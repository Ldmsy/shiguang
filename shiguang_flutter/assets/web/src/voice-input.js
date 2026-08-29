(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShiguangVoiceInput = api.createDomVoiceInput();
})(typeof window === 'undefined' ? globalThis : window, function (root) {
  function mergeTranscript(base, transcript) {
    const left = String(base || '').trimEnd();
    const right = String(transcript || '').trim();
    if (!left) return right;
    if (!right) return left;
    return `${left}${/[\s，。！？、,.!?;；:]$/.test(left) ? '' : ' '}${right}`;
  }

  function createVoiceInputCoordinator(options) {
    const {
      getInput,
      submit,
      transport,
      updateUi = () => {},
      finalWaitMs = 1500,
      createSessionId = () => root.crypto?.randomUUID?.() ||
        `voice-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    } = options;
    const setTimer = options.setTimer || options.setTimeout || setTimeout;
    const clearTimer = options.clearTimer || options.clearTimeout || clearTimeout;
    let sessionId = null;
    let baseText = '';
    let bestText = '';
    let status = 'idle';
    let stopRequested = false;
    let sent = false;
    let finalTimer = null;

    const setStatus = (next, message) => {
      status = next;
      updateUi({status, message});
    };
    const clearFinalTimer = () => {
      if (finalTimer !== null) clearTimer(finalTimer);
      finalTimer = null;
    };
    const writeDraft = () => {
      const input = getInput();
      if (input) input.value = mergeTranscript(baseText, bestText);
    };
    const reset = () => {
      clearFinalTimer();
      sessionId = null;
      baseText = '';
      bestText = '';
      stopRequested = false;
      sent = false;
      setStatus('idle');
    };
    const finalize = () => {
      if (sent || !stopRequested) return;
      clearFinalTimer();
      const input = getInput();
      if (!input || !bestText.trim()) {
        if (input) input.value = baseText;
        reset();
        return;
      }
      input.value = mergeTranscript(baseText, bestText);
      sent = true;
      submit(input);
      reset();
    };
    const receive = event => {
      if (!event || event.sessionId !== sessionId) return;
      if (event.type === 'voice.partial' || event.type === 'voice.final') {
        bestText = String(event.text || '');
        writeDraft();
        if (event.type === 'voice.final' && stopRequested) finalize();
        return;
      }
      if (event.type === 'voice.error') {
        const input = getInput();
        if (input) input.value = baseText;
        clearFinalTimer();
        sessionId = null;
        stopRequested = false;
        sent = false;
        status = 'idle';
        updateUi({
          status: 'idle',
          code: event.code,
          message: event.message || '语音识别失败，请改用文字输入。',
        });
        return;
      }
      if (event.type === 'voice.status') {
        if (event.status === 'idle' && !stopRequested) {
          writeDraft();
          sessionId = null;
          setStatus('idle', '识别已结束，请检查文字后发送或重新录入');
        } else {
          setStatus(event.status, event.message);
        }
      }
    };
    transport.subscribe(receive);

    return {
      get sessionId() { return sessionId; },
      get status() { return status; },
      async start() {
        if (sessionId || !transport.available) return;
        const input = getInput();
        if (!input) return;
        sessionId = createSessionId();
        baseText = input.value;
        bestText = '';
        stopRequested = false;
        sent = false;
        setStatus('requesting');
        await transport.send({
          type: 'voice.start', sessionId, preferredLocale: 'zh-CN',
        });
      },
      async stop() {
        if (!sessionId || stopRequested) return;
        stopRequested = true;
        setStatus('stopping');
        await transport.send({type: 'voice.stop', sessionId});
        finalTimer = setTimer(finalize, finalWaitMs);
      },
      async cancel() {
        if (!sessionId) return;
        const current = sessionId;
        const input = getInput();
        if (input) input.value = baseText;
        reset();
        await transport.send({type: 'voice.cancel', sessionId: current});
      },
      receive,
      refresh: () => updateUi({status}),
    };
  }

  function createBridgeTransport() {
    if (root.ShiguangVoiceBridge?.postMessage) {
      return {
        available: true,
        send: async message => {
          root.ShiguangVoiceBridge.postMessage(JSON.stringify(message));
        },
        subscribe() {},
      };
    }
    if (root.chrome?.webview?.postMessage) {
      const listeners = [];
      root.chrome.webview.addEventListener('message', event => {
        const data = event.data;
        const payload = typeof data === 'string' ? JSON.parse(data) : data;
        listeners.forEach(listener => listener(payload));
      });
      return {
        available: true,
        send: async message => {
          root.chrome.webview.postMessage(message);
        },
        subscribe: listener => listeners.push(listener),
      };
    }
    return null;
  }

  function createWebSpeechTransport() {
    const SpeechRecognition = root.SpeechRecognition || root.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return {available: false, send: async () => {}, subscribe() {}};
    }
    const listeners = [];
    let recognition = null;
    let activeSessionId = null;
    const emit = event => listeners.forEach(listener => listener(event));
    return {
      available: true,
      subscribe: listener => listeners.push(listener),
      send: async message => {
        if (message.type === 'voice.start') {
          activeSessionId = message.sessionId;
          recognition = new SpeechRecognition();
          recognition.lang = 'zh-CN';
          recognition.interimResults = true;
          recognition.continuous = false;
          recognition.onresult = event => {
            let text = '';
            let isFinal = false;
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
              text += event.results[i][0].transcript;
              if (event.results[i].isFinal) isFinal = true;
            }
            emit({
              type: isFinal ? 'voice.final' : 'voice.partial',
              sessionId: activeSessionId,
              text,
            });
          };
          recognition.onerror = event => {
            const code = event.error === 'not-allowed' || event.error === 'service-not-allowed'
              ? 'permission_denied'
              : event.error;
            const messages = {
              permission_denied: '无法使用麦克风，请在系统设置中开启权限后重试。',
              no_speech: '没有检测到语音，请再试一次。',
              network: '语音识别服务暂时不可用，请使用文字输入。',
            };
            emit({
              type: 'voice.error',
              sessionId: activeSessionId,
              code,
              message: messages[code] || '语音识别失败，请改用文字输入。',
            });
          };
          recognition.onend = () => {
            emit({
              type: 'voice.status',
              sessionId: activeSessionId,
              status: 'idle',
            });
          };
          recognition.start();
          emit({
            type: 'voice.status',
            sessionId: activeSessionId,
            status: 'listening',
          });
          return;
        }
        if (message.type === 'voice.stop') {
          recognition?.stop();
          return;
        }
        if (message.type === 'voice.cancel') {
          recognition?.abort?.();
          recognition = null;
        }
      },
    };
  }

  function createDomVoiceInput() {
    let coordinator = null;
    let submit = () => {};
    const hints = {
      idle: '按一下开始，再按一下结束',
      requesting: '正在请求麦克风权限…',
      listening: '正在聆听，再按一下即可发送',
      stopping: '正在整理刚才的话…',
    };

    const updateUi = ({status, message} = {}) => {
      const button = document.querySelector('[data-action="voice"]');
      const hint = document.querySelector('[data-voice-hint]');
      if (button) {
        const label = button.querySelector('b');
        button.classList.toggle('live', status === 'listening');
        button.disabled = status === 'requesting' || status === 'stopping';
        const nextLabel = status === 'listening' ? '停止' : '说话';
        if (label && label.textContent !== nextLabel) label.textContent = nextLabel;
      }
      if (hint) {
        const nextHint = message || hints[status] || hints.idle;
        if (hint.textContent !== nextHint) hint.textContent = nextHint;
      }
    };

    const getInput = () => document.querySelector('.composer textarea');

    const ensureCoordinator = () => {
      if (coordinator) return coordinator;
      const transport = createBridgeTransport() || createWebSpeechTransport();
      coordinator = createVoiceInputCoordinator({
        getInput,
        submit: input => submit(input),
        transport,
        updateUi,
      });
      if (!transport.available) {
        updateUi({
          status: 'idle',
          message: '当前设备不支持语音输入，请使用文字输入',
        });
      }
      return coordinator;
    };

    document.addEventListener('click', event => {
      const button = event.target.closest('[data-action="voice"]');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const voice = ensureCoordinator();
      if (voice.status === 'listening' || voice.status === 'requesting') {
        voice.stop();
        return;
      }
      if (voice.status === 'stopping') return;
      voice.start();
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) coordinator?.cancel();
    });
    root.addEventListener?.('pagehide', () => coordinator?.cancel());

    if (root.MutationObserver && root.document) {
      const observer = new MutationObserver(() => coordinator?.refresh());
      observer.observe(root.document.documentElement, {childList: true, subtree: true});
    }

    return {
      configure({submit: nextSubmit} = {}) {
        if (typeof nextSubmit === 'function') submit = nextSubmit;
        ensureCoordinator();
      },
      receive(event) {
        ensureCoordinator().receive(event);
      },
      cancel() {
        coordinator?.cancel();
      },
      refresh() {
        coordinator?.refresh();
      },
    };
  }

  return {mergeTranscript, createVoiceInputCoordinator, createDomVoiceInput};
});

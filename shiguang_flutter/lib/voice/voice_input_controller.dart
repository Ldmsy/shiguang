import 'dart:async';

import 'speech_recognition_service.dart';

typedef VoiceEventSink = void Function(Map<String, Object?> event);

final class VoiceInputController {
  VoiceInputController({
    required this.service,
    required this.emit,
    this.finalResultWait = const Duration(milliseconds: 1500),
  });

  final SpeechRecognitionService service;
  final VoiceEventSink emit;
  final Duration finalResultWait;

  String? _sessionId;
  String _bestText = '';
  bool _finalEmitted = false;
  bool _stopRequested = false;
  Timer? _finalTimer;
  Future<void>? _nativeOp;

  Future<void> start({
    required String sessionId,
    String preferredLocale = 'zh-CN',
  }) async {
    await _awaitNativeOp();
    if (_sessionId != null) {
      await _abandonSession();
    }

    _sessionId = sessionId;
    _bestText = '';
    _finalEmitted = false;
    _stopRequested = false;
    _emitEvent(type: 'voice.status', status: 'requesting');

    final available = await service.initialize(
      onStatus: _handleStatus,
      onError: _handleError,
    );
    if (_sessionId != sessionId) {
      return;
    }
    if (!available) {
      _emitEvent(
        type: 'voice.error',
        code: 'recognition_unavailable',
        message: '当前设备不支持语音识别',
      );
      _sessionId = null;
      return;
    }

    final locales = await service.locales();
    if (_sessionId != sessionId) {
      return;
    }
    await service.listen(
      localeId: _selectLocale(locales, preferredLocale),
      onResult: (text, isFinal) => _handleResult(text, isFinal, sessionId),
    );
    if (_sessionId != sessionId) {
      return;
    }
    _emitEvent(type: 'voice.status', status: 'listening');
  }

  Future<void> stop({required String sessionId}) async {
    if (sessionId != _sessionId || _stopRequested) {
      return;
    }
    _stopRequested = true;
    _emitEvent(type: 'voice.status', status: 'stopping');
    _finalTimer?.cancel();
    _finalTimer = Timer(finalResultWait, _emitFinalIfNeeded);
    await _trackNative(() => service.stop());
  }

  Future<void> cancel({required String sessionId}) async {
    if (sessionId != _sessionId) {
      return;
    }
    await _abandonSession();
  }

  Future<void> dispose() async {
    await _abandonSession();
  }

  Future<void> _abandonSession() async {
    _finalTimer?.cancel();
    _finalTimer = null;
    final hadSession = _sessionId != null;
    _sessionId = null;
    _stopRequested = false;
    if (hadSession) {
      await _trackNative(() => service.cancel());
    }
  }

  Future<void> _awaitNativeOp() async {
    final op = _nativeOp;
    if (op == null) {
      return;
    }
    await op;
  }

  Future<void> _trackNative(Future<void> Function() startOp) {
    final chain = (_nativeOp ?? Future<void>.value()).then((_) => startOp());
    _nativeOp = chain;
    chain.whenComplete(() {
      if (identical(_nativeOp, chain)) {
        _nativeOp = null;
      }
    });
    return chain;
  }

  void _handleResult(String text, bool isFinal, String sessionId) {
    if (sessionId != _sessionId || _finalEmitted) {
      return;
    }
    if (text.trim().isNotEmpty) {
      _bestText = text;
    }
    if (isFinal && _stopRequested) {
      _emitFinalIfNeeded();
      return;
    }
    if (text.trim().isNotEmpty) {
      _emitEvent(type: 'voice.partial', text: text);
    }
  }

  void _handleStatus(String status) {
    if (_sessionId == null) {
      return;
    }
    if (status == 'listening') {
      _emitEvent(type: 'voice.status', status: 'listening');
      return;
    }
    if (_stopRequested) {
      return;
    }
    if (status == 'done' || status == 'notListening') {
      _emitEvent(type: 'voice.status', status: 'idle');
    }
  }

  void _handleError(String code, String message, bool permanent) {
    if (_sessionId == null) {
      return;
    }
    _emitEvent(type: 'voice.error', code: code, message: message);
    if (permanent) {
      _trackNative(() => service.cancel());
      _finalTimer?.cancel();
      _finalTimer = null;
      _sessionId = null;
      _stopRequested = false;
    }
  }

  void _emitFinalIfNeeded() {
    if (_finalEmitted || _sessionId == null || !_stopRequested) {
      return;
    }
    _finalEmitted = true;
    _finalTimer?.cancel();
    _finalTimer = null;
    _emitEvent(type: 'voice.final', text: _bestText);
    _emitEvent(type: 'voice.status', status: 'idle');
    _sessionId = null;
  }

  void _emitEvent({
    required String type,
    String? status,
    String? text,
    String? code,
    String? message,
  }) {
    final sessionId = _sessionId;
    if (sessionId == null) {
      return;
    }
    emit({
      'type': type,
      'sessionId': sessionId,
      'status': ?status,
      'text': ?text,
      'code': ?code,
      'message': ?message,
    });
  }

  String? _selectLocale(List<String> locales, String preferred) {
    final preferredKey = _normalizeLocale(preferred);
    for (final locale in locales) {
      if (_normalizeLocale(locale) == preferredKey) {
        return locale;
      }
    }
    for (final locale in locales) {
      if (_normalizeLocale(locale).startsWith('zh')) {
        return locale;
      }
    }
    return null;
  }

  String _normalizeLocale(String locale) =>
      locale.replaceAll(RegExp(r'[-_]'), '').toLowerCase();
}

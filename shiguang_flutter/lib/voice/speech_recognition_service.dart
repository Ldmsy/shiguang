import 'package:speech_to_text/speech_to_text.dart';

typedef SpeechResultHandler = void Function(String text, bool isFinal);
typedef SpeechStatusHandler = void Function(String status);
typedef SpeechErrorHandler = void Function(
  String code,
  String message,
  bool permanent,
);

abstract interface class SpeechRecognitionService {
  Future<bool> initialize({
    required SpeechStatusHandler onStatus,
    required SpeechErrorHandler onError,
  });
  Future<List<String>> locales();
  Future<void> listen({
    required String? localeId,
    required SpeechResultHandler onResult,
  });
  Future<void> stop();
  Future<void> cancel();
}

final class DeviceSpeechRecognitionService implements SpeechRecognitionService {
  DeviceSpeechRecognitionService({SpeechToText? speech})
    : _speech = speech ?? SpeechToText();

  final SpeechToText _speech;
  SpeechStatusHandler? _onStatus;
  SpeechErrorHandler? _onError;
  bool? _available;
  Future<bool>? _initializing;

  @override
  Future<bool> initialize({
    required SpeechStatusHandler onStatus,
    required SpeechErrorHandler onError,
  }) async {
    _onStatus = onStatus;
    _onError = onError;
    if (_available == true) {
      return true;
    }
    final inFlight = _initializing;
    if (inFlight != null) {
      return inFlight;
    }
    final init = _speech.initialize(
      onStatus: (status) => _onStatus?.call(status),
      onError: (error) =>
          _onError?.call(error.errorMsg, error.errorMsg, error.permanent),
      finalTimeout: const Duration(milliseconds: 1500),
    );
    _initializing = init;
    try {
      final available = await init;
      if (available) {
        _available = true;
      }
      return available;
    } finally {
      if (identical(_initializing, init)) {
        _initializing = null;
      }
    }
  }

  @override
  Future<List<String>> locales() async {
    final locales = await _speech.locales();
    return [for (final locale in locales) locale.localeId];
  }

  @override
  Future<void> listen({
    required String? localeId,
    required SpeechResultHandler onResult,
  }) async {
    await _speech.listen(
      onResult: (result) =>
          onResult(result.recognizedWords, result.finalResult),
      listenOptions: SpeechListenOptions(
        partialResults: true,
        cancelOnError: true,
        listenMode: ListenMode.dictation,
        listenFor: const Duration(seconds: 60),
        pauseFor: const Duration(seconds: 8),
        localeId: localeId,
      ),
    );
  }

  @override
  Future<void> stop() => _speech.stop();

  @override
  Future<void> cancel() => _speech.cancel();
}

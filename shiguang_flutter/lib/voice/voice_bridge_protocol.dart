import 'dart:convert';

enum VoiceCommandType { start, stop, cancel }

final class VoiceBridgeCommand {
  const VoiceBridgeCommand({
    required this.type,
    required this.sessionId,
    required this.preferredLocale,
  });

  final VoiceCommandType type;
  final String sessionId;
  final String preferredLocale;

  static VoiceBridgeCommand parse(Object? value) {
    if (value is! Map) {
      throw const FormatException('voice command must be an object');
    }
    return VoiceBridgeCommand(
      type: _parseType(value['type']),
      sessionId: _parseSessionId(value['sessionId']),
      preferredLocale: _parsePreferredLocale(value['preferredLocale']),
    );
  }

  static VoiceBridgeCommand parseJson(String source) =>
      parse(jsonDecode(source));

  static VoiceCommandType _parseType(Object? value) {
    return switch (value) {
      'voice.start' => VoiceCommandType.start,
      'voice.stop' => VoiceCommandType.stop,
      'voice.cancel' => VoiceCommandType.cancel,
      _ => throw const FormatException('invalid voice command type'),
    };
  }

  static String _parseSessionId(Object? value) {
    if (value is! String || value.isEmpty || value.length > 128) {
      throw const FormatException('invalid sessionId');
    }
    return value;
  }

  static String _parsePreferredLocale(Object? value) {
    if (value is String && value.isNotEmpty) {
      return value;
    }
    return 'zh-CN';
  }
}

String encodeVoiceEvent(Map<String, Object?> event) => jsonEncode(event);

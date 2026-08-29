import 'package:flutter_test/flutter_test.dart';
import 'package:shiguang_app/main.dart';

void main() {
  test('bundled WebView target remains stable', () {
    expect(shiguangWebAsset, startsWith('assets/web/'));
    expect(shiguangWebAsset, endsWith('index.html'));
  });
}

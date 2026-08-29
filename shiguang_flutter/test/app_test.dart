import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shiguang_app/main.dart';

void main() {
  testWidgets('builds the Shiguang application shell', (tester) async {
    await tester.pumpWidget(
      const ShiguangApp(
        home: Scaffold(body: Center(child: Text('拾光 WebView'))),
      ),
    );

    expect(find.text('拾光 WebView'), findsOneWidget);
  });

  test('uses the bundled WebView demo on supported platforms', () {
    expect(shiguangWebAsset, 'assets/web/index.html');
  });
}

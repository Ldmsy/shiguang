import 'dart:io';

import 'package:flutter/material.dart';

import 'standard_webview_page.dart';
import 'windows_webview_page.dart';

const shiguangWebUrl =
    'https://a-d7g81pr41f2b54449-1475901646.tcloudbaseapp.com/demo/';
const shiguangWebAsset = 'assets/web/index.html';

void main() => runApp(const ShiguangApp());

class ShiguangApp extends StatelessWidget {
  const ShiguangApp({super.key, this.home});

  final Widget? home;

  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: '我是谁',
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2C695C)),
      scaffoldBackgroundColor: const Color(0xFFFFFDF8),
      useMaterial3: true,
    ),
    home:
        home ??
        (Platform.isWindows
            ? const WindowsWebViewPage(url: shiguangWebUrl)
            : const StandardWebViewPage(assetPath: shiguangWebAsset)),
  );
}

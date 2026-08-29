import 'dart:async';

import 'package:flutter/material.dart';
import 'package:webview_flutter_windows/webview_flutter_windows.dart';

class WindowsWebViewPage extends StatefulWidget {
  const WindowsWebViewPage({super.key, required this.url});

  final String url;

  @override
  State<WindowsWebViewPage> createState() => _WindowsWebViewPageState();
}

class _WindowsWebViewPageState extends State<WindowsWebViewPage> {
  final WebviewController _controller = WebviewController();
  final List<StreamSubscription<Object?>> _subscriptions = [];
  bool _loading = true;
  bool _canGoBack = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      await _controller.initialize();
      await _controller.setPopupWindowPolicy(WebviewPopupWindowPolicy.deny);
      _subscriptions
        ..add(
          _controller.loadingState.listen((state) {
            if (!mounted) return;
            setState(() => _loading = state == LoadingState.loading);
          }),
        )
        ..add(
          _controller.historyChanged.listen((history) {
            if (mounted) setState(() => _canGoBack = history.canGoBack);
          }),
        )
        ..add(
          _controller.onLoadError.listen((error) {
            if (mounted) setState(() => _error = error.name);
          }),
        );
      await _controller.loadUrl(widget.url);
      if (mounted) setState(() {});
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  @override
  void dispose() {
    for (final subscription in _subscriptions) {
      subscription.cancel();
    }
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !_canGoBack,
    onPopInvokedWithResult: (didPop, _) {
      if (!didPop) _controller.goBack();
    },
    child: Scaffold(
      body: Stack(
        children: [
          if (_controller.value.isInitialized)
            Positioned.fill(child: Webview(_controller))
          else
            const Center(child: CircularProgressIndicator()),
          if (_loading && _controller.value.isInitialized)
            const Align(
              alignment: Alignment.topCenter,
              child: LinearProgressIndicator(minHeight: 2),
            ),
          if (_error != null)
            ColoredBox(
              color: const Color(0xFFFFFDF8),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.cloud_off_outlined, size: 46),
                      const SizedBox(height: 16),
                      const Text('页面暂时无法加载'),
                      const SizedBox(height: 8),
                      Text(_error!, textAlign: TextAlign.center),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: () {
                          setState(() {
                            _error = null;
                            _loading = true;
                          });
                          _controller.loadUrl(widget.url);
                        },
                        child: const Text('重新加载'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    ),
  );
}

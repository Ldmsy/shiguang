# 我是谁 Flutter WebView 应用

“我是谁”最新网页界面的跨平台应用外壳。iOS、Android 和 macOS 启动后加载应用内置的网页资源：

`assets/web/index.html`

内置版通过 `assets/web/src/demo-api.js` 提供 `/api/v1` 演示接口，包含测试登录、历史对话、成长卡片、能力线索、月报、推荐方向和聊天回复。演示数据保存在设备本地，不依赖腾讯云服务。

## 平台实现

- Android、iOS、macOS：Flutter 官方 `webview_flutter`，加载内置演示版
- Windows：基于 Edge WebView2 的 `webview_flutter_windows`
- 支持 JavaScript、站内返回、加载进度、失败提示和重新加载
- macOS 沙盒与 Android 已配置联网权限

## 本地验证

```bash
../.tooling/flutter/bin/flutter analyze
../.tooling/flutter/bin/flutter test
```

## 运行

```bash
../.tooling/flutter/bin/flutter run -d macos
```

Android、iOS、Windows 分别选择对应设备运行。Windows 设备需要安装 Microsoft Edge WebView2 Runtime。

## 演示账户

- 手机号：`13800138000`
- 密码：`Shiguang2026!`
- 验证码：`202608`
- 也可使用“本设备一键登录”

# 我是谁 Flutter 队友开发包

## 直接登录体验

- 手机号：`13800138000`
- 密码：`Shiguang2026!`
- 验证码：`202608`
- 本地开发时也可以点击“本设备一键登录”。

当前安装包默认使用内置演示接口和设备本地数据，因此队友无需获得 API Key 或云数据库密码，也能登录并查看完整界面。

## 开始开发

1. 安装 Flutter、Xcode（iOS）或 Android Studio（Android）。
2. 在终端进入解压后的 `shiguang_flutter` 文件夹。
3. 运行：

```bash
flutter pub get
flutter doctor
flutter run
```

如果有多个设备，可以先运行 `flutter devices`，再运行：

```bash
flutter run -d 设备ID
```

## 项目入口

- Flutter 入口：`lib/main.dart`
- 当前 UI：`assets/web/index.html`
- 页面逻辑：`assets/web/src/app.js`
- 样式：`assets/web/src/*.css`
- 演示接口：`assets/web/src/demo-api.js`

## 接入共同云端

开发包不包含 `.env`、API Key 和数据库密码。需要联调云端时，应由项目负责人单独发送一份 `.env.example` 字段说明；每位开发者在自己的电脑创建 `.env`，真实密钥不要通过微信、ZIP 或 GitHub 传递。

正式给外部测试者安装时，iPhone 建议使用 TestFlight；仅用于开发的队友可以直接用 Xcode/Flutter 运行源码。

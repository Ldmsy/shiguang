# 我是谁 · AI 私人成长档案

“我是谁”是一款以真实对话为起点的个人成长陪伴应用。它帮助用户记录当下、整理情绪与生活经验，从对话中发现能力线索，并将值得保留的片段沉淀为成长卡片、月度回顾和年度档案。

项目采用 **Flutter + WebView** 封装结构，可运行于 iOS、Android、macOS 和 Windows；同时提供腾讯云网页体验版，便于评委和外部用户直接测试。

## 在线体验

- 腾讯云演示：[打开“我是谁”移动端体验](https://a-d7g81pr41f2b54449-1475901646.tcloudbaseapp.com/demo/?v=20260829-2251)
- GitHub Topic：`shenicest-fission`

### 测试账号

| 登录方式 | 测试数据 |
| --- | --- |
| 手机号 | `13800138000` |
| 密码 | `Shiguang2026!` |
| 页面验证码 | `202608` |

本地 Flutter 内置演示版也支持“本设备一键登录”。演示内容使用假数据，不会发送真实短信。

## 核心功能

- **照见自己**：与云朵伙伴进行陪伴式对话，支持文字、语音入口和表情辅助。
- **收入卡片**：把对话中值得保留的时刻收录为成长卡片。
- **成长卡片**：按日历查看往日记录，并生成月度、年度文字回顾。
- **我即宝藏**：从真实对话中整理观察、表达、照护、行动与关系等能力线索。
- **个人档案与记忆**：集中保存个人资料、重要句子、成长证据与历史记录。
- **寻找伯牙**：选择探索方向，查看推荐同好、公开资料并进入聊天窗口。
- **隐私与导出**：管理摄像头权限，并支持 TXT、PDF、JSON 等内容导出入口。
- **跨平台运行**：同一套 Flutter 工程覆盖 iOS、Android、macOS 和 Windows。

## 功能截图

仓库内提供 20 张统一采用 393 × 852 iPhone 视口的清晰截图：

- [查看完整功能截图目录](./screenshots/)
- [下载完整截图 ZIP](./screenshots/shiguang_app-功能全景截图-2026-08-30.zip)

| 照见自己 | 成长卡片 | 能力线索 | 寻找伯牙 |
| --- | --- | --- | --- |
| ![照见自己](./screenshots/shiguang_app_功能全景_2026-08-30/01-照见自己-对话主页.png) | ![成长卡片](./screenshots/shiguang_app_功能全景_2026-08-30/02-成长卡片.png) | ![能力线索](./screenshots/shiguang_app_功能全景_2026-08-30/03-我即宝藏-能力线索.png) | ![寻找伯牙](./screenshots/shiguang_app_功能全景_2026-08-30/04-寻找伯牙-个人名片.png) |

## Flutter App 运行

环境要求：已安装 Flutter、Xcode（运行 iOS/macOS）或 Android Studio（运行 Android）。

```bash
cd shiguang_flutter
flutter pub get
flutter devices
```

运行 iOS 模拟器：

```bash
flutter run -d "iPhone 17 Pro"
```

运行 macOS：

```bash
flutter run -d macos
```

Flutter 默认加载 `shiguang_flutter/assets/web/` 中的完整移动端 UI 和演示数据。

## 网页与服务端运行

```bash
npm install
cp .env.example .env
# 如需接入 AI 对话，在 .env 中填写 DEEPSEEK_API_KEY
npm run dev
```

打开 `http://127.0.0.1:4173`。

服务端提供手机号账户、会话、成长记录及 AI 流式聊天接口。密码使用 `scrypt` 加盐保存，模型密钥只保留在服务端，不写入前端或 Git 仓库。

## 项目结构

```text
shiguang_flutter/          Flutter 跨平台应用
  assets/web/              App 内置的完整移动端 UI 与演示数据
新版网页/                  本地网页开发版本
apps/api/                  Node.js 服务端与账户接口
packages/contracts/        前后端接口契约
deploy/tencent-cloud/      腾讯云部署内容
screenshots/               全功能截图与 ZIP 交付包
tests/                     服务端和契约测试
```

## 隐私说明

产品默认将个人对话、照片、成长记录和能力证据视为私密内容。公开资料仅在用户主动确认后展示；演示环境中的人物、对话和成长记录均为测试数据。

## 团队协作

- 功能开发请从最新 `main` 创建独立分支并通过 Pull Request 合并。
- UI 修改需同步检查网页版本与 `shiguang_flutter/assets/web/` 内置版本。
- 接口字段变更需同步更新 `packages/contracts/` 和相关测试。
- 不提交密钥、真实账号密码或用户隐私数据。

# 硅宠场域 · Pet Smart App

统一 React + TypeScript + Three.js 前端；Android 与 iOS 使用 Capacitor 8。
本次以 keeplinux/pet-smart-app 的 `2e92bf6f85841c51f072fd1a809e503e7cba0634`（v1.3.16）为基准导入。
旧 SwiftUI 原型及其设计/开发规划已移除，可从 Git 历史恢复。

## 目录

- `src/`：双端共享的页面、状态、原型数据与 3D 场景。
- `src/platform/`：原生能力适配边界，目前包含相机。
- `public/`：共享字体、图片等资源。
- `android/`：原安卓工程，包名 com.pawlink.petwater。
- `ios/`：Capacitor iOS 工程，同一包名，最低 iOS 16，iPhone 竖屏。
- `harmony/`：HarmonyOS NEXT 接入规划，目前没有可运行的鸿蒙工程。
- `docs/verification/`：本次迁移验证结果与限制。
- `tests/ios/`：独立 XCUITest 导航/持久化验收工程。

## 本地开发

Node.js 22+、npm；iOS 需要 Xcode 26+；Android 需要 Android SDK 36 和现代 JDK（当前 Gradle/Capacitor 所需版本）。

```sh
npm ci
npm run dev
npm run lint
npm run sync
npm run verify:parity
npm run verify:baseline
npm run open:ios
npm run open:android
```

每次修改共享代码后执行 `npm run sync`，同时更新两端原生壳内的 dist；不要直接修改原生 public 目录。
`verify:parity` 比较全部 Web 资源的 SHA-256，并检测额外资源，防止任意一端使用旧包。
构建 iOS 模拟器应用：`npm run build:ios`。真机运行在 Xcode 中配置自己的签名团队。

## iOS 自动验收

先安装构建产物到启动的模拟器：

```sh
xcrun simctl install booted .build/ios/Build/Products/Debug-iphonesimulator/App.app
xcodegen generate --spec tests/ios/project.yml
xcodebuild -project tests/ios/ParityTests.xcodeproj -scheme ParityUITests -destination 'platform=iOS Simulator,name=iPhone 17 Pro' CODE_SIGNING_ALLOWED=NO test
```

测试验证登录、首页、设置、商城切换、扫码入口、重启登录持久化，并将截图保存到 xcresult。
测试使用当前安卓原型的模拟账号，不代表真实认证验证。

## 当前业务边界

保留安卓现有行为：设备扫码/BLE/配网、登录、模型生成和版本更新仍包含模拟逻辑。
本次完成统一工程与平台移植，不代表已接入硬件、正式服务端或 App Store 发布。

## Git 合并与审核

统一工程通过 `codex/unified-capacitor` 整理，发布远端沿用当前仓库 origin。
这里已同时包含 Android 与 iOS 源码，后续应以一个仓库维护，不再分别修改两套 src。
当前仓库同时维护 Android/iOS；安卓原仓库是 v1.3.16 的设计与代码来源。后续日常迭代应只在统一工程进行，避免两边分别修改。

浏览器验收：首次执行 `npx playwright install chromium webkit`，随后执行 `npm run test:web`。测试屏蔽外网资源以验证内置字体和离线首屏。

迁移结果与截图见 [验收记录](docs/verification/MIGRATION.md)。

苹果真机签名打包见 [iOS 发布说明](docs/IOS_RELEASE.md)，执行 `npm run release:ios`。GitHub 下载 IPA 仍需有效苹果签名与设备授权。

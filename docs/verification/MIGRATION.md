# 统一工程迁移记录

日期：2026-10-18（Asia/Shanghai）

## 来源与变更

- 安卓基准：keeplinux/pet-smart-app，2e92bf6f85841c51f072fd1a809e503e7cba0634，v1.3.16。
- 原 iOS 基准：b19c155，旧 SwiftUI 页面、工程、设计与旧排期已移除。
- 安卓 src/public 按原样导入；业务唯一调整是 AvatarPicker 的相机调用改走可注入的跨平台适配器，默认仍为相同的 Capacitor Camera。
- Android 原生工程完整导入，新增标准 Capacitor iOS SPM 工程；未改写安卓交互或新增业务能力。
- 两端使用同一个 dist，不维护独立的 iOS 页面副本。
- iOS 相机/相册/局域网权限、版本 1.3.16(33)、App 图标及安卓启动图资源已对齐。
- 鸿蒙仅建立平台能力边界与接入文档，未来需 ArkWeb/ArkTS 壳和设备验证。

## 一致性验证层次

1. 源码对比：除相机导入适配边界外，原安卓业务页面、场景及资源保持一致。
2. 静态验证：ESLint、TypeScript/Vite 构建。
3. 分发验证：逐文件比较 dist、Android public、iOS public SHA-256，检测缺失/差异/额外文件。
4. iOS 原生构建与模拟器导航：Xcode 26.6 / iOS 26.5 / iPhone 17 Pro 上构建成功，XCUITest 1/1 通过。
5. Android 原生运行及跨设备视觉：本机未安装 Android SDK，不能据共享资源一致就宣称完成双端真机视觉验收。
6. 真机相机、BLE/配网、WebGL性能、后台恢复、权限拒绝：仍需对应硬件和真机验收。

## 已知限制

- 原安卓 simulateHardware=true；身份识别、设备流程、品种/模型、更新流程均有模拟实现，原样保留。
- Vite 提示主 JS 包超过 500KB，主要包含 Three.js；本次不改动已确定的安卓场景。
- 共享渲染代码一致不保证 WKWebView 与 Android WebView 每个像素相同，系统权限弹窗也属于各平台原生行为。
- 原 iOS 历史仍在当前 Git 仓库；安卓来源提交已记录。本次代码合并不改动远端仓库、不删除远端、不强推。


## 最终验收结果

| 检查 | 结果 |
|---|---|
| ESLint | 通过 |
| TypeScript + Vite 生产构建 | 通过；主包体积有非阻塞提示 |
| 安卓源码/资源基准 | 51 文件校验通过，仅相机 import 按适配规则归一化 |
| 双平台 Web 分发 | 15 文件 SHA-256 一致，无额外业务文件 |
| Chromium 手机视口流程 | 通过（13.6 秒）；不等同于 Android 原生设备 |
| WebKit 手机视口流程 | 通过（12.8 秒） |
| 禁止外网情况下运行 | 两浏览器流程通过，资源使用本地字体与图片 |
| iOS 模拟器原生构建 | BUILD SUCCEEDED |
| iOS 模拟器 XCUITest | 1/1 通过（22.4 秒），登录、设置、商城型号切换、扫码入口、重启持久化 |
| Android APK 构建/原生运行 | 未执行：本机无 Android SDK，现有 Java 为 8 |
| 真机硬件联调 / 鸿蒙构建 | 未执行，不在此次原型迁移的已验证范围 |

启动验证发现原 index.html 中 Google Fonts 样式外链可能阻塞离线首屏，已移除三行外链。
品牌汇文明朝字体原本已位于 public/fonts，页面设计与字体声明不变，修复同时应用于两端。

### iOS 模拟器验收截图

- [首页](ios/01-home.png)
- [设置](ios/02-settings.png)
- [商城](ios/03-mall.png)
- [商城切换型号](ios/04-next-product.png)
- [扫码入口](ios/05-scan.png)
- [重启恢复首页](ios/06-relaunch.png)

原始测试结果保存在本机 `/tmp/petsoul-parity-ui-tests-fixed-20261018.xcresult`。
可执行 `npm run test:web` 重跑浏览器测试，执行 `npm run build:ios` 和 `npm run test:ios` 重跑模拟器测试。
首次使用浏览器测试需执行 `npx playwright install chromium webkit`。

结论：共享业务代码和打包资源与安卓基准对齐，主要流程在 Chromium、WebKit 和 iOS 原生壳中可用。
尚不能宣称 Android/iOS 真机像素级一致或真实设备链路完成。用户已于本次发布请求中授权上传 Git。签名发布状态见 docs/IOS_RELEASE.md。

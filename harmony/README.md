# HarmonyOS NEXT 接入边界

当前统一工程提供 React + TypeScript + Three.js 前端，Android/iOS 由 Capacitor 承载。
本目录是未来鸿蒙原生壳的接入说明，尚无 ArkTS 工程，也不表示鸿蒙已可编译。

建议使用 DevEco Studio 创建 Stage 模型 ArkTS 工程，以 ArkWeb 加载 `npm run build` 的 dist。
相对资源路径、ArkWeb 本地资源协议、WebGL、字体、安全区、持久化和导航需在真机上验证。
不要安装 Android APK 来替代 HarmonyOS NEXT 原生适配。

当前唯一直接调用的 Capacitor 原生插件是相机，已收敛到 `src/platform/camera.ts`：
- iOS/Android 默认使用 Capacitor Camera。
- 鸿蒙启动 React 前调用 configureCameraAdapter，注入实现 getPhoto 的适配器。
- ArkTS 相机/照片选择器通过受限 JavaScript Proxy 返回 Photo 契约；不得暴露任意代码执行接口。
- 取消、权限拒绝和读取失败必须 reject Promise，页面已有错误处理。

后续 BLE、Wi-Fi、扫码、通知应分别建立同类接口和平台实现，禁止在业务页面堆叠平台判断。
现有 BLE/扫码等仍为安卓原型的模拟逻辑，尚无可直接复用的真实传输层。

接入顺序：ArkWeb 展示与 WebGL → 原生相机桥 → 存储与权限 → BLE/配网 → 真机回归。
共享 src/public，不复制独立页面；鸿蒙壳使用同一版本的 dist。

沿用 iOS/Android 的原有简约页面与共享 React/TypeScript/Three.js 资源，新增 HarmonyOS NEXT ArkTS + ArkWeb 宿主。

**附件 HAP 是 Release 未签名预览包，已通过官方 NEXT 模拟器验证；不能直接安装到手机。** NEXT 手机需要匹配设备的合法开发签名与 profile。HarmonyOS 4.2 不适用，不包含兼容 APK。

附件：

- `silifield-1.3.18-harmony-next-unsigned.hap`：实际 SDK 编译的 HAP，包含 ArkTS 字节码；关闭 Web 调试。
- `SHA256SUMS.txt`：安装包校验值。
- `INSTALL.md`：模拟器运行与 NEXT 手机签名安装说明。

已验证：原页面与样式未改变，三端17个共享 Web 文件 SHA-256 一致；NEXT 5.0.1 / API13 模拟器安装、启动、3D 首页、导航、登录持久化、图片/视频选择器；ArkWeb 安全源、AES-GCM 和 IndexedDB。修复 API13 文件选择参数展开成扩展名列表的兼容问题。

尚待 NEXT 真机验收：相机、实际媒体读取、扫码、BLE GATT、真实水机配网、中文输入法及后台恢复。模拟器系统扫码不受支持，不宣称已完成真实硬件联调。

包版本 1.3.18，最低 NEXT 5.0 / API12；构建日期 2026-10-21，使用 DevEco Studio 26.0.0 Release / SDK 26.0.0.105。

HAP SHA-256：`760cd7e902e189afa36c489ff47665b81707e8de6d0d0f5826cf7fed86143367`。

[完整验证记录与截图](https://github.com/keeplinux/reliycooking-petsoul_app_ios/blob/v1.3.18-harmony.1/docs/verification/HARMONY_2026-10-20.md)。

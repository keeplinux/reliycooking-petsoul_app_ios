# silifield · HarmonyOS NEXT

React/TypeScript/Three.js 与 iOS、Android 共用；本目录为 ArkTS Stage + ArkWeb 工程，不是 Android APK。

[移植方案与边界](HARMONY_PORT_PLAN.md)已按现有 App 核对并更新。页面、样式、业务模型和 BLE 加密协议保持共享；相机、扫码和 GATT 在原生适配层实现。原生桥仅暴露白名单 JSON RPC，不向外部页面开放。

```sh
npm ci
npm run sync
npm run verify:parity
npm run build:harmony
```

用 DevEco Studio 打开本目录，完成 SDK/依赖同步。通过 Signing Configs 配置个人开发签名和目标设备，生成的 HAP 在 entry/build/default/outputs/default/。CLI 自动寻找 /Applications/DevEco-Studio.app/Contents，可通过 DEVECO_HOME/HVIGORW_JS 覆盖。

当前本机缺少 DevEco Studio/HarmonyOS SDK，尚未完成 ArkTS 编译、HAP 签名和鸿蒙真机验收。工程文件和通过的 Web 检查不代表已生成手机可安装包。状态见 [本次验证记录](../docs/verification/HARMONY_2026-10-20.md)。

rawfile/public 由 sync 生成，禁止手工修改；web-manifest.json 记录资源指纹。签名文件、密码和用户设备资料不提交 Git。

# silifield · HarmonyOS NEXT

React/TypeScript/Three.js 与 iOS、Android 共用；本目录为 ArkTS Stage + ArkWeb 工程，不是 Android APK。

[移植方案与边界](HARMONY_PORT_PLAN.md)已按现有 App 核对并更新。页面、样式、业务模型和 BLE 加密协议保持共享；相机、扫码和 GATT 在原生适配层实现。原生桥仅暴露白名单 JSON RPC，不向外部页面开放。

```sh
npm ci
npm run sync
npm run verify:parity
npm run build:harmony
# 交付 Release 未签名包，关闭 Web 调试
node scripts/build-harmony.mjs --release
npm run verify:harmony-package
```

用 DevEco Studio 打开本目录，完成 SDK/依赖同步。通过 Signing Configs 配置个人开发签名和目标设备，生成的 HAP 在 entry/build/default/outputs/default/。CLI 自动寻找 /Applications/DevEco-Studio.app/Contents，可通过 DEVECO_HOME/HVIGORW_JS 覆盖。

已使用 DevEco Studio 26.0.0 Release / SDK 26.0.0.105 实际编译并生成未签名 HAP，`npm run verify:harmony-package` 可校验包内字节码与17个共享资源。官方 NEXT 5.0.1 / API13 模拟器安装、启动及基础回归已通过；[交付包](../artifacts/harmony/1.3.18/INSTALL.md)为关闭调试的 Release 未签名 HAP。签名与 NEXT 真机验收尚未完成，不能把未签名包当作可直接安装包。HarmonyOS 4.2 手机不适用；用户已确认仅继续 NEXT 路线。状态见 [本次验证记录](../docs/verification/HARMONY_2026-10-20.md)。

rawfile/public 由 sync 生成，禁止手工修改；web-manifest.json 记录资源指纹。签名文件、密码和用户设备资料不提交 Git。

## 下载与发布

[GitHub Releases：NEXT 未签名预览版](https://github.com/keeplinux/reliycooking-petsoul_app_ios/releases/tag/v1.3.18-harmony.1) 提供 HAP、SHA256SUMS.txt 和 INSTALL.md。手机安装仍需合法签名。

后续发布：先提交对应 artifacts/harmony/<版本>/ 包、校验值和 docs/releases/HARMONY_v<版本>.md，再推送 v<版本>-harmony.<序号> 标签。HarmonyOS 发布流程会先校验真实 HAP 与资源指纹，上传附件后公开为预览版；不会修改已发布的版本。

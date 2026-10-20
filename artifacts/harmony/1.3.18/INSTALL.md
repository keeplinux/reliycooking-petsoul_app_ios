# silifield 1.3.18 · HarmonyOS NEXT 预览包

构建日期：2026-10-21。文件 `silifield-1.3.18-harmony-next-unsigned.hap` 是 SDK/Hvigor 实际编译的 **Release 未签名 HAP**，不是可直接分发安装到手机的签名包。

- 包名：`com.pawlink.petwater`；最低 HarmonyOS NEXT 5.0 / API12。
- 工具：DevEco Studio 26.0.0 Release / SDK 26.0.0.105 / Hvigor 插件 6.26.8。
- Release 元数据 `debug=false`，生成的 `BuildProfile.DEBUG=false`，关闭 ArkWeb 调试。
- 已在官方 NEXT 5.0.1 / API13 模拟器安装启动。验证记录与截图见 [验收记录](../../../docs/verification/HARMONY_2026-10-20.md)。
- HarmonyOS 4.2 手机不能安装此 NEXT HAP；按用户选择不生成兼容 APK。

## 校验与模拟器运行

在本目录执行 `shasum -a 256 -c SHA256SUMS.txt`。

使用 DevEco Studio 启动官方 NEXT 模拟器后，用 SDK 中的 hdc 执行：

```sh
hdc list targets
# 先停止旧实例，再覆盖安装；等待安装后的旧进程退出再启动
hdc -t <模拟器ID> shell aa force-stop com.pawlink.petwater
hdc -t <模拟器ID> install -r silifield-1.3.18-harmony-next-unsigned.hap
hdc -t <模拟器ID> shell aa start -b com.pawlink.petwater -a EntryAbility
```

仅本次官方模拟器接受未签名包；不能据此认为真实手机也可安装。首次安装尚无运行进程时，force-stop 提示未运行不影响后续步骤。

## NEXT 手机安装条件

需要 NEXT 5.0 及以上手机、已授权 USB 调试，以及适用于该设备的合法开发签名和 profile。用 DevEco Studio 打开 `harmony/`，在 Signing Configs 配置开发者账号、证书及目标设备，重新生成签名 HAP 再安装；正式分发另需发布签名。私钥、证书、profile、密码与设备标识不要提交 Git。

相机、HEIF/方向、实际视频读取、BLE GATT、真实水机配网、后台恢复与系统输入法仍需 NEXT 真机验收。模拟器的系统扫码返回 `Emulator is not supported.`，不会伪造扫码或配网成功。

## 源码复现

在仓库根目录执行：

```sh
npm ci
npm run sync
npm run verify:parity
npm run build:harmony
node scripts/build-harmony.mjs --release
npm run verify:harmony-package -- --require-release
```

构建成功后输出位于 `harmony/entry/build/default/outputs/default/`。重新构建的 HAP 压缩元数据可能导致整体 SHA-256 不同；包内容校验仍应确认 ArkTS 字节码及三端17个共享资源一致。

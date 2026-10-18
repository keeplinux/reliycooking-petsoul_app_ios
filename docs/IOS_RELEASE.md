# iPhone 签名打包与发布

统一工程 iOS Bundle ID：`com.pawlink.petwater`，版本 `1.3.16 (33)`。

## 已验证

2026-10-18：Release / iphoneos ARM64 无签名 Archive 构建成功；模拟器构建与 UI 验收通过。
无签名 Archive 只能作为构建验证，不能直接安装到 iPhone，不能冒充签名 IPA 发布。

## 签名准备

1. 在 Xcode → Settings → Accounts 登录 Apple 开发者账号。
2. 在账号的 Manage Certificates 中准备 Apple Development/Distribution 证书。
3. 使用 USB 连接目标 iPhone，在手机上信任电脑，并按系统要求启用开发者模式。
4. 确认开发者团队、Bundle ID 与目标设备的注册和授权。

发布给已登记设备使用 `release-testing`（Ad Hoc）；开发调试使用 `debugging`。
TestFlight 使用 `app-store-connect`，还需要 App Store Connect 中的应用记录与上传步骤。
GitHub Releases 只是文件下载，不会替代 Apple 签名或设备授权。

```sh
IOS_DEVELOPMENT_TEAM=你的TeamID IOS_EXPORT_METHOD=release-testing npm run release:ios
```

脚本会构建共享资源、校验双端一致性，执行自动签名 Archive 和 Xcode 官方 exportArchive。
如需注册设备，Xcode 会使用当前登录账号的权限；不把账号凭据、私钥或描述文件写入仓库。
产物路径：`.build/release/silifield-1.3.16-ios.ipa`。

## 发布检查

- 解包后用 codesign 验证 App 及内嵌框架签名。
- 确认 embedded.mobileprovision 有效、分发类型与目标手机相符。
- 在目标 iPhone 安装启动验证。
- 只将最终签名 IPA、SHA256SUMS.txt 和安装说明上传 Releases，不上传证书/私钥。

当前签名证书与设备配置尚未就绪，正式签名 IPA 及 Release 附件需在配置完成后生成。

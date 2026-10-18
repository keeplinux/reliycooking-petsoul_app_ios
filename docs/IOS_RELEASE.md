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

2026-10-18 已使用 Personal Team 完成 debugging 签名导出；签名 IPA 已在登记的 iPhone 13 上安装并启动。该描述文件于 2026-10-25 20:10:38（北京时间）到期。

## GitHub Release 草稿

推送 `v*-ios.*` 标签后，GitHub Actions 使用仅该作业有效的仓库令牌建立 Release 草稿。草稿不会自动发布，也不会将未签名产物列为安装包。正式附件仍需完成 Apple 签名后上传。


## 免费 Personal Team 真机测试

免费账号使用 Xcode 直接签名安装到登记的个人设备，不能用于 Ad Hoc、TestFlight 或 App Store 分发。
Personal Team 的开发描述文件有效期为 7 天，过期后需重新签名安装。
Apple 官方说明：https://developer.apple.com/help/account/basics/about-your-developer-account

```sh
IOS_DEVELOPMENT_TEAM=你的TeamID IOS_DEVICE_ID=连接设备标识 npm run install:ios
```

首次运行会请求 Xcode 创建开发签名证书、App ID 和该设备的描述文件，需已在 Xcode 登录。
iPhone 需完成信任配对、启用开发者模式并解锁。Team ID 与设备标识通过本地环境变量传入，不写进 Git。

本次通过 Xcode `exportArchive` 的 `debugging` 方式正式导出签名 IPA，并对导出的 App 解包、验证签名、检查设备授权后安装启动。
该 IPA 标记为 Personal Team 个人设备测试包，不承诺其他手机下载后可以安装。

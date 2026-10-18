# v1.3.17 输入布局修复

日期：2026-10-18，问题来自 iPhone 13 实测：输入宠物名字后页面放大，按钮超出屏幕。

## 修复

- 名字和生日输入由 14px 调整为 16px；全局编辑控件也设置至少 16px，覆盖登录、Wi-Fi 名称/密码等输入。
- 保留用户主动缩放能力，没有使用 maximum-scale 或 user-scalable=no 禁止缩放。
- App 外层跟随原生 WebView 高度，限制页面根容器溢出，滚动发生在页面内容区域。
- 宠物录入内容区增加 min-height:0，日期和名字输入限制在父容器宽度内。
- 接入官方 Capacitor Keyboard 8.0.6，iOS 使用 native resize，键盘弹出时调整 WebView 的可用高度。
- 名字输入支持“完成”键收起键盘，并避免中文输入法组字时误收起；生日框关闭原生外观以保持宽度边界。
- Android 与 iOS 使用同一份更新后的前端，版本统一为 1.3.17 (34)。

## 验证

- ESLint、TypeScript/Vite 生产构建通过。
- Chromium + WebKit：320/375/390/430px 宽度，反复切换 844/420px 高度、输入中文名字、滚动到提交按钮，8 项通过。
- 两浏览器完整登录、导航、模拟配网与持久化流程，2 项通过，总计 10/10。
- 签名 Release 构建、Archive、Xcode debugging IPA 导出通过。
- 导出的 IPA 签名有效、版本号正确，15 个 Web 文件与双端共享 dist 一致；含 KeyboardPlugin，resize=native。
- 新版已覆盖安装至登记的 iPhone 13，保持原有应用数据。

## iPhone 13 真机结果

- XCUITest `testPetNameKeyboardDoesNotZoom` 通过，1 项、0 失败（约 30 秒）。
- 连续两轮输入名字、点击系统键盘 Done、收起键盘，输入框宽度与输入前一致（允许 2pt 测量误差），左右边界保持在屏幕内。
- 关闭键盘后提交按钮可以完整滚动至屏幕内。测试未提交或创建宠物，保留原有数据。
- 最终导出 IPA 再次校验签名及 15 个 Web 文件，并覆盖安装、启动至同一台 iPhone。
- 截图：`input-layout/keyboard-visible.png`、`input-layout/keyboard-dismissed.png`。

浏览器测试覆盖多种屏宽；实际系统键盘验证仅覆盖当前连接的 iPhone 13。

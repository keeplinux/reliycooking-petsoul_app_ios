# HarmonyOS NEXT 移植与验收方案

版本：v1.2，2026-10-21。替代 v1.0 中尚未核实的能力、时序及验收描述。

目标：沿用 iOS 的简约界面与共享 React/TypeScript/Three.js 业务，新增 ArkTS Stage + ArkWeb 宿主；生成真正的 HAP，不使用 Android APK 兼容方式。

## 可行性与修正结论

路线可行，但同一 dist 只能证明资源一致，不能证明不同 Web 内核的渲染、原生 API 和实际硬件行为一致。完整交付必须经历 Web 校验、ArkTS 编译、签名安装和真机回归四层验收。

| v1.0 假设 | 核对与优化 |
|---|---|
| onPageEnd 注入后再挂载 React | 太晚，index 的模块脚本已可能执行。Web 声明 javaScriptProxy，React 启动前 initializeHarmony 同步配置适配器 |
| BLE 工厂可注入即完成 | 默认客户端在模块加载时已创建，新增 configureHardwareClient 和稳定转发导出，真正替换运行客户端 |
| ArkTS 直接 implements Web BleTransport | 两种编译环境的类型不能直接互认。两端用 JSON RPC 合同，TS 侧符合 BleTransport，ArkTS 侧单独编译验证 |
| DataView/回调直接通过 Proxy | 不直接跨进程传递。字节数组保留视图偏移；通知/断开事件单独分发；请求 ID、超时和拒绝路径明确 |
| resource:// 一定支持全部 Web API | 不作保证。使用固定 HTTPS 虚拟源 https://app.silifield.local，所有资源由 rawfile 拦截返回，无公网服务器依赖；真机验证 secureContext、AES-GCM、IndexedDB |
| iOS 已有 APNs | 当前仅有通知偏好，没有真实 APNs、推送服务或登录后端。Push Kit 属将来的三端业务建设，不计入现有克隆功能 |
| LocalStorage 等于跨设备数据一致 | 仅相同存储逻辑，各系统沙箱独立；已有 iPhone 资料不会自动搬到鸿蒙。跨端同步需要真实账号和后端 |
| 系统最低要求 Android API36 | API36 是构建目标，Android 实际 minSdk 为26；鸿蒙工程最低目标先固定 API12，最终以编译与测试为准 |
| 8周即可保证完全一致 | 工期取决于 SDK、签名、设备及硬件协议是否就绪，以验收证据判断，不能用估算替代完成状态 |

## 代码与边界

- 现有 src/views、src/components、src/index.css 和设备加密/分片协议不修改。
- src/platform/harmony.ts：启动适配、JSON RPC、请求生命周期、二进制和通知转换。
- camera.ts 继续使用既有 Adapter；scanner.ts 新增同类 Adapter；hardware.ts 增加默认客户端切换。
- harmony/entry：Stage Ability、ArkWeb 页面、MediaBridge、BleBridge、受限 JsProxy。
- 相机使用 CameraPicker；相册使用 PhotoViewPicker；系统扫码使用 Scan Kit；BLE 使用 Connectivity Kit。
- ArkWeb file input 按 accept/capture 选择系统拍照、图片或视频选择器；兼容 API12/13 将 MIME 展开为扩展名的行为，返回授权 URI，原有压缩、jsQR 与视频处理不变。
- 本地页面使用同一个固定源，LocalStorage/IndexedDB 沿用既有账号隔离，不开启无痕模式、不在普通退出时清空数据。
- Web 容器保留系统安全区，锁定竖屏；软键盘、系统字号和 WebGL 的最终表现仍需鸿蒙设备验证。
- 图标直接复用 iOS AppIcon；权限、扫码界面和蓝牙设备选择由鸿蒙宿主承载，不要求模仿 iOS 系统弹窗。

## 原生桥合同与安全

JS→ArkTS 仅暴露 SilifieldNative.invoke(string)：

```json
{"id":1,"method":"ble.read","params":"{\"deviceId\":\"selected-device\",\"service\":\"...\",\"characteristic\":\"...\"}"}
```

同步仅返回 accepted/rejected；异步通过 silifield:native 事件返回 `{id,result:<JSON字符串>}` 或 `{id,error:<文本>}`。通知包含 event、deviceId、service、characteristic、bytes；断开事件单独通知。相机/扫码使用相同合同。

原生端校验顶层 URL、方法白名单、请求长度、并发数和重复 ID。BLE 限当前选择的设备、固定配网服务及 Info/Config/Status 特征，写入20字节上限，不能当任意蓝牙控制接口。没有 eval、任意文件路径或任意代码执行方法。

拦截资源只读 packaged rawfile/public，拒绝目录穿越、外部导航与外部资源；CSP 禁止 frame/object/外部脚本，避免远程页面使用本地桥。禁止忽略 SSL 错误、打开全域文件访问或记录 WiFi 密码/QR 密钥。Web 调试仅在 BuildProfile.DEBUG 为 true 时开启；交付 Release 包验证 DEBUG=false。

进入后台停止扫描、断开 GATT、取消设备选择；连接、扫描及选择有时限。回前台需重新连接，不伪造成功。实际生命周期行为必须真机回归。

当前未开放真实云端及 AP 配网。固定 CSP 的 connect-src 仅 self；将来接后端或局域网 HTTP 时需分别设计白名单、权限、TLS/混合内容和凭据处理，不应直接放开所有来源。

## 构建与签名

```sh
npm ci
npm run sync
npm run verify:parity
npm run verify:baseline
npm run verify:water-protocol
npm run test:web
npm run build:harmony
npm run verify:harmony-package
# 交付构建：Release 关闭 ArkWeb 调试
node scripts/build-harmony.mjs --release
```

sync 同时更新 Capacitor 两端和鸿蒙 rawfile，verify:parity 校验三端全部资源 SHA-256。仅运行 build/sync:harmony 后若两端资源落后，parity 应失败，不自动跳过。

工程打开目录为 harmony/，需要华为 DevEco Studio 与 HarmonyOS SDK。工程初始 API12 / modelVersion5.0.0；使用更新 IDE 时按其官方工程升级检查处理，不从未知镜像下载编译器或更换成 Android 项目。build-harmony.mjs 可通过 DEVECO_HOME 或 HVIGORW_JS 指定已有工具。先在 IDE 完成工程同步及 SDK 安装。

构建成功后 HAP 位于 entry/build/default/outputs/default/，通常包含未签名和/或签名输出。可安装包须由华为账号生成合法调试签名与 profile，登记目标设备；公开发布使用正式发布签名。密钥、证书、profile、密码及本机路径不能提交 Git。当前 signingConfigs 为空，不能声称源码已签名。

## 验收矩阵

| 层级 | 范围 | 完成依据 |
|---|---|---|
| 共享源码 | 原页面/样式/协议、TS 编译、原功能回归 | build、lint、baseline、协议与浏览器测试 |
| Web 资源 | dist 对 iOS/Android/Harmony | 全文件 SHA-256，不只首页 |
| 桥接合同 | 字节偏移、通知、断开、权限拒绝、超时、启动注入 | 自动测试；不等同真实 Bluetooth Kit 验证 |
| ArkTS 构建 | SDK API、权限、资源、构建配置 | Hvigor 成功并生成实际 HAP |
| 签名安装 | 合法签名和设备授权 | hdc 安装/启动成功 |
| 鸿蒙真机 | 全页面、WebGL、相机、file input、扫码、BLE配网、持久化、键盘/字号/安全区、后台恢复 | 逐项实际操作与截图/日志，不以 Chromium 替代 ArkWeb |

当前边界：已使用 DevEco Studio 26.0.0 / SDK 26.0.0.105 完成实际 ArkTS 编译并生成未签名 HAP，包内17个 Web 资源已校验。已在官方 NEXT 5.0.1 / API13 模拟器安装、启动并验证主要页面、存储、安全源及选择器；Release 包关闭调试。开发/发布签名及 NEXT 真机验收仍待完成；HarmonyOS 4.2 不适用，用户已确认不生成兼容 APK。真实水机固件仍需实现兼容的 BLE 协议才能联调。以 docs/verification/HARMONY_2026-10-20.md 记录本次最终验证状态。

## 官方依据

- [ArkWeb 资源加载](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/web-page-loading)
- [WebResourceResponse](https://github.com/openharmony/docs/blob/master/en/application-dev/reference/apis-arkweb/arkts-basic-components-web-WebResourceResponse.md)
- [CameraPicker](https://github.com/openharmony/docs/blob/master/en/application-dev/reference/apis-camera-kit/js-apis-cameraPicker.md)
- [Bluetooth GATT](https://developer.huawei.com/consumer/en/doc/harmonyos-guides-V13/gatt-development-guide-V13)
- [Scan Kit 默认界面](https://developer.huawei.com/consumer/en/doc/harmonyos-guides-V14/scan-scanbarcode-V14)
- [DevEco Studio 下载](https://developer.huawei.com/consumer/en/deveco-studio/)

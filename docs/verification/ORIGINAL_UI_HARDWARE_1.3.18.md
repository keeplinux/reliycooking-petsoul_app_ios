# 1.3.18 (36)：原界面恢复与真实扫码/BLE配网

日期：2026-10-18。用户撤回 1.4.0 的新增 UI，要求按 1.3.17 原设计实现能力。

## 原设计恢复

- `Home.tsx`、`Mall.tsx`、`Purchase.tsx`、`TopBar.tsx`、`HomeScene.tsx`、`index.css` 与 036785c（1.3.17）逐文件一致：原星球首页、探针/母舰、扫码入口、品牌字体和原页面结构。
- 撤掉新增卡片、固定列表入口、演示横条、档案编辑弹层和分步结果页；其他页面保留原布局。Settings 去除伪更新，通知偏好仍持久化。
- 保留资料按本机账号隔离、退出重登保留档案、媒体写入 IndexedDB、保存失败提示、16px 输入防缩放等底层修复。
- 未上报的传感器数据/录像不再由宠物姓名随机生成并显示为真实值；水泵/灯光无控制协议时不报告执行成功。宠物形象明确为本机生成，品种不再随机标成“云识别”。

## 真实能力实现

- 原相机入口调用 Capacitor 原生 QR 扫描，原相册入口用 jsQR 解码真实图片；读不到合法码就报错，不生成随机设备。
- 使用 Capacitor BLE 系统选择器、连接、GATT读取、写入与通知，校验二维码 SN/型号与设备 Info 一致；iOS 不用 MAC 识别设备。
- 配网报文 AES-256-GCM 加密，按20字节GATT分片下发；收到认证正确、requestId/SSID匹配的设备联网成功回执才登记设备。失败/超时/断连不伪造成功或IP。
- 删除旧的随机设备、随机密钥、模拟步骤定时器、假联网结果和模拟硬件配置模块。
- 自定义协议、工厂二维码生成器与 ESP32 参考固件见 `docs/HARDWARE_PROTOCOL_V1.md`。
- Android最低API26，iOS添加蓝牙用途说明；扫码/BLE插件按需请求系统权限，不申请后台蓝牙常驻。

## 验证

- ESLint、TypeScript/Vite 生产构建通过。
- Chromium/WebKit 全量26项测试通过：旧UI导航、账户隔离/通知保存、相册二维码真实识别、非二维码拒绝、四种屏宽输入、协议校验、独立AES-GCM互解密、篡改/错密钥/旧会话/反向回执拒绝、分片与超长拒绝、注入GATT测试传输的完整配置与回执流程。
- 其中协议传输测试使用测试适配器，**不等于物理设备测试**；生产代码使用真实 BLE 插件，无模拟成功分支。
- ESP32 DevKit参考固件通过 PlatformIO 编译（espressif32 6.10.0、ArduinoJson7.3.1），生成 firmware.bin，RAM17.2%、Flash49.0%。没有烧录或操作任何实际硬件。
- iOS Release Archive与签名IPA导出通过；解包验签、1.3.18(36)版本及17个Web文件校验通过，包含 BarcodeScanner、BluetoothLe、Camera、Keyboard 插件。
- iPhone13覆盖安装并启动，未卸载、未清空原资料。导航/登录持久化检查通过；键盘连续两轮输入/收起与提交边界检查通过。首次键盘检查未点中移动宠物，重试定位后通过；未改变页面来迁就测试。
- Android/iOS 17个Web文件逐字节一致；Android实际原生编译/设备联调未执行。
- 真机恢复后首页截图：`original-ui-1.3.18/iphone-home.png`。

## 本地交付

- IPA：`.build/release/restored-production/silifield-1.3.18-ios-personal.ipa`，同目录有SHA256SUMS.txt。
- 测试设备 SF000001 的二维码：`.build/factory/SF000001/device-qr.png`；同目录配置头必须与固件配套，包含独立设备密钥，已忽略Git。
- 参考固件：`firmware/esp32-provisioning/`；本机编译产物在其 `.pio/build/esp32dev/` 下，已忽略Git。
- 原始实测结果：`/tmp/petsoul-original-ui-native.xcresult`、`/tmp/petsoul-original-ui-keyboard-retry.xcresult`。
- 未推送Git、未发布Release。

## 尚需联调/接入

当前没有实际ESP32或其他宠物硬件，原生相机实景识码、系统BLE权限/射频、真实路由器联网的完整链路尚未做物理联调。需要将配套配置刷入ESP32，使用对应机身码验证。二维码和协议不能使任意已有蓝牙设备自动兼容。

云端认证/绑定、AP热点配网、视频、照片重建和传感/执行器协议尚未接入；本版不将这些能力描述为已实现。参考固件是可编译的配网实现，量产还需密钥生命周期、所有权校验、NVS/Flash加密及硬件测试。

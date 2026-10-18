# 硅宠 BLE 配网协议 v1

本协议由项目定义，配套 App 1.3.18 (36) 与 `firmware/esp32-provisioning` 参考固件。适用于 ESP32 DevKit（4MB Flash、2.4GHz WiFi）。其他芯片需实现同样的 GATT 与报文，不代表任意市售设备可以直接接入。

## 工厂二维码与配置

```sh
node scripts/create-device-qr.mjs SF000001 smart-water
cp .build/factory/SF000001/device_config.h firmware/esp32-provisioning/include/device_config.h
.build/firmware-env/bin/pio run -d firmware/esp32-provisioning
# 接上属于你的 ESP32 开发板，确认串口后再执行上传；本次没有烧录任何硬件。
# .build/firmware-env/bin/pio run -d firmware/esp32-provisioning -t upload --upload-port 串口路径
```

生成文件位于 `.build/factory/<SN>/`，包括机身二维码 PNG、原始 JSON 和 `device_config.h`。目录存在时拒绝覆盖，避免旧二维码与新密钥不一致。每台设备使用独立随机 32 字节密钥；二维码、配置头和包含密钥的固件二进制不能公开发布或提交 Git。

二维码是 JSON：`{"v":1,"p":"smart-water","sn":"SF000001","key":"<64位十六进制密钥>"}`。SN 限4–32位大写字母、数字和横线；p 必须是 catalog 已知型号；缺失身份或密钥时拒绝，不生成随机 SN/MAC/token。iOS 使用系统设备 UUID，不能靠 BLE MAC 定位。

## GATT

| 用途 | UUID | 权限 |
|---|---|---|
| Service | 28a00001-8c31-4a3b-9d61-425350455431 | 广播 |
| Info | 28a00002-8c31-4a3b-9d61-425350455431 | Read |
| Config | 28a00003-8c31-4a3b-9d61-425350455431 | Write with response |
| Status | 28a00004-8c31-4a3b-9d61-425350455431 | Notify |

广播名称 `SF-<SN>`。用户在原生蓝牙选择器选择目标设备；App 校验 Info 中的 v、SN、型号后才进入原有 WiFi 页面。Info 为 UTF-8 JSON：`{"v":1,"sn":"...","productId":"smart-water","challenge":"<随机16字节hex>"}`。每次连接生成新 challenge，一次连接只接受一次有效配网请求。

## 加密与分片

配置和回执使用 AES-256-GCM，密钥为二维码 key 解码后的32字节；随机 nonce 12字节；tag16字节附在密文末尾。信封为 UTF-8 JSON：`{"v":1,"nonce":"<24 hex>","cipher":"<密文+tag 的 hex>"}`。

请求 AAD 为 UTF-8 `<SN>:<challenge>:request`，回执 AAD 为 `<SN>:<challenge>:response`。会话与方向均参与认证，回执必须匹配当前 requestId 和 SSID。不得记录密码、密钥或明文报文到日志。

Config/Status 使用同一种分片：每包最多20字节，头部为 `[index:uint8, final:uint8]`，后18字节为信封文本数据。index 从0递增；final只有0/1；总长不超过2048字节。Config 逐包等待 GATT 写响应；Status 逐包通知。接收方拒绝乱序、非法长度、过长和非法UTF-8。

请求明文：`{"requestId":"<UUID>","ssid":"...","password":"..."}`，SSID UTF-8 最多32字节，密码8–63字节。参考固件连接真实 WiFi，30秒仍未成功返回失败；仅在 `WL_CONNECTED` 时返回含真实 IP 的联网回执。

成功回执：`{"requestId":"...","status":"connected","ssid":"...","ip":"192.168.x.x"}`。
失败回执：`{"requestId":"...","status":"failed","ssid":"...","error":"可读错误"}`。
App 等待45秒，超时、解密失败、连接中断或失败回执均不添加已绑定设备；成功只代表设备联网与本机列表登记，不声称完成云端账号绑定。

## 参考固件边界

- 已实际编译：espressif32 6.10.0 / Arduino ESP32 / ArduinoJson 7.3.1，esp32dev，huge_app 分区；Flash约1.54MB。
- WiFi 凭据由 ESP32 SDK 持久化，断电后可重新连接；生产设备还需要 Flash/NVS 加密、密钥灌装与更换、恢复出厂与所有权转移策略。
- 二维码相当于设备访问凭据，必须通过可信机身标签交付。BLE 广播和 Info 不含 WiFi 密码，配置在应用层加密；本版本未实现云端所有权校验、限速或完整量产安全认证。
- 未实现 AP 热点配网、云端绑定、水泵/灯光控制、真实饮水传感、实时视频。App 不将这些未收到的读数伪造为真实数据。
- 当前没有连接实际 ESP32，不能将编译与协议测试写成实机联调通过；出厂标签必须与实际烧录的 config 使用同一密钥。

依赖文档：[Capacitor Barcode Scanner](https://capacitorjs.com/docs/apis/barcode-scanner)、[Bluetooth LE](https://github.com/capacitor-community/bluetooth-le)。

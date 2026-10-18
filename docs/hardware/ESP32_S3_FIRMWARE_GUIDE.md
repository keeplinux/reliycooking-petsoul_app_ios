# ESP32-S3 固件开发指南

## 当前可运行基线

`firmware/esp32-provisioning` 是 Arduino + PlatformIO 配网参考工程，默认环境 `esp32-s3-devkitc-1`；固定平台 espressif32 6.10.0、ArduinoJson 7.3.1。旧 esp32dev 环境仅为兼容保留。未启用相机/PSRAM、TF、音频或传感器 GPIO，没有自动烧录设备。

```sh
node scripts/create-device-qr.mjs SF000002 smart-water
cp .build/factory/SF000002/device_config.h firmware/esp32-provisioning/include/device_config.h
.build/firmware-env/bin/pio run -d firmware/esp32-provisioning -e esp32-s3-devkitc-1
npm run verify:water-protocol
```

PlatformIO 可以单独安装；`.build/firmware-env/bin/pio` 是本机已有虚拟环境路径。SN 示例需换成自己的独立编号；重复生成会拒绝覆盖。QR、头文件和包含密钥的二进制必须私下保管，不能上传公共 Release。确认实际板型、电源与串口后才手动执行 upload。参考板的默认 Flash/分区参数不等于你的模块参数；`huge_app.csv` 当前仅用于配网验证，没有 OTA 双分区，不可宣称支持 OTA。

生产可迁移 ESP-IDF，但须保持现有 BLE v1 的 UUID、AES-GCM、分片与身份校验一致。乐鑫 protocomm 是另一套协议，不能直接替换并期待当前 App 兼容。[protocomm 官方文档](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/provisioning/protocomm.html)。

## 模块与任务划分

| 模块 | 职责与约束 |
|---|---|
| board_config / HAL | 唯一引脚、总线、供电、Flash/PSRAM 配置来源；禁止将未定 GPIO 写死 |
| identity / provisioning | 工厂身份、二维码密钥、BLE 配网；与云端身份分离 |
| sensors | 三路水位和三类温度；采样、去抖、标定、故障质量标记 |
| state | 带采样时间的快照；用队列交接，禁止把未初始化内存当读数 |
| network / cloud | WiFi、时钟、TLS/MQTT、退避重连、有限离线队列 |
| camera / media | 限制帧大小、缓冲数量、会话时长；输出图像与媒体索引 |
| storage | 单一写入协调、录像轮转、掉电恢复、拔卡故障处理 |
| audio | 音频缓冲、录播状态、隐私开关；满队列有明确丢弃策略 |
| rgb | 本地告警优先级及逻辑场景映射 |
| command | 参数/能力/时钟/权限检查、幂等、过期、异步完成回执 |

相机、SD 和音频同时开启前做内存/带宽预算，明确 PSRAM 与 DMA 缓冲分配和任务优先级。避免在 BLE/MQTT 回调中执行阻塞 WiFi 连接、SD 写入或媒体编码；现有配网工程不能直接当完整业务任务架构。WiFi/BLE 共存、长时间媒体流和重连需真机压力验证。

## 开发顺序与验收

1. 确认模块完整型号和供电、Flash/PSRAM；保留下载/调试与量产测试接口。使用参考板先跑现有 BLE 配网，验证正确/错误密码、断连、重启和重复报文。
2. 建立状态模型，未接外设全部为未安装或不可用。接入三路水位逐一验证正常、断线、噪声和标定，记录实际质量状态；禁止用随机数填充生产遥测。
3. 接 MQTT 测试服务和独立设备凭据，验证证书失败、断网、LWT、重启、去重、越权 topic、过期命令和未校时拒绝。此时云端服务需要另行实现。
4. 分别验证 JPEG 抓图、TF 读写、单向录音/播放，再测试组合负载；记录峰值内存、帧率、温升、掉帧和卡写入延迟，之后才填写 capabilities。
5. 增加 RGB 场景和事件，先验证本地故障优先级；按合同把真实数据接入 App 原有页面，页面布局不变。unsupported 必须显示不可用而不是演示成功。
6. 量产前补充安全启动/加密/OTA 回滚、密钥轮换、所有权转移、隐私和异常恢复。若后续加水泵，缺水/污水满/水盘异常的保护必须在本机独立完成，断云不能解除保护；当前未实现泵控制。

协议样例是格式示范，不是采集结果；编译通过只说明参考目标代码可构建，不代表烧录、外设兼容或 App 实机联调通过。

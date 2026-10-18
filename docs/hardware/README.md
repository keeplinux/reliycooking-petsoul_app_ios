# ESP32-S3 饮水机开发资料

目标：在保持现有 App 页面和简约设计不变的前提下，为饮水机固件、后端及后续 App 接入约定数据接口。状态：**业务协议设计与接口预留，尚未实现外设驱动、云服务或音视频链路**。当前可执行固件只实现 BLE 加密配网。

阅读顺序：

1. [业务协议与字段](WATER_DEVICE_PROTOCOL_V1.md)：传感器、相机、TF、灯语、联网、音频与温度。
2. [ESP32-S3 开发指南](ESP32_S3_FIRMWARE_GUIDE.md)：模块选型、任务划分、开发顺序和验收。
3. [硬件待定清单](HARDWARE_DECISIONS.md)：画原理图、采购和写驱动前需确认的项目。
4. [BLE 配网 v1](../HARDWARE_PROTOCOL_V1.md)：当前 App 已使用的二维码、GATT、加密和联网回执。
5. [机器可校验的数据合同](../../protocol/water-device/v1/message.schema.json)、[完整预留样例](../../protocol/water-device/v1/examples/)；执行 `npm run verify:water-protocol`。

版本区分：二维码/GATT 信封 `v:1` 保持不变；业务数据 `schemaVersion:"1.0"` 独立演进。下列接口不会因为写入文档就自动出现在 App 中，后续按此合同接入原有页面。当前不更改任何页面、导航或样式。

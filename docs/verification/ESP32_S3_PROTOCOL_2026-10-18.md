# ESP32-S3 饮水机协议预留验证

日期：2026-10-18。

- Git 同步前 fetch：远端 origin/main 没有新增提交，本地已有两次提交尚待上传；本次一并同步。
- 默认参考固件目标：ESP32-S3-DevKitC-1-N8，8MB Flash、未启用 PSRAM；仅是 PlatformIO 参考配置，不代表最终模块配置。
- `pio run -d firmware/esp32-provisioning` 成功；RAM 63,988 / 327,680 bytes（19.5%），应用 Flash 1,291,949 / 3,145,728 bytes（41.1%）。huge_app 分区不支持双分区 OTA。
- `npm run verify:water-protocol`：6 类消息样例通过，11 个非法样例被拒绝，包括未知值冒充 0、液位越界、开关量冒充百分比、错误时间与未开放命令。
- `npm run lint` 和 `git diff --check` 通过。
- 相对于本次开始的 HEAD，本次没有修改 src、Android 资源或 iOS Web 资源，页面、布局和样式保持不变；本机签名团队配置继续留在工作区，不随本次提交上传。
- 本次没有烧录 ESP32-S3，也没有实际传感器/相机/TF/音频/云端联调。样例是接口格式，不是设备实测数据。未重新发布 IPA 或公开带密钥固件。

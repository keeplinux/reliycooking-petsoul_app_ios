# 饮水机业务协议 1.0（开发预留）

## 连接及责任边界

机身 QR → App BLE 配网 → 设备连接 2.4GHz WiFi → TLS 连接 MQTT 服务端 → 账号授权后的 App 经后端读取数据。WiFi 成功不等于互联网可用、MQTT 已连接或云端绑定成功。现有 BLE v1 仅用于配网，不承载业务遥测或视频。账号认领、解绑和所有权转移由后端独立验证，扫码本身不得获得云端所有权。

参考 ESP32-S3 支持 WiFi 与 BLE，并提供相机、SD/MMC、I2S 等外设接口；这不代表模块自带摄像头、TF、麦克风或温度探头，须外接硬件和驱动。[乐鑫芯片数据手册](https://documentation.espressif.com/esp32-s3_datasheet_en.pdf)。

## 传输与信封

建议 MQTT 3.1.1 over TLS，服务端证书必须验证，设备使用独立凭据和 topic ACL；云端凭据不得复用 QR 配网密钥。禁用不验证证书的连接。生产环境启用安全启动、Flash/NVS 加密和签名 OTA 前需完成密钥生命周期设计。MQTT 仅传小型 JSON 与媒体索引，不传 JPEG、视频或音频二进制。[ESP-MQTT 文档](https://docs.espressif.com/projects/esp-idf/en/v5.5.6/esp32s3/api-reference/protocols/mqtt.html)。

主题根 `silifield/v1/devices/{deviceId}`，deviceId 即出厂 SN。设备只能读写自己的主题；用户租户与设备关联由后端数据库和鉴权处理，不信任 App 自报租户。

| 后缀 | 方向 | QoS / retain | 内容 |
|---|---|---|---|
| capabilities | 设备→云 | 1 / 是 | 已安装且驱动可用的能力，固件版本与实际限制 |
| telemetry | 设备→云 | 0 / 否 | 传感器快照；允许丢包 |
| event | 设备→云 | 1 / 否 | 水位报警、TF 故障等状态变化 |
| presence | 设备→云 | 1 / 是 | 在线状态和 LWT |
| command | 云→设备 | 1 / 否 | 有过期时间的命令，禁止保留历史命令 |
| ack | 设备→云 | 1 / 否 | 命令受理、完成或失败 |

所有 JSON 包含 schemaVersion、deviceId、bootId、seq、ts、uptimeMs、kind、payload，结构见 JSON Schema 与同目录样例。bootId 每次启动随机生成；seq 在同一启动内跨业务消息单调递增，QoS 重传保持原 seq。ts 为 UTC ISO8601 时间，未校时为 null；uptimeMs 使用启动后的单调毫秒计时。云端另存 receivedAt，不能用未校时设备的时间判断离线。云下行使用自身启动标识与序号，commandId 为幂等键。

v1 JSON 上限建议 16 KiB，接收方必须有长度/深度/队列限制；示例心跳 30 秒、三次未收到标记失联，仅是可配置初值，实际采样与上报周期需依据功耗和实时性测试。LWT 使用 presence、online:false、reason:will，ts:null；它的 uptimeMs 只能代表注册遗嘱时刻，不代表断网时刻。服务端用接收时间判定。重连更新 retained 状态，按 bootId 丢弃旧会话。QoS 1 可能重复，消费者必须去重。

## 能力与数据质量

capabilities 只声明真正已安装且可用的功能；在设计清单中预留不等于 supported。相机分辨率、TF 文件系统、传感器类型、音频格式、灯珠数量和采样范围均由设备实际报告，未知为 null/空数组。旧端忽略新增字段；删除字段、改变单位/含义或传输机制必须升级主版本。

每个传感器读数使用统一结构 `quality/value/unit`：quality 为 ok、not_installed、not_supported、unavailable、fault、stale 或 uncalibrated。**只有 ok 才允许非 null 数值；未知不得填 0**。stale 保留历史值应由服务端历史记录提供，当前读数仍为 null。数值须有限，禁止 NaN/Infinity。基础单位温度 °C、液位 mm/百分比、容量 mL、空间 byte、音量/亮度百分比。单位字段使用 `C/mm/percent/mL/byte/dBm` 等固定机器字符串。

### 水位与温度

固定三个槽位 `clean` 净水箱、`waste` 污水箱、`tray` 水盘。每路保留 mode（unknown/none/binary/continuous）、quality、percent、heightMm、volumeMl、low、high。binary 只报告实际开关量，percent/heightMm/volumeMl 必须为 null；连续液位也不能在未标定容积时推算容量。low/high 为布尔或 null，阈值和迟滞由标定参数决定；无数据时两者均为 null。传感器安装方向、去抖、越界/断线诊断需按最终器件确定。

温度预留 water、ambient、chip 三路，互不替代。ESP32-S3 内置温度传感器测芯片内部温度，不能当水温或环境温度。[温度传感器说明](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/peripherals/temp_sensor.html)。水温/环境温度需外置传感器。温度上下限未确定，不给 UI 伪造“正常”区间。

### 摄像头图像与视频

capabilities.payload.features.camera.limits 报告 supported、snapshotFormats、streamFormats、resolutions、maxFps；全部由实测决定。预留 snapshot 请求、短时 stream 会话和 TF 录像索引。ack 返回有权限、短时有效的 HTTPS 媒体 URL、expiresAt、mime、width/height；服务端校验用户所有权。局域网直连需要另行定义 TLS 身份、会话鉴权和网络权限，当前不开放匿名接口。

优先验证外接 JPEG 传感器的 JPEG 抓图和 MJPEG 流；不承诺 H.264/H.265、1080p、帧率、WebRTC 或跨网 P2P。ESP32-S3 不具备硬件视频编码能力，摄像头和 PSRAM 配置直接影响可实现范围；WebRTC/HLS 等可由网关/云端转换，但需要额外服务和费用。[相机驱动说明](https://github.com/espressif/esp32-camera/blob/master/README.md)、[乐鑫相机方案](https://docs.espressif.com/projects/esp-techpedia/en/latest/esp-friends/solution-introduction/camera/dvp-mipi-csi-camera-solution.html)。

### TF 卡

storage 预留 quality、mounted、totalBytes、freeBytes、readOnly、recording、errorCode。未知容量为 null，没卡不能表示为“0GB 正常”。文件列表使用服务端/固件生成的不透明 fileId 和分页游标，文件时间未校准应标明；不允许外部任意路径访问。录像轮转、卡满策略、文件系统、热插拔检测待确定。格式化和批量删除默认禁用，未来须设计单独授权与确认流程；本协议不开放这些命令。

### RGB 灯语

报告 scene、brightness、quality，控制使用逻辑场景名，不暴露 GPIO。预留场景：off、idle、pairing、connecting、online、low_clean_water、waste_full、tray_abnormal、fault、privacy。建议优先级：本地安全故障 > 水位报警 > 配网/联网 > 交互 > 常态；远端灯光命令不得覆盖安全提示。

初拟灯语供固件联调：pairing 蓝色呼吸，connecting 蓝色慢闪，online 绿色短亮后返回 idle，low_clean_water 琥珀慢闪，waste_full 红色慢闪，tray_abnormal 红色双闪，fault 红色快闪，privacy 白色常亮。颜色、节奏和常态亮度不是硬件定稿，后续用配置表调整；不能只靠颜色区分故障。privacy 需与真实采集状态一致，不能由远端熄灯隐藏采集。

### 联网、云端、咪头与喇叭

network 分别报告 wifiConnected、ip、rssiDbm、internetReachable、cloudConnected；unknown 使用 null。cloudConnected 仅在 MQTT 已完成鉴权且连接有效时为 true。不要在遥测中包含 WiFi 密码、QR 密钥、云凭据或完整个人信息。

audio 预留 micAvailable、speakerAvailable、micMuted、speakerVolume、captureActive、playbackActive；未知为 null。I2S/PDM/外置 ADC、功放、codec、采样率、位宽、声道与回声消除均待选型。默认不宣称全双工通话，先验证单向录音与播放，格式由 capabilities 报告。音频通过经授权的媒体通道传输；MQTT 仅传状态和会话控制。采集/录像需显式授权与可见指示，并定义本地隐私模式和访问审计。

## 命令及回执

预留 name：state.get、camera.snapshot、camera.stream.start、camera.stream.stop、storage.list、rgb.set、audio.capture.start、audio.capture.stop、audio.play、audio.stop、audio.volume.set。未实现/未声明能力必须返回 unsupported，不得回成功。水泵、消毒、OTA、格式化、恢复出厂及解绑尚未开放。

command payload：commandId（UUID）、name、issuedAt、expiresAt（UTC，默认最长 30 秒，长时间流另用有期限会话）、params。设备未校时拒绝会改变状态的远程命令并返回 clock_unavailable；校验身份、权限、参数和过期时间后方可执行。相同 commandId 不得重复执行，返回缓存结果；缓存保留至少 10 分钟，同 commandId 不同参数返回 conflict。重启后过期/旧会话命令不得恢复执行。

ack payload：commandId、status（accepted/succeeded/failed/rejected）、errorCode（成功 null）、result（无结果 null）。accepted 仅表示受理，不能更新为已完成；超时返回 failed/timeout。errorCode 约定 unsupported、invalid_params、expired、clock_unavailable、busy、not_ready、forbidden、conflict、timeout、hardware_fault。payload.result 按命令定义，后续驱动落地时补充逐命令参数 Schema，当前不把开放 params 当作安全验证器。

事件 payload 包含 code、severity（info/warning/critical）、active、details，预留 clean.low、waste.full、tray.abnormal、sensor.fault、storage.fault、camera.fault、audio.fault、network.changed。事件告警必须来自真实状态与去抖结果，不按演示计时器触发。告警恢复发送相同 code/active:false。

## capabilities.limits 字段约定

路径以信封 payload.features 为起点：camera.limits 中 snapshotFormats/streamFormats 为 MIME 字符串数组，resolutions 为 `{width,height}` 数组，maxFps 为数值或 null；storage.limits 含 filesystems 字符串数组、maxCapacityBytes 数值或 null；audio.limits 含 codecs、sampleRatesHz、sampleBits、channels 数组和 fullDuplex 布尔值；rgb.limits 含 ledCount 数值或 null、scenes 字符串数组；water.limits 含 cleanMode/wasteMode/trayMode；temperature.limits.sensors 为已支持的 water/ambient/chip 列表。空数组表示无已验证支持项。首次驱动接入时应为相应 limits 和每条 command.params 增加严格 Schema，基础 Schema 目前只校验信封、状态读数及命令名称，不替代业务授权、跨字段校验或驱动参数检查。

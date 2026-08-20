# 硅宠场域 PetSoul · iOS App 技术架构设计

> 版本：v1.0（决策已对齐，定稿）
> 日期：2026年8月20日
> 关联文档：[README.md](./README.md)（PRD v2.1）、[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)

---

## 1. 架构总览

### 1.1 分层架构

采用 **Clean Architecture + MVVM** 分层，自上而下分为四层，依赖方向单向向下：

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation Layer（展示层 · SwiftUI）                        │
│  View（声明式UI） + ViewModel（@Observable，绑定状态与交互）     │
├──────────────────────────────────────────────────────────────┤
│  Domain Layer（领域层 · 纯 Swift）                             │
│  Entity（领域模型） + UseCase（业务用例） + Repository Protocol │
│  不依赖任何 UI / 网络 / 持久化框架，可独立测试                   │
├──────────────────────────────────────────────────────────────┤
│  Data Layer（数据层）                                          │
│  Repository 实现 + NetworkClient + PersistenceStore + Cache    │
│  DTO ↔ Entity 映射，对接后端 API / 本地数据库 / 缓存            │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure（基础设施层）                                  │
│  ARKit / SceneKit / APNs / Keychain / WebSocket / HLS         │
│  第三方 SDK 封装、系统服务封装                                  │
└──────────────────────────────────────────────────────────────┘
```

**设计原则**：
- **单向依赖**：上层依赖下层，下层不感知上层；ViewModel 不直接调网络，而是通过 UseCase → Repository
- **协议导向**：Domain 层定义 Repository 协议，Data 层提供实现，便于 Mock 测试与替换
- **模块化**：按 Feature 拆分为独立 Swift Package / Target，编译隔离、职责清晰
- **离线优先**：本地 CoreData 为唯一数据源（Single Source of Truth），UI 只读本地，网络层负责同步

### 1.2 数据流（单向数据流）

```
用户操作 → ViewModel.intent → UseCase.execute → Repository
                                                       ↓
                                              NetworkClient（远程）
                                              PersistenceStore（本地）← 刷新 UI
                                                       ↓
                                              Entity 写入本地 DB
                                                       ↓
                                              SwiftUI 自动刷新 View
```

- UI 不直接持有网络请求结果，只观察本地数据
- 网络请求成功后写入本地，本地变更通过 `@FetchRequest` / Combine 自动驱动 UI 刷新
- 网络失败时本地仍有缓存数据，保证离线可用

---

## 2. 模块划分

### 2.1 工程结构（Swift Package Manager 多模块）

采用 **单 App Target + 多 Swift Package 模块** 的方式，主工程轻量，功能模块独立可测：

```
PetSoulApp/                          ← App Target（壳工程，仅组装）
├── App/                             ← 入口、Tab 组装、依赖注入
│   ├── PetSoulApp.swift             ← @main 入口
│   ├── RootTabView.swift            ← 四大 Tab 容器
│   └── DIContainer.swift            ← 依赖注入容器
├── Resources/                       ← App 级资源（Assets、LaunchScreen）
│
├── Packages/                        ← 各功能模块（独立 Swift Package）
│   ├── CoreKit/                     ← 跨模块基础设施
│   │   ├── CoreUI/                  ← 设计系统（色彩/字体/组件/粒子动画）
│   │   ├── CoreModels/              ← 共享领域模型 + DTO
│   │   ├── CoreNetwork/             ← 网络层（APIClient/WebSocket/拦截器）
│   │   ├── CorePersistence/         ← 持久化（CoreData Stack/Repository基类）
│   │   ├── CoreCommon/              ← 工具/扩展/常量/Logger
│   │   └── CoreDesign/             ← 设计 Token（颜色值/间距/圆角定义）
│   │
│   ├── FeatureLaunch/               ← 启动页（3秒Logo）
│   ├── FeatureHome/                 ← 宇宙首页（3D孪生主体/探针轨道/观测速览）
│   ├── FeatureTwin/                 ← 数字孪生（照片/视频/硬件三种生成方式）
│   ├── FeatureProbe/                ← 智能探针（商城/已购设备/设备详情）
│   ├── FeatureHealth/               ← 健康管理（报告/趋势/赫罗图/行为洞察）
│   ├── FeatureProfile/              ← 家长中心（账号/消息/数据主权/设置）
│   └── FeatureStarMap/              ← AR星图观测（ARKit天体追踪）
│
└── PetSoulApp.xcodeproj
```

### 2.2 模块职责与依赖关系

```
                    ┌─────────────┐
                    │  PetSoulApp │（壳工程）
                    └──────┬──────┘
        ┌──────┬───────┬───┴────┬────────┬──────────┐
        ▼      ▼       ▼        ▼        ▼          ▼
   Launch   Home   Probe    Health   Profile    StarMap
        │      │       │        │        │          │
        │      ├──Twin─┤        │        │          │
        ▼      ▼       ▼        ▼        ▼          ▼
              ┌──────────────────────────────────────┐
              │              CoreKit                  │
              │  CoreUI · CoreModels · CoreNetwork   │
              │  CorePersistence · CoreCommon        │
              └──────────────────────────────────────┘
```

**规则**：
- Feature 模块之间 **不直接依赖**，跨模块通信用 Combine/回调或通过 App 层协调
- 所有 Feature 模块依赖 `CoreKit`，但不依赖彼此
- `FeatureHome` 需要触发生成孪生 → 依赖 `FeatureTwin`（唯一允许的 Feature 间依赖）
- 每个模块对对外暴露一个 `***View`（入口视图）和 `***ViewModel`

### 2.3 各模块内部结构（以 FeatureHome 为例）

```
FeatureHome/
├── Sources/FeatureHome/
│   ├── HomeView.swift              ← 入口视图
│   ├── HomeViewModel.swift         ← 状态管理
│   ├── Views/                      ← 子视图
│   │   ├── TwinSceneView.swift     ← SceneKit 3D孪生场景
│   │   ├── ProbeOrbitView.swift    ← 探针轨道
│   │   ├── EnergyBarView.swift     ← 恒星能量条
│   │   └── EmptyStateView.swift    ← 空态引导
│   ├── UseCases/                   ← 业务用例
│   └── Repository/                 ← 本模块 Repository 协议
├── Tests/FeatureHomeTests/

---

## 3. 技术选型确认

### 3.1 技术栈

| 项目 | 方案 | 说明 |
|------|------|------|
| 语言 | Swift 6.0 | 启用严格并发检查（Strict Concurrency） |
| UI 框架 | SwiftUI | 声明式 UI，ViewModel 用 `ObservableObject` + `@Published` |
| 架构 | Clean Architecture + MVVM | 分层解耦（iOS 16 兼容，不用 `@Observable` 宏） |
| 最低系统 | iOS 16.0+ | 覆盖 iPhone SE 2 及以上，与 PRD 兼容性要求一致 |
| 数据存储 | CoreData | iOS 16+ 原生，UI 用 `@FetchRequest` 驱动刷新 |
| 网络 | URLSession + async/await | RESTful API |
| 实时通信 | WebSocket（URLSessionWebSocketTask） | 设备状态实时推送 |
| 3D 渲染 | SceneKit | 数字孪生 3D 形象渲染与手势交互 |
| AR | ARKit + SceneKit | 星图观测天体叠加 |
| 推送 | APNs + UserNotifications | 远程推送 + 本地通知兜底 |
| 视频流 | AVPlayer + HLS | 带摄像头探针的实时画面 |
| 安全 | Keychain + CryptoKit | Token/密钥存储 + 设备指令签名 |
| 依赖管理 | Swift Package Manager | 原生集成 |
| 测试 | XCTest + Swift Testing | 单元测试 + UI 测试 |
| IDE | Xcode 16 | 需安装完整版 |

### 3.2 第三方依赖（最小化原则）

| 库 | 用途 | 是否必需 |
|----|------|---------|
| [Supabase Swift SDK](https://github.com/supabase/supabase-swift) | BaaS 客户端（Auth/Database/Storage/Realtime） | ✅ 必需 |
| ❓ [LumaKit / Meshy SDK] | 照片/视频→3D模型重建 | P1 阶段接入，MVP 不需要 |
| 无（其余零三方依赖） | 图表用 SwiftUI Charts，3D 用 SceneKit，AR 用 ARKit | — |

> **原则**：能用原生不用三方。图表用 SwiftUI Charts；3D 重建倾向后端 API 化（App 只负责上传素材、轮询结果），不在客户端引入重 SDK。

---

## 4. 核心数据模型

### 4.1 领域实体关系

```
User ──┬── owns ──→ Pet ──┬── has ──→ DigitalTwin（3D模型）
       │                  ├── binds ──→ Probe（探针设备）──→ Observation（观测数据）
       │                  ├── has ──→ HealthReport（健康报告）
       │                  └── has ──→ BehaviorInsight（行为洞察）
       │
       └── manages ──→ FamilyMember（家庭成员）
                       Message（消息）
```

### 4.2 核心实体定义

#### Pet（宠物恒星）
```swift
struct Pet {
    let id: UUID
    var name: String
    var species: PetSpecies        // .cat / .dog
    var breed: String              // 品种
    var birthDate: Date            // 生日 → 推算恒星演化阶段
    var gender: Gender
    var isNeutered: Bool
    var avatarURL: URL?
    var twinModelURL: URL?         // 3D孪生模型文件地址
    var twinStatus: TwinStatus     // .none / .processing / .ready
    var stellarStage: StellarStage // 恒星演化阶段（由年龄自动推算）
    var healthScore: Int           // 恒星亮度指数 0-100
    var createdAt: Date
}

enum TwinStatus { case none, processing(progress: Double), ready, failed }
enum StellarStage { case protostar, mainSequenceBlue, mainSequenceGold, subGiant, redGiant, whiteDwarf }
```

#### DigitalTwin（数字孪生）
```swift
struct DigitalTwin {
    let id: UUID
    let petId: UUID
    var modelURL: URL              // .usdz / .obj 3D模型文件
    var thumbnailURL: URL?
    var source: TwinSource         // 生成来源
    var qualityScore: Double       // 还原度评分
    var version: Int               // 形象版本（可迭代优化）
    var generatedAt: Date
}

enum TwinSource { case photo, video, hardwareCapture }
```

#### Probe（探针设备）
```swift
struct Probe {
    let id: UUID
    var petId: UUID?
    var productModel: ProbeModel   // .drinker(饮水舱) / .feeder(喂食器) / .litterbox(猫砂盆)
    var nickname: String           // "客厅饮水舱"
    var serialNumber: String
    var firmwareVersion: String
    var onlineStatus: OnlineStatus
    var capabilities: ProbeCapabilities // 设备能力（控温/摄像头/麦克风...）
    var boundAt: Date
}

struct ProbeCapabilities {
    var hasCamera: Bool
    var hasMicrophone: Bool
    var hasTemperatureControl: Bool
    var hasWaterLevelSensor: Bool
}
```

#### Observation（观测数据）
```swift
struct Observation {
    let id: UUID
    let petId: UUID
    let probeId: UUID
    var type: ObservationType      // .drinking / .feeding / .proximity / .weight
    var value: Double
    var duration: TimeInterval?
    var timestamp: Date
}

enum ObservationType { case drinking, feeding, proximity, weight, temperature }
```

#### HealthReport（健康报告）
```swift
struct HealthReport {
    let id: UUID
    let petId: UUID
    var period: ReportPeriod       // .daily / .weekly / .monthly / .yearly
    var healthScore: Int           // 恒星亮度指数 0-100
    var stellarStage: StellarStage
    var anomalyLevel: AnomalyLevel // .normal / .mild / .moderate / .severe
    var summary: String            // "青年期·主序星，恒星亮度正常✨"
    var metrics: [HealthMetric]    // 各项指标
    var generatedAt: Date
}

enum AnomalyLevel { case normal, mild(stellarSpot), moderate(flare), severe(dying) }
```

---

## 5. API 契约设计

### 5.1 通用约定

| 项目 | 约定 |
|------|------|
| Base URL | Supabase Project URL（如 `https://xxx.supabase.co`），REST 走 PostgREST，Auth/Storage/Realtime 各有子端点 |
| 通信格式 | JSON（请求体 / 响应体） |
| 认证 | `Authorization: Bearer <accessToken>`，Token 过期用 refreshToken 刷新 |
| 时间格式 | ISO 8601（UTC）`2026-08-20T09:00:00Z` |
| 分页 | `?page=1&pageSize=20`，响应含 `total` |
| 错误码 | HTTP 状态码 + 业务 `code` 字段 |
| 幂等 | 写操作支持 `Idempotency-Key` 请求头 |

**统一响应结构**：
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**：
```json
{
  "code": 40001,
  "message": "宠物不存在",
  "data": null
}
```

### 5.2 认证模块

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 手机号验证码登录 | POST | `/auth/sms/send` | 发送验证码 |
| 验证码校验登录 | POST | `/auth/sms/verify` | 校验 → 返回 accessToken + refreshToken |
| 微信登录 | POST | `/auth/wechat` | code 换 token |
| Apple ID 登录 | POST | `/auth/apple` | identityToken 换 token |
| 刷新 Token | POST | `/auth/refresh` | refreshToken → 新 accessToken |
| 登出 | POST | `/auth/logout` | 吊销 Token |

```json
// POST /auth/sms/verify 响应
{
  "code": 0,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600,
    "user": {
      "id": "u_001",
      "phone": "138****8888",
      "nickname": "星辰家长"
    }
  }
}
```

### 5.3 宠物模块

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 宠物列表 | GET | `/pets` | 当前用户的所有宠物 |
| 添加宠物 | POST | `/pets` | 创建宠物档案 |
| 宠物详情 | GET | `/pets/{petId}` | 含孪生状态、健康分 |
| 更新宠物 | PUT | `/pets/{petId}` | 修改档案 |
| 删除宠物 | DELETE | `/pets/{petId}` | 二次确认 |

```json
// POST /pets 请求
{
  "name": "咪咪",
  "species": "cat",
  "breed": "英国短毛猫",
  "birthDate": "2023-03-15",
  "gender": "female",
  "isNeutered": true
}

// GET /pets/{petId} 响应
{
  "code": 0,
  "data": {
    "id": "pet_001",
    "name": "咪咪",
    "species": "cat",
    "breed": "英国短毛猫",
    "birthDate": "2023-03-15",
    "stellarStage": "mainSequenceGold",
    "healthScore": 88,
    "twin": {
      "status": "ready",
      "modelURL": "https://cdn.../twin_001.usdz",
      "thumbnailURL": "https://cdn.../twin_001_thumb.png",
      "source": "photo",
      "version": 2
    }
  }
}
```

### 5.4 数字孪生模块（核心）

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 上传素材 | POST | `/pets/{petId}/twin/upload` | 上传照片/视频，返回 taskId |
| 查询生成进度 | GET | `/twin/tasks/{taskId}` | 轮询生成状态与进度 |
| 获取孪生模型 | GET | `/pets/{petId}/twin` | 获取最新3D模型文件地址 |
| 触发硬件自动生成 | POST | `/pets/{petId}/twin/hardware` | 用探针采集图像生成 |
| 更新孪生版本 | POST | `/pets/{petId}/twin/refresh` | 补充素材后重新生成 |

```json
// POST /pets/{petId}/twin/upload 请求（multipart/form-data）
// field: files[] = [照片1, 照片2, ...] 或 视频
// field: source = "photo" | "video"

// 响应
{
  "code": 0,
  "data": {
    "taskId": "task_001",
    "status": "processing",
    "estimatedSeconds": 60
  }
}

// GET /twin/tasks/{taskId} 响应（轮询）
{
  "code": 0,
  "data": {
    "taskId": "task_001",
    "status": "processing",    // processing | ready | failed
    "progress": 0.65,
    "modelURL": null            // ready 时返回
  }
}
```

**客户端策略**：
1. 上传素材 → 拿到 taskId
2. 每 3 秒轮询 `/twin/tasks/{taskId}`，更新进度条
3. status=ready → 下载 `.usdz` 模型到本地缓存 → 首页 SceneKit 加载

### 5.5 探针设备模块

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 设备列表 | GET | `/pets/{petId}/probes` | 按宠物分组的设备 |
| 扫码绑定 | POST | `/probes/bind` | 扫描二维码绑定设备到宠物 |
| 设备详情 | GET | `/probes/{probeId}` | 状态、能力、固件版本 |
| 下发指令 | POST | `/probes/{probeId}/command` | 控温/模式切换等 |
| 解绑设备 | DELETE | `/probes/{probeId}` | 解绑 |
| 固件升级 | POST | `/probes/{probeId}/ota` | 触发 OTA |

```json
// POST /probes/{probeId}/command 请求
{
  "command": "set_temperature",
  "params": { "targetTemp": 45, "mode": "constant" }
}

// 响应
{
  "code": 0,
  "data": {
    "commandId": "cmd_001",
    "status": "executing"     // executing | success | failed
  }
}
```

### 5.6 实时通信（WebSocket）

| 通道 | URL | 推送内容 |
|------|-----|---------|
| 设备状态 | `wss://api.../ws/device` | 在线/离线、实时水温水量 |
| 观测数据 | `wss://api.../ws/observation` | 饮水/进食/靠近实时事件 |
| 孪生进度 | `wss://api.../ws/twin` | 3D生成进度推送（替代轮询） |

```json
// WebSocket 消息格式
{
  "type": "observation",
  "petId": "pet_001",
  "probeId": "probe_001",
  "data": {
    "observationType": "drinking",
    "value": 1,
    "duration": 12.5,
    "timestamp": "2026-08-20T09:30:00Z"
  }
}
```

### 5.7 健康报告模块

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 每日晨报 | GET | `/pets/{petId}/reports/daily?date=` | 当日健康摘要 |
| 周报/月报 | GET | `/pets/{petId}/reports?period=&from=&to=` | 趋势报告 |
| 趋势数据 | GET | `/pets/{petId}/observations?type=&from=&to=` | 折线图原始数据 |
| 异常预警列表 | GET | `/pets/{petId}/alerts` | 健康异常记录 |
| 赫罗图坐标 | GET | `/pets/{petId}/stellar-chart` | 生命轨迹坐标点 |

### 5.8 探针商城模块

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 商品列表 | GET | `/shop/products` | 探针产品线 |
| 商品详情 | GET | `/shop/products/{productId}` | 3D展示、参数、评价 |
| 预约购买 | POST | `/shop/orders` | 下单/预约 |

### 5.9 用户与消息模块

| 接口 | Method | Path | 说明 |
|------|--------|------|------|
| 用户资料 | GET/PUT | `/user/profile` | 个人信息 |
| 家庭成员 | GET/POST/DELETE | `/family/members` | 成员管理 |
| 消息列表 | GET | `/messages?type=&page=` | 按类型分页 |
| 标记已读 | PUT | `/messages/{id}/read` | — |
| 数据导出 | GET | `/pets/{petId}/data/export` | 导出 JSON/CSV |
| 数据删除 | DELETE | `/pets/{petId}/data` | 删除全部数据 |
| 推送注册 | POST | `/user/device-token` | 注册 APNs deviceToken |

---

## 6. 关键技术方案

### 6.1 数字孪生 3D 渲染（SceneKit）

```
FeatureTwin 上传素材 → 后端 AI 重建 → 返回 .usdz 模型文件
                                           ↓
FeatureHome TwinSceneView（SCNView）
  ├── 加载本地缓存的 .usdz
  ├── 相机：允许旋转/缩放（SCNNode 手势绑定）
  ├── 微动效：呼吸缩放/眨眼/摆尾（CAAnimation / SCNAction 序列）
  ├── 状态叠加：光晕（SCNNode 透明球体）+ 粒子（SCNParticleSystem）
  └── 探针轨道：金色圆环 SCNNode + 光点闪烁动画
```

**MVP 阶段降级方案**：后端 AI 重建未就绪前，先用预置通用 3D 宠物模型（猫/狗各一个 `.usdz`）作为占位，验证 SceneKit 渲染与交互链路。

### 6.2 AR 星图观测（ARKit）

```
FeatureStarMap
  ├── ARView（RealityKit/ARKit）
  ├── CoreLocation：GPS 定位
  ├── CoreMotion：陀螺仪/指南针 → 设备姿态
  ├── 天文计算：本地算法算行星方位角/高度角（无需网络）
  └── SceneKit 叠加层：天体标签 + 方向箭头 + 锁定圈
```

天体位置计算纯本地实现（行星轨道根数算法），不依赖后端 API，可完全独立开发。

### 6.3 设备通信链路（ESP32-S3）

整体原则：**全链路走 Supabase，不引入额外的 MQTT 服务器**，让 MVP 最简单最稳定。

```
                        ┌─────────────┐
  iPhone App ──────────→│  Supabase   │←────────── ESP32-S3 探针
   (SwiftUI)            │  (云端BaaS)  │           (WiFi+BLE)
                        └─────────────┘
   HTTP REST ───────────→  数据库/存储  ←────────── HTTP REST
   Realtime ←──────────── 实时变更推送  ←────────── 设备定时上报
```

分两个阶段：

**① 配网阶段（BLE 蓝牙配网）—— 手机直接连设备**
```
ESP32-S3 开机，未配网 → 广播 BLE 信号
  ↓
App 扫描 BLE → 发现 "PetSoul-Drinker-XXXX"
  ↓
App 通过 BLE 把 WiFi 账号密码发给 ESP32-S3
  ↓
ESP32-S3 连上 WiFi → 连上 Supabase → 注册设备 → 配网完成
  ↓
App 把设备绑定到某只宠物（写入 Supabase 设备表）
```

**② 日常通信阶段（HTTP 直连 Supabase）—— 手机和设备都只和云端说话**
```
设备 → 云端（上报数据）：
  ESP32-S3 传感器检测到饮水 → HTTP POST 到 Supabase 数据库
  （ESP32 的 HTTPClient 库非常成熟稳定）

云端 → 设备（下发指令）：
  App 写一条指令到 Supabase "commands" 表（如 set_temp=45）
  ESP32-S3 每 5~10 秒 HTTP GET 轮询自己有没有新指令
  收到指令 → 执行 → 把结果写回数据库

App ↔ 云端（实时刷新）：
  Supabase Realtime（WebSocket）推送数据库变更 → App 实时刷新
```

**为什么这样最简单稳定**：
- 设备和 App 都只跟 Supabase 打交道，中间没有别的服务器，环节越少越稳定
- ESP32 的 HTTP 库比 MQTT 库更简单稳定，MVP 阶段不需要 MQTT
- 设备轮询指令虽然不是"实时"，但 5~10 秒延迟对宠物饮水舱完全够用
- 后续如果需要真正实时下发，再单独加一个轻量 MQTT broker 即可，不影响现有架构


### 6.4 离线优先与本地缓存

```
CoreData（本地数据库，Single Source of Truth）
  ├── Pet / DigitalTwin / Probe / Observation / HealthReport
  ├── UI 通过 @FetchRequest 直接读本地
  └── 网络层负责：拉取远端 → 写入本地（UI 自动刷新）

网络层策略：
  ├── 请求成功 → 更新本地 + 更新 lastSyncTime
  ├── 请求失败 → 返回本地缓存数据 + 标记 stale
  └── 后台刷新：App 启动 / 下拉刷新 / WebSocket 推送触发
```

### 6.5 启动页（3秒Logo）

```swift
// LaunchFlow
LaunchView（Logo 动画，约3秒）
  ├── 支持 tap/swipe 跳过
  ├── 倒计时结束 → 检查登录态
  │   ├── 已登录 → RootTabView（首页）
  │   └── 未登录 → LoginView
  └── 品牌素材支持远程下发（GET /config/launch → 缓存到本地）
```

---

## 7. 决策点确认（✅ 已对齐）

| # | 决策点 | 决定 | 说明 |
|---|--------|------|------|
| 1 | **最低 iOS 版本** | ✅ **iOS 16** | 覆盖 iPhone SE 2 及以上，与 PRD 兼容性要求一致 |
| 2 | **3D孪生重建方案** | ✅ **MVP预置模型 → P1接第三方API** | MVP 用预置通用宠物 .usdz 模型占位，P1 接入第三方 AI 重建 API 验证效果 |
| 3 | **后端方案** | ✅ **Supabase，MVP样机阶段** | 仅做 MVP 样机验证，先用单个 dev 项目即可 |
| 4 | **数据持久化** | ✅ **CoreData** | iOS 16+ 原生，UI 用 `@FetchRequest` 驱动刷新 |
| 5 | **登录方式** | ✅ **MVP全做** | 手机号 + 微信 + Apple ID（App Store 强制要求 Apple ID） |
| 6 | **设备通信** | ✅ **ESP32-S3 + BLE配网 + HTTP直连Supabase，详见 7.2** | 全链路走Supabase，不引入MQTT，最简最稳 |
| 7 | **图表方案** | ✅ **SwiftUI Charts（原生）** | iOS 16+ 内置，零三方依赖 |
| 8 | **设备适配策略** | ✅ **通用，iPhone优先、iPad自然兼容** | 一套代码(Universal)，先做iPhone，跑通后iPad微调；上架一次覆盖全部设备 |

### 7.1 决策点3详解：后端方案（你要稳定和简单，我的建议）

#### 什么是"后端"？
你的 App 需要存数据（宠物档案、健康记录）、做登录、存3D模型文件、给设备发指令——这些都需要一台"服务器"在云端24小时运行。这就是后端。

#### 三种方案对比

| 方案 | 是什么 | 稳定性 | 简单度 | 适合你吗 |
|------|--------|--------|--------|---------|
| **A. BaaS（推荐）** | "后端即服务"，别人帮你把数据库/登录/文件存储/实时推送全搭好了，你只管调用 | ⭐⭐⭐ 高（大厂运维） | ⭐⭐⭐ 最简单（不用管服务器） | ✅ **最适合** |
| B. 自建服务器 | 自己租云服务器、写后端代码、维护数据库、管安全 | ⭐⭐ 中（需自己运维） | ⭐ 复杂（需后端开发） | ❌ 太重 |
| C. Apple CloudKit | Apple自带的云服务，免费但只限Apple生态 | ⭐⭐⭐ 高 | ⭐⭐⭐ 最简单 | ⚠️ 功能受限，不适合设备通信 |

#### 我推荐：Supabase（开源 BaaS）

**为什么选它**：
- **稳定**：全球 CDN，99.9% 可用性，大公司也在用
- **简单**：自带数据库 + 登录 + 文件存储 + 实时推送，不用自己搭
- **开源**：数据在你自己手里，随时可迁移，不被锁死
- **免费起步**：免费额度够 MVP 用（500MB 数据库 + 1GB 文件存储）
- **功能齐全**：恰好覆盖我们需要的——用户认证、宠物数据 CRUD、3D 模型文件存储、WebSocket 实时推送

**它帮你做了什么**（对照我们的需求）：

| 我们的需求 | Supabase 对应功能 | 你要做的 |
|-----------|------------------|---------|
| 用户登录（手机/微信/Apple） | Supabase Auth | 配置登录方式 |
| 存宠物/健康数据 | Supabase Database（PostgreSQL） | 设计表结构 |
| 存3D模型/照片文件 | Supabase Storage | 上传下载文件 |
| 设备实时状态推送 | Supabase Realtime（WebSocket） | 订阅数据变更 |
| 后端逻辑（健康报告生成等） | Supabase Edge Functions | 写简单函数 |

**关于国内访问**：Supabase 服务器在海外，国内访问可能有轻微延迟（200-500ms），对宠物 App 这种非高频交易场景完全够用。如果后续需要更快，可迁移到国内云。

**环境划分**（稳定原则）：
- **开发环境（dev）**：一个 Supabase Project，开发调试用，数据可随意删改
- **生产环境（prod）**：另一个 Supabase Project，正式用户数据，严格保护
- MVP 阶段先只用 dev 环境，上线前再建 prod

> **结论**：你不需要懂后端技术，注册一个 Supabase 账号即可。我会把 App 端的网络层写好对接，你只需要提供一个 Supabase 项目的 URL 和 API Key（注册后我指导你获取）。

---

### 7.2 决策点6详解：设备通信方案（ESP32-S3）

#### 你的硬件是什么？
你用的 **ESP32-S3** 是乐鑫（Espressif）出的一款很成熟的芯片，自带 **WiFi + 蓝牙（BLE）** 两套无线能力。宠物智能硬件圈大量在用，资料多、坑少，选得好。

#### 整个流程用大白话讲

把它想象成给新员工（ESP32-S3 探针）办入职：

**第1步：配网（让设备连上你家 WiFi）**
> 新员工第一天来，还没工位、没账号，需要前台（手机App）带他办入职。

1. 探针插电开机，这时它还没连上 WiFi，但它会**用蓝牙广播**"我是 PetSoul 饮水舱，谁来帮我配网"
2. 用户在 App 里点"添加设备"，App 用**蓝牙扫描**，找到这个探针
3. App 通过蓝牙把**你家 WiFi 的名字和密码**发给探针
4. 探针拿到 WiFi 密码 → 连上你家 WiFi → 连上 Supabase 云端 → 在数据库里注册自己"我上线了"
5. App 让用户选这只设备绑定到哪只宠物 → 完成

> 这就是你说的"BLE 蓝牙配网"，ESP32-S3 原生支持，Espressif 官方有现成的配网协议（ESP BLE Provisioning），Apple 的 CoreBluetooth 也能对接，不用我们从头造。

**第2步：日常使用（设备和云端互相说话）**
> 员工入职后，日常就通过公司系统（Supabase）沟通，不用再面对面。

- 探针检测到宠物喝水了 → 通过 **HTTP 上报**到 Supabase 数据库
- 你在 App 点"水温调到45度" → App 往 Supabase 写一条指令 → 探针**每隔几秒来查一次**有没有新指令 → 收到就执行

**为什么不用 MQTT？**（你可能听过这个词）
MQTT 是一种专门给物联网用的"实时消息"技术。它确实更实时，但需要**额外搭一个 MQTT 服务器**，多一个环节就多一个出问题的地方。MVP 样机阶段，探针用 HTTP 直接读写 Supabase 数据库就够了，延迟几秒完全不影响宠物饮水这种场景。等以后量大了、需要真正实时了，再加 MQTT 也不迟。

#### MVP 阶段 App 端要做什么

| 功能 | App 端工作 | 依赖硬件吗？ |
|------|-----------|------------|
| BLE 配网页面 | 用 CoreBluetooth 扫描/连接/发WiFi密码 | 需要 ESP32-S3 烧好配网固件 |
| 设备列表/详情 | 读 Supabase 数据库（Mock 数据先行） | ❌ 不依赖，先用假数据 |
| 设备控制（调温等） | 往 Supabase 写指令 | ❌ 不依赖硬件，指令先写库里 |

#### 你需要硬件那边配合什么（不急，MVP不阻塞）

| 事项 | 说明 | 什么时候需要 |
|------|------|------------|
| ESP32-S3 烧录配网固件 | 用 ESP-IDF 官方 BLE Provisioning 例程改 | 真机联调阶段 |
| WiFi 配网的蓝牙广播名格式 | 如 `PetSoul-Drinker-XXXX`，App 扫描时识别 | 真机联调阶段 |
| 传感器数据字段约定 | 饮水量/水温/水量的数据格式 | 真机联调阶段 |

> **结论**：MVP 阶段 App 用 Mock 假数据把界面和交互全部做出来，BLE 配网页面可以先用占位 UI。等硬件那边把 ESP32-S3 配网固件烧好，我们再对接真机。你现在不用管硬件的事，我先把 App 做出来。

---

## 8. Apple 开发者公司账号注册指南

> 你的 App 是「上海硅宠场域科技有限公司」的产品，必须注册**公司账号（Organization）**，上架时才能显示公司名，也方便以后加团队成员。
> 整个流程免费申请邓白氏编码 + $99/年订阅，一次注册覆盖 iPhone + iPad + Mac。

### 8.1 费用与时长一览

| 项目 | 费用 | 耗时 | 备注 |
|------|------|------|------|
| 注册 Apple ID | 免费 | 5 分钟 | 用公司域名邮箱 |
| 申请邓白氏编码（D-U-N-S） | 免费 | 5-15 个工作日 | 公司账号必须，Apple 协助申请 |
| 加入 Apple Developer Program | $99/年（约 ¥699） | 审核约 1-2 个工作日 | 可用公司信用卡/借记卡支付 |
| **合计** | **$99/年** | **约 2-4 周** | 每年续费一次 |

### 8.2 详细步骤（按顺序操作）

#### 第1步：准备材料（提前备好）

| 材料 | 说明 | 你有了吗 |
|------|------|---------|
| 📄 营业执照 | 「上海硅宠场域科技有限公司」营业执照扫描件/照片 | ❓ |
| 🏢 公司英文/拼音名称 | 如 "Shanghai SiliField Technology Co., Ltd."（营业执照上若有英文名用英文名，没有就用拼音） | ❓ |
| 📍 公司注册地址 | 营业执照上的地址（英文/拼音） | ❓ |
| 📞 公司电话 | 座机或手机均可，**Apple 会打这个电话回访确认** | ❓ |
| 📧 公司域名邮箱 | 如 `dev@silifield.com`，**不能用 QQ/163/Gmail 等免费邮箱** | ❓ |
| 🌐 公司官网（可选） | 有官网更好，审核更容易通过 | ❓ |
| 💳 支付用的卡 | 公司或个人信用卡/借记卡（Visa/MasterCard/银联），用于付 $99 | ❓ |

> ⚠️ **最关键的是"公司域名邮箱"**。Apple 不接受免费邮箱注册公司账号，你必须有一个 `@你公司域名.com` 的邮箱。如果还没有，需要先注册一个公司域名（如 `silifield.com`）并开通企业邮箱（阿里云/腾讯企业邮都可以，几十块/年）。

#### 第2步：注册公司 Apple ID（5分钟）

1. 打开 https://appleid.apple.com → 点"创建你的 Apple ID"
2. 填写信息：
   - **姓名**：填你（法人/负责人）的真实姓名
   - **邮箱**：用公司域名邮箱（如 `dev@silifield.com`），这将成为 Apple ID
   - **手机号**：用于双重认证，填你的手机号
3. 完成手机验证码 + 短信双重认证
4. 登录 Apple ID，在"个人信息"里把**电话号码设置为公司电话**（审核时会核对）

#### 第3步：申请邓白氏编码 D-U-N-S（免费，最耗时）

> 邓白氏编码（Data Universal Numbering System）是国际上唯一的企业身份识别码，Apple 用它来验证你的公司真实存在。**个人账号不需要，公司账号必须。**

**方式一：通过 Apple 申请（推荐，最省事）**
1. 打开 https://developer.apple.com/programs/enroll/ → 选"Organization"→ 开始申请
2. 填写公司信息时勾选"D-U-N-S Number"栏的"我需要申请"
3. Apple 会帮你向邓白氏发起申请，你填一份在线表单（公司名、地址、营业执照等）
4. 邓白氏会**电话联系你**核实公司信息（打你填的公司电话）
5. 等待 5-15 个工作日，编码会发到你的邮箱

**方式二：自己去邓白氏官网申请（可能更快）**
1. 打开 https://www.dnb.com/duns-number/get-a-duns.html
2. 选择"Looking up a company"或"Request a D-U-N-S Number"
3. 填写公司信息（公司英文名、地址、主营业务、员工人数等）
4. 提交后等待邮件回复

> 💡 **注意**：免费申请的 D-U-N-S 编码是"自服务"版本，用于 Apple 开发者注册没问题。邓白氏会推销付费增值服务，**一律不需要买**，只要免费的编码就行。

#### 第4步：加入 Apple Developer Program（拿到D-U-N-S后）

1. 打开 https://developer.apple.com/programs/enroll/
2. 用第2步注册的公司 Apple ID 登录
3. 选择实体类型：**Organization（公司/组织）** ← 别选错成个人
4. 填写公司信息：
   - **Legal Entity Name**：营业执照上的公司全称（英文/拼音）
   - **D-U-N-S Number**：第3步拿到的编码
   - **Registered Address**：营业执照地址
   - **Phone**：公司电话（要能接通，Apple 会打来核实）
5. 同意《Apple Developer Program License Agreement》
6. 支付 $99/年（用 Visa/MasterCard 信用卡或借记卡）

#### 第5步：等待 Apple 审核（1-2个工作日）

- Apple 会**打电话到你填的公司电话**，确认：
  - 你是否是该公司的授权人
  - 公司是否真实存在
  - 注册目的是否合理
- 接电话时如实回答即可，一般问"你是XX公司的吗？""你们要开发什么App？"
- 审核通过后，你会收到邮件通知，账号立即激活

#### 第6步：激活完成，开始使用

- 登录 https://developer.apple.com → 下载证书、配置 App ID
- 登录 https://appstoreconnect.apple.com → 上架管理 App

### 8.3 关于绑定银行卡（重点说明）

> 这是用户特别关心的问题：**绑定的是公司银行卡还是个人银行卡？**

**分两个阶段，绑定的卡用途不同：**

| 阶段 | 绑什么卡 | 用途 | 必须公司卡吗 |
|------|---------|------|------------|
| **注册开发者账号**（付$99/年） | 信用卡/借记卡均可 | 只是扣 $99 年费 | ❌ 不必须，个人卡也能付 |
| **App 收款**（App收费/内购时） | **必须公司银行账户** | 用户付的钱打到这个账户 | ✅ 必须，且要和公司名一致 |

**详细说明：**

**① 付 $99 年费的卡**：注册时填的信用卡只是用来扣年费，**公司卡或你个人的卡都行**，Apple 不卡这个。很多人用个人的 Visa/MasterCard 付，没问题。银联卡部分支持，建议用 Visa 或 MasterCard 更稳妥。

**② App 收款账户**（只有 App 要收费/内购才需要设置）：
- 这是在 **App Store Connect** 里设置的，不是注册开发者账号时
- **必须绑定公司银行账户**，账户名必须和营业执照上的公司名一致
- Apple 会验证账户名和公司名是否匹配
- 还需要填写**税务信息**（W-8BEN 表，证明你是非美国税务居民，Apple 代扣代缴）
- 如果你 App 完全免费、无内购，这一步可以不做

> 💡 **结论**：MVP 阶段你的 App 大概率是免费的（先做样机验证），所以**暂时只需要一张能付 $99 的卡就行**，公司卡个人卡都可以。等以后 App 要收费了，再去 App Store Connect 绑定公司对公银行账户。

### 8.4 ⚠️ 注意事项（避坑指南）

| # | 注意事项 | 说明 |
|---|---------|------|
| 1 | **必须用公司域名邮箱** | `@silifield.com`，不能用 QQ/163/Gmail。没有就先注册域名+开企业邮箱（几十块/年） |
| 2 | **公司电话要能接通** | Apple 一定会电话回访，填的手机号要保持畅通，接到电话如实回答 |
| 3 | **公司名要与营业执照一致** | 英文名/拼音名一旦注册很难改，务必核对营业执照 |
| 4 | **D-U-N-S 免费就够** | 邓白氏会推销付费服务，一律拒绝，免费编码完全够用 |
| 5 | **选 Organization 别选 Individual** | 选错成个人账号，上架只显示个人名字，且无法转换，只能重新注册 |
| 6 | **个人账号不能转公司账号** | Apple 不支持，一开始就要想清楚。公司产品务必直接注册公司账号 |
| 7 | **每年记得续费** | $99/年，忘记续费 App 会被下架。Apple 会提前邮件提醒 |
| 8 | **税务表 W-8BEN** | App 收费时需填，证明非美国居民，避免被扣 30% 预扣税（中美协定税率 10%） |
| 9 | **营业执照经营范围** | 建议包含"软件开发"或"信息技术服务"，否则审核可能被问 |
| 10 | **域名邮箱与企业邮箱** | 推荐阿里云/腾讯企业邮，年费几十元，顺便也能用作公司正式邮箱 |

### 8.5 时间规划建议

> 这些注册流程**不阻塞 App 开发**，可以和开发并行进行。

```
开发启动（现在）
  ├── 第1周：注册公司域名 + 开通企业邮箱 ← 最先做，后面都依赖它
  ├── 第1周：注册公司 Apple ID
  ├── 第1-3周：申请邓白氏编码 D-U-N-S（等待5-15个工作日）
  ├── 第3周：拿到 D-U-N-S → 加入 Apple Developer Program → 付 $99
  ├── 第3-4周：Apple 电话审核 → 账号激活
  │
  └── 开发期间：用免费的个人开发者账号在模拟器上开发（不需要付费账号）
       只在上架前才需要正式的公司账号
```

> 💡 **重要**：开发阶段不需要付费开发者账号。免费 Apple ID 就能在 Xcode 模拟器上开发调试。**只有真机调试和上架才需要 $99 的付费账号**。所以你现在可以先开发，注册流程同步走，不耽误事。

---

---

## 9. 下一步行动

文档定稿后，开发按以下顺序推进：

1. **环境准备**：安装完整 Xcode 16
2. **工程搭建**：创建 App Target + CoreKit 包结构
3. **第1层开发**：四大 Tab 骨架 + 设计系统 + 启动页（纯前端，无外部依赖）
4. **第2层开发**：首页 SceneKit 3D 孪生展示（预置模型）+ 各板块完整 UI（Mock 数据）
5. **第3层开发**：接入真实 API + WebSocket + 推送（需后端就绪）

---

> 📌 本文档为技术架构定稿（v1.0），8 项决策点已全部对齐。开发可按第8节路径启动。


```

# 硅宠场域 PetSoul · iOS App 技术架构设计

> 版本：v0.1（草案，待评审）
> 日期：2026年8月20日
> 关联文档：[README.md](./README.md)（PRD v2.1）、[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)
>
> 📌 本文档为技术架构设计初稿，用于开发前对齐。标记为 ❓ 的条目为待决策点，需讨论确认。

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
- **离线优先**：本地 CoreData/SwiftData 为唯一数据源（Single Source of Truth），UI 只读本地，网络层负责同步

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
| UI 框架 | SwiftUI | 声明式 UI，搭配 `@Observable` 宏 |
| 架构 | Clean Architecture + MVVM | 分层解耦，ViewModel 用 `@Observable` |
| 最低系统 | iOS 16.0+ | 覆盖 iPhone SE 2 及以上 |
| 数据存储 | SwiftData ❓（或 CoreData） | SwiftData 更现代但 iOS 17+；若需兼容 iOS 16 则用 CoreData。**待确认** |
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
| 无（尽量零三方依赖） | 优先使用 Apple 原生框架 | — |
| ❓ [LumaKit / Meshy SDK] | 照片/视频→3D模型重建 | 待调研，可能用自研后端 |
| ❓ [Charts](https://github.com/apple/SwiftCharts) | 健康趋势图表 | 或用 SwiftUI 原生 Charts（iOS 16+） |

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
| Base URL | `https://api.petsoul.silifield.com/v1` ❓（域名待定） |
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

### 6.3 设备通信链路

```
App ←→ 后端云 ←→ 探针硬件
  │ HTTP REST    │ 私有云协议
  │ WebSocket    │
  │
  ├── 指令下发：POST /probes/{id}/command → 后端转发 → 设备执行
  ├── 状态上报：设备 → 后端 → WebSocket 推送 → App 实时刷新
  └── 离线兜底：WebSocket 断开时，App 定时轮询 GET 设备状态
```

### 6.4 离线优先与本地缓存

```
SwiftData/CoreData（本地数据库，Single Source of Truth）
  ├── Pet / DigitalTwin / Probe / Observation / HealthReport
  ├── UI 通过 @Query / @FetchRequest 直接读本地
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

## 7. 待对齐决策点（❓）

以下决策点需讨论确认后才能最终定稿：

| # | 决策点 | 选项 | 我的建议 | 影响 |
|---|--------|------|---------|------|
| 1 | **最低 iOS 版本** | iOS 16 / iOS 17 | iOS 16（覆盖更广） | 决定用 SwiftData（17+）还是 CoreData（16+） |
| 2 | **3D孪生重建方案** | 自研AI后端 / 第三方API（Luma/Meshy）/ MVP先用预置模型 | MVP 先预置模型，P1 接第三方API验证效果 | 核心卖点，最大技术风险 |
| 3 | **后端 API 域名/环境** | 待定 | 需确定 dev/staging/prod 三套环境 | 网络层配置 |
| 4 | **数据持久化** | SwiftData / CoreData | 若选 iOS 16 → CoreData；iOS 17 → SwiftData | 整个数据层实现 |
| 5 | **登录方式优先级** | 手机号 / 微信 / Apple ID | MVP 全做（App Store 要求支持 Apple ID） | 认证模块 |
| 6 | **设备私有协议** | 需硬件团队提供协议文档 | 待硬件方提供 | 设备通信层 |
| 7 | **图表方案** | SwiftUI Charts（原生）/ 三方 Charts | SwiftUI Charts（iOS 16+ 原生） | 健康趋势页 |
| 8 | **是否支持 iPad** | 仅 iPhone / 通用 | PRD 已定仅 iPhone | 布局策略 |

---

## 8. 下一步行动

文档定稿后，开发按以下顺序推进：

1. **环境准备**：安装完整 Xcode 16
2. **工程搭建**：创建 App Target + CoreKit 包结构
3. **第1层开发**：四大 Tab 骨架 + 设计系统 + 启动页（纯前端，无外部依赖）
4. **第2层开发**：首页 SceneKit 3D 孪生展示（预置模型）+ 各板块完整 UI（Mock 数据）
5. **第3层开发**：接入真实 API + WebSocket + 推送（需后端就绪）

---

> 📌 本文档为技术架构设计初稿，待 ❓ 决策点确认后定稿。


```

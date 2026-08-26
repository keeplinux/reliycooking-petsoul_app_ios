# 硅宠场域 PetSoul · iOS 开发进度

> 最后更新：2026-08-26
> 维护者：开发团队（请每次提交后更新此文档）

---

## 当前状态：✅ Phase 0 完成 — UI 骨架可编译可运行

```
Phase 0  ████████████  ✅ 已完成  设计系统 + 29 文件 UI 骨架
Phase 1  ░░░░          ⏳ 待开始  数据层 + 状态管理       ← 下一步
Phase 2  ░░░░          ⏳ 待开始  设备通信链路（BLE/HTTP/WS）
Phase 3  ░░░░          ⏳ 待开始  健康管理业务逻辑
Phase 4  ░░░░          ⏳ 待开始  商城 / 家长中心 / 隐私
Phase 5  ░░░░          ⏳ 待开始  AR 星图观测 + 打磨
Phase 6  ░░░░          ⏳ 待开始  App Store 上架
```

---

## 开发环境

| 项目 | 版本 |
|------|------|
| macOS | 26.4.1 |
| Xcode | 26.6 (Build 17F113) |
| Swift | 5.0 |
| 最低部署 | iOS 16.0+ |
| 模拟器 | iPhone 17 Pro (已 Booted) |
| Scheme | `PetSoul` |
| Bundle ID | `com.silifield.petsoul` |

**构建验证**：`xcodebuild ... build` → `** BUILD SUCCEEDED **`（无错误无警告）

---

## Phase 0 已交付内容

### 设计系统（「宣纸上的星空」融合版）

| 文件 | 说明 |
|------|------|
| `DesignSystem/DesignTokens.swift` | 色彩 Token（墨绿/宣纸白/朱砂红）、字体阶梯、间距/圆角 |
| `DesignSystem/Components.swift` | `GlassCard`、`CapsuleButton`、`DeepCard`、`StatusChip`、`MenuRow`、`SectionHeader` |
| `DesignSystem/PaperBackground.swift` | 浅色纸面背景（日常页面） |
| `DesignSystem/StarSpaceBackground.swift` | 深空背景（沉浸场景） |
| `DesignSystem/PlaceholderScreen.swift` | 统一占位屏组件 |
| `DESIGN_SYSTEM.md` | 设计规范文档（Token + 组件 + 页面清单） |

**双模式规则**：
- 日常页面（首页/探针/健康/家长）→ 浅色 `PaperBackground`
- 沉浸场景（赫罗图/AR 星图/启动页）→ 深色 `StarSpaceBackground` + `.preferredColorScheme(.dark)`

### UI 页面清单（29 个 Swift 文件，~12,600 行）

| Tab | 页面文件 | 状态 |
|-----|----------|------|
| 🏠 宇宙 | `HomeView` · `HomeComponents` · `TwinSceneView` · `AddPetView` · `StarMapView` | ✅ UI |
| 🔊 探针 | `ProbeView` · `ProbeDetailView` · `AddDeviceView` · `ProbeShopView` | ✅ UI |
| 🌡️ 健康 | `HealthView` · `HertzsprungView` · `HealthReportView` · `HealthBaselineView` · `BehaviorInsightView` | ✅ UI |
| 👤 家长 | `ProfileView` · `SettingsView` · `MessageCenterView` · `PrivacyCenterView` · `AboutView` · `ProductInfoView` | ✅ UI |
| ⚙️ App | `LaunchView` · `PetSoulApp` · `RootTabView` · `RootView` | ✅ UI |

> ⚠️ 当前所有页面为**纯静态 UI + 硬编码 Mock 数据**，无真实业务逻辑、无数据持久化、无网络通信。

### 辅助工具

| 文件 | 说明 |
|------|------|
| `Scripts/live-build.sh` | 增量构建脚本，开发时快速验证编译 |
| `project.yml` | XcodeGen 配置（bundle ID、部署版本、Info.plist 键值） |

---

## 各 Phase 详细计划

### Phase 1 — 数据层与状态管理（预计 2-3 周）

**目标**：UI 从静态预览 → 可交互原型（本地数据持久化）

| # | 任务 | 产出 |
|---|------|------|
| 1.1 | CoreData Model 设计 | `Pet`、`Device`、`HealthRecord`、`User`、`Message` 实体及关系 |
| 1.2 | CoreData Stack | `PersistenceController`，`@FetchRequest` 集成 |
| 1.3 | ViewModel 层 (`@Observable`) | `HomeViewModel`、`ProbeViewModel`、`HealthViewModel`、`ProfileViewModel` |
| 1.4 | Repository 模式 | `PetRepository`、`DeviceRepository`、`HealthRepository` |
| 1.5 | 依赖注入容器 | 统一注入 Repository/Service |
| 1.6 | 结构化 Mock 数据 | 替换硬编码字符串，驱动 UI 交互 |

**里程碑 M1.5**：App 内可添加/切换/删除宠物，数据持久化到本地

### Phase 2 — 设备通信链路（预计 4 周）

| # | 任务 | 技术 |
|---|------|------|
| 2.1 | BLE 配网流程 | `CoreBluetooth` — 扫描 ESP32-S3 → 写入 WiFi 凭据 |
| 2.2 | 扫码绑定 | `AVFoundation` 二维码识别 |
| 2.3 | HTTP + WebSocket 通信 | `URLSession` async/await — 设备 ↔ Supabase |
| 2.4 | 实时数据推送 | WebSocket 订阅水温/水量/饮水事件 |
| 2.5 | 7 天趋势查询 | RESTful 历史数据 + 图表绘制 |
| 2.6 | 本地缓存 + 云端同步 | CoreData 本地优先，后台同步 |

**里程碑 M2**：饮水舱探针全链路可用

### Phase 3 — 健康管理业务逻辑（预计 4 周）

| # | 任务 | 算法/逻辑 |
|---|------|-----------|
| 3.1 | 恒星生命体系 | 年龄 → 演化阶段映射（原恒星→主序星→红巨星） |
| 3.2 | 恒星亮度指数 | 0-100 健康评分 + 异常分级（黑子/耀斑/濒临熄火） |
| 3.3 | 赫罗图真实数据 | `HRDiagram` 接入历史 HealthRecord 绘制轨迹 |
| 3.4 | 健康基线建模 | 个体基线 + 群体参考区间 |
| 3.5 | 行为洞察 | 饮水规律/异常模式识别 |
| 3.6 | 每日晨报 | 定时生成摘要 + APNs 推送 |
| 3.7 | 灵动岛 Live Activities | 实时饮水状态/预警 |

**里程碑 M3**：健康管理（含宇宙概念）可用

### Phase 4 — 商城 / 家长中心 / 隐私（预计 3 周）

| # | 任务 | 说明 |
|---|------|------|
| 4.1 | 探针商城 | 商品列表 API、StoreKit 内购 |
| 4.2 | 账号体系 | 手机号 / 微信 / Sign in with Apple |
| 4.3 | 消息中心 | 推送分类收件箱、免打扰 22:00-08:00 |
| 4.4 | 数据主权 | 数据导出(JSON/PDF)、删除账号（合规留痕） |
| 4.5 | 设置 | 通知偏好、主题、关于 |

**里程碑 M4**：商城/家长中心/数据主权可用

### Phase 5 — AR 星图观测与打磨（预计 3 周）

| # | 任务 | 技术 |
|---|------|------|
| 5.1 | ARKit 星图 | ARKit + SceneKit 天体追踪 |
| 5.2 | 寻找我的恒星 | 健康亮度联动星体亮度 |
| 5.3 | 星轨明信片 | 纪念卡片生成 + 社交分享 |
| 5.4 | 性能优化 | Instruments 分析 |
| 5.5 | TestFlight 内测 | Xcode Cloud CI + 分发 |

**里程碑 M5**：AR 星图 + 内测版

### Phase 6 — 上架（预计 5 周）

App Store 资料 → 审核提交 → 随首款饮水舱探针同步发售

**里程碑 M6**：App Store 上线

---

## 里程碑总览

| 里程碑 | 时间 | 交付物 | 状态 |
|--------|------|--------|------|
| M0 | 已完成 | 设计系统 + UI 骨架可运行 | ✅ |
| M1.5 | 第 3 周 | 本地数据持久化可交互 | ⏳ |
| M2 | 第 7 周 | 饮水舱全链路可用 | ⏳ |
| M3 | 第 11 周 | 健康管理可用 | ⏳ |
| M4 | 第 14 周 | 商城/家长/隐私可用 | ⏳ |
| M5 | 第 17 周 | AR 星图 + 内测版 | ⏳ |
| M6 | 第 22 周 | App Store 上线 | ⏳ |

---

## 协作约定

1. **每次提交后更新本文件**的「当前状态」横幅和对应 Phase 进度
2. **提交信息格式**：`<type>: <简要描述>`，type ∈ `feat|fix|docs|refactor|chore`
3. **分支策略**：`main` 保持可运行；功能开发用 `feature/phaseN-xxx` 分支
4. **构建验证**：提交前确保 `xcodebuild build` → `BUILD SUCCEEDED`

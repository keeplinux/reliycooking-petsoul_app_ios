# 硅宠场域 SiliField · iOS 设计系统（融合版）

> 来源：`硅宠场域SiliField-UI设计说明文档（融合版）.html`
> 本文档将 HTML 设计规范翻译为 SwiftUI 可执行的设计 Token 与组件规范。

---

## 1. 设计理念

### 1.1 核心叙事
「宣纸上的星空」—— 以**宣纸白**为日常底色（温润、东方、可亲近），以**墨绿**为品牌骨架，以**朱砂红**点睛预警；进入宇宙观测场景（AR 星图、恒星生命图）时切换为**深空墨绿**沉浸模式。

### 1.2 与旧设计的根本差异

| 维度 | 旧设计（已废弃） | 新设计（融合版） |
|------|------------------|------------------|
| 默认底色 | 深空黑 #05060A | **宣纸白 #F4F1EA**（浅色为主） |
| 主色调 | 硅蓝 #1A2238 | **墨绿 #103028** |
| 强调色 | 星金 #F5C97B | **松绿 #2C5A49** |
| 点睛色 | 暖橙 #FF8C42 | **朱砂红 #B5482F** |
| 标题字体 | 系统粗体 | **徽文明朝体（衬线）** |
| 卡片风格 | 深色半透明 | **纸面白玻璃卡片** |
| 整体气质 | 科技深空 | **东方温润 + 宇宙浪漫** |

---

## 2. 色彩体系

### 2.1 Design Token 定义（Swift）

```swift
enum DesignTokens {
    enum Color {
        // ---- 品牌主色 ----
        static let ink       = Color(hex: 0x103028)  // 墨绿 — 品牌主色、标题
        static let night     = Color(hex: 0x0A211B)  // 深墨绿 — 沉浸背景
        static let pine      = Color(hex: 0x2C5A49)  // 松绿 — 强调/按钮
        static let sage      = Color(hex: 0x7FA394)  // 鼠尾草绿 — 辅助文字
        static let cinnabar  = Color(hex: 0xB5482F)  // 朱砂红 — 点睛/预警

        // ---- 纸面体系 ----
        static let paper     = Color(hex: 0xF4F1EA)  // 宣纸白 — 默认背景
        static let surface   = Color(hex: 0xFCFAF5)  // 纸面白 — 卡片表面
        static let mist      = Color(hex: 0xD9E3DC)  // 薄雾绿 — 分隔/底纹
        static let mistSoft  = Color(hex: 0xE9EFE9)  // 薄雾浅 — callout 底
        static let border    = Color(hex: 0xE5DFD2)  // 纸边色 — 描边

        // ---- 文字层级 ----
        static let textPrimary   = Color(hex: 0x0A211B)  // 主文字
        static let textSub       = Color(hex: 0x55695F)  // 次文字
        static let textMute      = Color(hex: 0x8FA79B)  // 弱文字
        static let textFaint     = Color(hex: 0xB7C6BD)  // 淡文字

        // ---- 语义色 ----
        static let normal   = pine       // 正常 — 松绿
        static let warning  = cinnabar   // 预警 — 朱砂
        static let anomaly  = cinnabar   // 异常 — 朱砂（加粗/图标区分）
    }
}
```

### 2.2 浅色 / 深色双模式

| 场景 | 模式 | 背景 | 卡片 |
|------|------|------|------|
| 日常页面（首页/探针/健康/家长） | **浅色** | paper #F4F1EA | surface #FCFAF5 |
| 宇宙观测（AR星图/赫罗图/启动页） | **深色** | night #0A211B | ink+opacity |

> SwiftUI 实现：页面级 `.preferredColorScheme` 控制，非全局。日常 Tab 保持浅色，仅沉浸场景切深色。

---

## 3. 字体体系

### 3.1 字体族

| 用途 | 字体族 | iOS 对应 |
|------|--------|----------|
| 标题（页面名/大数字） | 徽文明朝体 / Noto Serif SC | `SFPro` 衬线回退 → `.serif` |
| 正文 / UI 文字 | Noto Sans SC / PingFang SC | `.rounded`（系统圆体） |

### 3.2 字号阶梯

```swift
enum DesignTokens {
    enum Font {
        // 衬线标题（页面标题/恒星名/大数字）
        static let display  = Font.custom("NotoSerifSC-Bold", size: 32).bold()
        static let title    = Font.custom("NotoSerifSC-Regular", size: 22)
        static let title2   = Font.custom("NotoSerifSC-Regular", size: 18)

        // 无衬线正文
        static let headline = Font.system(size: 16, weight: .semibold, design: .rounded)
        static let body     = Font.system(size: 15, weight: .regular, design: .rounded)
        static let caption  = Font.system(size: 13, weight: .regular, design: .rounded)
        static let caption2 = Font.system(size: 11, weight: .regular, design: .rounded)
        static let micro    = Font.system(size: 10, weight: .regular, design: .rounded)
    }
}
```

> **回退策略**：若未捆绑 Noto Serif SC 字体，标题用 `Font.system(.title, design: .serif)`，正文用 `Font.system(.body, design: .rounded)`。

---

## 4. 间距 / 圆角

```swift
enum Spacing { static let xs=4, sm=8, md=16, lg=24, xl=32, xxl=48 }
enum Radius { static let sm=8, md=12, lg=16, xl=24, full=9999 }
```

> 与旧版一致，保持不变。

---

## 5. 核心组件规范

### 5.1 纸面玻璃卡片 `GlassCard`

```swift
/// 纸面白底 + 细描边 + 柔阴影
struct GlassCard<Content: View>: View {
    var body: some View {
        content
            .padding(.md)
            .background(RoundedRectangle(radius: 16).fill(surface))
            .overlay(RoundedRectangle(radius: 16).stroke(border, lineWidth: 1))
            .shadow(color: ink.opacity(0.06), radius: 8, y: 2)
    }
}
```

- 底色 `surface #FCFAF5`
- 描边 `border #E5DFD2` 1pt
- 阴影 墨绿 6% 透明度
- 圆角 16pt

### 5.2 胶囊按钮 `CapsuleButton`

```swift
struct CapsuleButton: View {
    let title: String; let icon: String?; let action: () -> Void
    // 主按钮：pine 底 + paper 字
    // 次按钮：transparent 底 + pine 字 + pine 描边
}
```

- 全圆角 `Capsule()`
- 主按钮底色 `pine`，文字 `paper`
- 高度 48pt

### 5.3 深空沉浸卡片 `DeepCard`

用于 AR/赫罗图等深色场景：

```swift
/// 深色场景专用：night 底 + sage 描边
struct DeepCard<Content: View>: View { ... }
```

- 底色 `ink` 60% 透明
- 描边 `sage` 20% 透明
- 用于沉浸模式页面

### 5.4 状态标签 `StatusChip`

```swift
/// 正常=松绿 / 预警=朱砂 / 离线=灰
struct StatusChip: View { let status: Status; let text: String }
```

### 5.5 探针轨道图标 `ProbeOrbitIcon`（保留概念，更新配色）

### 5.6 恒星亮度条 `EnergyBar`（保留概念，更新配色）

---

## 6. 页面清单（12 页）

| # | 页面 | Tab | 模式 | 核心内容 |
|---|------|-----|------|----------|
| 1 | 宇宙首页 | 宇宙 | 浅色 | 宠物恒星 + 探针轨道 + 观测速览 + AR入口 |
| 2 | 添加宠物 | — (sheet) | 浅色 | 照片/视频/硬件三种生成方式 |
| 3 | 智能探针 | 探针 | 浅色 | 设备列表 + 商城入口 + 添加 |
| 4 | 探针商城 | — (push) | 浅色 | 商品列表、详情、购买 |
| 5 | 设备详情 | — (push) | 浅色 | 水温控制、水量、7天趋势 |
| 6 | 健康晨报 | — (push) | 浅色 | 每日恒星观测摘要 |
| 7 | 恒星生命图(赫罗图) | — (push) | **深色** | 年龄×健康轨迹可视化 |
| 8 | AR星图观测 | — (push) | **深色** | ARKit 天体追踪 |
| 9 | 星轨明信片 | — (push) | **深色** | 纪念卡片保存/分享 |
| 10 | 家长中心 | 家长 | 浅色 | 资料+宠物+账号+设置 |
| 11 | 消息中心 | — (push) | 浅色 | 分类收件箱+免打扰 |
| 12 | 数据主权中心 | — (push) | 浅色 | 权限开关+导出/删除 |

### 健康管理 Tab 入口
健康 Tab（恒星观测台）作为聚合页，通过 NavigationLink 进入页面 6/7/8/9。

---

## 7. 名词对照表

| 宇宙叙事词 | 大白话 |
|------------|--------|
| 探针 | 智能设备（饮水机/喂食器/猫砂盆） |
| 恒星 | 你家宠物 |
| 健康亮度 | 健康评分 0-100 |
| 主序星/红巨星 | 按年龄起的宇宙阶段称号 |
| 玻璃卡片 | 半透明信息容器 |
| 胶囊按钮 | 两端全圆角长条按钮 |
| 赫罗图 | 宠物一生健康地图（年龄×健康） |
| 数据主权 | 数据归你：可查看/导出/删除 |
| 免打扰 | 22:00-08:00 不推送 |
| 紧急标识 | 红色标签，须马上处理 |

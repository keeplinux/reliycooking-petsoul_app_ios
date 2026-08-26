//
//  DesignTokens.swift
//  PetSoul
//
//  设计系统 Token —— 「宣纸上的星空」东方温润 + 宇宙浪漫
//  来源：硅宠场域SiliField-UI设计说明文档（融合版）
//  墨绿骨架 · 宣纸白底 · 朱砂点睛 · 衬线标题
//

import SwiftUI

// MARK: - Color(hex:) 扩展
extension Color {
    init(hex: UInt32, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}

// MARK: - 设计 Token
enum DesignTokens {

    // MARK: - 色彩（融合版）
    enum Color {
        // typealias 消除枚举内命名遮蔽
        typealias SWColor = SwiftUI.Color

        // ---- 品牌主色 · 墨绿体系 ----
        /// 墨绿 — 品牌主色、标题、深色背景
        static let ink       = SWColor(hex: 0x103028)
        /// 深墨绿 — 沉浸场景底色
        static let night     = SWColor(hex: 0x0A211B)
        /// 松绿 — 强调、主按钮、链接
        static let pine      = SWColor(hex: 0x2C5A49)
        /// 鼠尾草绿 — 辅助文字、图标
        static let sage      = SWColor(hex: 0x7FA394)
        /// 朱砂红 — 点睛、预警、紧急
        static let cinnabar  = SWColor(hex: 0xB5482F)

        // ---- 纸面体系 ----
        /// 宣纸白 — 默认页面背景
        static let paper     = SWColor(hex: 0xF4F1EA)
        /// 纸面白 — 卡片表面
        static let surface   = SWColor(hex: 0xFCFAF5)
        /// 薄雾绿 — 分隔线、底纹
        static let mist      = SWColor(hex: 0xD9E3DC)
        /// 薄雾浅 — callout 背景
        static let mistSoft  = SWColor(hex: 0xE9EFE9)
        /// 纸边色 — 卡片描边
        static let border    = SWColor(hex: 0xE5DFD2)

        // ---- 文字层级 ----
        /// 主文字（标题/正文）
        static let textPrimary = SWColor(hex: 0x0A211B)
        /// 次文字（说明/副标题）
        static let textSub     = SWColor(hex: 0x55695F)
        /// 弱文字（时间/辅助）
        static let textMute    = SWColor(hex: 0x8FA79B)
        /// 淡文字（占位/极弱）
        static let textFaint   = SWColor(hex: 0xB7C6BD)

        // ---- 语义色 ----
        /// 正常 — 松绿
        static let normal   = pine
        /// 预警 — 朱砂
        static let warning  = cinnabar
        /// 异常 — 朱砂（加粗/图标区分）
        static let anomaly  = cinnabar
        /// 离线 — 灰雾
        static let offline  = sage

        // ---- 兼容旧引用（逐步迁移后删除）----
        static let starGold      = pine
        static let siliconBlue   = ink
        static let siliconBlueLight = sage
        static let warmOrange    = cinnabar
        static let deepSpace     = night
        static let anomalyRed    = cinnabar
        static let normalGreen   = pine
    }

    // MARK: - 间距
    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }

    // MARK: - 圆角
    enum Radius {
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 24
        static let full: CGFloat = 9999
    }

    // MARK: - 字体（衬线标题 + 圆体正文）
    enum Font {
        typealias SWFont = SwiftUI.Font

        // 衬线标题（页面标题 / 恒星名 / 大数字）
        static let display  = SWFont.system(size: 32, weight: .bold, design: .serif)
        static let title    = SWFont.system(size: 22, weight: .regular, design: .serif)
        static let title2   = SWFont.system(size: 18, weight: .regular, design: .serif)
        static let title3   = SWFont.system(size: 17, weight: .semibold, design: .serif)

        // 无衬线正文（圆体）
        static let headline = SWFont.system(size: 16, weight: .semibold, design: .rounded)
        static let body     = SWFont.system(size: 15, weight: .regular, design: .rounded)
        static let caption  = SWFont.system(size: 13, weight: .regular, design: .rounded)
        static let caption2 = SWFont.system(size: 11, weight: .regular, design: .rounded)
        static let micro    = SWFont.system(size: 10, weight: .regular, design: .rounded)

        // 兼容旧引用
        static let largeTitle = display
    }
}

// MARK: - 便捷视图修饰
extension View {
    /// 纸面玻璃卡片（浅色日常场景默认卡片样式）
    func glassCard() -> some View {
        self
            .padding(DesignTokens.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .fill(DesignTokens.Color.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .stroke(DesignTokens.Color.border, lineWidth: 1)
            )
            .shadow(color: DesignTokens.Color.ink.opacity(0.06), radius: 8, y: 2)
    }

    /// 深空沉浸卡片（深色观测场景专用）
    func deepCard() -> some View {
        self
            .padding(DesignTokens.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .fill(DesignTokens.Color.ink.opacity(0.6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .stroke(DesignTokens.Color.sage.opacity(0.2), lineWidth: 1)
            )
    }

    /// 旧接口兼容 —— 等价于 glassCard
    func deepSpaceCard() -> some View {
        glassCard()
    }
}

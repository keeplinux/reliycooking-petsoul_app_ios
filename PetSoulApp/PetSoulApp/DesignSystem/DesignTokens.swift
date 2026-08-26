//
//  DesignTokens.swift
//  PetSoul
//
//  设计系统 Token —— 统一管理宇宙叙事视觉体系
//  PRD 4.1 视觉规范：硅蓝底色 + 暖橙点缀 + 金色轨道
//

import SwiftUI

enum DesignTokens {
    // MARK: - 色彩
    enum Color {
        /// 硅蓝主色 —— 深空底色
        static let siliconBlue = SwiftUI.Color(red: 0.10, green: 0.13, blue: 0.22)        // #1A2238
        /// 硅蓝浅色 —— 文字/辅助
        static let siliconBlueLight = SwiftUI.Color(red: 0.40, green: 0.48, blue: 0.65)
        /// 暖橙 —— 强调/能量
        static let warmOrange = SwiftUI.Color(red: 1.0, green: 0.55, blue: 0.26)            // #FF8C42
        /// 星金 —— 轨道/高亮
        static let starGold = SwiftUI.Color(red: 0.96, green: 0.79, blue: 0.48)             // #F5C97B
        /// 深空黑 —— 背景层
        static let deepSpace = SwiftUI.Color(red: 0.05, green: 0.06, blue: 0.10)
        /// 警示红 —— 恒星异常
        static let anomalyRed = SwiftUI.Color(red: 0.85, green: 0.25, blue: 0.20)
        /// 正常绿 —— 健康正常
        static let normalGreen = SwiftUI.Color(red: 0.30, green: 0.80, blue: 0.50)
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

    // MARK: - 字体
    enum Font {
        static let largeTitle = SwiftUI.Font.largeTitle.weight(.bold)
        static let title = SwiftUI.Font.title.weight(.bold)
        static let title2 = SwiftUI.Font.title2.weight(.semibold)
        static let headline = SwiftUI.Font.headline.weight(.semibold)
        static let body = SwiftUI.Font.body
        static let caption = SwiftUI.Font.caption
        static let caption2 = SwiftUI.Font.caption2
    }
}

// MARK: - 便捷视图修饰
extension View {
    /// 深空卡片样式
    func deepSpaceCard() -> some View {
        self
            .padding(DesignTokens.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .fill(DesignTokens.Color.siliconBlue.opacity(0.6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .stroke(DesignTokens.Color.starGold.opacity(0.2), lineWidth: 1)
            )
    }
}

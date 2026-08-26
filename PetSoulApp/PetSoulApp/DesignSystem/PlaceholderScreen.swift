//
//  PlaceholderScreen.swift
//  PetSoul
//
//  通用占位页面 —— 新版 token 配色
//  保留为工具组件，Phase C 后大部分页面已替换为真实 UI
//

import SwiftUI

struct PlaceholderScreen: View {
    let title: String
    let systemImage: String
    let description: String
    var bullets: [String] = []
    var primaryButtonTitle: String? = nil
    var primaryAction: (() -> Void)? = nil

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: DesignTokens.Spacing.lg) {
                // 占位区
                ZStack {
                    RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                        .fill(DesignTokens.Color.mistSoft)
                    RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                        .stroke(DesignTokens.Color.border,
                                style: .init(lineWidth: 1, dash: [6]))
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Image(systemName: systemImage)
                            .font(.system(size: 48))
                            .foregroundStyle(DesignTokens.Color.pine.opacity(0.5))
                        Text("待设计")
                            .font(DesignTokens.Font.caption2)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                }
                .frame(height: 180)

                Text(description)
                    .font(DesignTokens.Font.body)
                    .foregroundStyle(DesignTokens.Color.textSub)

                if !bullets.isEmpty {
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        ForEach(bullets, id: \.self) { bullet in
                            HStack(spacing: DesignTokens.Spacing.sm) {
                                Circle()
                                    .fill(DesignTokens.Color.cinnabar)
                                    .frame(width: 6, height: 6)
                                Text(bullet)
                                    .font(DesignTokens.Font.body)
                                    .foregroundStyle(DesignTokens.Color.textPrimary)
                            }
                        }
                    }
                    .glassCard()
                }

                if let primaryButtonTitle, let primaryAction {
                    CapsuleButton(title: primaryButtonTitle, style: .primary, action: primaryAction)
                }
            }
            .padding(.horizontal, DesignTokens.Spacing.lg)
            .padding(.top, DesignTokens.Spacing.md)
        }
    }
}

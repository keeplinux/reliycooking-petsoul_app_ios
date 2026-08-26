//
//  Components.swift
//  PetSoul
//
//  核心组件库 —— 融合版设计系统
//  GlassCard · CapsuleButton · DeepCard · StatusChip · MenuRow · SectionHeader
//

import SwiftUI

// MARK: - 纸面玻璃卡片
/// 浅色日常场景的标准信息容器
/// 宣纸白底 + 纸边描边 + 柔阴影
struct GlassCard<Content: View>: View {
    var padding: CGFloat = DesignTokens.Spacing.md
    var radius: CGFloat = DesignTokens.Radius.lg
    let content: () -> Content

    init(padding: CGFloat = DesignTokens.Spacing.md,
         radius: CGFloat = DesignTokens.Radius.lg,
         @ViewBuilder content: @escaping () -> Content) {
        self.padding = padding
        self.radius = radius
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: radius)
                    .fill(DesignTokens.Color.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: radius)
                    .stroke(DesignTokens.Color.border, lineWidth: 1)
            )
            .shadow(color: DesignTokens.Color.ink.opacity(0.06), radius: 8, y: 2)
    }
}

// MARK: - 胶囊按钮
/// 全圆角按钮，主/次/危险三种样式
struct CapsuleButton: View {
    let title: String
    var icon: String? = nil
    var style: BtnStyle = .primary
    var action: () -> Void

    enum BtnStyle {
        case primary   // 松绿底 + 宣纸字
        case secondary // 透明底 + 松绿字 + 松绿描边
        case danger    // 朱砂底 + 宣纸字
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: DesignTokens.Spacing.sm) {
                if let icon {
                    Image(systemName: icon)
                        .font(DesignTokens.Font.headline)
                }
                Text(title)
                    .font(DesignTokens.Font.headline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignTokens.Spacing.md)
            .background(bgColor)
            .foregroundStyle(fgColor)
            .overlay(overlayBorder)
            .clipShape(Capsule())
        }
    }

    private var bgColor: Color {
        switch style {
        case .primary:   return DesignTokens.Color.pine
        case .secondary: return .clear
        case .danger:    return DesignTokens.Color.cinnabar
        }
    }

    private var fgColor: Color {
        switch style {
        case .primary:   return DesignTokens.Color.paper
        case .secondary: return DesignTokens.Color.pine
        case .danger:    return DesignTokens.Color.paper
        }
    }

    @ViewBuilder private var overlayBorder: some View {
        if style == .secondary {
            Capsule().stroke(DesignTokens.Color.pine, lineWidth: 1.5)
        }
    }
}

// MARK: - 深空沉浸卡片
/// 深色观测场景（AR星图/赫罗图/明信片）专用
struct DeepCard<Content: View>: View {
    var padding: CGFloat = DesignTokens.Spacing.md
    let content: () -> Content

    init(padding: CGFloat = DesignTokens.Spacing.md,
         @ViewBuilder content: @escaping () -> Content) {
        self.padding = padding
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .fill(DesignTokens.Color.ink.opacity(0.6))
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                    .stroke(DesignTokens.Color.sage.opacity(0.2), lineWidth: 1)
            )
    }
}

// MARK: - 状态标签
/// 正常=松绿 / 预警=朱砂 / 异常=朱砂 / 离线=灰雾
struct StatusChip: View {
    let status: Status
    let text: String

    enum Status {
        case normal, warning, anomaly, offline

        var color: Color {
            switch self {
            case .normal:  return DesignTokens.Color.normal
            case .warning: return DesignTokens.Color.warning
            case .anomaly: return DesignTokens.Color.anomaly
            case .offline: return DesignTokens.Color.offline
            }
        }

        var icon: String {
            switch self {
            case .normal:  return "checkmark.circle.fill"
            case .warning: return "exclamationmark.circle.fill"
            case .anomaly: return "xmark.octagon.fill"
            case .offline: return "moon.zzz.fill"
            }
        }
    }

    var body: some View {
        HStack(spacing: DesignTokens.Spacing.xs) {
            Image(systemName: status.icon)
                .font(DesignTokens.Font.caption2)
            Text(text)
                .font(DesignTokens.Font.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, DesignTokens.Spacing.sm)
        .padding(.vertical, DesignTokens.Spacing.xs)
        .background(status.color.opacity(0.12))
        .foregroundStyle(status.color)
        .clipShape(Capsule())
    }
}

// MARK: - 通用列表行
/// 家长中心等菜单列表的标准行
struct MenuRow: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var badge: String? = nil
    var showChevron: Bool = true

    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            // 图标圆底
            ZStack {
                Circle()
                    .fill(DesignTokens.Color.pine.opacity(0.1))
                    .frame(width: 36, height: 36)
                Image(systemName: icon)
                    .font(.system(size: 16))
                    .foregroundStyle(DesignTokens.Color.pine)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(DesignTokens.Font.body)
                    .foregroundStyle(DesignTokens.Color.textPrimary)
                if let subtitle {
                    Text(subtitle)
                        .font(DesignTokens.Font.caption2)
                        .foregroundStyle(DesignTokens.Color.textMute)
                }
            }

            Spacer()

            if let badge {
                Text(badge)
                    .font(DesignTokens.Font.caption2)
                    .fontWeight(.bold)
                    .foregroundStyle(DesignTokens.Color.paper)
                    .padding(.horizontal, DesignTokens.Spacing.sm)
                    .padding(.vertical, 2)
                    .background(DesignTokens.Color.cinnabar)
                    .clipShape(Capsule())
            }

            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(DesignTokens.Color.textFaint)
            }
        }
        .padding(.vertical, DesignTokens.Spacing.md)
        .padding(.horizontal, DesignTokens.Spacing.md)
        .contentShape(Rectangle())
    }
}

// MARK: - 区块标题
/// 带朱砂竖线标记的区块标题
struct SectionHeader: View {
    let title: String
    var subtitle: String? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: DesignTokens.Spacing.sm) {
            // 朱砂竖线
            Rectangle()
                .fill(DesignTokens.Color.cinnabar)
                .frame(width: 3, height: 16)
                .clipShape(RoundedRectangle(cornerRadius: 2))

            Text(title)
                .font(DesignTokens.Font.title3)
                .foregroundStyle(DesignTokens.Color.ink)

            if let subtitle {
                Text(subtitle)
                    .font(DesignTokens.Font.caption)
                    .foregroundStyle(DesignTokens.Color.textMute)
                Spacer()
            } else {
                Spacer()
            }
        }
    }
}


//
//  HomeComponents.swift
//  PetSoul
//
//  首页子组件：能量条、健康角标、探针轨道图标、观测卡片、空态
//  融合版：宣纸白底 + 玻璃卡片 + 墨绿/朱砂配色
//

import SwiftUI

// MARK: - 恒星能量条
struct EnergyBarView: View {
    let score: Int

    var body: some View {
        VStack(spacing: DesignTokens.Spacing.xs) {
            HStack {
                Text("恒星亮度")
                    .font(DesignTokens.Font.caption)
                    .foregroundStyle(DesignTokens.Color.textSub)
                Spacer()
                Text("\(score)")
                    .font(DesignTokens.Font.headline)
                    .foregroundStyle(barColor)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(DesignTokens.Color.mist)
                    RoundedRectangle(cornerRadius: 4)
                        .fill(barColor)
                        .frame(width: geo.size.width * CGFloat(score) / 100)
                }
            }
            .frame(height: 8)
        }
        .glassCard()
    }

    private var barColor: Color {
        switch score {
        case 90...: return DesignTokens.Color.pine
        case 70..<90: return DesignTokens.Color.pine
        case 40..<70: return DesignTokens.Color.cinnabar
        default: return DesignTokens.Color.cinnabar
        }
    }
}

// MARK: - 健康状态角标
struct HealthBadge: View {
    let score: Int

    var body: some View {
        VStack(spacing: 2) {
            Circle()
                .fill(color)
                .frame(width: 12, height: 12)
            Text(label)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(color)
        }
    }

    private var color: Color {
        switch score {
        case 90...: return DesignTokens.Color.pine
        case 70..<90: return DesignTokens.Color.pine
        case 40..<70: return DesignTokens.Color.cinnabar
        default: return DesignTokens.Color.cinnabar
        }
    }

    private var label: String {
        switch score {
        case 90...: return "稳定燃烧"
        case 70..<90: return "正常"
        case 40..<70: return "黑子"
        default: return "耀斑"
        }
    }
}

// MARK: - 探针轨道图标
struct ProbeOrbitIcon: View {
    let icon: String
    let name: String
    let isOnline: Bool

    var body: some View {
        VStack(spacing: DesignTokens.Spacing.xs) {
            ZStack {
                Circle()
                    .stroke(DesignTokens.Color.pine.opacity(0.3), lineWidth: 1)
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(isOnline
                        ? DesignTokens.Color.pine
                        : DesignTokens.Color.textFaint)
                if isOnline {
                    Circle()
                        .fill(DesignTokens.Color.pine)
                        .frame(width: 6, height: 6)
                        .offset(x: 16, y: -16)
                }
            }
            Text(name)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(DesignTokens.Color.textMute)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - 观测速览卡片
struct ObservationCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String

    var body: some View {
        VStack(spacing: DesignTokens.Spacing.xs) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(DesignTokens.Color.pine)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(DesignTokens.Font.title2)
                    .foregroundStyle(DesignTokens.Color.ink)
                Text(unit)
                    .font(DesignTokens.Font.caption)
                    .foregroundStyle(DesignTokens.Color.textMute)
            }
            Text(title)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(DesignTokens.Color.textMute)
        }
        .frame(maxWidth: .infinity)
        .glassCard()
    }
}

// MARK: - 空态引导
struct EmptyPetStateView: View {
    var body: some View {
        VStack(spacing: DesignTokens.Spacing.lg) {
            Spacer()

            Image(systemName: "pawprint.fill")
                .font(.system(size: 64))
                .foregroundStyle(DesignTokens.Color.pine.opacity(0.5))

            Text("你的家园星系还没有恒星")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(DesignTokens.Color.textPrimary)

            Text("添加宠物，生成它的 3D 数字孪生形象")
                .font(DesignTokens.Font.body)
                .foregroundStyle(DesignTokens.Color.textSub)
                .multilineTextAlignment(.center)

            Button {
                // TODO: 添加宠物流程
            } label: {
                Label("添加宠物", systemImage: "plus")
                    .font(DesignTokens.Font.headline)
                    .padding(.horizontal, DesignTokens.Spacing.xl)
                    .padding(.vertical, DesignTokens.Spacing.md)
                    .background(DesignTokens.Color.pine)
                    .foregroundStyle(DesignTokens.Color.paper)
                    .clipShape(Capsule())
            }

            Spacer()
        }
        .padding(.horizontal, DesignTokens.Spacing.xl)
    }
}

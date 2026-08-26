//
//  HomeComponents.swift
//  PetSoul
//
//  首页子组件：能量条、健康角标、探针轨道图标、观测卡片、空态
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
                    .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                Spacer()
                Text("\(score)")
                    .font(DesignTokens.Font.headline)
                    .foregroundStyle(barColor)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(DesignTokens.Color.siliconBlueLight.opacity(0.2))
                    RoundedRectangle(cornerRadius: 4)
                        .fill(barColor)
                        .frame(width: geo.size.width * CGFloat(score) / 100)
                }
            }
            .frame(height: 8)
        }
        .deepSpaceCard()
    }

    private var barColor: Color {
        switch score {
        case 90...: return DesignTokens.Color.normalGreen
        case 70..<90: return DesignTokens.Color.starGold
        case 40..<70: return DesignTokens.Color.warmOrange
        default: return DesignTokens.Color.anomalyRed
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
        case 90...: return DesignTokens.Color.normalGreen
        case 70..<90: return DesignTokens.Color.starGold
        case 40..<70: return DesignTokens.Color.warmOrange
        default: return DesignTokens.Color.anomalyRed
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
                    .stroke(DesignTokens.Color.starGold.opacity(0.3), lineWidth: 1)
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundStyle(isOnline
                        ? DesignTokens.Color.starGold
                        : DesignTokens.Color.siliconBlueLight.opacity(0.4))
                if isOnline {
                    Circle()
                        .fill(DesignTokens.Color.normalGreen)
                        .frame(width: 6, height: 6)
                        .offset(x: 16, y: -16)
                }
            }
            Text(name)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight)
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
                .foregroundStyle(DesignTokens.Color.starGold)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(DesignTokens.Font.title2)
                    .foregroundStyle(.white)
                Text(unit)
                    .font(DesignTokens.Font.caption)
                    .foregroundStyle(DesignTokens.Color.siliconBlueLight)
            }
            Text(title)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight)
        }
        .frame(maxWidth: .infinity)
        .deepSpaceCard()
    }
}

// MARK: - 空态引导
struct EmptyPetStateView: View {
    var body: some View {
        VStack(spacing: DesignTokens.Spacing.lg) {
            Spacer()

            Image(systemName: "pawprint.fill")
                .font(.system(size: 64))
                .foregroundStyle(DesignTokens.Color.starGold.opacity(0.5))

            Text("你的家园星系还没有恒星")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(.white)

            Text("添加宠物，生成它的 3D 数字孪生形象")
                .font(DesignTokens.Font.body)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                .multilineTextAlignment(.center)

            Button {
                // TODO: 添加宠物流程
            } label: {
                Label("添加宠物", systemImage: "plus")
                    .font(DesignTokens.Font.headline)
                    .padding(.horizontal, DesignTokens.Spacing.xl)
                    .padding(.vertical, DesignTokens.Spacing.md)
                    .background(DesignTokens.Color.starGold)
                    .foregroundStyle(DesignTokens.Color.deepSpace)
                    .clipShape(Capsule())
            }

            Spacer()
        }
        .padding(.horizontal, DesignTokens.Spacing.xl)
    }
}

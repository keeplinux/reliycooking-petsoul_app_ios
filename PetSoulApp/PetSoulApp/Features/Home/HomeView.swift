//
//  HomeView.swift
//  PetSoul
//
//  🌌 宇宙首页（宠物数字孪生星系）
//  PRD 3.1 —— 首页正面主体展示 3D 宠物数字孪生形象
//  MVP 阶段：预置占位 3D 模型 + 空态引导
//

import SwiftUI

struct HomeView: View {
    @State private var selectedPetIndex = 0

    // MVP Mock 数据
    private let mockPets: [MockPet] = [
        MockPet(name: "咪咪", species: "英国短毛猫", healthScore: 88, stage: "主序星·金黄"),
        MockPet(name: "旺财", species: "金毛寻回犬", healthScore: 76, stage: "主序星·金黄"),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                StarSpaceBackground()

                if mockPets.isEmpty {
                    EmptyPetStateView()
                } else {
                    petUniverseView
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Text("家园星系")
                        .font(DesignTokens.Font.title2)
                        .foregroundStyle(DesignTokens.Color.starGold)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        // TODO: 添加宠物
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundStyle(DesignTokens.Color.starGold)
                            .font(.title3)
                    }
                }
            }
        }
    }

    // MARK: - 宠物星系视图
    private var petUniverseView: some View {
        VStack(spacing: 0) {
            TwinSceneView()
                .frame(maxWidth: .infinity)
                .frame(height: 380)

            petInfoBar

            EnergyBarView(score: currentPet.healthScore)
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.sm)

            probeOrbitRow
                .padding(.top, DesignTokens.Spacing.md)

            observationQuickView
                .padding(.top, DesignTokens.Spacing.md)

            Spacer()
        }
    }

    private var petInfoBar: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            HStack(spacing: DesignTokens.Spacing.xs) {
                ForEach(0..<mockPets.count, id: \.self) { index in
                    Circle()
                        .fill(index == selectedPetIndex
                              ? DesignTokens.Color.starGold
                              : DesignTokens.Color.siliconBlueLight.opacity(0.3))
                        .frame(width: 8, height: 8)
                }
            }

            VStack(spacing: 2) {
                Text(currentPet.name)
                    .font(DesignTokens.Font.headline)
                    .foregroundStyle(.white)
                Text("\(currentPet.species) · \(currentPet.stage)")
                    .font(DesignTokens.Font.caption2)
                    .foregroundStyle(DesignTokens.Color.siliconBlueLight)
            }

            Spacer()

            HealthBadge(score: currentPet.healthScore)
        }
        .padding(.horizontal, DesignTokens.Spacing.lg)
        .padding(.top, DesignTokens.Spacing.sm)
    }

    private var probeOrbitRow: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ProbeOrbitIcon(icon: "drop.fill", name: "饮水舱", isOnline: true)
            ProbeOrbitIcon(icon: "fork.knife", name: "喂食器", isOnline: false)
            ProbeOrbitIcon(icon: "circle.grid.2x2", name: "猫砂盆", isOnline: false)
        }
        .padding(.horizontal, DesignTokens.Spacing.lg)
    }

    private var observationQuickView: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ObservationCard(title: "饮水", value: "5", unit: "次", icon: "drop.fill")
            ObservationCard(title: "进食", value: "3", unit: "次", icon: "fork.knife")
            ObservationCard(title: "靠近", value: "12", unit: "次", icon: "location.fill")
        }
        .padding(.horizontal, DesignTokens.Spacing.lg)
    }

    private var currentPet: MockPet {
        mockPets[selectedPetIndex]
    }
}

// MARK: - Mock 数据
struct MockPet {
    let name: String
    let species: String
    let healthScore: Int
    let stage: String
}

#Preview {
    HomeView()
        .environmentObject(AppState())
}

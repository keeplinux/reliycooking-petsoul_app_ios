//
//  ProfileView.swift
//  PetSoul
//
//  👤 家长中心（个人设置）
//  PRD 3.4 —— 家长个人中心、账号管理、系统设置
//  MVP 阶段：占位菜单
//

import SwiftUI

struct ProfileView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                StarSpaceBackground()

                ScrollView {
                    VStack(spacing: DesignTokens.Spacing.lg) {
                        userHeader
                        menuSection
                        aboutSection
                    }
                    .padding(.horizontal, DesignTokens.Spacing.lg)
                    .padding(.top, DesignTokens.Spacing.md)
                }
            }
            .navigationTitle("家长中心")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    private var userHeader: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle()
                    .fill(DesignTokens.Color.starGold.opacity(0.2))
                    .frame(width: 64, height: 64)
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(DesignTokens.Color.starGold)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("硅宠家长")
                    .font(DesignTokens.Font.title3)
                    .foregroundStyle(.white)
                Text("已绑定 2 颗恒星 · 2 个探针")
                    .font(DesignTokens.Font.caption)
                    .foregroundStyle(DesignTokens.Color.siliconBlueLight)
            }

            Spacer()

            Image(systemName: "qrcode")
                .font(.title2)
                .foregroundStyle(DesignTokens.Color.starGold)
        }
        .deepSpaceCard()
    }

    private var menuSection: some View {
        VStack(spacing: 0) {
            MenuRow(icon: "bell.fill", title: "消息通知", badge: "3")
            Divider().overlay(DesignTokens.Color.siliconBlueLight.opacity(0.1))
            MenuRow(icon: "shield.fill", title: "隐私与安全")
            Divider().overlay(DesignTokens.Color.siliconBlueLight.opacity(0.1))
            MenuRow(icon: "gearshape.fill", title: "系统设置")
        }
        .deepSpaceCard()
        .padding(.horizontal, 0) // 卡片内已有 padding
        .padding([.horizontal], DesignTokens.Spacing.md)
    }

    private var aboutSection: some View {
        VStack(spacing: 0) {
            MenuRow(icon: "info.circle.fill", title: "关于硅宠场域")
            Divider().overlay(DesignTokens.Color.siliconBlueLight.opacity(0.1))
            MenuRow(icon: "doc.text.fill", title: "用户协议与隐私政策")
            Divider().overlay(DesignTokens.Color.siliconBlueLight.opacity(0.1))
            MenuRow(icon: "star.fill", title: "给我们评分")
        }
        .deepSpaceCard()
        .padding([.horizontal], DesignTokens.Spacing.md)
    }
}

// MARK: - 菜单行
struct MenuRow: View {
    let icon: String
    let title: String
    var badge: String? = nil

    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundStyle(DesignTokens.Color.starGold)
                .frame(width: 28)

            Text(title)
                .font(DesignTokens.Font.body)
                .foregroundStyle(.white)

            Spacer()

            if let badge {
                Text(badge)
                    .font(DesignTokens.Font.caption2)
                    .foregroundStyle(DesignTokens.Color.deepSpace)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(DesignTokens.Color.warmOrange)
                    .clipShape(Capsule())
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight.opacity(0.5))
        }
        .padding(.vertical, DesignTokens.Spacing.md)
        .padding(.horizontal, DesignTokens.Spacing.md)
        .contentShape(Rectangle())
    }
}

#Preview {
    ProfileView()
        .environmentObject(AppState())
}

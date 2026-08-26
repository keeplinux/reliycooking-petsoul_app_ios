//
//  ProfileView.swift
//  PetSoul
//
//  👤 家长中心（个人设置）
//  PRD 3.4 —— 家长个人中心、账号管理、系统设置
//  融合版：宣纸白底 + 玻璃卡片 + 松绿配色
//

import SwiftUI

struct ProfileView: View {
    var body: some View {
        NavigationStack {
            ZStack {
                PaperBackground()

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
        }
    }

    private var userHeader: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle()
                    .fill(DesignTokens.Color.pine.opacity(0.1))
                    .frame(width: 64, height: 64)
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(DesignTokens.Color.pine)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("硅宠家长")
                    .font(DesignTokens.Font.title3)
                    .foregroundStyle(DesignTokens.Color.textPrimary)
                Text("已绑定 2 颗恒星 · 2 个探针")
                    .font(DesignTokens.Font.caption)
                    .foregroundStyle(DesignTokens.Color.textMute)
            }

            Spacer()

            Image(systemName: "qrcode")
                .font(.title2)
                .foregroundStyle(DesignTokens.Color.pine)
        }
        .glassCard()
    }

    private var menuSection: some View {
        VStack(spacing: 0) {
            NavigationLink { MessageCenterView() } label: { MenuRow(icon: "bell.fill", title: "消息通知", badge: "3") }
            Divider().overlay(DesignTokens.Color.mist)
            NavigationLink { PrivacyCenterView() } label: { MenuRow(icon: "shield.fill", title: "隐私与安全") }
            Divider().overlay(DesignTokens.Color.mist)
            NavigationLink { SettingsView() } label: { MenuRow(icon: "gearshape.fill", title: "系统设置") }
        }
        .glassCard()
    }

    private var aboutSection: some View {
        VStack(spacing: 0) {
            NavigationLink { AboutView() } label: { MenuRow(icon: "info.circle.fill", title: "关于硅宠场域") }
            Divider().overlay(DesignTokens.Color.mist)
            MenuRow(icon: "doc.text.fill", title: "用户协议与隐私政策")
            Divider().overlay(DesignTokens.Color.mist)
            NavigationLink { ProductInfoView() } label: { MenuRow(icon: "cube.box.fill", title: "产品信息") }
        }
        .glassCard()
    }
}

#Preview {
    ProfileView()
        .environmentObject(AppState())
}

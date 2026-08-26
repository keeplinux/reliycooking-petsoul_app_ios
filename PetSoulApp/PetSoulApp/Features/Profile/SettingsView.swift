//
//  SettingsView.swift
//  PetSoul
//
//  系统设置 —— PRD 3.4
//

import SwiftUI

struct SettingsView: View {
    @State private var notifyOn = true
    @State private var dndOn = false
    @State private var hapticsOn = true

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: DesignTokens.Spacing.lg) {
                    // 通知设置
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "通知")
                        VStack(spacing: 0) {
                            Toggle(isOn: $notifyOn) {
                                Label("推送通知", systemImage: "bell.fill")
                            }
                            .tint(DesignTokens.Color.pine)
                            Divider().overlay(DesignTokens.Color.mist)
                            Toggle(isOn: $dndOn) {
                                Label("免打扰 22:00-08:00", systemImage: "moon.zzz.fill")
                            }
                            .tint(DesignTokens.Color.pine)
                            Divider().overlay(DesignTokens.Color.mist)
                            Toggle(isOn: $hapticsOn) {
                                Label("触感反馈", systemImage: "hand.tap.fill")
                            }
                            .tint(DesignTokens.Color.pine)
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                    }

                    // 系统
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "系统")
                        VStack(spacing: 0) {
                            MenuRow(icon: "wifi", title: "网络设置")
                            Divider().overlay(DesignTokens.Color.mist)
                            MenuRow(icon: "internaldrive", title: "清除缓存", subtitle: "23.5 MB")
                            Divider().overlay(DesignTokens.Color.mist)
                            MenuRow(icon: "arrow.clockwise", title: "检查更新", subtitle: "已是最新版本")
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                    }

                    // 反馈
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "反馈")
                        VStack(spacing: 0) {
                            MenuRow(icon: "star.bubble", title: "意见反馈")
                            Divider().overlay(DesignTokens.Color.mist)
                            MenuRow(icon: "star.fill", title: "给我们评分")
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                    }
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("系统设置")
        .navigationBarTitleDisplayMode(.inline)
    }
}

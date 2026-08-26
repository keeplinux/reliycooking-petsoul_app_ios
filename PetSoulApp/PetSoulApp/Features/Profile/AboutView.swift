//
//  AboutView.swift
//  PetSoul
//
//  关于硅宠场域
//

import SwiftUI

struct AboutView: View {
    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 品牌 Logo
                    VStack(spacing: DesignTokens.Spacing.md) {
                        ZStack {
                            Circle().fill(DesignTokens.Color.pine.opacity(0.1))
                                .frame(width: 80, height: 80)
                            Image(systemName: "pawprint.fill")
                                .font(.system(size: 36))
                                .foregroundStyle(DesignTokens.Color.pine)
                        }
                        Text("硅宠场域")
                            .font(DesignTokens.Font.display)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("SiliField")
                            .font(DesignTokens.Font.title2)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, DesignTokens.Spacing.xl)

                    // 品牌故事
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        SectionHeader(title: "品牌故事")
                        Text("每一只宠物，都是从硅宠场域降临地球的温暖恒星。我们用硅基探针观测它们的健康亮度，用宇宙叙事守护每一份陪伴。")
                            .font(DesignTokens.Font.body)
                            .foregroundStyle(DesignTokens.Color.textSub)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard()

                    // 版本信息
                    VStack(spacing: 0) {
                        InfoRow(label: "版本", value: "v2.1.0")
                        Divider().overlay(DesignTokens.Color.mist)
                        InfoRow(label: "公司", value: "上海硅宠场域科技有限公司")
                        Divider().overlay(DesignTokens.Color.mist)
                        InfoRow(label: "品牌", value: "SiliField")
                    }
                    .padding(.horizontal, DesignTokens.Spacing.md)
                    .padding(.vertical, DesignTokens.Spacing.sm)
                    .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                    .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("关于")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct InfoRow: View {
    let label: String; let value: String
    var body: some View {
        HStack {
            Text(label).font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.textSub)
            Spacer()
            Text(value).font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.ink)
        }
        .padding(.vertical, DesignTokens.Spacing.sm)
    }
}

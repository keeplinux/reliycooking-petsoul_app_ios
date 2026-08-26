//
//  HealthBaselineView.swift
//  PetSoul
//
//  基线档案 —— PRD 3.3
//  建立宠物个性化健康基线，作为异常检测的参照标准
//

import SwiftUI

struct HealthBaselineView: View {
    private let baselines: [BaselineItem] = [
        BaselineItem(icon: "scalemass.fill", label: "体重基线", value: "4.2 kg", range: "3.8 - 4.6 kg"),
        BaselineItem(icon: "drop.fill", label: "日饮水量", value: "120 ml", range: "100 - 150 ml"),
        BaselineItem(icon: "fork.knife", label: "日进食量", value: "45 g", range: "40 - 50 g"),
        BaselineItem(icon: "figure.walk", label: "日活动量", value: "中等", range: "30 - 60 分钟活跃"),
    ]

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 头部
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Image(systemName: "person.text.rectangle")
                            .font(.system(size: 36))
                            .foregroundStyle(DesignTokens.Color.pine)
                        Text("基线档案")
                            .font(DesignTokens.Font.display)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("个性化健康基线 · 异常检测参照")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, DesignTokens.Spacing.lg)

                    // 建立进度
                    VStack(spacing: DesignTokens.Spacing.md) {
                        HStack {
                            Text("建立进度").font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.ink)
                            Spacer()
                            Text("7 / 14 天").font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.pine)
                        }
                        ProgressView(value: 7, total: 14)
                            .tint(DesignTokens.Color.pine)
                            .scaleEffect(y: 1.2)
                        Text("需 14 天连续观测以建立稳定基线")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                    .glassCard()

                    // 基线列表
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "当前基线值")
                        VStack(spacing: 0) {
                            ForEach(Array(baselines.enumerated()), id: \.offset) { idx, item in
                                BaselineRow(item: item)
                                if idx < baselines.count - 1 {
                                    Divider().overlay(DesignTokens.Color.mist)
                                }
                            }
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                    }

                    // 说明
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        HStack(spacing: DesignTokens.Spacing.sm) {
                            Image(systemName: "info.circle.fill").foregroundStyle(DesignTokens.Color.pine)
                            Text("什么是基线？").font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.ink)
                        }
                        Text("基线是宠物在健康状态下的各项指标平均值。建立基线后，系统可自动检测偏离正常范围的数据，及时发出预警。")
                            .font(DesignTokens.Font.body)
                            .foregroundStyle(DesignTokens.Color.textSub)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard()
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("基线档案")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct BaselineItem {
    let icon: String; let label: String; let value: String; let range: String
}

private struct BaselineRow: View {
    let item: BaselineItem
    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(DesignTokens.Color.pine.opacity(0.1)).frame(width: 36, height: 36)
                Image(systemName: item.icon).font(.system(size: 15)).foregroundStyle(DesignTokens.Color.pine)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.label).font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.textSub)
                Text("正常区间 \(item.range)").font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
            }
            Spacer()
            Text(item.value).font(DesignTokens.Font.title3).foregroundStyle(DesignTokens.Color.ink)
        }
        .padding(.vertical, DesignTokens.Spacing.sm)
    }
}

//
//  BehaviorInsightView.swift
//  PetSoul
//
//  行为洞察 —— PRD 3.3
//  AI 识别宠物行为节律与异常，输出个性化洞察
//

import SwiftUI

struct BehaviorInsightView: View {
    private let insights: [InsightItem] = [
        InsightItem(icon: "drop.fill", title: "饮水节律", value: "稳定",
                    desc: "每日 4-6 次，集中在晨间与傍晚", status: .normal),
        InsightItem(icon: "clock.fill", title: "活动高峰", value: "20:00-22:00",
                    desc: "晚间活跃度最高，符合猫科夜行习性", status: .normal),
        InsightItem(icon: "person.crop.circle.badge.questionmark", title: "靠近频次", value: "↓ 15%",
                    desc: "本周靠近主人的频次较上周下降 15%", status: .warning),
        InsightItem(icon: "moon.zzz.fill", title: "睡眠时长", value: "14 小时",
                    desc: "日均睡眠 14 小时，处于正常区间", status: .normal),
    ]

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 概述
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Image(systemName: "waveform.path.ecg")
                            .font(.system(size: 36))
                            .foregroundStyle(DesignTokens.Color.pine)
                        Text("行为洞察")
                            .font(DesignTokens.Font.display)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("基于近 30 天观测数据，AI 识别行为节律")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, DesignTokens.Spacing.lg)

                    // 洞察列表
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "节律识别")
                        ForEach(Array(insights.enumerated()), id: \.offset) { idx, item in
                            InsightCard(item: item)
                        }
                    }

                    // 异常提示
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        HStack(spacing: DesignTokens.Spacing.sm) {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundStyle(DesignTokens.Color.cinnabar)
                            Text("异常提示")
                                .font(DesignTokens.Font.headline)
                                .foregroundStyle(DesignTokens.Color.ink)
                        }
                        Text("本周靠近频次下降 15%，可能原因：环境变化、温度升高、或情绪波动。建议增加互动时间，观察是否有其他异常表现。")
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
        .navigationTitle("行为洞察")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct InsightItem {
    let icon: String; let title: String; let value: String
    let desc: String; let status: StatusChip.Status
}

private struct InsightCard: View {
    let item: InsightItem
    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(item.status.color.opacity(0.12)).frame(width: 40, height: 40)
                Image(systemName: item.icon).font(.system(size: 17)).foregroundStyle(item.status.color)
            }
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(item.title).font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.ink)
                    Spacer()
                    Text(item.value).font(DesignTokens.Font.body).fontWeight(.bold)
                        .foregroundStyle(item.status.color)
                }
                Text(item.desc).font(DesignTokens.Font.caption).foregroundStyle(DesignTokens.Color.textMute)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(.horizontal, DesignTokens.Spacing.md)
        .padding(.vertical, DesignTokens.Spacing.sm)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
    }
}

//
//  HealthReportView.swift
//  PetSoul
//
//  每日晨报 —— PRD 3.3
//  今日恒星观测摘要：饮水、进食、亮度、预警
//

import SwiftUI

struct HealthReportView: View {
    private let reportItems: [ReportItem] = [
        ReportItem(icon: "drop.fill", label: "今日饮水", value: "5 次", status: .normal, note: "正常区间 4-6 次"),
        ReportItem(icon: "fork.knife", label: "今日进食", value: "3 次", status: .normal, note: "定时投喂正常"),
        ReportItem(icon: "star.fill", label: "恒星亮度", value: "88", status: .normal, note: "稳定燃烧"),
        ReportItem(icon: "exclamationmark.triangle.fill", label: "异常预警", value: "无", status: .normal, note: "一切正常"),
    ]

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 晨报头部
                    VStack(spacing: DesignTokens.Spacing.xs) {
                        Image(systemName: "sun.max.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(DesignTokens.Color.cinnabar)
                        Text("今日晨报")
                            .font(DesignTokens.Font.display)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("2026 年 8 月 26 日 · 星期三")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, DesignTokens.Spacing.lg)

                    // 总体评价
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Text("总体评价")
                            .font(DesignTokens.Font.headline)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("今日恒星稳定燃烧，各项指标正常。继续保持良好的观测条件。")
                            .font(DesignTokens.Font.body)
                            .foregroundStyle(DesignTokens.Color.textSub)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity)
                    .glassCard()

                    // 观测明细
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "观测明细")
                        VStack(spacing: 0) {
                            ForEach(Array(reportItems.enumerated()), id: \.offset) { idx, item in
                                ReportRow(item: item)
                                if idx < reportItems.count - 1 {
                                    Divider().overlay(DesignTokens.Color.mist)
                                }
                            }
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                            .fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                            .stroke(DesignTokens.Color.border, lineWidth: 1))
                    }

                    // 建议
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        HStack(spacing: DesignTokens.Spacing.sm) {
                            Image(systemName: "lightbulb.fill")
                                .foregroundStyle(DesignTokens.Color.cinnabar)
                            Text("今日建议")
                                .font(DesignTokens.Font.headline)
                                .foregroundStyle(DesignTokens.Color.ink)
                        }
                        Text("饮水量充足，可适当增加互动时间。晚间活动高峰期可安排 15 分钟逗猫棒互动。")
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
        .navigationTitle("每日晨报")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ReportItem {
    let icon: String; let label: String; let value: String
    let status: StatusChip.Status; let note: String
}

private struct ReportRow: View {
    let item: ReportItem
    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(item.status.color.opacity(0.12)).frame(width: 36, height: 36)
                Image(systemName: item.icon).font(.system(size: 15)).foregroundStyle(item.status.color)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.label).font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.textSub)
                Text(item.note).font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
            }
            Spacer()
            Text(item.value).font(DesignTokens.Font.title3).foregroundStyle(DesignTokens.Color.ink)
        }
        .padding(.vertical, DesignTokens.Spacing.sm)
    }
}

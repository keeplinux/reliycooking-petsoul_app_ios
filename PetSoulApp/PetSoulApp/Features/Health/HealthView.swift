//
//  HealthView.swift
//  PetSoul
//
//  💚 健康管理（恒星观测台）
//  PRD 3.3 —— 生成宠物健康图谱，呈现为恒星观测信息
//  融合版：宣纸白底 + 玻璃卡片 + 松绿/朱砂配色
//

import SwiftUI
import Charts

struct HealthView: View {
    // MVP Mock 趋势数据（近7天健康分）
    private let healthTrend: [HealthPoint] = [
        HealthPoint(day: "周一", score: 82),
        HealthPoint(day: "周二", score: 85),
        HealthPoint(day: "周三", score: 80),
        HealthPoint(day: "周四", score: 88),
        HealthPoint(day: "周五", score: 90),
        HealthPoint(day: "周六", score: 86),
        HealthPoint(day: "周日", score: 88),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                PaperBackground()

                ScrollView {
                    VStack(spacing: DesignTokens.Spacing.lg) {
                        // 总览
                        healthOverview

                        // 功能入口（导航）
                        VStack(spacing: DesignTokens.Spacing.md) {
                            NavigationLink { HealthReportView() } label: { healthEntry(icon: "sun.max.fill", title: "每日晨报", subtitle: "今日恒星观测摘要") }
                            NavigationLink { HertzsprungView() } label: { healthEntry(icon: "chart.line.uptrend.xyaxis", title: "恒星生命图", subtitle: "赫罗图 · 生命轨迹") }
                            NavigationLink { BehaviorInsightView() } label: { healthEntry(icon: "waveform.path.ecg", title: "行为洞察", subtitle: "AI 行为节律识别") }
                            NavigationLink { HealthBaselineView() } label: { healthEntry(icon: "person.text.rectangle", title: "基线档案", subtitle: "个性化健康基线") }
                        }

                        // 趋势图
                        trendChart

                        // 观测维度
                        observationDimensions
                    }
                    .padding(.horizontal, DesignTokens.Spacing.lg)
                    .padding(.top, DesignTokens.Spacing.md)
                }
            }
            .navigationTitle("恒星观测台")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var healthOverview: some View {
        VStack(spacing: DesignTokens.Spacing.xs) {
            Text("咪咪 · 英国短毛猫")
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.textSub)
            Text("88")
                .font(.system(size: 56, weight: .bold, design: .serif))
                .foregroundStyle(DesignTokens.Color.ink)
            Text("恒星亮度正常 · 稳定燃烧")
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.pine)
        }
        .frame(maxWidth: .infinity)
        .glassCard()
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
            Text("近 7 日亮度趋势")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(DesignTokens.Color.textPrimary)

            Chart(healthTrend) { point in
                LineMark(
                    x: .value("日", point.day),
                    y: .value("亮度", point.score)
                )
                .foregroundStyle(DesignTokens.Color.pine)
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("日", point.day),
                    y: .value("亮度", point.score)
                )
                .foregroundStyle(DesignTokens.Color.cinnabar)
            }
            .chartYScale(domain: 60...100)
            .chartYAxis {
                AxisMarks(values: [60, 70, 80, 90, 100]) { value in
                    AxisGridLine()
                        .foregroundStyle(DesignTokens.Color.mist)
                    AxisValueLabel()
                        .foregroundStyle(DesignTokens.Color.textMute)
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel()
                        .foregroundStyle(DesignTokens.Color.textMute)
                }
            }
            .frame(height: 180)
        }
        .glassCard()
    }

    private var observationDimensions: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.md) {
            Text("观测维度")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(DesignTokens.Color.textPrimary)

            VStack(spacing: DesignTokens.Spacing.sm) {
                DimensionRow(title: "饮水舱水量", value: "正常", status: .normal)
                DimensionRow(title: "进食频次", value: "正常", status: .normal)
                DimensionRow(title: "猫砂盆使用", value: "偏少", status: .warning)
                DimensionRow(title: "靠近频次", value: "正常", status: .normal)
            }
        }
        .glassCard()
    }

    private func healthEntry(icon: String, title: String, subtitle: String) -> some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(DesignTokens.Color.pine.opacity(0.1)).frame(width: 40, height: 40)
                Image(systemName: icon).foregroundStyle(DesignTokens.Color.pine)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.textPrimary)
                Text(subtitle).font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(DesignTokens.Color.textFaint)
        }
        .glassCard()
    }
}

// MARK: - 观测维度行
struct DimensionRow: View {
    let title: String
    let value: String
    let status: Status

    enum Status { case normal, warning, anomaly }

    private var color: Color {
        switch status {
        case .normal: return DesignTokens.Color.pine
        case .warning: return DesignTokens.Color.cinnabar
        case .anomaly: return DesignTokens.Color.cinnabar
        }
    }

    var body: some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(title)
                .font(DesignTokens.Font.body)
                .foregroundStyle(DesignTokens.Color.textPrimary)
            Spacer()
            Text(value)
                .font(DesignTokens.Font.body)
                .foregroundStyle(color)
        }
    }
}

// MARK: - Mock 数据
struct HealthPoint: Identifiable {
    let id = UUID()
    let day: String
    let score: Int
}

#Preview {
    HealthView()
        .environmentObject(AppState())
}

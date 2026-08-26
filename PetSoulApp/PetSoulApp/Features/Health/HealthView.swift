//
//  HealthView.swift
//  PetSoul
//
//  💚 健康管理（恒星观测台）
//  PRD 3.3 —— 生成宠物健康图谱，呈现为恒星观测信息
//  MVP 阶段：健康趋势图占位（SwiftUI Charts 原生）
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
                StarSpaceBackground()

                ScrollView {
                    VStack(spacing: DesignTokens.Spacing.lg) {
                        // 总览
                        healthOverview

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
            .toolbarColorScheme(.dark, for: .navigationBar)
        }
    }

    private var healthOverview: some View {
        VStack(spacing: DesignTokens.Spacing.xs) {
            Text("咪咪 · 英国短毛猫")
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight)
            Text("88")
                .font(.system(size: 56, weight: .bold))
                .foregroundStyle(DesignTokens.Color.starGold)
            Text("恒星亮度正常 · 稳定燃烧")
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.normalGreen)
        }
        .frame(maxWidth: .infinity)
        .deepSpaceCard()
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
            Text("近 7 日亮度趋势")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(.white)

            Chart(healthTrend) { point in
                LineMark(
                    x: .value("日", point.day),
                    y: .value("亮度", point.score)
                )
                .foregroundStyle(DesignTokens.Color.starGold)
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("日", point.day),
                    y: .value("亮度", point.score)
                )
                .foregroundStyle(DesignTokens.Color.warmOrange)
            }
            .chartYScale(domain: 60...100)
            .chartYAxis {
                AxisMarks(values: [60, 70, 80, 90, 100]) { value in
                    AxisGridLine()
                        .foregroundStyle(DesignTokens.Color.siliconBlueLight.opacity(0.2))
                    AxisValueLabel()
                        .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                }
            }
            .chartXAxis {
                AxisMarks { value in
                    AxisValueLabel()
                        .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                }
            }
            .frame(height: 180)
        }
        .deepSpaceCard()
    }

    private var observationDimensions: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.md) {
            Text("观测维度")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(.white)

            VStack(spacing: DesignTokens.Spacing.sm) {
                DimensionRow(title: "饮水舱水量", value: "正常", status: .normal)
                DimensionRow(title: "进食频次", value: "正常", status: .normal)
                DimensionRow(title: "猫砂盆使用", value: "偏少", status: .warning)
                DimensionRow(title: "靠近频次", value: "正常", status: .normal)
            }
        }
        .deepSpaceCard()
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
        case .normal: return DesignTokens.Color.normalGreen
        case .warning: return DesignTokens.Color.warmOrange
        case .anomaly: return DesignTokens.Color.anomalyRed
        }
    }

    var body: some View {
        HStack {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(title)
                .font(DesignTokens.Font.body)
                .foregroundStyle(.white)
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

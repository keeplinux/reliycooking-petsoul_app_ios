//
//  ProbeDetailView.swift
//  PetSoul
//
//  设备详情 —— PRD 3.2 饮水舱详情
//  水温控制、水量、7天趋势
//

import SwiftUI

struct ProbeDetailView: View {
    let deviceName: String
    @State private var targetTemp: Double = 24

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 设备状态卡片
                    VStack(spacing: DesignTokens.Spacing.md) {
                        HStack(spacing: DesignTokens.Spacing.md) {
                            ZStack {
                                Circle().fill(DesignTokens.Color.pine.opacity(0.1)).frame(width: 56, height: 56)
                                Image(systemName: "drop.fill").font(.system(size: 26)).foregroundStyle(DesignTokens.Color.pine)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(deviceName).font(DesignTokens.Font.title3).foregroundStyle(DesignTokens.Color.ink)
                                HStack(spacing: DesignTokens.Spacing.sm) {
                                    StatusChip(status: .normal, text: "在线")
                                    Text("电量 85%").font(DesignTokens.Font.caption).foregroundStyle(DesignTokens.Color.textMute)
                                }
                            }
                            Spacer()
                        }
                    }
                    .glassCard()

                    // 实时数据
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "实时数据")
                        HStack(spacing: DesignTokens.Spacing.md) {
                            StatBlock(title: "水温", value: "24", unit: "°C", icon: "thermometer")
                            StatBlock(title: "水量", value: "正常", unit: "", icon: "drop")
                            StatBlock(title: "今日饮水", value: "120", unit: "ml", icon: "cup.and.saucer")
                        }
                    }

                    // 水温控制
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "水温控制")
                        VStack(spacing: DesignTokens.Spacing.sm) {
                            HStack {
                                Text("目标温度").font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.textSub)
                                Spacer()
                                Text("\(Int(targetTemp))°C").font(DesignTokens.Font.title3).foregroundStyle(DesignTokens.Color.pine)
                            }
                            Slider(value: $targetTemp, in: 20...40, step: 1)
                                .tint(DesignTokens.Color.pine)
                            HStack {
                                Text("20°C").font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
                                Spacer()
                                Text("40°C").font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
                            }
                        }
                    }
                    .glassCard()
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
            }
        }
        .navigationTitle(deviceName)
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - 数据统计块

struct StatBlock: View {
    let title: String
    let value: String
    let unit: String
    let icon: String

    var body: some View {
        VStack(spacing: DesignTokens.Spacing.sm) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(DesignTokens.Color.pine)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value)
                    .font(DesignTokens.Font.title3)
                    .foregroundStyle(DesignTokens.Color.ink)
                if !unit.isEmpty {
                    Text(unit)
                        .font(DesignTokens.Font.caption)
                        .foregroundStyle(DesignTokens.Color.textMute)
                }
            }
            Text(title)
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.textSub)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, DesignTokens.Spacing.md)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.md).fill(DesignTokens.Color.surface))
        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.md).stroke(DesignTokens.Color.border, lineWidth: 1))
    }
}

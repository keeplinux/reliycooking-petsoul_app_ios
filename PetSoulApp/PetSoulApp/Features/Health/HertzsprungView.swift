//
//  HertzsprungView.swift
//  PetSoul
//
//  恒星生命图（赫罗图）—— PRD 3.3
//  深色沉浸：横轴年龄阶段，纵轴健康亮度，绘制宠物生命轨迹
//

import SwiftUI

struct HertzsprungView: View {
    var body: some View {
        ZStack {
            StarSpaceBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 标题
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Text("恒星生命图")
                            .font(DesignTokens.Font.display)
                            .foregroundStyle(DesignTokens.Color.surface)
                        Text("赫罗图 · 年龄 × 健康亮度")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.sage.opacity(0.8))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.top, DesignTokens.Spacing.lg)

                    // 赫罗图画布
                    HRDiagram()
                        .frame(height: 320)

                    // 当前阶段
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        HStack {
                            Text("当前阶段").font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.surface)
                            Spacer()
                            Text("主序星 · 金黄").font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.pine)
                        }
                        HStack {
                            Text("亮度轨迹").font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.surface)
                            Spacer()
                            Text("近 30 日稳定").font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.pine)
                        }
                        HStack {
                            Text("演化预测").font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.surface)
                            Spacer()
                            Text("3 年后进入亚巨星").font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.sage)
                        }
                    }
                    .padding(DesignTokens.Spacing.md)
                    .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.ink.opacity(0.6)))
                    .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.sage.opacity(0.2), lineWidth: 1))
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("恒星生命图")
        .navigationBarTitleDisplayMode(.inline)
        .preferredColorScheme(.dark)
    }
}

// MARK: - 赫罗图画布

private struct HRDiagram: View {
    // 模拟生命轨迹点（年龄 × 健康亮度）
    private let trajectory: [CGPoint] = [
        CGPoint(x: 0.05, y: 0.85),   // 幼年
        CGPoint(x: 0.15, y: 0.90),
        CGPoint(x: 0.25, y: 0.92),   // 青年
        CGPoint(x: 0.40, y: 0.88),
        CGPoint(x: 0.55, y: 0.82),   // 壮年（当前）
        CGPoint(x: 0.70, y: 0.70),
        CGPoint(x: 0.85, y: 0.55),   // 老年
        CGPoint(x: 0.95, y: 0.40),
    ]

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let pad: CGFloat = 32

            ZStack {
                // 网格背景
                VStack {
                    Spacer()
                    HStack {
                        ForEach(0..<5, id: \.self) { _ in
                            Rectangle().fill(DesignTokens.Color.sage.opacity(0.08)).frame(height: 1)
                            Spacer()
                        }
                    }
                    Spacer()
                }

                // 坐标轴
                // Y 轴（左侧）
                Rectangle().fill(DesignTokens.Color.sage.opacity(0.3))
                    .frame(width: 1)
                    .position(x: pad, y: h / 2)
                // X 轴（底部）
                Rectangle().fill(DesignTokens.Color.sage.opacity(0.3))
                    .frame(height: 1)
                    .position(x: w / 2, y: h - pad)

                // 轨迹路径
                Path { path in
                    for (i, pt) in trajectory.enumerated() {
                        let x = pad + pt.x * (w - 2 * pad)
                        let y = pad + (1 - pt.y) * (h - 2 * pad)
                        if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                        else { path.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(DesignTokens.Color.pine, style: .init(lineWidth: 2, lineCap: .round, lineJoin: .round))

                // 轨迹点
                ForEach(0..<trajectory.count, id: \.self) { i in
                    let pt = trajectory[i]
                    let x = pad + pt.x * (w - 2 * pad)
                    let y = pad + (1 - pt.y) * (h - 2 * pad)
                    Circle()
                        .fill(i == 4 ? DesignTokens.Color.cinnabar : DesignTokens.Color.pine)
                        .frame(width: i == 4 ? 10 : 6)
                        .overlay(
                            Circle().stroke(DesignTokens.Color.surface, lineWidth: 1.5)
                        )
                        .position(x: x, y: y)
                }

                // 当前位置标签
                let cur = trajectory[4]
                Text("现在")
                    .font(DesignTokens.Font.caption2)
                    .foregroundStyle(DesignTokens.Color.cinnabar)
                    .position(x: pad + cur.x * (w - 2 * pad),
                              y: pad + (1 - cur.y) * (h - 2 * pad) - 16)

                // 轴标签
                Text("年龄 →")
                    .font(DesignTokens.Font.micro)
                    .foregroundStyle(DesignTokens.Color.sage.opacity(0.7))
                    .position(x: w - pad - 16, y: h - pad + 10)
                Text("↑ 亮度")
                    .font(DesignTokens.Font.micro)
                    .foregroundStyle(DesignTokens.Color.sage.opacity(0.7))
                    .position(x: pad - 14, y: pad + 6)
            }
        }
    }
}

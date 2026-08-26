//
//  StarMapView.swift
//  PetSoul
//
//  🌟 AR 星图观测 —— PRD 3.5
//  深色沉浸模式：将手机朝向天空，寻找属于你的宠物恒星
//  框架阶段：沉浸式星空预览，后续接入 ARKit 天体追踪
//

import SwiftUI

struct StarMapView: View {
    @State private var isObserving = false
    @State private var foundStar = false

    var body: some View {
        ZStack {
            StarSpaceBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    StarPreviewZone(isObserving: $isObserving, foundStar: $foundStar)
                        .frame(height: 280)
                    VStack(spacing: DesignTokens.Spacing.md) {
                        FeatureRow(icon: "scope", title: "行星 / 月亮实时追踪",
                                   desc: "ARKit 天体识别，对准天空即可标注")
                        FeatureRow(icon: "star.fill", title: "寻找我的恒星",
                                   desc: "亮度联动健康指数，越健康越耀眼")
                        FeatureRow(icon: "rectangle.stack.fill.badge.plus", title: "星轨明信片",
                                   desc: "捕捉星轨瞬间，生成可分享的纪念卡")
                    }
                    CapsuleButton(title: isObserving ? "正在观测…" : "开始观测",
                                  icon: isObserving ? "radiowaves.left" : "telescope",
                                  style: .primary) {
                        withAnimation(.easeInOut(duration: 1.5)) { isObserving = true }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                            withAnimation(.spring()) { foundStar = true }
                        }
                    }
                    .disabled(isObserving).opacity(isObserving ? 0.6 : 1)
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("星图观测")
        .navigationBarTitleDisplayMode(.inline)
        .preferredColorScheme(.dark)
    }
}


private struct StarPreviewZone: View {
    @Binding var isObserving: Bool
    @Binding var foundStar: Bool
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                .fill(RadialGradient(colors: [DesignTokens.Color.night.opacity(0.8),
                                              DesignTokens.Color.ink.opacity(0.95)],
                                     center: .center, startRadius: 20, endRadius: 200))
            .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                .stroke(DesignTokens.Color.sage.opacity(0.2), lineWidth: 1))
            StarField()
            if isObserving {
                VStack(spacing: DesignTokens.Spacing.sm) {
                    Image(systemName: "scope").font(.system(size: 48))
                        .foregroundStyle(DesignTokens.Color.sage.opacity(0.8))
                    if foundStar {
                        VStack(spacing: DesignTokens.Spacing.xs) {
                            Text("✦ 发现你的恒星").font(DesignTokens.Font.title2)
                                .foregroundStyle(DesignTokens.Color.pine)
                            Text("「橘子」· 亮度 88").font(DesignTokens.Font.caption)
                                .foregroundStyle(DesignTokens.Color.sage)
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(Capsule().fill(DesignTokens.Color.surface.opacity(0.15)))
                        .transition(.scale.combined(with: .opacity))
                    } else {
                        Text("搜索中…").font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.sage.opacity(0.6))
                    }
                }
            } else {
                VStack(spacing: DesignTokens.Spacing.sm) {
                    Image(systemName: "telescope").font(.system(size: 44))
                        .foregroundStyle(DesignTokens.Color.sage.opacity(0.5))
                    Text("将手机朝向天空").font(DesignTokens.Font.caption)
                        .foregroundStyle(DesignTokens.Color.sage.opacity(0.5))
                }
            }
        }
    }
}

private struct StarField: View {
    @State private var stars: [StarDot] = []
    var body: some View {
        Canvas { context, size in
            for s in stars {
                context.opacity = s.opacity
                context.fill(Circle().path(in: CGRect(x: s.x * size.width, y: s.y * size.height,
                                                       width: s.size, height: s.size)),
                             with: .color(DesignTokens.Color.sage))
            }
        }
        .onAppear { generate() }
    }
    private func generate() {
        stars = (0..<40).map { _ in StarDot(x: .random(in: 0.05...0.95), y: .random(in: 0.05...0.95),
                                            size: .random(in: 1...3), opacity: .random(in: 0.2...0.8)) }
    }
}
private struct StarDot { let x: CGFloat; let y: CGFloat; let size: CGFloat; let opacity: Double }

private struct FeatureRow: View {
    let icon: String; let title: String; let desc: String
    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(DesignTokens.Color.pine.opacity(0.15)).frame(width: 40, height: 40)
                Image(systemName: icon).font(.system(size: 17)).foregroundStyle(DesignTokens.Color.pine)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.surface)
                Text(desc).font(DesignTokens.Font.caption).foregroundStyle(DesignTokens.Color.sage.opacity(0.8))
            }
            Spacer()
        }
        .padding(DesignTokens.Spacing.md)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.ink.opacity(0.6)))
        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.sage.opacity(0.2), lineWidth: 1))
    }
}
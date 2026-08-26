//
//  LaunchView.swift
//  PetSoul
//
//  启动页：品牌 Logo 展示约 3 秒，可点击/滑动跳过
//  PRD 3.6 — 深色沉浸场景，保留 StarSpaceBackground
//

import SwiftUI

struct LaunchView: View {
    @EnvironmentObject private var appState: AppState

    /// 启动页展示时长（秒）
    private let displayDuration: TimeInterval = 3.0

    /// 进度动画
    @State private var logoScale: CGFloat = 0.8
    @State private var logoOpacity: Double = 0.0
    @State private var glowOpacity: Double = 0.0
    @State private var progress: CGFloat = 0.0

    var body: some View {
        ZStack {
            // 深空背景（启动页保留沉浸感）
            StarSpaceBackground()

            VStack(spacing: 32) {
                Spacer()

                // 品牌 Logo（占位，后续替换为真实品牌素材）
                VStack(spacing: 16) {
                    ZStack {
                        // 光晕
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        DesignTokens.Color.pine.opacity(0.6),
                                        DesignTokens.Color.pine.opacity(0),
                                    ],
                                    center: .center,
                                    startRadius: 20,
                                    endRadius: 80
                                )
                            )
                            .frame(width: 160, height: 160)
                            .opacity(glowOpacity)

                        // Logo 图标占位
                        Image(systemName: "pawprint.circle.fill")
                            .font(.system(size: 72))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [DesignTokens.Color.pine, DesignTokens.Color.cinnabar],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .scaleEffect(logoScale)
                            .opacity(logoOpacity)
                    }

                    // 品牌名
                    Text("硅宠场域")
                        .font(.system(size: 22, weight: .bold, design: .serif))
                        .foregroundStyle(DesignTokens.Color.mist)
                        .opacity(logoOpacity)

                    Text("PetSoul")
                        .font(.caption)
                        .foregroundStyle(DesignTokens.Color.sage)
                        .opacity(logoOpacity)
                }

                Spacer()

                // 进度条
                VStack(spacing: 8) {
                    ProgressView(value: progress)
                        .progressViewStyle(.linear)
                        .tint(DesignTokens.Color.pine)
                        .frame(width: 120)

                    Text("每一只宠物，都是从硅宠场域降临地球的温暖恒星")
                        .font(.caption2)
                        .foregroundStyle(DesignTokens.Color.sage.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                .padding(.bottom, 60)
            }
        }
        // 点击跳过
        .contentShape(Rectangle())
        .onTapGesture {
            finishLaunch()
        }
        // 上滑跳过
        .gesture(
            DragGesture(minimumDistance: 30)
                .onEnded { value in
                    if value.translation.height < -30 {
                        finishLaunch()
                    }
                }
        )
        .onAppear {
            startAnimation()
            startCountdown()
        }
    }

    // MARK: - 动画
    private func startAnimation() {
        // Logo 淡入 + 放大
        withAnimation(.easeOut(duration: 0.8)) {
            logoOpacity = 1.0
            logoScale = 1.0
        }
        // 光晕延迟淡入
        withAnimation(.easeIn(duration: 1.0).delay(0.3)) {
            glowOpacity = 1.0
        }
        // 进度条
        withAnimation(.linear(duration: displayDuration)) {
            progress = 1.0
        }
    }

    // MARK: - 倒计时
    private func startCountdown() {
        DispatchQueue.main.asyncAfter(deadline: .now() + displayDuration) {
            finishLaunch()
        }
    }

    // MARK: - 完成启动
    private func finishLaunch() {
        appState.hasLaunched = true
    }
}

#Preview {
    LaunchView()
        .environmentObject(AppState())
}

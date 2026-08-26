//
//  StarSpaceBackground.swift
//  PetSoul
//
//  深空星海背景 —— 硅蓝渐变 + 呼吸光点粒子
//  用于启动页、首页等需要宇宙沉浸感的场景
//

import SwiftUI

struct StarSpaceBackground: View {
    /// 粒子数量
    private let starCount = 60
    /// 是否启用呼吸动画
    var animated: Bool = true

    @State private var stars: [StarParticle] = []
    @State private var animateBreath = false

    var body: some View {
        ZStack {
            // 渐变底色
            LinearGradient(
                colors: [
                    DesignTokens.Color.deepSpace,
                    DesignTokens.Color.siliconBlue,
                    DesignTokens.Color.deepSpace,
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // 星点粒子
            Canvas { context, size in
                for star in stars {
                    let opacity = animated ? star.opacity * (animateBreath ? 1.0 : 0.5) : star.opacity
                    context.opacity = opacity
                    context.fill(
                        Circle()
                            .path(in: CGRect(x: star.x * size.width,
                                             y: star.y * size.height,
                                             width: star.size,
                                             height: star.size)),
                        with: .color(DesignTokens.Color.starGold)
                    )
                }
            }
            .ignoresSafeArea()
        }
        .onAppear {
            generateStars()
            if animated {
                withAnimation(.easeInOut(duration: 2.5).repeatForever(autoreverses: true)) {
                    animateBreath = true
                }
            }
        }
    }

    private func generateStars() {
        stars = (0..<starCount).map { _ in
            StarParticle(
                x: CGFloat.random(in: 0...1),
                y: CGFloat.random(in: 0...1),
                size: CGFloat.random(in: 1...3),
                opacity: Double.random(in: 0.2...0.8)
            )
        }
    }
}

private struct StarParticle {
    let x: CGFloat
    let y: CGFloat
    let size: CGFloat
    let opacity: Double
}

#Preview {
    StarSpaceBackground()
}

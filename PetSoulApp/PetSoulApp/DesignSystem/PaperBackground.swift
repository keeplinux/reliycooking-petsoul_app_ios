//
//  PaperBackground.swift
//  PetSoul
//
//  宣纸纹理底色 —— 浅色日常场景的默认背景
//  宣纸白渐变 + 极淡墨绿纹理粒子
//  「宣纸上的星空」—— 日常页面温润东方底色
//

import SwiftUI

struct PaperBackground: View {
    /// 纹理粒子数量（极淡，营造纸面质感）
    private let particleCount = 24
    /// 是否显示纹理粒子
    var showTexture: Bool = true

    @State private var particles: [PaperParticle] = []

    var body: some View {
        ZStack {
            // 宣纸渐变底色
            LinearGradient(
                colors: [
                    DesignTokens.Color.paper,
                    DesignTokens.Color.mistSoft,
                    DesignTokens.Color.paper,
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // 极淡墨绿纹理粒子
            if showTexture {
                Canvas { context, size in
                    for p in particles {
                        context.opacity = p.opacity
                        context.fill(
                            Circle()
                                .path(in: CGRect(
                                    x: p.x * size.width,
                                    y: p.y * size.height,
                                    width: p.size,
                                    height: p.size
                                )),
                            with: .color(DesignTokens.Color.sage)
                        )
                    }
                }
                .ignoresSafeArea()
            }
        }
        .onAppear {
            if showTexture { generateParticles() }
        }
    }

    private func generateParticles() {
        particles = (0..<particleCount).map { _ in
            PaperParticle(
                x: CGFloat.random(in: 0...1),
                y: CGFloat.random(in: 0...1),
                size: CGFloat.random(in: 1...2.5),
                opacity: Double.random(in: 0.04...0.10)
            )
        }
    }
}

private struct PaperParticle {
    let x: CGFloat
    let y: CGFloat
    let size: CGFloat
    let opacity: Double
}

#Preview {
    PaperBackground()
}
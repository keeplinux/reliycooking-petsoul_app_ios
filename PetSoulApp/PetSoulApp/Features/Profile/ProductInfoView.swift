//
//  ProductInfoView.swift
//  PetSoul
//
//  产品信息 —— PRD 3.4
//  硅基探针矩阵产品线
//

import SwiftUI

struct ProductInfoView: View {
    private let products: [ProductLine] = [
        ProductLine(name: "饮水舱探针", desc: "虹吸循环 · 静音星流道 · 毛细渗透滤芯", status: "已发售", icon: "drop.fill", available: true),
        ProductLine(name: "喂食器探针", desc: "观食探针 · 定时投喂 · 余量监测", status: "即将上线", icon: "fork.knife", available: false),
        ProductLine(name: "猫砂盆探针", desc: "归航探针 · 如厕观测 · 自动除臭", status: "研发中", icon: "circle.grid.2x2", available: false),
        ProductLine(name: "星轨项圈", desc: "随身探针 · 体征监测 · 星轨定位", status: "规划中", icon: "location.circle.fill", available: false),
    ]

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 头部
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Image(systemName: "cube.box.fill")
                            .font(.system(size: 36))
                            .foregroundStyle(DesignTokens.Color.pine)
                        Text("硅基探针矩阵")
                            .font(DesignTokens.Font.display)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("用硅基探针观测每一颗温暖恒星")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, DesignTokens.Spacing.lg)

                    // 产品列表
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "产品线")
                        ForEach(Array(products.enumerated()), id: \.offset) { idx, product in
                            ProductCard(product: product)
                        }
                    }
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("产品信息")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ProductLine {
    let name: String; let desc: String; let status: String
    let icon: String; let available: Bool
}

private struct ProductCard: View {
    let product: ProductLine
    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(product.available ? DesignTokens.Color.pine.opacity(0.1) : DesignTokens.Color.mistSoft)
                    .frame(width: 44, height: 44)
                Image(systemName: product.icon).font(.system(size: 20))
                    .foregroundStyle(product.available ? DesignTokens.Color.pine : DesignTokens.Color.textMute)
            }
            VStack(alignment: .leading, spacing: 4) {
                Text(product.name).font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.ink)
                Text(product.desc).font(DesignTokens.Font.caption).foregroundStyle(DesignTokens.Color.textMute)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
            Text(product.status)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(product.available ? DesignTokens.Color.pine : DesignTokens.Color.textMute)
                .padding(.horizontal, DesignTokens.Spacing.sm)
                .padding(.vertical, 4)
                .background(Capsule().fill(product.available ? DesignTokens.Color.pine.opacity(0.1) : DesignTokens.Color.mistSoft))
        }
        .padding(.horizontal, DesignTokens.Spacing.md)
        .padding(.vertical, DesignTokens.Spacing.sm)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
    }
}

//
//  ProbeShopView.swift
//  PetSoul
//
//  探针商城 —— PRD 3.2
//  商品列表、详情、购买
//

import SwiftUI

struct ProbeShopView: View {
    private let products: [ShopProduct] = [
        ShopProduct(name: "饮水舱探针", desc: "虹吸循环 · 静音星流道", price: "¥ 399", icon: "drop.fill", status: "已发售"),
        ShopProduct(name: "滤芯套装", desc: "毛细渗透 · 三月一换", price: "¥ 69", icon: "circle.dashed", status: "已发售"),
        ShopProduct(name: "喂食器探针", desc: "观食探针 · 定时投喂", price: "即将上线", icon: "fork.knife", status: "预告"),
        ShopProduct(name: "猫砂盆探针", desc: "归航探针 · 如厕观测", price: "即将上线", icon: "circle.grid.2x2", status: "预告"),
    ]

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())],
                          spacing: DesignTokens.Spacing.md) {
                    ForEach(products) { p in
                        ProbeProductCard(product: p)
                    }
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("探针商城")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct ProbeProductCard: View {
    let product: ShopProduct
    var body: some View {
        VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
            ZStack {
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .fill(DesignTokens.Color.mistSoft)
                Image(systemName: product.icon)
                    .font(.system(size: 32))
                    .foregroundStyle(DesignTokens.Color.pine)
            }
            .frame(height: 100)

            Text(product.name)
                .font(DesignTokens.Font.headline)
                .foregroundStyle(DesignTokens.Color.ink)
            Text(product.desc)
                .font(DesignTokens.Font.caption2)
                .foregroundStyle(DesignTokens.Color.textMute)
            HStack {
                Text(product.price)
                    .font(DesignTokens.Font.body)
                    .fontWeight(.bold)
                    .foregroundStyle(product.price.hasPrefix("¥") ? DesignTokens.Color.cinnabar : DesignTokens.Color.textMute)
                Spacer()
                Text(product.status)
                    .font(DesignTokens.Font.caption2)
                    .foregroundStyle(DesignTokens.Color.pine)
                    .padding(.horizontal, DesignTokens.Spacing.xs)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(DesignTokens.Color.pine.opacity(0.1)))
            }
        }
        .padding(DesignTokens.Spacing.md)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
    }
}

struct ShopProduct: Identifiable {
    let id = UUID()
    let name: String
    let desc: String
    let price: String
    let icon: String
    let status: String
}

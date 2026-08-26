//
//  MessageCenterView.swift
//  PetSoul
//
//  消息中心 —— PRD 3.4
//  分类收件箱 + 免打扰
//

import SwiftUI

struct MessageCenterView: View {
    private let messages: [MockMessage] = [
        MockMessage(type: "观测", title: "今日晨报已生成", time: "08:00", unread: true, icon: "sun.max.fill"),
        MockMessage(type: "设备", title: "饮水舱电量低于 20%", time: "昨天", unread: true, icon: "battery.25"),
        MockMessage(type: "产品", title: "新探针预告：喂食器即将上线", time: "3 天前", unread: false, icon: "sparkles"),
        MockMessage(type: "系统", title: "隐私政策已更新", time: "1 周前", unread: false, icon: "doc.text"),
    ]

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(spacing: DesignTokens.Spacing.lg) {
                    // 免打扰提示
                    HStack(spacing: DesignTokens.Spacing.md) {
                        Image(systemName: "moon.zzz.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(DesignTokens.Color.pine)
                        Text("免打扰模式 22:00 - 08:00")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textSub)
                        Spacer()
                    }
                    .padding(.horizontal, DesignTokens.Spacing.md)
                    .padding(.vertical, DesignTokens.Spacing.sm)
                    .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.md).fill(DesignTokens.Color.mistSoft))

                    // 消息列表
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "收件箱", subtitle: "\(messages.filter { $0.unread }.count) 条未读")
                        ForEach(messages) { msg in
                            MessageRow(message: msg)
                        }
                    }
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("消息中心")
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct MessageRow: View {
    let message: MockMessage
    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(DesignTokens.Color.pine.opacity(0.1)).frame(width: 40, height: 40)
                Image(systemName: message.icon).font(.system(size: 16)).foregroundStyle(DesignTokens.Color.pine)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(message.title).font(DesignTokens.Font.body).foregroundStyle(DesignTokens.Color.ink)
                HStack(spacing: DesignTokens.Spacing.xs) {
                    Text(message.type).font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
                    Text("·").font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textFaint)
                    Text(message.time).font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
                }
            }
            Spacer()
            if message.unread {
                Circle().fill(DesignTokens.Color.cinnabar).frame(width: 8, height: 8)
            }
        }
        .padding(.horizontal, DesignTokens.Spacing.md)
        .padding(.vertical, DesignTokens.Spacing.sm)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
    }
}

struct MockMessage: Identifiable {
    let id = UUID()
    let type: String
    let title: String
    let time: String
    let unread: Bool
    let icon: String
}

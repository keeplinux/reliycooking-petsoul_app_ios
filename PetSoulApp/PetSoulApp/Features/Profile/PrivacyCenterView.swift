//
//  PrivacyCenterView.swift
//  PetSoul
//
//  隐私与数据主权 —— PRD 3.4
//  权限开关 + 导出/删除
//

import SwiftUI

struct PrivacyCenterView: View {
    @State private var cameraOn = true
    @State private var micOn = false
    @State private var locationOn = true
    @State private var showDeleteConfirm = false

    var body: some View {
        ZStack {
            PaperBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: DesignTokens.Spacing.lg) {
                    // 数据主权声明
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        HStack(spacing: DesignTokens.Spacing.sm) {
                            Image(systemName: "shield.lefthalf.filled")
                                .font(.system(size: 20))
                                .foregroundStyle(DesignTokens.Color.pine)
                            Text("数据主权")
                                .font(DesignTokens.Font.headline)
                                .foregroundStyle(DesignTokens.Color.ink)
                        }
                        Text("你的数据归你所有。你可以随时查看、导出或删除所有观测数据。")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textSub)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard()

                    // 权限开关
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "权限管理")
                        VStack(spacing: 0) {
                            Toggle(isOn: $cameraOn) {
                                Label("摄像头", systemImage: "camera.fill")
                            }
                            .tint(DesignTokens.Color.pine)
                            Divider().overlay(DesignTokens.Color.mist)
                            Toggle(isOn: $micOn) {
                                Label("麦克风", systemImage: "mic.fill")
                            }
                            .tint(DesignTokens.Color.pine)
                            Divider().overlay(DesignTokens.Color.mist)
                            Toggle(isOn: $locationOn) {
                                Label("位置", systemImage: "location.fill")
                            }
                            .tint(DesignTokens.Color.pine)
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                    }

                    // 数据控制
                    VStack(spacing: DesignTokens.Spacing.md) {
                        SectionHeader(title: "数据控制")
                        VStack(spacing: 0) {
                            Button {
                                // TODO: 导出数据
                            } label: {
                                MenuRow(icon: "square.and.arrow.up", title: "导出我的数据")
                            }
                            .buttonStyle(.plain)
                            Divider().overlay(DesignTokens.Color.mist)
                            Button {
                                showDeleteConfirm = true
                            } label: {
                                MenuRow(icon: "trash.fill", title: "删除所有数据", showChevron: true)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, DesignTokens.Spacing.md)
                        .padding(.vertical, DesignTokens.Spacing.sm)
                        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                        .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                    }

                    // 危险提示
                    VStack(alignment: .leading, spacing: DesignTokens.Spacing.sm) {
                        HStack(spacing: DesignTokens.Spacing.sm) {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundStyle(DesignTokens.Color.cinnabar)
                            Text("删除不可恢复")
                                .font(DesignTokens.Font.headline)
                                .foregroundStyle(DesignTokens.Color.cinnabar)
                        }
                        Text("删除后，所有观测数据、基线档案和恒星记录将永久消失，无法恢复。")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textSub)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard()
                }
                .padding(.horizontal, DesignTokens.Spacing.lg)
                .padding(.top, DesignTokens.Spacing.md)
                .padding(.bottom, DesignTokens.Spacing.xxl)
            }
        }
        .navigationTitle("隐私与安全")
        .navigationBarTitleDisplayMode(.inline)
        .alert("确认删除所有数据？", isPresented: $showDeleteConfirm) {
            Button("取消", role: .cancel) { }
            Button("确认删除", role: .destructive) { /* TODO: 删除 */ }
        } message: {
            Text("此操作不可恢复，所有观测数据将被永久删除。")
        }
    }
}

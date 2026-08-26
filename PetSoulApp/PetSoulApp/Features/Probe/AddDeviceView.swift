//
//  AddDeviceView.swift
//  PetSoul
//
//  扫码添加探针 —— PRD 3.2
//  扫描探针底部二维码或蓝牙自动发现
//

import SwiftUI

struct AddDeviceView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isScanning = false
    @State private var found = false

    var body: some View {
        NavigationStack {
            ZStack {
                PaperBackground()
                VStack(spacing: DesignTokens.Spacing.xl) {
                    Spacer()

                    // 扫码区
                    ZStack {
                        RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                            .stroke(DesignTokens.Color.pine.opacity(0.4),
                                    style: .init(lineWidth: 2, dash: [8]))
                            .frame(width: 240, height: 240)
                        VStack(spacing: DesignTokens.Spacing.md) {
                            Image(systemName: isScanning ? "qrcode.viewfinder" : "qrcode")
                                .font(.system(size: 64))
                                .foregroundStyle(DesignTokens.Color.pine)
                                .scaleEffect(isScanning ? 1.1 : 1.0)
                                .animation(.easeInOut(duration: 0.8).repeatForever(), value: isScanning)
                            if found {
                                Text("✦ 发现探针：饮水舱")
                                    .font(DesignTokens.Font.headline)
                                    .foregroundStyle(DesignTokens.Color.pine)
                            } else {
                                Text(isScanning ? "扫描中…" : "扫码添加")
                                    .font(DesignTokens.Font.caption)
                                    .foregroundStyle(DesignTokens.Color.textMute)
                            }
                        }
                    }

                    // 说明
                    VStack(spacing: DesignTokens.Spacing.sm) {
                        Text("扫描探针底部二维码")
                            .font(DesignTokens.Font.headline)
                            .foregroundStyle(DesignTokens.Color.ink)
                        Text("或通过蓝牙自动发现附近设备")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textMute)
                    }

                    Spacer()

                    // 蓝牙发现
                    Button {
                        // TODO: BLE 扫描
                    } label: {
                        Label("蓝牙自动发现", systemImage: "antenna.radiowaves.left.and.right")
                            .font(DesignTokens.Font.body)
                            .foregroundStyle(DesignTokens.Color.pine)
                    }
                    .buttonStyle(.plain)

                    // 扫码按钮
                    CapsuleButton(title: found ? "确认添加" : "开始扫码",
                                  icon: "camera.fill", style: .primary) {
                        if !isScanning {
                            isScanning = true
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                isScanning = false
                                found = true
                            }
                        } else {
                            dismiss()
                        }
                    }
                    .padding(.horizontal, DesignTokens.Spacing.lg)
                    .padding(.bottom, DesignTokens.Spacing.xl)
                }
            }
            .navigationTitle("添加新探针")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("取消") { dismiss() }.foregroundStyle(DesignTokens.Color.pine)
                }
            }
        }
    }
}

//
//  ProbeView.swift
//  PetSoul
//
//  📡 智能探针（设备控制中心）
//  PRD 3.2 —— 管理围绕宠物恒星运行的探针设备
//  融合版：宣纸白底 + 玻璃卡片 + 松绿配色
//

import SwiftUI

struct ProbeView: View {
    // MVP Mock 设备
    @State private var devices: [MockDevice] = [
        MockDevice(name: "饮水舱-001", type: .water, isOnline: true, battery: 85),
        MockDevice(name: "喂食器-002", type: .feeder, isOnline: false, battery: 0),
    ]
    @State private var showAddDevice = false

    var body: some View {
        NavigationStack {
            ZStack {
                PaperBackground()

                ScrollView {
                    VStack(spacing: DesignTokens.Spacing.md) {
                        // 商城入口
                        NavigationLink {
                            ProbeShopView()
                        } label: {
                            shopEntry
                        }
                        .buttonStyle(.plain)

                        if devices.isEmpty {
                            emptyState
                        } else {
                            deviceListView
                        }

                        addDeviceButton
                    }
                    .padding(.horizontal, DesignTokens.Spacing.lg)
                    .padding(.top, DesignTokens.Spacing.md)
                }
            }
            .navigationTitle("智能探针")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .foregroundStyle(DesignTokens.Color.pine)
                }
            }
            .sheet(isPresented: $showAddDevice) {
                AddDeviceView()
            }
        }
    }

    private var shopEntry: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            ZStack {
                Circle().fill(DesignTokens.Color.pine.opacity(0.1)).frame(width: 44, height: 44)
                Image(systemName: "bag.fill").foregroundStyle(DesignTokens.Color.pine)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("探针商城").font(DesignTokens.Font.headline).foregroundStyle(DesignTokens.Color.textPrimary)
                Text("饮水舱 · 滤芯 · 新探针预告").font(DesignTokens.Font.caption2).foregroundStyle(DesignTokens.Color.textMute)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(DesignTokens.Color.textFaint)
        }
        .glassCard()
    }

    private var deviceListView: some View {
        VStack(spacing: DesignTokens.Spacing.md) {
            ForEach(devices) { device in
                NavigationLink {
                    ProbeDetailView(deviceName: device.name)
                } label: {
                    DeviceCard(device: device)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private var addDeviceButton: some View {
        Button {
            showAddDevice = true
        } label: {
            Label("添加新探针", systemImage: "plus.circle")
                .font(DesignTokens.Font.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, DesignTokens.Spacing.md)
                .background(DesignTokens.Color.pine.opacity(0.1))
                .foregroundStyle(DesignTokens.Color.pine)
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.md))
        }
    }

    private var emptyState: some View {
        VStack(spacing: DesignTokens.Spacing.md) {
            Image(systemName: "sensor.tag.radiowaves.forward")
                .font(.system(size: 48))
                .foregroundStyle(DesignTokens.Color.pine.opacity(0.5))
            Text("还没有探针设备")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(DesignTokens.Color.textPrimary)
            Text("通过蓝牙添加你的硅宠探针设备")
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.textSub)
        }
        .padding(.vertical, DesignTokens.Spacing.xxl)
    }
}

// MARK: - 设备卡片
struct DeviceCard: View {
    let device: MockDevice

    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            // 设备图标
            ZStack {
                Circle()
                    .fill(DesignTokens.Color.pine.opacity(0.1))
                    .frame(width: 48, height: 48)
                Image(systemName: device.type.icon)
                    .font(.system(size: 22))
                    .foregroundStyle(device.isOnline
                        ? DesignTokens.Color.pine
                        : DesignTokens.Color.textFaint)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(device.name)
                    .font(DesignTokens.Font.headline)
                    .foregroundStyle(DesignTokens.Color.textPrimary)
                HStack(spacing: DesignTokens.Spacing.sm) {
                    statusDot
                    Text(device.isOnline ? "在线" : "离线")
                        .font(DesignTokens.Font.caption)
                        .foregroundStyle(DesignTokens.Color.textSub)
                    if device.isOnline {
                        Image(systemName: "battery.100")
                            .font(.caption)
                            .foregroundStyle(DesignTokens.Color.textSub)
                        Text("\(device.battery)%")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.textSub)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(DesignTokens.Color.textFaint)
        }
        .glassCard()
    }

    private var statusDot: some View {
        Circle()
            .fill(device.isOnline ? DesignTokens.Color.pine : DesignTokens.Color.textFaint)
            .frame(width: 8, height: 8)
    }
}

// MARK: - Mock 数据
struct MockDevice: Identifiable {
    let id = UUID()
    let name: String
    let type: DeviceType
    let isOnline: Bool
    let battery: Int

    enum DeviceType {
        case water, feeder, litter

        var icon: String {
            switch self {
            case .water: return "drop.fill"
            case .feeder: return "fork.knife"
            case .litter: return "circle.grid.2x2"
            }
        }

        var label: String {
            switch self {
            case .water: return "饮水舱"
            case .feeder: return "喂食器"
            case .litter: return "猫砂盆"
            }
        }
    }
}

#Preview {
    ProbeView()
        .environmentObject(AppState())
}

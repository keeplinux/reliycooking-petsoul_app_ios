//
//  ProbeView.swift
//  PetSoul
//
//  📡 智能探针（设备控制中心）
//  PRD 3.2 —— 管理围绕宠物恒星运行的探针设备
//  MVP 阶段：设备列表占位 + 配网引导
//

import SwiftUI

struct ProbeView: View {
    // MVP Mock 设备
    @State private var devices: [MockDevice] = [
        MockDevice(name: "饮水舱-001", type: .water, isOnline: true, battery: 85),
        MockDevice(name: "喂食器-002", type: .feeder, isOnline: false, battery: 0),
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                StarSpaceBackground()

                ScrollView {
                    VStack(spacing: DesignTokens.Spacing.md) {
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
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Image(systemName: "antenna.radiowaves.left.and.right")
                        .foregroundStyle(DesignTokens.Color.starGold)
                }
            }
        }
    }

    private var deviceListView: some View {
        VStack(spacing: DesignTokens.Spacing.md) {
            ForEach(devices) { device in
                DeviceCard(device: device)
            }
        }
    }

    private var addDeviceButton: some View {
        Button {
            // TODO: 设备配网流程（BLE）
        } label: {
            Label("添加新探针", systemImage: "plus.circle")
                .font(DesignTokens.Font.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, DesignTokens.Spacing.md)
                .background(DesignTokens.Color.starGold.opacity(0.15))
                .foregroundStyle(DesignTokens.Color.starGold)
                .clipShape(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg))
                .overlay(
                    RoundedRectangle(cornerRadius: DesignTokens.Radius.lg)
                        .stroke(DesignTokens.Color.starGold.opacity(0.4), style: .init(lineWidth: 1, dash: [5]))
                )
        }
    }

    private var emptyState: some View {
        VStack(spacing: DesignTokens.Spacing.md) {
            Image(systemName: "sensor.tag.radiowaves.forward")
                .font(.system(size: 48))
                .foregroundStyle(DesignTokens.Color.starGold.opacity(0.5))
            Text("还没有探针设备")
                .font(DesignTokens.Font.headline)
                .foregroundStyle(.white)
            Text("通过蓝牙添加你的硅宠探针设备")
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight)
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
                    .fill(DesignTokens.Color.siliconBlue.opacity(0.5))
                    .frame(width: 48, height: 48)
                Image(systemName: device.type.icon)
                    .font(.system(size: 22))
                    .foregroundStyle(device.isOnline
                        ? DesignTokens.Color.starGold
                        : DesignTokens.Color.siliconBlueLight.opacity(0.4))
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(device.name)
                    .font(DesignTokens.Font.headline)
                    .foregroundStyle(.white)
                HStack(spacing: DesignTokens.Spacing.sm) {
                    statusDot
                    Text(device.isOnline ? "在线" : "离线")
                        .font(DesignTokens.Font.caption)
                        .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                    if device.isOnline {
                        Image(systemName: "battery.100")
                            .font(.caption)
                            .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                        Text("\(device.battery)%")
                            .font(DesignTokens.Font.caption)
                            .foregroundStyle(DesignTokens.Color.siliconBlueLight)
                    }
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(DesignTokens.Color.siliconBlueLight.opacity(0.5))
        }
        .deepSpaceCard()
    }

    private var statusDot: some View {
        Circle()
            .fill(device.isOnline ? DesignTokens.Color.normalGreen : DesignTokens.Color.siliconBlueLight.opacity(0.3))
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

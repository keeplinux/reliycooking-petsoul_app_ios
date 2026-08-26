//
//  AddPetView.swift
//  PetSoul
//
//  添加宠物 —— PRD 3.1.0
//  照片 / 视频 / 硬件三种生成方式 → 填写生命档案 → 生成专属恒星
//

import SwiftUI

struct AddPetView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedMethod: GenerationMethod = .photo
    @State private var name = ""
    @State private var species = "猫"
    @State private var breed = ""
    @State private var birthDate = Date()
    @State private var gender = "雌"
    @State private var isNeutered = false

    private let speciesOptions = ["猫", "狗"]
    private let genderOptions = ["雌", "雄"]

    var body: some View {
        NavigationStack {
            ZStack {
                PaperBackground()
                ScrollView {
                    VStack(spacing: DesignTokens.Spacing.lg) {
                        // 生成方式选择
                        VStack(spacing: DesignTokens.Spacing.sm) {
                            SectionHeader(title: "选择生成方式")
                            HStack(spacing: DesignTokens.Spacing.sm) {
                                ForEach(GenerationMethod.allCases) { method in
                                    MethodChip(method: method, isSelected: selectedMethod == method) {
                                        withAnimation(.easeInOut(duration: 0.2)) { selectedMethod = method }
                                    }
                                }
                            }
                        }
                        MethodHintCard(method: selectedMethod)

                        // 生命档案表单
                        VStack(spacing: DesignTokens.Spacing.md) {
                            SectionHeader(title: "生命档案")
                            VStack(spacing: 0) {
                                FormRow(label: "宠物名字") {
                                    TextField("给它起个名字", text: $name)
                                        .font(DesignTokens.Font.body)
                                        .foregroundStyle(DesignTokens.Color.textPrimary)
                                        .multilineTextAlignment(.trailing)
                                }
                                Divider().overlay(DesignTokens.Color.mist)
                                FormRow(label: "种类") {
                                    Picker("", selection: $species) {
                                        ForEach(speciesOptions, id: \.self) { Text($0).tag($0) }
                                    }
                                    .pickerStyle(.segmented).frame(width: 120)
                                }
                                Divider().overlay(DesignTokens.Color.mist)
                                FormRow(label: "品种") {
                                    TextField("如：英国短毛猫", text: $breed)
                                        .font(DesignTokens.Font.body)
                                        .foregroundStyle(DesignTokens.Color.textPrimary)
                                        .multilineTextAlignment(.trailing)
                                }
                                Divider().overlay(DesignTokens.Color.mist)
                                FormRow(label: "出生日期") {
                                    DatePicker("", selection: $birthDate, displayedComponents: .date)
                                        .labelsHidden()
                                        .environment(\.locale, Locale(identifier: "zh_CN"))
                                }
                                Divider().overlay(DesignTokens.Color.mist)
                                FormRow(label: "性别") {
                                    Picker("", selection: $gender) {
                                        ForEach(genderOptions, id: \.self) { Text($0).tag($0) }
                                    }
                                    .pickerStyle(.segmented).frame(width: 120)
                                }
                                Divider().overlay(DesignTokens.Color.mist)
                                FormRow(label: "已绝育") {
                                    Toggle("", isOn: $isNeutered).labelsHidden().tint(DesignTokens.Color.pine)
                                }
                            }
                            .padding(.horizontal, DesignTokens.Spacing.md)
                            .padding(.vertical, DesignTokens.Spacing.sm)
                            .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).fill(DesignTokens.Color.surface))
                            .overlay(RoundedRectangle(cornerRadius: DesignTokens.Radius.lg).stroke(DesignTokens.Color.border, lineWidth: 1))
                        }

                        CapsuleButton(title: "生成我的恒星", icon: "sparkles", style: .primary) { dismiss() }
                            .padding(.top, DesignTokens.Spacing.sm)
                    }
                    .padding(.horizontal, DesignTokens.Spacing.lg)
                    .padding(.top, DesignTokens.Spacing.md)
                    .padding(.bottom, DesignTokens.Spacing.xxl)
                }
            }
            .navigationTitle("添加宠物")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("取消") { dismiss() }.foregroundStyle(DesignTokens.Color.pine)
                }
            }
        }
    }
}

// MARK: - 生成方式

enum GenerationMethod: String, CaseIterable, Identifiable {
    case photo   = "照片"
    case video   = "视频"
    case hardware = "硬件"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .photo:    return "photo.fill"
        case .video:    return "video.fill"
        case .hardware: return "cpu"
        }
    }

    var hint: String {
        switch self {
        case .photo:    return "上传一张宠物照片，AI 将生成它的数字孪生恒星"
        case .video:    return "上传一段短视频，捕捉更生动的生命特征"
        case .hardware: return "绑定智能探针，实时采集饮水、活动数据生成恒星"
        }
    }
}

// MARK: - 方法选择芯片

private struct MethodChip: View {
    let method: GenerationMethod
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: DesignTokens.Spacing.xs) {
                Image(systemName: method.icon)
                    .font(.system(size: 20))
                Text(method.rawValue)
                    .font(DesignTokens.Font.caption)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, DesignTokens.Spacing.sm)
            .background(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .fill(isSelected ? DesignTokens.Color.pine.opacity(0.12) : DesignTokens.Color.surface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: DesignTokens.Radius.md)
                    .stroke(isSelected ? DesignTokens.Color.pine : DesignTokens.Color.border, lineWidth: isSelected ? 1.5 : 1)
            )
            .foregroundStyle(isSelected ? DesignTokens.Color.pine : DesignTokens.Color.textSub)
        }
    }
}

// MARK: - 方法提示卡片

private struct MethodHintCard: View {
    let method: GenerationMethod

    var body: some View {
        HStack(spacing: DesignTokens.Spacing.md) {
            Image(systemName: "lightbulb.fill")
                .font(.system(size: 16))
                .foregroundStyle(DesignTokens.Color.cinnabar)
            Text(method.hint)
                .font(DesignTokens.Font.caption)
                .foregroundStyle(DesignTokens.Color.textSub)
                .fixedSize(horizontal: false, vertical: true)
            Spacer()
        }
        .padding(.horizontal, DesignTokens.Spacing.md)
        .padding(.vertical, DesignTokens.Spacing.sm)
        .background(RoundedRectangle(cornerRadius: DesignTokens.Radius.md).fill(DesignTokens.Color.mistSoft))
    }
}

// MARK: - 表单行

struct FormRow<Content: View>: View {
    let label: String
    @ViewBuilder let content: Content

    var body: some View {
        HStack {
            Text(label)
                .font(DesignTokens.Font.body)
                .foregroundStyle(DesignTokens.Color.textSub)
            Spacer()
            content
        }
        .padding(.vertical, DesignTokens.Spacing.sm)
    }
}

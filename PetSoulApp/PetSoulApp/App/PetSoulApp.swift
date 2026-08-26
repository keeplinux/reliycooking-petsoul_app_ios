//
//  PetSoulApp.swift
//  PetSoul
//
//  硅宠场域 PetSoul · 宠物智能家居APP
//  Created by SiliField on 2026/8/26.
//

import SwiftUI

@main
struct PetSoulApp: App {
    // 全局状态：是否已度过启动页
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(.dark) // 宇宙叙事深空底色
        }
    }
}

// MARK: - 全局应用状态
/// 管理启动流程与全局状态（iOS 16 兼容，用 ObservableObject）
final class AppState: ObservableObject {
    /// 是否已完成启动页展示
    @Published var hasLaunched: Bool = false

    /// 当前选中的 Tab
    @Published var selectedTab: Tab = .home

    enum Tab: Int {
        case home, probe, health, profile
    }
}

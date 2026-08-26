//
//  RootTabView.swift
//  PetSoul
//
//  四大底部 Tab：宇宙首页 / 智能探针 / 健康管理 / 家长中心
//

import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            HomeView()
                .tabItem {
                    Label("宇宙", systemImage: "globe")
                }
                .tag(AppState.Tab.home)

            ProbeView()
                .tabItem {
                    Label("探针", systemImage: "sensor.tag.radiowaves.forward")
                }
                .tag(AppState.Tab.probe)

            HealthView()
                .tabItem {
                    Label("健康", systemImage: "heart.text.square")
                }
                .tag(AppState.Tab.health)

            ProfileView()
                .tabItem {
                    Label("家长", systemImage: "person.crop.circle")
                }
                .tag(AppState.Tab.profile)
        }
        // 宇宙叙事深空底色
        .tint(DesignTokens.Color.starGold)
    }
}

#Preview {
    RootTabView()
        .environmentObject(AppState())
}

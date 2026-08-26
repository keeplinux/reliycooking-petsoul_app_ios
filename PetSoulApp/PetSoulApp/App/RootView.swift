//
//  RootView.swift
//  PetSoul
//
//  根视图：启动页 → 主界面（四大 Tab）
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.hasLaunched {
                RootTabView()
                    .transition(.opacity)
            } else {
                LaunchView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: appState.hasLaunched)
    }
}

#Preview {
    RootView()
        .environmentObject(AppState())
}

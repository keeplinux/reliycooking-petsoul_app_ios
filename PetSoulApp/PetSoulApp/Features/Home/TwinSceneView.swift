//
//  TwinSceneView.swift
//  PetSoul
//
//  3D 数字孪生场景（SceneKit）
//  PRD 3.1.1 —— 首页主体位置展示 3D 宠物数字孪生形象
//  MVP 阶段：用占位球体+轨道环，后续替换为真实 .usdz 模型
//

import SwiftUI
import SceneKit

struct TwinSceneView: View {
    var body: some View {
        SceneView(
            scene: makeScene(),
            options: [.allowsCameraControl, .autoenablesDefaultLighting]
        )
        .background(Color.clear)
    }

    private func makeScene() -> SCNScene {
        let scene = SCNScene()

        // 占位：发光球体代表宠物恒星
        let sphere = SCNSphere(radius: 1.2)
        sphere.firstMaterial?.diffuse.contents = UIColor(
            red: 0.96, green: 0.79, blue: 0.48, alpha: 1.0
        )
        sphere.firstMaterial?.emission.contents = UIColor(
            red: 0.96, green: 0.65, blue: 0.30, alpha: 0.6
        )
        let sphereNode = SCNNode(geometry: sphere)
        scene.rootNode.addChildNode(sphereNode)

        // 探针轨道环
        for i in 0..<3 {
            let ring = SCNTorus(
                ringRadius: CGFloat(2.0 + Double(i) * 0.5),
                pipeRadius: 0.02
            )
            ring.firstMaterial?.diffuse.contents = UIColor(
                red: 0.96, green: 0.79, blue: 0.48, alpha: 0.4
            )
            let ringNode = SCNNode(geometry: ring)
            ringNode.eulerAngles = SCNVector3(
                Float.random(in: 0.3...0.6),
                Float.random(in: 0...Float.pi),
                0
            )
            scene.rootNode.addChildNode(ringNode)
        }

        // 慢速旋转动画
        let rotation = SCNAction.rotateBy(
            x: 0, y: CGFloat(Float.pi * 2), z: 0, duration: 20
        )
        sphereNode.runAction(SCNAction.repeatForever(rotation))

        return scene
    }
}

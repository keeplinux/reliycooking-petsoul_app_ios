import XCTest
import UIKit

final class ParityUITests: XCTestCase {
    func testSharedAppNavigationAndPersistence() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.pawlink.petwater")
        app.launch()
        let login = app.buttons["登录"]
        if login.waitForExistence(timeout: 15) {
            XCTAssertTrue(login.isEnabled)
            login.tap()
        }
        XCTAssertTrue(app.buttons["母舰·我的"].waitForExistence(timeout: 15))
        snapshot("01-home")
        app.buttons["母舰·我的"].tap()
        XCTAssertTrue(app.staticTexts["设置"].waitForExistence(timeout: 5))
        snapshot("02-settings")
        app.buttons["返回"].tap()
        app.buttons["探针·产品"].tap()
        XCTAssertTrue(app.buttons.matching(identifier: "下一个型号").firstMatch.waitForExistence(timeout: 5))
        snapshot("03-mall")
        app.buttons.matching(identifier: "下一个型号").firstMatch.tap()
        snapshot("04-next-product")
        app.buttons["返回"].tap()
        app.buttons["添加设备"].tap()
        XCTAssertTrue(app.staticTexts["扫码配网"].waitForExistence(timeout: 5))
        snapshot("05-scan")
        app.buttons["返回"].tap()
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["母舰·我的"].waitForExistence(timeout: 10), "登录状态应在重启后保留")
        snapshot("06-relaunch")
    }

    func testPetNameKeyboardDoesNotZoom() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "com.pawlink.petwater")
        app.launch()
        if app.buttons["登录"].waitForExistence(timeout: 5) { app.buttons["登录"].tap() }
        XCTAssertTrue(app.buttons["母舰·我的"].waitForExistence(timeout: 15))
        snapshot("keyboard-home")
        app.buttons["添加宠物"].tap()
        let name = app.textFields["比如：咪咪"]
        XCTAssertTrue(name.waitForExistence(timeout: 8))
        for _ in 0..<3 where !name.isHittable { app.swipeUp() }
        XCTAssertTrue(app.staticTexts["草稿已保存在本机"].waitForExistence(timeout: 10))
        let existing = name.value as? String ?? ""
        let originalName = existing == "比如：咪咪" ? "" : existing
        let originalWidth = name.frame.width
        XCTAssertGreaterThan(originalWidth, 0)
        for round in 1...2 {
            name.tap()
            XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
            for _ in 0..<2 where name.frame.maxY > app.keyboards.firstMatch.frame.minY {
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.4)).press(forDuration: 0.05,
                    thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.15)))
            }
            snapshot("keyboard-before-typing-\(round)")
            name.tap()
            app.typeText("Nuomi")
            XCTAssertEqual(name.frame.width, originalWidth, accuracy: 2, "输入不能触发页面放大")
            XCTAssertGreaterThanOrEqual(name.frame.minX, -1)
            XCTAssertLessThanOrEqual(name.frame.maxX, app.frame.width + 1)
            snapshot("keyboard-visible-\(round)")
            // Restore the owner's draft before leaving the form.
            let currentName = name.value as? String ?? ""
            name.tap()
            if !currentName.isEmpty { app.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: currentName.count)) }
            if !originalName.isEmpty { app.typeText(originalName) }
            let done = app.keyboards.buttons.matching(NSPredicate(format: "label IN %@", ["Done", "done", "完成", "Return", "return"])).firstMatch
            XCTAssertTrue(done.waitForExistence(timeout: 5))
            done.tap()
            XCTAssertTrue(app.keyboards.firstMatch.waitForNonExistence(timeout: 5))
            XCTAssertEqual(name.frame.width, originalWidth, accuracy: 2)
            snapshot("keyboard-dismissed-\(round)")
        }
        let submit = app.buttons["保存并生成示例形象"]
        for _ in 0..<3 where submit.frame.maxY > app.frame.maxY { app.swipeUp() }
        XCTAssertGreaterThan(submit.frame.height, 0)
        XCTAssertGreaterThanOrEqual(submit.frame.minY, 0)
        XCTAssertLessThanOrEqual(submit.frame.maxY, app.frame.maxY, "关闭键盘后提交按钮必须能正常滚动到达")
        XCTAssertLessThanOrEqual(submit.frame.maxX, app.frame.width + 1)
        app.buttons["返回"].tap()
    }

    // The 3D cat moves and the owner can rotate the planet; a fixed tap misses it.
    private func tapDefaultCat(in app: XCUIApplication) throws {
        let image = XCUIScreen.main.screenshot().image.cgImage!
        let width = image.width, height = image.height
        var bytes = [UInt8](repeating: 0, count: width * height * 4)
        bytes.withUnsafeMutableBytes { data in
            let context = CGContext(data: data.baseAddress, width: width, height: height,
                bitsPerComponent: 8, bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue)!
            context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))
        }
        var sumX = 0, sumY = 0, count = 0
        for y in stride(from: height / 8, to: height * 4 / 5, by: 3) {
            for x in stride(from: 0, to: width, by: 3) {
                let i = (y * width + x) * 4
                let r = Int(bytes[i]), g = Int(bytes[i + 1]), b = Int(bytes[i + 2])
                if r > 65 && g > 30 && r * 10 > g * 13 && g * 10 > b * 13 {
                    sumX += x; sumY += y; count += 1
                }
            }
        }
        guard count > 20 else { throw XCTSkip("Default cat is not visible; open the pet capture screen manually") }
        app.coordinate(withNormalizedOffset: CGVector(dx: Double(sumX) / Double(count * width),
            dy: Double(sumY) / Double(count * height))).tap()
    }

    private func snapshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

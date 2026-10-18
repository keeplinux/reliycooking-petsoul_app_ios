import XCTest

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
        XCTAssertTrue(app.buttons["母舰"].waitForExistence(timeout: 15))
        snapshot("01-home")
        app.buttons["母舰"].tap()
        XCTAssertTrue(app.staticTexts["设置"].waitForExistence(timeout: 5))
        snapshot("02-settings")
        app.buttons["返回"].tap()
        app.buttons["探针"].tap()
        XCTAssertTrue(app.buttons.matching(identifier: "下一个型号").firstMatch.waitForExistence(timeout: 5))
        snapshot("03-mall")
        app.buttons.matching(identifier: "下一个型号").firstMatch.tap()
        snapshot("04-next-product")
        app.buttons["返回"].tap()
        app.buttons["扫码"].tap()
        XCTAssertTrue(app.staticTexts["扫码配网"].waitForExistence(timeout: 5))
        snapshot("05-scan")
        app.buttons["返回"].tap()
        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["母舰"].waitForExistence(timeout: 10), "登录状态应在重启后保留")
        snapshot("06-relaunch")
    }

    private func snapshot(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}

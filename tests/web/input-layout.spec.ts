import { expect, test } from '@playwright/test'

for (const width of [320, 375, 390, 430]) {
  test(`宠物名字输入和键盘高度变化后布局保持在 ${width}px 屏幕内`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('http://127.0.0.1:4173/tests/fixtures/pet-capture.html')
    const name = page.getByPlaceholder('比如：咪咪')
    await name.scrollIntoViewIfNeeded()
    await name.fill('糯米123')
    await expect(name).toHaveValue('糯米123')
    await name.press('Enter')
    await expect(name).not.toBeFocused()
    const birthday = page.locator('input[type=date]')
    const dateBounds = await birthday.boundingBox()
    expect(dateBounds!.x + dateBounds!.width).toBeLessThanOrEqual(width + 1)
    expect(await name.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
    for (const height of [420, 844, 420, 844]) {
      await page.setViewportSize({ width, height })
      await name.focus()
      const submit = page.getByRole('button', { name: '保存并生成示例形象' })
      await submit.scrollIntoViewIfNeeded()
      await expect(submit).toBeInViewport()
      const bounds = await submit.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        scrollX: window.scrollX, scrollY: window.scrollY,
        scale: window.visualViewport?.scale ?? 1,
      }))
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width)
      expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.width)
      expect(dimensions.scrollX).toBe(0)
      expect(dimensions.scrollY).toBe(0)
      expect(dimensions.scale).toBe(1)
    }
    await page.getByRole('button', { name: '妹妹' }).click()
    await expect(name).toHaveValue('糯米123')
  })
}

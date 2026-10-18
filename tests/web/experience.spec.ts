import { expect, test } from '@playwright/test'
import { resolve } from 'node:path'

const owner = { id: 'phone:13800138000', method: 'phone', identifier: '13800138000', avatarId: 'moon' }
const pet = { id: 'pet-legacy', name: '老朋友', birthday: '2022-01-02', gender: 'female', breed: '中华田园猫', media: null, model: { color: '#e08a4e', scale: 1, pattern: 'solid' } }
const device = { id: 'water-legacy', kind: 'water', productId: 'smart-water', name: '饮水舱', sn: 'LEGACY001', mac: 'A4:C1:38:2B:71:0C', wifiSsid: 'demo', source: 'scan', status: 'bound', boundAt: 1, online: true }

async function seed(page: import('@playwright/test').Page) {
  await page.addInitScript(({ owner, pet, device }) => {
    if (localStorage.getItem('review-seeded')) return
    localStorage.setItem('review-seeded', 'yes')
    localStorage.setItem('pet-smart-app:account', JSON.stringify(owner))
    localStorage.setItem('pet-smart-app:pets', JSON.stringify([pet]))
    localStorage.setItem('pet-smart-app:devices-v3', JSON.stringify([device]))
  }, { owner, pet, device })
  await page.goto('http://127.0.0.1:4173/')
  await expect(page.getByRole('button', { name: '我的宠物（1）' })).toBeVisible()
}
async function openPet(page: import('@playwright/test').Page, name = '老朋友') {
  await page.getByRole('button', { name: /我的宠物（/ }).click()
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}
async function signIn(page: import('@playwright/test').Page, phone: string) {
  await expect(page.getByText('正在准备演示账号')).not.toBeVisible()
  await page.getByLabel('手机号', { exact: true }).fill(phone)
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page.getByRole('button', { name: '母舰·我的' })).toBeVisible()
}

test('旧档案迁移、退出重登和不同账号隔离', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: '母舰·我的' }).click()
  await page.getByRole('button', { name: '退出登录' }).click()
  await signIn(page, '13900139000')
  await expect(page.getByRole('button', { name: '我的宠物（0）' })).toBeVisible()
  await page.getByRole('button', { name: '母舰·我的' }).click()
  await expect(page.getByText('LEGACY001')).toHaveCount(0)
  await page.getByRole('button', { name: '退出登录' }).click()
  await signIn(page, '13800138000')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('pet-smart-app:account')!).avatarId)).toBe('moon')
  await openPet(page)
  await page.reload()
  await openPet(page)
})

test('通知偏好和设备开关返回、重启后保持，版本没有虚假更新', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: '母舰·我的' }).click()
  await page.getByRole('switch', { name: '消息通知偏好' }).click()
  await page.getByRole('button', { name: '返回', exact: true }).click()
  await page.getByRole('button', { name: '母舰·我的' }).click()
  await expect(page.getByRole('switch', { name: '消息通知偏好' })).not.toBeChecked()
  await expect(page.getByRole('button', { name: /点击更新/ })).toHaveCount(0)
  await page.getByRole('button', { name: '查看设备 饮水舱' }).click()
  await page.getByRole('switch', { name: '流动水', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: /我的设备（/ }).click()
  await page.getByRole('button', { name: /饮水舱.*LEGACY001/ }).click()
  await expect(page.getByRole('switch', { name: '流动水', exact: true })).not.toBeChecked()
  await page.getByRole('button', { name: '返回', exact: true }).click()
  await page.getByRole('button', { name: '母舰·我的' }).click()
  await expect(page.getByRole('switch', { name: '消息通知偏好' })).not.toBeChecked()
})

test('四视图草稿跨返回及重启恢复，建档、编辑、取消删除与确认删除', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: '添加宠物', exact: true }).click()
  await page.getByText('草稿已保存在本机').waitFor()
  await page.getByLabel('宠物名字', { exact: true }).fill('新伙伴')
  const labels = ['正视图', '左侧视图', '后背视图', '右侧视图']
  for (const label of labels) {
    await page.getByRole('button', { name: `采集${label}`, exact: true }).click()
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: '从相册选择', exact: true }).click()
    await (await chooser).setFiles(resolve('public/clips/clip-nuomi-day.jpg'))
    await expect(page.getByRole('button', { name: `采集${label}`, exact: true })).toHaveCount(0)
  }
  await expect(page.getByText('4 / 4 · 已采集完成')).toBeVisible()
  await page.getByRole('button', { name: '返回', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: '添加宠物', exact: true }).click()
  await expect(page.getByLabel('宠物名字', { exact: true })).toHaveValue('新伙伴')
  await expect(page.getByText('4 / 4 · 已采集完成')).toBeVisible()
  await page.getByRole('button', { name: '保存并生成示例形象', exact: true }).click()
  await expect(page.getByRole('heading', { name: '宠物档案已保存', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '查看宠物档案' }).click()
  await page.getByRole('button', { name: '编辑资料', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '编辑宠物资料' })
  await dialog.getByLabel('宠物名字', { exact: true }).fill('糯米')
  await dialog.getByLabel('品种（可选）').fill('橘猫')
  await dialog.getByRole('button', { name: '保存资料', exact: true }).click()
  await expect(page.getByRole('heading', { name: '糯米', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '删除宠物档案', exact: true }).click()
  await page.getByRole('button', { name: '保留档案' }).click()
  await expect(page.getByRole('heading', { name: '糯米', exact: true })).toBeVisible()
  await page.reload()
  await openPet(page, '糯米')
  await page.getByRole('button', { name: '删除宠物档案', exact: true }).click()
  await page.getByRole('button', { name: '确认删除档案' }).click()
  await expect(page.getByRole('button', { name: '我的宠物（1）' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: '我的宠物（1）' })).toBeVisible()
})

test('图表单位、明细和全部隐藏的空态可用', async ({ page }) => {
  await seed(page)
  await page.getByRole('button', { name: /我的设备（/ }).click()
  await page.getByRole('button', { name: /饮水舱.*LEGACY001/ }).click()
  await expect(page.getByText(/示例数据.*单位 ml/)).toBeVisible()
  await page.getByRole('button', { name: '月', exact: true }).click()
  await expect(page.getByRole('heading', { name: '本月饮水量' })).toBeVisible()
  const length = await page.getByLabel('查看饮水时段').locator('option').count()
  expect(length).toBe(new Date().getDate())
  await page.getByRole('button', { name: /老朋友.*L/ }).click()
  await expect(page.getByText('已隐藏全部宠物，点击下方名字重新显示。')).toBeVisible()
  await page.getByRole('button', { name: /老朋友.*L/ }).click()
  await expect(page.getByRole('img', { name: '月期饮水量条形图' })).toBeVisible()
})

test('媒体存储失败显示错误，不误报建档成功', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('simulate-quota', 'yes')
    const original = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (sessionStorage.getItem('simulate-quota') === 'yes' && String(args[1]).startsWith('draft:')) throw new DOMException('Quota exceeded', 'QuotaExceededError')
      return original.apply(this, args)
    }
  })
  await seed(page)
  await page.getByRole('button', { name: '添加宠物', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('草稿保存失败')
  await expect(page.getByRole('heading', { name: '宠物档案已保存' })).toHaveCount(0)
  await page.evaluate(() => sessionStorage.removeItem('simulate-quota'))
  await page.getByRole('button', { name: '重试保存草稿', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByText('草稿已保存在本机')).toBeVisible()
})

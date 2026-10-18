import { test, expect } from '@playwright/test'
import QRCode from 'qrcode'
import { resolve } from 'node:path'

const owner = { id: 'phone:13800138000', method: 'phone', identifier: '13800138000', avatarId: 'moon' }
const pet = { id: 'pet-existing', name: '原有宠物', birthday: '', gender: 'male', breed: '待填写', media: null, model: { color: '#e08a4e', scale: 1, pattern: 'solid' } }
async function seed(page: import('@playwright/test').Page) {
  await page.addInitScript(({ owner, pet }) => {
    if (localStorage.getItem('seeded')) return
    localStorage.setItem('seeded','1')
    localStorage.setItem('pet-smart-app:account',JSON.stringify(owner))
    localStorage.setItem('pet-smart-app:pets',JSON.stringify([pet]))
  }, {owner,pet})
  await page.goto('http://127.0.0.1:4173/')
}
async function login(page: import('@playwright/test').Page, value: string) {
  await expect(page.getByText('正在自动检索账号')).not.toBeVisible()
  await page.getByLabel('手机号', {exact:true}).fill(value)
  await page.getByRole('button',{name:'登录',exact:true}).click()
}
test('保持简约首页；退出重登保留资料，不同账号隔离；通知偏好持久化',async({page})=>{
  await seed(page)
  await expect(page.getByRole('button',{name:'母舰',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:/我的宠物/})).toHaveCount(0)
  await page.getByRole('button',{name:'母舰',exact:true}).click()
  await expect(page.getByText('已录入宠物：1 只')).toBeVisible()
  await page.getByRole('switch',{name:'消息通知',exact:true}).click()
  await page.getByRole('button',{name:'退出登录',exact:true}).click()
  await login(page,'13900139000')
  await page.getByRole('button',{name:'母舰',exact:true}).click()
  await expect(page.getByText('未录入宠物数字形象')).toBeVisible()
  await page.getByRole('button',{name:'退出登录',exact:true}).click()
  await login(page,'13800138000')
  await page.reload()
  await page.getByRole('button',{name:'母舰',exact:true}).click()
  await expect(page.getByText('已录入宠物：1 只')).toBeVisible()
  await expect(page.getByRole('switch',{name:'消息通知',exact:true})).not.toBeChecked()
  await expect(page.getByRole('button',{name:/点击更新/})).toHaveCount(0)
})
test('相册真实解码设备二维码；浏览器无蓝牙时明确失败，不假绑定',async({page},info)=>{
  await seed(page)
  const path=info.outputPath('device-test.png')
  await QRCode.toFile(path,JSON.stringify({v:1,p:'smart-water',sn:'TEST0001',key:'ab'.repeat(32)}),{width:800})
  await page.getByRole('button',{name:'扫码',exact:true}).click()
  await page.locator('input[type=file]').setInputFiles(path)
  await expect(page.getByText('请在 iPhone 或安卓 App 中使用蓝牙连接')).toBeVisible()
  await expect(page.getByRole('heading',{name:'配网并绑定成功'})).toHaveCount(0)
  await expect(page.getByPlaceholder('请输入 WiFi 名称')).toHaveCount(0)
})
test('非二维码图片不能生成随机设备，界面保持原样',async({page})=>{
  await seed(page)
  await page.getByRole('button',{name:'扫码',exact:true}).click()
  await page.locator('input[type=file]').setInputFiles(resolve('public/clips/clip-nuomi-day.jpg'))
  await expect(page.getByRole('alert')).toContainText('图片中没有可识别的二维码')
  await expect(page.getByRole('heading',{name:'WiFi 配网'})).toHaveCount(0)
})

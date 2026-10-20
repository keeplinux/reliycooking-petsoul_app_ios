import { expect, test } from '@playwright/test'
import { createHarmonyTransport } from '../../src/platform/harmony'

function fixture(handler: (request: { id: number; method: string; params: string }, send: (detail: object) => void) => void, acknowledgement = 'accepted') {
  const host = new EventTarget()
  const send = (detail: object) => host.dispatchEvent(new CustomEvent('silifield:native', { detail }))
  const requests: { id: number; method: string; params: string }[] = []
  const bridge = createHarmonyTransport({ invoke: raw => {
    const request = JSON.parse(raw)
    requests.push(request)
    queueMicrotask(() => handler(request, send))
    return acknowledgement
  } }, host as Window)
  return { ...bridge, send, requests }
}

test('鸿蒙桥保持二进制视图边界和通知字节，设备断开后停止回调', async () => {
  const bridge = fixture((request, send) => send({ id: request.id, result: request.method === 'ble.read' ? '[0,128,255]' : 'null' }))
  const bytes: number[][] = []
  const disconnects: string[] = []
  await bridge.ble.connect('device', id => disconnects.push(id))
  await bridge.ble.startNotifications('device', 'service', 'status', value => bytes.push(Array.from(new Uint8Array(value.buffer))))
  bridge.send({ event: 'notification', deviceId: 'device', service: 'service', characteristic: 'status', bytes: [0,128,255] })
  bridge.send({ event: 'notification', deviceId: 'other', service: 'service', characteristic: 'status', bytes: [1] })
  bridge.send({ event: 'notification', deviceId: 'device', service: 'service', characteristic: 'status', bytes: [256] })
  expect(bytes).toEqual([[0,128,255]])
  const source = Uint8Array.from([99,1,2,3,88])
  await bridge.ble.write('device', 'service', 'config', new DataView(source.buffer, 1, 3))
  expect(JSON.parse(bridge.requests.at(-1)!.params).bytes).toEqual([1,2,3])
  expect(Array.from(new Uint8Array((await bridge.ble.read('device','service','info')).buffer))).toEqual([0,128,255])
  bridge.send({ event: 'disconnected', deviceId: 'device' })
  bridge.send({ event: 'notification', deviceId: 'device', service: 'service', characteristic: 'status', bytes: [1] })
  expect(disconnects).toEqual(['device']); expect(bytes).toHaveLength(1)
  bridge.dispose()
})

test('权限拒绝、无效JSON、超时、原生拒绝和销毁均拒绝请求', async () => {
  const denied = fixture((request, send) => send({ id: request.id, error: 'denied' }))
  await expect(denied.call('camera.photo')).rejects.toThrow('denied'); denied.dispose()
  const malformed = fixture((request, send) => send({ id: request.id, result: 'bad JSON' }))
  await expect(malformed.call('camera.photo')).rejects.toThrow('无效数据'); malformed.dispose()
  const silent = fixture(() => {})
  await expect(silent.call('ble.read', {}, 5)).rejects.toThrow('超时')
  const pending = silent.call('scanner.scan'); silent.dispose()
  await expect(pending).rejects.toThrow('退出前台')
  const rejected = fixture(() => {}, 'rejected')
  await expect(rejected.call('ble.initialize')).rejects.toThrow('被拒绝'); rejected.dispose()
})

test('鸿蒙启动时注入扫码能力，不进入Capacitor浏览器失败分支', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { SilifieldNative: { invoke: (raw: string) => {
      const request = JSON.parse(raw)
      setTimeout(() => window.dispatchEvent(new CustomEvent('silifield:native', { detail: { id: request.id, error: 'harmony-scanner-reached' } })), 0)
      return 'accepted'
    } } })
  })
  await page.goto('http://127.0.0.1:4173/')
  await expect(page.locator('input').first()).toHaveValue('13800138000')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.getByRole('button', { name: '扫码', exact: true }).click()
  await page.getByRole('button', { name: '扫描产品机身二维码' }).click()
  await expect(page.getByRole('alert')).toContainText('harmony-scanner-reached')
})

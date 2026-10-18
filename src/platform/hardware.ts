import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import type { QrPayload } from '../nav'
import { CONFIG, INFO, SERVICE, STATUS, FrameReader, frames, open, seal } from './deviceProtocol'

export type BleTransport = Pick<typeof BleClient, 'initialize' | 'isEnabled' | 'requestDevice' | 'connect' | 'disconnect' | 'read' | 'readRssi' | 'startNotifications' | 'stopNotifications' | 'write'>
export function createHardwareClient(ble: BleTransport, isNative = () => Capacitor.isNativePlatform()) {
let session: { deviceId: string; payload: QrPayload; challenge: string } | undefined
async function disconnectDevice(): Promise<void> {
  const current = session; session = undefined
  if (current) await ble.disconnect(current.deviceId).catch(() => {})
}
async function connectDevice(payload: QrPayload, signal: AbortSignal, onStep: (step: number) => void): Promise<number> {
  if (!isNative()) throw new Error('请在 iPhone 或安卓 App 中使用蓝牙连接')
  if (!/^[a-f0-9]{64}$/i.test(payload.token)) throw new Error('请重新扫描设备机身二维码')
  await disconnectDevice()
  await ble.initialize({ androidNeverForLocation: true })
  if (!(await ble.isEnabled())) throw new Error('请在系统设置中开启蓝牙后重试')
  onStep(0)
  const device = await ble.requestDevice({ services: [SERVICE] })
  if (signal.aborted) throw new Error('连接已取消')
  onStep(1)
  const cleanup = () => { void ble.disconnect(device.deviceId).catch(() => {}) }
  signal.addEventListener('abort', cleanup, { once: true })
  try {
    await ble.connect(device.deviceId, () => { if (session?.deviceId === device.deviceId) session = undefined }, { timeout: 15000 })
    if (signal.aborted) throw new Error('连接已取消')
    onStep(2)
    const info = JSON.parse(new TextDecoder().decode(await ble.read(device.deviceId, SERVICE, INFO))) as { v: number; sn: string; productId: string; challenge: string }
    if (info.v !== 1 || info.sn !== payload.sn || info.productId !== payload.productId || !/^[a-f0-9]{32}$/i.test(info.challenge)) throw new Error('蓝牙设备身份与机身二维码不匹配')
    session = { deviceId: device.deviceId, payload, challenge: info.challenge }
    return await ble.readRssi(device.deviceId)
  } catch (error) { cleanup(); throw error }
  finally { signal.removeEventListener('abort', cleanup) }
}
async function provisionDevice(payload: QrPayload, ssid: string, password: string, signal: AbortSignal, onStep: (step: number) => void): Promise<{ ip: string; ssid: string; boundAt: string }> {
  const current = session
  if (!current || current.payload.sn !== payload.sn) throw new Error('蓝牙已断开，请重新扫码连接')
  const requestId = crypto.randomUUID()
  const aad = `${payload.sn}:${current.challenge}`
  const message = await seal(payload.token, `${aad}:request`, { requestId, ssid, password })
  if (signal.aborted) throw new Error('配网已取消')
  let finished = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let settle!: (result: { ip: string; ssid: string; boundAt: string }) => void
  let fail!: (error: Error) => void
  const result = new Promise<{ ip: string; ssid: string; boundAt: string }>((resolve, reject) => { settle = resolve; fail = reject })
  void result.catch(() => {})
  const abort = () => { finished = true; fail(new Error('配网已取消')); void disconnectDevice() }
  signal.addEventListener('abort', abort, { once: true })
  const reader = new FrameReader()
  try {
    await ble.startNotifications(current.deviceId, SERVICE, STATUS, (packet) => {
      if (finished) return
      try {
        const raw = reader.push(packet)
        if (!raw) return
        void open(payload.token, `${aad}:response`, raw).then((value) => {
          if (finished) return
          const response = value as { requestId: string; status: string; ip: string; ssid: string; error?: string }
          if (response.requestId !== requestId) throw new Error('设备回执不属于当前配网请求')
          if (response.status !== 'connected' || response.ssid !== ssid || !/^\d{1,3}(\.\d{1,3}){3}$/.test(response.ip) || response.ip === '0.0.0.0') throw new Error(response.error || '设备未确认联网成功')
          finished = true; onStep(2)
          settle({ ip: response.ip, ssid, boundAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) })
        }).catch((error: unknown) => { finished = true; fail(error instanceof Error ? error : new Error('设备回执校验失败')) })
      } catch { finished = true; fail(new Error('设备回执分片损坏，请重试')) }
    })
    timer = setTimeout(() => { finished = true; fail(new Error('设备联网超时，请检查 WiFi 密码与 2.4GHz 网络')) }, 45000)
    onStep(0)
    for (const frame of frames(message)) {
      if (signal.aborted) throw new Error('配网已取消')
      await ble.write(current.deviceId, SERVICE, CONFIG, frame)
    }
    onStep(1)
    return await result
  } finally {
    finished = true; clearTimeout(timer); signal.removeEventListener('abort', abort)
    await ble.stopNotifications(current.deviceId, SERVICE, STATUS).catch(() => {})
    await disconnectDevice()
  }
}

return { connectDevice, disconnectDevice, provisionDevice }
}
const client = createHardwareClient(BleClient)
export const { connectDevice, disconnectDevice, provisionDevice } = client

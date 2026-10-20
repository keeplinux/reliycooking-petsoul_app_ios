import type { Photo } from '@capacitor/camera'
import type { BleTransport } from './hardware'
import { configureCameraAdapter } from './camera'
import { configureScannerAdapter } from './scanner'
import { configureHardwareClient } from './hardware'

declare global {
  interface Window { SilifieldNative?: { invoke(request: string): string } }
}
type Reply = { id?: number; result?: string; error?: string; event?: string; deviceId?: string; service?: string; characteristic?: string; bytes?: number[] }
type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
const bytesView = (bytes: number[]) => new DataView(Uint8Array.from(bytes).buffer)

/** One JSON RPC endpoint; callbacks and binary data never cross the proxy directly. */
export function createHarmonyTransport(proxy: { invoke(request: string): string }, host: Window = window) {
  let sequence = 0
  const pending = new Map<number, Pending>()
  const notifications = new Map<string, (value: DataView) => void>()
  const disconnections = new Map<string, () => void>()
  const key = (id: string, service: string, characteristic: string) => `${id}/${service.toLowerCase()}/${characteristic.toLowerCase()}`
  const receive = (event: Event) => {
    const message = (event as CustomEvent<Reply>).detail
    if (!message || typeof message !== 'object') return
    if (message.event === 'disconnected' && message.deviceId) {
      disconnections.get(message.deviceId)?.()
      disconnections.delete(message.deviceId)
      for (const id of notifications.keys()) if (id.startsWith(`${message.deviceId}/`)) notifications.delete(id)
    } else if (message.event === 'notification' && message.deviceId && message.service && message.characteristic && Array.isArray(message.bytes)) {
      if (message.bytes.length > 512 || message.bytes.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return
      notifications.get(key(message.deviceId, message.service, message.characteristic))?.(bytesView(message.bytes))
    } else if (typeof message.id === 'number') {
      const task = pending.get(message.id)
      if (!task) return
      clearTimeout(task.timer); pending.delete(message.id)
      if (message.error) task.reject(new Error(message.error))
      else {
        try { task.resolve(JSON.parse(message.result ?? 'null')) }
        catch { task.reject(new Error('鸿蒙能力返回了无效数据')) }
      }
    }
  }
  host.addEventListener('silifield:native', receive)
  function call<T>(method: string, params: object = {}, timeout = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = ++sequence
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('鸿蒙原生能力响应超时')) }, timeout)
      pending.set(id, { resolve: value => resolve(value as T), reject, timer })
      try {
        if (proxy.invoke(JSON.stringify({ id, method, params: JSON.stringify(params) })) !== 'accepted') throw new Error('鸿蒙能力请求被拒绝')
      } catch (error) { clearTimeout(timer); pending.delete(id); reject(error) }
    })
  }
  const ble: BleTransport = {
    initialize: () => call<void>('ble.initialize'),
    isEnabled: () => call<boolean>('ble.isEnabled'),
    requestDevice: options => call('ble.requestDevice', { services: options?.services ?? [] }, 60000),
    connect: async (deviceId, onDisconnect, options) => {
      if (onDisconnect) disconnections.set(deviceId, () => onDisconnect(deviceId))
      try { await call('ble.connect', { deviceId, timeout: options?.timeout ?? 15000 }) }
      catch (error) { disconnections.delete(deviceId); void call('ble.disconnect', { deviceId }).catch(() => {}); throw error }
    },
    disconnect: async deviceId => { try { await call('ble.disconnect', { deviceId }) } finally { disconnections.delete(deviceId) } },
    read: async (deviceId, service, characteristic) => bytesView(await call<number[]>('ble.read', { deviceId, service, characteristic })),
    readRssi: deviceId => call<number>('ble.readRssi', { deviceId }),
    startNotifications: async (deviceId, service, characteristic, callback) => {
      const id = key(deviceId, service, characteristic)
      notifications.set(id, callback)
      try { await call('ble.notify', { deviceId, service, characteristic, enabled: true }) }
      catch (error) { notifications.delete(id); throw error }
    },
    stopNotifications: async (deviceId, service, characteristic) => {
      notifications.delete(key(deviceId, service, characteristic))
      await call('ble.notify', { deviceId, service, characteristic, enabled: false })
    },
    write: (deviceId, service, characteristic, value) => call<void>('ble.write', { deviceId, service, characteristic, bytes: Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength)) }),
  }
  const dispose = () => {
    host.removeEventListener('silifield:native', receive)
    for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error('App 已退出前台')) }
    pending.clear(); notifications.clear(); disconnections.clear()
  }
  return { call, ble, dispose }
}

export function initializeHarmony(): void {
  if (!window.SilifieldNative) return
  if (!window.isSecureContext || !crypto.subtle || !window.indexedDB) throw new Error('鸿蒙 Web 容器缺少安全上下文或持久化能力')
  const bridge = createHarmonyTransport(window.SilifieldNative)
  configureCameraAdapter({ getPhoto: options => bridge.call<Photo>('camera.photo', { source: options.source }, 120000) })
  configureScannerAdapter({ scanDeviceQr: () => bridge.call<string>('scanner.scan', {}, 120000) })
  configureHardwareClient(bridge.ble)
  let lastBack: boolean | undefined
  const observer = new MutationObserver(() => {
    const canGoBack = Boolean(document.querySelector('button[aria-label="返回"]'))
    if (canGoBack !== lastBack) {
      lastBack = canGoBack
      void bridge.call('navigation.state', { canGoBack }).catch(() => {})
    }
  })
  observer.observe(document.getElementById('root')!, { childList: true, subtree: true })
  window.addEventListener('pagehide', () => { observer.disconnect(); bridge.dispose() }, { once: true })
}

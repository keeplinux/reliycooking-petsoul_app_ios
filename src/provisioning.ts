import { kindForProduct, products } from './catalog'
import type { Device, DeviceInput, DeviceStatus, ProvisionSource, QrPayload } from './nav'

export type { QrPayload }

/** 设备确认的配网结果 */
export type ProvisionResult = {
  ip: string
  ssid: string
  boundAt: string
}

/** 设备流程中的单步 */
export type SimStep = {
  key: string
  label: string
  /** 该步耗时（毫秒） */
  ms: number
}

/** BLE 连接阶段的分步 */
export const bleSteps: SimStep[] = [
  { key: 'discover', label: '发现设备 BLE 信号', ms: 900 },
  { key: 'connect', label: '建立 GATT 连接', ms: 1400 },
  { key: 'handshake', label: '读取设备信息', ms: 800 },
]

/** 保底热点阶段的分步：手机已连上设备热点，走 HTTP 会话 */
export const hotspotSteps: SimStep[] = [
  { key: 'probe', label: '连接设备热点服务', ms: 900 },
  { key: 'verify', label: '校验设备绑定令牌', ms: 700 },
]

/** 配网下发阶段的分步 */
export const provisionSteps: SimStep[] = [
  { key: 'write', label: '写入 WiFi 配置', ms: 1000 },
  { key: 'join', label: '设备连接路由器', ms: 1700 },
  { key: 'bind', label: '确认设备联网', ms: 900 },
]

export type ProvisionStage = 'ble' | 'hotspot' | 'provision'

export type FailureCode =
  | 'BLE_NO_DEVICE'
  | 'BLE_CONNECT_TIMEOUT'
  | 'BLE_ALREADY_BOUND'
  | 'WIFI_UNSUPPORTED_BAND'
  | 'WIFI_WRONG_PASSWORD'
  | 'DEVICE_NO_RESPONSE'
  | 'HOTSPOT_NOT_FOUND'
  | 'HOTSPOT_TOKEN_INVALID'

export type ProvisionFailure = {
  code: FailureCode
  stage: ProvisionStage
  /** 失败发生在该阶段分步中的第几步 */
  stepIndex: number
  title: string
  message: string
  hint: string
  /** 是否建议改用保底热点配网 */
  suggestHotspot: boolean
}

const failureTable: Record<FailureCode, Omit<ProvisionFailure, 'code'>> = {
  BLE_NO_DEVICE: {
    stage: 'ble',
    stepIndex: 0,
    title: '未发现设备',
    message: '没有搜索到设备的蓝牙信号',
    hint: '请确认设备已通电、指示灯处于闪烁状态，并靠近设备 1 米内重试。',
    suggestHotspot: true,
  },
  BLE_CONNECT_TIMEOUT: {
    stage: 'ble',
    stepIndex: 1,
    title: '蓝牙连接超时',
    message: '与设备建立蓝牙连接超时',
    hint: '设备可能已被其他手机占用，或蓝牙信号太弱。请重启设备后重试。',
    suggestHotspot: true,
  },
  BLE_ALREADY_BOUND: {
    stage: 'ble',
    stepIndex: 2,
    title: '设备已被绑定',
    message: '该设备已被其他账号绑定',
    hint: '请先在原账号中解绑，或长按设备重置键 5 秒恢复出厂设置后重新配网。',
    suggestHotspot: false,
  },
  WIFI_UNSUPPORTED_BAND: {
    stage: 'provision',
    stepIndex: 0,
    title: '频段不支持',
    message: '设备不支持 5GHz 频段',
    hint: '请改用 2.4GHz 的 WiFi，名称通常不带「5G」后缀。可在路由器中关闭双频合一后重试。',
    suggestHotspot: true,
  },
  WIFI_WRONG_PASSWORD: {
    stage: 'provision',
    stepIndex: 1,
    title: '配网失败',
    message: '设备连接路由器失败，通常是 WiFi 密码错误',
    hint: '请确认密码大小写与特殊字符是否正确，返回重新填写后再试。',
    suggestHotspot: true,
  },
  DEVICE_NO_RESPONSE: {
    stage: 'provision',
    stepIndex: 2,
    title: '设备无响应',
    message: '设备没有回执配网结果',
    hint: '配置可能没有下发成功。请保持手机距离设备 1 米内后重试。',
    suggestHotspot: true,
  },
  HOTSPOT_NOT_FOUND: {
    stage: 'hotspot',
    stepIndex: 0,
    title: '未发现设备',
    message: '没有发现处于保底模式的设备',
    hint: '请确认手机已连接名为 silifield 的热点，并在系统提示「无互联网」时选择「保持连接」。',
    suggestHotspot: false,
  },
  HOTSPOT_TOKEN_INVALID: {
    stage: 'hotspot',
    stepIndex: 1,
    title: '设备校验失败',
    message: '设备绑定令牌校验未通过',
    hint: '该设备可能已被重新绑定。请重启设备后重试，或联系客服核验设备归属。',
    suggestHotspot: false,
  },
}

export function makeFailure(code: FailureCode): ProvisionFailure {
  return { code, ...failureTable[code] }
}

/** SSID 以 5G 结尾时视为 5GHz 频段，真实设备无法加入 */
export function isFiveGhzSsid(ssid: string): boolean {
  return /5g$/i.test(ssid.trim())
}

export const sourceLabel: Record<ProvisionSource, string> = {
  scan: '扫码配网',
  hotspot: '保底热点配网',
}

export const statusLabel: Record<DeviceStatus, string> = {
  unbound: '未绑定',
  bound: '已配网',
  pending: '待配网',
}

const productIdSet = new Set(products.map((product) => product.id))

function normalizeProductId(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const id = value.trim()
  return productIdSet.has(id) ? id : null
}

export function formatQrPayload(payload: QrPayload): string {
  return JSON.stringify({ v: 1, p: payload.productId, sn: payload.sn, key: payload.token })
}

/** No synthesized identity, MAC address or authentication key in production. */
export function parseQrPayload(raw: string): QrPayload | null {
  if (raw.length > 2048) return null
  try {
    const data = JSON.parse(raw) as Record<string, unknown>
    const productId = normalizeProductId(data.p)
    if (data.v !== 1 || !productId || typeof data.sn !== 'string' || !/^[A-Z0-9-]{4,32}$/.test(data.sn) || typeof data.key !== 'string' || !/^[a-f0-9]{64}$/i.test(data.key)) return null
    return { productId, sn: data.sn, mac: '', token: data.key.toLowerCase() }
  } catch { return null }
}

/** 由已绑定设备还原出配网所需的二维码信息（用于待配网设备手动配网） */
export function payloadFromDevice(device: Device): QrPayload {
  return {
    productId: device.productId,
    sn: device.sn,
    mac: device.mac,
    token: '' // Reconfiguration requires the original factory QR; never derive a key from the SN.,
  }
}

/** 由设备输入构造设备实体 */
export function buildDevice(input: DeviceInput): Device {
  const product = products.find((item) => item.id === input.productId)
  return {
    id: `dev-${input.sn}`,
    kind: kindForProduct(input.productId),
    productId: input.productId,
    name: product?.name ?? '未知设备',
    online: input.status === 'bound',
    sn: input.sn,
    mac: input.mac,
    wifiSsid: input.wifiSsid,
    source: input.source,
    status: input.status,
    boundAt: Date.now(),
  }
}

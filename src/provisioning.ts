import { kindForProduct, products } from './catalog'
import { simulateHardware } from './config'
import type { Device, DeviceInput, DeviceStatus, ProvisionSource, QrPayload } from './nav'

export type { QrPayload }

/** 配网结果（演示数据） */
export type ProvisionResult = {
  ip: string
  ssid: string
  boundAt: string
}

/** 模拟流程中的单步 */
export type SimStep = {
  key: string
  label: string
  /** 该步耗时（毫秒） */
  ms: number
}

export type SimHandlers = {
  onStep: (index: number) => void
  onDone: () => void
  onError: (failure: ProvisionFailure) => void
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
  { key: 'bind', label: '云端绑定设备', ms: 900 },
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

function textOr(value: string | null | undefined, fallback: string): string {
  const text = value?.trim()
  return text ? text : fallback
}

/** 生成演示序列号，如 PF85310976 */
export function randomSn(prefix = 'PF'): string {
  const block = () => Math.floor(1000 + Math.random() * 9000).toString()
  return `${prefix}${block()}${block()}`
}

/** 生成演示 MAC 地址 */
export function randomMac(): string {
  const part = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return ['A4', 'C1', part(), part(), part(), part()].join(':')
}

/** 生成演示信号强度（dBm） */
export function randomRssi(): number {
  return -(38 + Math.floor(Math.random() * 32))
}

/**
 * 由 SN 推导设备绑定令牌。
 * 真机上该令牌来自机身二维码，或由设备热点接口返回；
 * 此处用确定性哈希保证同一台设备在多次会话中令牌一致。
 */
export function tokenForSn(sn: string): string {
  let hash = 0
  for (let index = 0; index < sn.length; index += 1) {
    hash = (hash * 31 + sn.charCodeAt(index)) % 0xffffffff
  }
  return hash.toString(16).padStart(8, '0')
}

/** 生成产品机身二维码的标准绑定链接 */
export function formatQrPayload(payload: QrPayload): string {
  const params = new URLSearchParams({
    p: payload.productId,
    sn: payload.sn,
    mac: payload.mac,
    token: payload.token,
  })
  return `https://bind.pawlink.cn/bind?${params.toString()}`
}

/**
 * 解析二维码内容，支持三种格式：
 * - 绑定链接：https://bind.pawlink.cn/bind?p=smart-water&sn=...&mac=...&token=...
 * - JSON：{"p":"smart-water","sn":"...","mac":"...","token":"..."}
 * - 紧凑格式：PAWLINK:smart-water:PF12340567
 *
 * 返回 null 表示内容无法识别（如产品编号无效）。
 */
export function parseQrPayload(raw: string): QrPayload | null {
  const text = raw.trim()
  if (!text) {
    return null
  }

  const build = (productId: string, sn: string, mac: string, token: string): QrPayload => ({
    productId,
    sn,
    mac,
    token,
  })

  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text) as Record<string, unknown>
      const productId = normalizeProductId(obj.p ?? obj.productId)
      if (productId) {
        const sn = textOr(typeof obj.sn === 'string' ? obj.sn : null, randomSn())
        return build(
          productId,
          sn,
          textOr(typeof obj.mac === 'string' ? obj.mac : null, randomMac()),
          textOr(typeof obj.token === 'string' ? obj.token : null, tokenForSn(sn)),
        )
      }
    } catch {
      // 内容不是合法 JSON，继续尝试其他格式
    }
    return null
  }

  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text)
      const productId = normalizeProductId(
        url.searchParams.get('p') ?? url.searchParams.get('productId'),
      )
      if (productId) {
        const sn = textOr(url.searchParams.get('sn'), randomSn())
        return build(
          productId,
          sn,
          textOr(url.searchParams.get('mac'), randomMac()),
          textOr(url.searchParams.get('token'), tokenForSn(sn)),
        )
      }
    } catch {
      // 内容不是合法 URL
    }
    return null
  }

  const compact = /^PAWLINK:([^:\s]+):([^:\s]+)$/i.exec(text)
  if (compact) {
    const productId = normalizeProductId(compact[1])
    if (productId) {
      const sn = compact[2]
      return build(productId, sn, randomMac(), tokenForSn(sn))
    }
  }

  return null
}

/**
 * 模拟相机解码出一张产品机身二维码。
 *
 * 尚未接入相机解码能力时使用：先按产品型号生成标准二维码内容，
 * 再交给真实的 parseQrPayload 解析，保证下行链路与真机完全一致。
 * 真机上改为把相机识别到的原始字符串传进 parseQrPayload 即可。
 *
 * expectProductId：从某台未绑定设备的「扫码绑定」入口进入时锁定产品型号，
 * 只会识别为该产品（如饮水舱绑定入口只识别饮水舱二维码）。
 */
export function simulateQrRecognition(expectProductId?: string): QrPayload {
  const product = expectProductId
    ? (products.find((item) => item.id === expectProductId) ?? products[0])
    : products[Math.floor(Math.random() * products.length)]
  const sn = randomSn()
  const encoded = formatQrPayload({
    productId: product.id,
    sn,
    mac: randomMac(),
    token: tokenForSn(sn),
  })
  const parsed = simulateHardware ? parseQrPayload(encoded) : null
  return parsed ?? { productId: product.id, sn, mac: randomMac(), token: tokenForSn(sn) }
}

/** 由已绑定设备还原出配网所需的二维码信息（用于待配网设备手动配网） */
export function payloadFromDevice(device: Device): QrPayload {
  return {
    productId: device.productId,
    sn: device.sn,
    mac: device.mac,
    token: tokenForSn(device.sn),
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

/**
 * 依次执行模拟步骤，返回取消函数（用于中断或卸载时停止流程）。
 * failure 命中时，在该分步结束后抛出对应的失败信息。
 */
export function runSimSteps(
  steps: SimStep[],
  handlers: SimHandlers,
  failure: ProvisionFailure | null = null,
): () => void {
  let cancelled = false
  let timer: number | undefined

  const run = (index: number) => {
    if (cancelled) {
      return
    }
    if (index >= steps.length) {
      handlers.onDone()
      return
    }
    handlers.onStep(index)
    timer = window.setTimeout(() => {
      if (cancelled) {
        return
      }
      if (failure && index === failure.stepIndex) {
        handlers.onError(failure)
        return
      }
      run(index + 1)
    }, steps[index].ms)
  }

  run(0)

  return () => {
    cancelled = true
    if (timer !== undefined) {
      window.clearTimeout(timer)
    }
  }
}

/** 生成演示配网结果 */
export function buildProvisionResult(ssid: string): ProvisionResult {
  return {
    ip: `192.168.31.${100 + Math.floor(Math.random() * 100)}`,
    ssid,
    boundAt: new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

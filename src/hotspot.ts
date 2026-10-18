import { useCallback, useEffect, useRef, useState } from 'react'
import { hotspotProbeMs, simulateHardware } from './config'
import { randomRssi, tokenForSn } from './provisioning'

/**
 * 配网保底通道（AP 直连模式）
 *
 * 适用场景：机身二维码丢失导致首次绑定无法扫码、家里 WiFi 变更后无法重新配网、
 * 设备蓝牙模块异常导致 BLE 配网不可用。
 *
 * 工况：设备进入保底模式后自身作为一个 WiFi 热点，手机连上该热点，
 * 应用通过热点访问设备内置的 HTTP 服务，发现设备并下发新的 WiFi 配置。
 */

/** 设备保底热点默认 SSID */
export const HOTSPOT_SSID = 'silifield'

/** 设备保底热点默认密码 */
export const HOTSPOT_PASSWORD = 'silifield'

/** 设备保底模式下的固定网关地址（模组 AP 模式默认网段） */
export const HOTSPOT_GATEWAY = '192.168.4.1'

export type HotspotDevice = {
  sn: string
  productId: string
  mac: string
  token: string
  /** 设备实际广播的热点名，可能是 silifield，也可能是 silifield-A7C3 */
  ssid: string
  gateway: string
  firmware: string
  /** 手机到设备热点的信号强度 */
  rssi: number
}

export type HotspotDiscoveryState = 'searching' | 'found' | 'empty'

/**
 * 真机实现：手机连上设备热点后，设备在 HOTSPOT_GATEWAY 上提供 HTTP 接口：
 *   GET http://192.168.4.1/api/info
 *   → { sn, model, mac, token, fw }
 *
 * 接入真机时需要注意三点：
 * 1. capacitor.config.ts 的 androidScheme 为 https，WebView 内请求 http 属于混合内容，
 *    需要在原生层放开（allowMixedContent / server.allowNavigation）。
 * 2. 手机连上无外网的热点后，Android 可能自动切回蜂窝网络，导致探测失败，
 *    必须在界面上明确提示用户「保持连接此 WiFi」并关闭「自动切换网络」。
 * 3. 多台设备同时处于保底模式时若使用同一 SSID，手机无法区分目标设备，
 *    量产版本建议出厂热点名带 SN 后缀（silifield-XXXX）。
 */
export async function probeHotspotGateway(): Promise<HotspotDevice[]> {
  try {
    const response = await fetch(`http://${HOTSPOT_GATEWAY}/api/info`, { method: 'GET' })
    if (!response.ok) {
      return []
    }
    const data = (await response.json()) as Partial<HotspotDevice>
    if (typeof data.sn !== 'string' || typeof data.productId !== 'string') {
      return []
    }
    return [
      {
        sn: data.sn,
        productId: data.productId,
        mac: typeof data.mac === 'string' ? data.mac : 'A4:C1:38:00:00:00',
        token: typeof data.token === 'string' ? data.token : tokenForSn(data.sn),
        ssid: typeof data.ssid === 'string' ? data.ssid : HOTSPOT_SSID,
        gateway: HOTSPOT_GATEWAY,
        firmware: typeof data.firmware === 'string' ? data.firmware : 'unknown',
        rssi: typeof data.rssi === 'number' ? data.rssi : randomRssi(),
      },
    ]
  } catch {
    return []
  }
}

const simDevice = {
  sn: 'PF24060001',
  productId: 'smart-water',
  mac: 'A4:C1:38:5D:2E:9B',
  firmware: 'v1.4.2',
}

/** 发现处于保底模式的设备（未接入设备侧时返回一台模拟设备） */
export async function discoverHotspotDevices(): Promise<HotspotDevice[]> {
  if (simulateHardware) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, hotspotProbeMs)
    })
    return [
      {
        ...simDevice,
        token: tokenForSn(simDevice.sn),
        ssid: HOTSPOT_SSID,
        gateway: HOTSPOT_GATEWAY,
        rssi: randomRssi(),
      },
    ]
  }
  return probeHotspotGateway()
}

/**
 * 保底设备检测。
 *
 * 只在用户进入保底配网流程时检测一次，避免全局常驻轮询；
 * 重新检测通过返回的 retry 触发。
 */
export function useHotspotDiscovery(onFound: (devices: HotspotDevice[]) => void): {
  state: HotspotDiscoveryState
  devices: HotspotDevice[]
  retry: () => void
} {
  const [state, setState] = useState<HotspotDiscoveryState>('searching')
  const [devices, setDevices] = useState<HotspotDevice[]>([])
  const [attempt, setAttempt] = useState(0)
  const onFoundRef = useRef(onFound)

  useEffect(() => {
    onFoundRef.current = onFound
  }, [onFound])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setState('searching')
      const found = await discoverHotspotDevices()
      if (cancelled) {
        return
      }
      setDevices(found)
      setState(found.length > 0 ? 'found' : 'empty')
      if (found.length > 0) {
        onFoundRef.current(found)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setDevices([])
    setAttempt((value) => value + 1)
  }, [])

  return { state, devices, retry }
}

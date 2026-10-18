import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { LoaderCircle, RefreshCw, Smartphone, TriangleAlert, Wifi } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { HOTSPOT_GATEWAY, HOTSPOT_PASSWORD, HOTSPOT_SSID, useHotspotDiscovery } from '../hotspot'
import type { HotspotDevice } from '../hotspot'
import type { QrPayload } from '../nav'
import { products } from '../catalog'

function payloadOf(device: HotspotDevice): QrPayload {
  return {
    productId: device.productId,
    sn: device.sn,
    mac: device.mac,
    token: device.token,
  }
}

/**
 * 保底配网指引
 *
 * 用于二维码丢失无法首次绑定、家里 WiFi 变更后无法重新配网、
 * 设备蓝牙模块异常导致 BLE 配网不可用的场景。
 * 入口收敛在配网失败提示与设置页的故障排查项，不放在首页明面上。
 */
export function HotspotBindView() {
  const { navigate, devices, addDevice } = useApp()

  const handleFound = useCallback(
    (found: HotspotDevice[]) => {
      found.forEach((item) => {
        addDevice({
          productId: item.productId,
          sn: item.sn,
          mac: item.mac,
          wifiSsid: null,
          status: 'pending',
          source: 'hotspot',
        })
      })
    },
    [addDevice],
  )

  const { state, devices: found, retry } = useHotspotDiscovery(handleFound)
  const [expanded, setExpanded] = useState(false)

  const boundSns = new Set(devices.filter((item) => item.status === 'bound').map((item) => item.sn))
  const candidates = found.filter((item) => !boundSns.has(item.sn))

  return (
    <>
      <TopBar title="保底配网" onBack={() => navigate({ name: 'home' })} />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 safe-bottom">
        <section className="rounded-xl border border-[#171717]/10 bg-white p-4">
          <h2 className="m-0 flex items-center gap-1.5 text-sm font-semibold">
            <Wifi size={15} /> 二维码丢了，也能重新配网
          </h2>
          <p className="m-0 mt-1.5 text-xs leading-5 text-[#171717]/50">
            设备在上电后如果长时间没有配网，会自动开启一个名为「{HOTSPOT_SSID}」的热点。
            手机连上这个热点，应用就能直接发现设备并重新下发 WiFi 配置，不需要扫机身二维码。
          </p>
          <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0 text-xs text-[#171717]/55">
            <li>· 机身二维码丢失，首次绑定无法扫码</li>
            <li>· 家里换了 WiFi，旧二维码无法重新配网</li>
            <li>· 设备蓝牙模块异常，BLE 配网连不上</li>
          </ul>
        </section>

        <section className="rounded-xl border border-[#171717]/10 bg-white p-4">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Smartphone size={15} /> 操作步骤
            </span>
            <span className="text-xs text-[#171717]/45">{expanded ? '收起' : '展开'}</span>
          </button>

          {expanded && (
            <ol className="m-0 mt-3 flex list-none flex-col gap-3 p-0">
              <Step index={1} title="打开手机的「设置 → WLAN」">
                保持设备通电，等待设备热点出现（约 30 秒）。
              </Step>
              <Step index={2} title={`连接热点 ${HOTSPOT_SSID}`}>
                密码为
                <code className="mx-1 rounded bg-[#171717]/5 px-1.5 py-0.5 font-mono text-[11px]">
                  {HOTSPOT_PASSWORD}
                </code>
                ，与热点名相同。
              </Step>
              <Step index={3} title="选择「保持连接」">
                手机可能提示「无法访问互联网」或「不安全网络」，请选择仍然连接，
                并关闭系统里的「自动切换网络」，否则手机会自动切回原来的 WiFi。
              </Step>
              <Step index={4} title="回到本页等待自动发现">
                设备会被自动添加到设备列表，显示为「待配网」，随后即可手动配网。
              </Step>
            </ol>
          )}
        </section>

        <section className="rounded-xl border border-[#171717]/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-1.5 text-sm font-semibold">
              <Smartphone size={15} /> 设备发现
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                candidates.length > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {candidates.length > 0 ? `已发现 ${candidates.length} 台` : '检测中'}
            </span>
          </div>

          {state === 'searching' ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f7f7f8] px-3 py-3 text-xs text-[#171717]/60">
              <LoaderCircle size={15} className="shrink-0 animate-spin" />
              正在检测 {HOTSPOT_GATEWAY} 上的设备，请确认手机已连上 {HOTSPOT_SSID} 热点
            </div>
          ) : candidates.length === 0 ? (
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex gap-1.5 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                <span>
                  {found.length > 0
                    ? '发现的设备都已完成配网，无需重复配置。'
                    : `没有检测到设备。请确认手机当前连接的 WiFi 是「${HOTSPOT_SSID}」，而不是已经切回原网络。`}
                </span>
              </div>
              <button
                type="button"
                onClick={retry}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#171717]/15 text-sm font-medium hover:bg-[#171717]/5"
              >
                <RefreshCw size={15} /> 重新检测
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {candidates.map((device) => (
                <div key={device.sn} className="rounded-lg border border-[#171717]/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {products.find((item) => item.id === device.productId)?.name ?? '未知设备'}
                    </span>
                    <span className="text-[10px] text-[#171717]/45">{device.rssi} dBm</span>
                  </div>
                  <p className="m-0 mt-1 font-mono text-[10px] text-[#171717]/45">
                    SN {device.sn} · 热点 {device.ssid} · {device.firmware}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        name: 'provision',
                        payload: payloadOf(device),
                        source: 'hotspot',
                      })
                    }
                    className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
                  >
                    <Wifi size={15} /> 手动配网
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={retry}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#171717]/15 text-sm font-medium hover:bg-[#171717]/5"
              >
                <RefreshCw size={15} /> 重新检测
              </button>
            </div>
          )}
        </section>

        <p className="m-0 text-center text-[11px] leading-5 text-[#171717]/40">
          保底热点仅在设备未配网或长按重置键后开启，配网成功后会自动关闭。
        </p>
      </main>
    </>
  )
}

function Step({
  index,
  title,
  children,
}: {
  index: number
  title: string
  children: ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#171717] text-[11px] font-semibold text-white">
        {index}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-[#171717]/50">{children}</span>
      </span>
    </li>
  )
}

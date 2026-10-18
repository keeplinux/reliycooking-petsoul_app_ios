import type { ReactNode } from 'react'
import { ArrowRight, Globe, QrCode, Radar, Wifi } from 'lucide-react'
import { useApp } from '../appContext'
import { HomeScene } from '../components/HomeScene'
import { LogoMark } from '../components/LogoMark'
import { payloadFromDevice } from '../provisioning'
import { HOTSPOT_SSID } from '../hotspot'

export function Home() {
  const { navigate, devices, pets } = useApp()
  const pendingDevices = devices.filter((device) => device.status === 'pending')

  function openPendingDevice(deviceId: string) {
    const device = pendingDevices.find((item) => item.id === deviceId)
    if (!device) {
      navigate({ name: 'hotspot' })
      return
    }
    navigate({ name: 'provision', payload: payloadFromDevice(device), source: 'hotspot' })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="absolute inset-0">
        <HomeScene
          pets={pets}
          devices={devices}
          onCatClick={(petIndex) => {
            const pet = pets[petIndex]
            if (pet) {
              navigate({ name: 'petProfile', petId: pet.id })
              return
            }
            navigate({ name: 'petCapture' })
          }}
          onDeviceClick={(deviceId) => navigate({ name: 'device', deviceId })}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-linear-to-b from-black/40 to-transparent" />
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pb-3 safe-top">
        <div className="flex items-center gap-2 text-white">
          <LogoMark size="sm" />
          <span className="text-sm font-semibold [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
            硅宠场域
          </span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate({ name: 'scan' })}
            className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-black/20 px-3 py-2 text-xs font-medium text-white backdrop-blur hover:bg-white/10"
          >
            <QrCode size={16} /> 扫码
          </button>
        </div>
      </header>

      {pendingDevices.length > 0 && (
        <section className="absolute inset-x-4 z-10 rounded-xl border border-white/20 bg-white/95 p-3 shadow-lg shadow-black/20 backdrop-blur banner-top">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
              <Wifi size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-semibold">
                发现 {pendingDevices.length} 台待配网设备
              </p>
              <p className="m-0 mt-0.5 text-xs leading-5 text-[#171717]/50">
                通过 {HOTSPOT_SSID} 热点自动发现，点击即可手动配网
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-col gap-2">
            {pendingDevices.map((device) => (
              <button
                key={device.id}
                type="button"
                onClick={() => openPendingDevice(device.id)}
                className="flex items-center justify-between rounded-lg bg-[#f7f7f8] px-3 py-2.5 text-left hover:bg-[#171717]/5"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{device.name}</span>
                  <span className="block font-mono text-[10px] text-[#171717]/45">
                    SN {device.sn}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium">
                  去配网 <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-28 bg-linear-to-t from-black/50 to-transparent" />
      <BottomNav />
    </div>
  )
}

function BottomNav() {
  const { navigate } = useApp()
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid grid-cols-2 safe-bottom">
      <NavButton
        icon={<Radar size={20} />}
        title="探针"
        onClick={() => navigate({ name: 'mall' })}
      />
      <NavButton
        icon={<Globe size={20} strokeWidth={1.8} />}
        title="母舰"
        onClick={() => navigate({ name: 'settings' })}
      />
    </nav>
  )
}

function NavButton({
  icon,
  title,
  onClick,
}: {
  icon: ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex flex-col items-center gap-1.5 py-4 text-white hover:bg-white/10"
    >
      <span className="text-white">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </button>
  )
}

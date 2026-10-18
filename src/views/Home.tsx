import { useState } from 'react'
import { ArrowRight, Boxes, Cat, Globe, Plus, QrCode, Radar } from 'lucide-react'
import { useApp } from '../appContext'
import { HomeScene } from '../components/HomeScene'
import { LogoMark } from '../components/LogoMark'

export function Home() {
  const { navigate, devices, pets } = useApp()
  const [panel, setPanel] = useState<'pets' | 'devices' | null>(null)
  const bound = devices.filter((device) => device.status === 'bound')
  const pending = devices.filter((device) => device.status !== 'bound')
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <div className="absolute inset-0">
        <HomeScene pets={pets} devices={devices}
          onCatClick={(index) => { const pet = pets[index]; navigate(pet ? { name: 'petProfile', petId: pet.id } : { name: 'petCapture' }) }}
          onDeviceClick={(deviceId) => navigate({ name: 'device', deviceId })} />
      </div>
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-linear-to-b from-black/70 to-transparent px-4 pb-4 safe-top">
        <div className="flex items-center gap-2 text-white"><LogoMark size="sm" /><span className="brand-font font-semibold">硅宠场域</span></div>
        <button type="button" onClick={() => navigate({ name: 'scan' })} className="flex min-h-11 items-center gap-2 rounded-xl bg-white/15 px-3 text-sm text-white"><QrCode size={18} /> 添加设备</button>
      </header>
      <div className="absolute inset-x-4 top-[112px] z-10 rounded-2xl border border-white/20 bg-black/50 p-3 text-white backdrop-blur">
        <p className="m-0 text-xs text-amber-200">演示模式 · 数据与操作为本地模拟</p>
        <p className="mb-1 mt-2 text-base font-semibold">{pets.length ? `${pets.length} 位伙伴，今日一起探索` : '欢迎来到你的宠物星球'}</p>
        <p className="m-0 text-sm text-white/85">{pending.length ? `${pending.length} 台设备待绑定` : `${bound.length} 台演示设备已绑定`} · 真实监测尚未接入</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => setPanel('pets')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/15 text-sm"><Cat size={18} /> 我的宠物（{pets.length}）</button>
          <button onClick={() => setPanel('devices')} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/15 text-sm"><Boxes size={18} /> 我的设备（{devices.length}）</button>
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-[112px] text-center text-xs text-white/75">拖动探索星球，也可通过固定入口查看宠物与设备</div>
      <nav className="absolute inset-x-0 bottom-0 z-10 grid grid-cols-3 bg-linear-to-t from-black/80 to-transparent text-white safe-bottom">
        <button onClick={() => navigate({ name: 'mall' })} className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm"><Radar size={20} />探针·产品</button>
        <button onClick={() => navigate({ name: 'petCapture' })} className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm"><Plus size={22} />添加宠物</button>
        <button onClick={() => navigate({ name: 'settings' })} className="flex min-h-16 flex-col items-center justify-center gap-1 text-sm"><Globe size={20} />母舰·我的</button>
      </nav>
      {panel && <div className="absolute inset-0 z-30 flex items-end">
        <button aria-label="关闭列表" onClick={() => setPanel(null)} className="absolute inset-0 bg-black/60" />
        <section role="dialog" aria-modal="true" aria-label={panel === 'pets' ? '我的宠物' : '我的设备'} className="relative flex max-h-[75%] w-full flex-col rounded-t-3xl bg-white p-5 safe-bottom">
          <div className="mb-3 flex items-center justify-between"><h2 className="m-0 text-lg">{panel === 'pets' ? '我的宠物' : '我的设备'}</h2><button onClick={() => setPanel(null)} className="min-h-11 px-3 text-sm">关闭</button></div>
          <div className="min-h-0 overflow-y-auto">
            {panel === 'pets' ? <>{pets.length === 0 && <p className="text-sm text-[#555]">还没有宠物档案，先为伙伴创建一份。</p>}{pets.map((pet) => <button key={pet.id} onClick={() => navigate({ name: 'petProfile', petId: pet.id })} className="mb-2 flex min-h-14 w-full items-center justify-between rounded-xl bg-[#f3f4f3] p-3 text-left"><span>{pet.name}<span className="block text-xs text-[#666]">{pet.breed || '品种待填写'}</span></span><ArrowRight size={18} /></button>)}<button onClick={() => navigate({ name: 'petCapture' })} className="mt-2 min-h-11 w-full rounded-xl bg-[#193e32] px-4 text-white">添加宠物</button></> : <>{devices.length === 0 && <p className="text-sm text-[#555]">暂无设备，可先体验添加流程。</p>}{devices.map((device) => <button key={device.id} onClick={() => navigate({ name: 'device', deviceId: device.id })} className="mb-2 flex min-h-14 w-full items-center justify-between rounded-xl bg-[#f3f4f3] p-3 text-left"><span>{device.name}<span className="block text-xs text-[#666]">{device.status === 'bound' ? '演示已绑定' : '待绑定'} · {device.sn}</span></span><ArrowRight size={18} /></button>)}<button onClick={() => navigate({ name: 'scan' })} className="mt-2 min-h-11 w-full rounded-xl bg-[#193e32] px-4 text-white">添加设备</button></>}
          </div>
        </section>
      </div>}
    </div>
  )
}

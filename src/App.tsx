import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AppContext } from './appContext'
import type { AppApi } from './appContext'
import { clearStoredAccount, readStoredAccount, storeAccount } from './auth'
import type { Account, Device, DeviceInput, Pet, View } from './nav'
import { buildDevice } from './provisioning'
import { migrateLegacyWorkspace, readStoredDevices, readStoredPets, storeDevices, storePets } from './storage'
import { AvatarPickerView } from './views/AvatarPicker'
import { DeviceView } from './views/Device'
import { Home } from './views/Home'
import { HotspotBindView } from './views/HotspotBind'
import { Mall } from './views/Mall'
import { PetCapture } from './views/PetCapture'
import { PetProfileView } from './views/PetProfile'
import { PurchaseView } from './views/Purchase'
import { ScanView } from './views/Scan'
import { SettingsView } from './views/Settings'
import { Splash } from './views/Splash'

// 初始状态：星球上预置一台未绑定饮水舱（与一只待录入的猫），
// 首次扫描饮水机二维码即默认绑定这台设备，数据在绑定后按已录入宠物生成
const initialDevices: Device[] = [
  buildDevice({
    productId: 'smart-water',
    sn: 'PF24050007',
    mac: 'A4:C1:38:2B:71:0C',
    wifiSsid: null,
    status: 'unbound',
    source: 'scan',
  }),
]

function renderView(view: View): ReactNode {
  switch (view.name) {
    case 'splash':
      return <Splash />
    case 'home':
      return <Home />
    case 'mall':
      return <Mall />
    case 'purchase':
      return <PurchaseView productId={view.productId} variant={view.variant} />
    case 'scan':
      return <ScanView expectProductId={view.expectProductId} />
    case 'hotspot':
      return <HotspotBindView />
    case 'provision':
      return <ScanView initialPayload={view.payload} source={view.source} />
    case 'settings':
      return <SettingsView />
    case 'avatarPicker':
      return <AvatarPickerView />
    case 'device':
      return <DeviceView deviceId={view.deviceId} />
    case 'petCapture':
      return <PetCapture petId={view.petId} />
    case 'petProfile':
      return <PetProfileView petId={view.petId} />
    default:
      return <Home />
  }
}

function App() {
  const [account, setAccount] = useState<Account | null>(() => readStoredAccount())
  const [view, setView] = useState<View>(() => (readStoredAccount() ? { name: 'home' } : { name: 'splash' }))
  const [devices, setDevices] = useState<Device[]>(() => {
    const id = readStoredAccount()?.id
    if (id) migrateLegacyWorkspace(id)
    return id ? readStoredDevices(initialDevices, id) : []
  })
  const [pets, setPets] = useState<Pet[]>(() => { const id = readStoredAccount()?.id; return id ? readStoredPets(id) : [] })

  const [storageError, setStorageError] = useState<string | null>(null)
  const navigate = useCallback((next: View) => setView(next), [])

  const addDevice = useCallback((input: DeviceInput) => {
    setDevices((prev) => {
      const index = prev.findIndex((device) => device.sn === input.sn)
      if (index === -1) {
        // 首次绑定预置设备：星球上未绑定的同型号设备就是这台，原位升级绑定而不新增一台
        const unboundIndex =
          input.status === 'bound'
            ? prev.findIndex(
                (device) => device.productId === input.productId && device.status === 'unbound',
              )
            : -1
        if (unboundIndex !== -1) {
          const next = [...prev]
          next[unboundIndex] = buildDevice(input)
          return next
        }
        const next = [...prev]
        // 新设备自动插到饮水舱（预置主设备，恒为首位）正下方
        next.splice(Math.min(1, next.length), 0, buildDevice(input))
        return next
      }
      const current = prev[index]
      // 已配网设备不会被保底探测降级为待配网
      if (current.status === 'bound' && input.status === 'pending') {
        return prev
      }
      if (
        current.status === input.status &&
        current.wifiSsid === input.wifiSsid &&
        current.source === input.source
      ) {
        return prev
      }
      const next = [...prev]
      // 已绑定设备保持原绑定时间；未绑定/待配网记录升级时绑定时间取当前时刻
      next[index] =
        current.status === 'bound'
          ? { ...buildDevice(input), boundAt: current.boundAt }
          : buildDevice(input)
      return next
    })
  }, [])

  const removeDevice = useCallback((deviceId: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== deviceId))
  }, [])

  const addPet = useCallback(async (next: Pet) => {
    if (!account) throw new Error('请先登录')
    await storePets([...pets, next], account.id)
    setPets((prev) => [...prev, next])
  }, [account, pets])

  const updatePet = useCallback(async (next: Pet) => {
    if (!account) throw new Error('请先登录')
    const updated = pets.map((pet) => pet.id === next.id ? next : pet)
    await storePets(updated, account.id)
    setPets(updated)
  }, [account, pets])

  const removePet = useCallback(async (petId: string) => {
    if (!account) throw new Error('请先登录')
    const updated = pets.filter((pet) => pet.id !== petId)
    await storePets(updated, account.id)
    setPets(updated)
  }, [account, pets])

  const updateDevice = useCallback((deviceId: string, patch: Pick<Device, 'flowEnabled' | 'lightEnabled'>) => {
    setDevices((prev) => prev.map((device) => device.id === deviceId ? { ...device, ...patch } : device))
  }, [])

  const signIn = useCallback((next: Account) => {
    try {
      migrateLegacyWorkspace(next.id)
      const profile = localStorage.getItem(`silifield:profile:${next.id}`)
      const saved = profile ? JSON.parse(profile) as Account : next
      const restored = { ...next, avatarId: saved.avatarId, avatarImage: saved.avatarImage, notifications: saved.notifications }
      storeAccount(restored)
      setDevices(readStoredDevices(initialDevices, next.id))
      setPets(readStoredPets(next.id))
      setAccount(restored)
      setView({ name: 'home' })
    } catch {
      setStorageError('本地资料读取失败，请释放存储空间后重试。')
    }
  }, [])

  const updateAccount = useCallback((patch: Partial<Account>) => {
    if (!account) return
    const next = { ...account, ...patch }
    try {
      localStorage.setItem(`silifield:profile:${next.id}`, JSON.stringify(next))
      storeAccount(next)
      setAccount(next)
    } catch { setStorageError('账号偏好保存失败，请释放存储空间后重试。') }
  }, [account])

  const signOut = useCallback(() => {
    clearStoredAccount()
    setAccount(null)
    setPets([])
    setDevices([])
    setView({ name: 'splash' })
  }, [])

  // 配网结果持久化，刷新后绑定关系不丢失
  useEffect(() => {
    if (!account) return
    let active = true
    void Promise.resolve().then(() => storeDevices(devices, account.id)).catch(() => {
      if (active) setStorageError('设备设置未能保存，请释放存储空间后重试。')
    })
    return () => { active = false }
  }, [devices, account])

  // 宠物档案持久化（含服务器回传的模型参数）
  useEffect(() => {
    if (!account) return
    let active = true
    void storePets(pets, account.id).catch(() => {
      if (active) setStorageError('宠物资料未能保存，请保留当前页面并释放存储空间。')
    })
    return () => { active = false }
  }, [pets, account])

  const api = useMemo<AppApi>(
    () => ({
      view,
      navigate,
      devices,
      addDevice,
      removeDevice,
      pets,
      addPet,
      updatePet,
      removePet,
      updateDevice,
      account,
      signIn,
      updateAccount,
      signOut,
    }),
    [view, navigate, devices, addDevice, removeDevice, pets, addPet, updatePet, removePet, updateDevice, account, signIn, updateAccount, signOut],
  )

  return (
    <AppContext.Provider value={api}>
      <div className="app-shell relative flex flex-col bg-[#f7f7f8] text-[#171717]">
        {storageError && <div role="alert" className="shrink-0 bg-amber-100 p-3 text-sm text-amber-950">{storageError}<button className="ml-3 underline" onClick={() => setStorageError(null)}>知道了</button></div>}
        {renderView(view)}
        {view.name !== 'home' && <div className="demo-banner">演示模式 · 数据与设备操作为本地模拟</div>}
      </div>
    </AppContext.Provider>
  )
}

export default App

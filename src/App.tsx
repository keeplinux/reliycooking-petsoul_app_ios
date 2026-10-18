import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AppContext } from './appContext'
import type { AppApi } from './appContext'
import { clearStoredAccount, readStoredAccount, storeAccount } from './auth'
import type { Account, Device, DeviceInput, Pet, View } from './nav'
import { buildDevice } from './provisioning'
import { clearStoredDevices, clearStoredPets, readStoredDevices, readStoredPets, storeDevices, storePets } from './storage'
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
      return <PurchaseView productId={view.productId} />
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
      return <PetCapture />
    case 'petProfile':
      return <PetProfileView petId={view.petId} />
    default:
      return <Home />
  }
}

function App() {
  const [account, setAccount] = useState<Account | null>(() => readStoredAccount())
  const [view, setView] = useState<View>(() => (readStoredAccount() ? { name: 'home' } : { name: 'splash' }))
  const [devices, setDevices] = useState<Device[]>(() => readStoredDevices(initialDevices))
  const [pets, setPets] = useState<Pet[]>(() => readStoredPets())

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

  const addPet = useCallback((next: Pet) => {
    setPets((prev) => [...prev, next])
  }, [])

  const signIn = useCallback((next: Account) => {
    storeAccount(next)
    setAccount(next)
    setView({ name: 'home' })
  }, [])

  const updateAccount = useCallback(
    (patch: Partial<Account>) => {
      setAccount((prev) => {
        if (!prev) {
          return prev
        }
        const next = { ...prev, ...patch }
        storeAccount(next)
        return next
      })
    },
    [],
  )

  const signOut = useCallback(() => {
    clearStoredAccount()
    clearStoredDevices()
    clearStoredPets()
    setAccount(null)
    setPets([])
    setView({ name: 'splash' })
  }, [])

  // 配网结果持久化，刷新后绑定关系不丢失
  useEffect(() => {
    storeDevices(devices)
  }, [devices])

  // 宠物档案持久化（含服务器回传的模型参数）
  useEffect(() => {
    storePets(pets)
  }, [pets])

  const api = useMemo<AppApi>(
    () => ({
      view,
      navigate,
      devices,
      addDevice,
      removeDevice,
      pets,
      addPet,
      account,
      signIn,
      updateAccount,
      signOut,
    }),
    [view, navigate, devices, addDevice, removeDevice, pets, addPet, account, signIn, updateAccount, signOut],
  )

  return (
    <AppContext.Provider value={api}>
      <div className="relative flex h-dvh flex-col bg-[#f7f7f8] text-[#171717]">
        {renderView(view)}
      </div>
    </AppContext.Provider>
  )
}

export default App

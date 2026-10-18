import { writeMedia } from './mediaStore'
import type { Device, Pet } from './nav'
import { products } from './catalog'

// v3：设备初始态演示修复——升级 key 使上一版本测试期间绑定的设备数据失效，
// 新版本回到「未绑定饮水舱」初始态；同版本会话内绑定仍正常持久化
const deviceStorageKey = 'pet-smart-app:devices-v3'
const petStorageKey = 'pet-smart-app:pets'

/** 历史产品名：持久化设备若仍带着旧名，读取时迁移为 catalog 当前名 */
const legacyProductNames = new Set(['智能饮水机', '宠物暖泉'])

function migrateDeviceName(device: Device): Device {
  if (!legacyProductNames.has(device.name)) {
    return device
  }
  const current = products.find((item) => item.id === device.productId)?.name
  return current && current !== device.name ? { ...device, name: current } : device
}

function isDevice(value: unknown): value is Device {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const item = value as Partial<Device>
  return (
    typeof item.id === 'string' &&
    typeof item.productId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.sn === 'string' &&
    (item.status === 'unbound' || item.status === 'bound' || item.status === 'pending')
  )
}

/** 读取已持久化的设备列表，数据缺失或损坏时回退到默认列表 */
export function readStoredDevices(fallback: Device[], accountId?: string): Device[] {
  try {
    const raw = window.localStorage.getItem(scopedKey(deviceStorageKey, accountId))
    if (!raw) {
      return fallback
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return fallback
    }
    // 允许为空数组：用户主动清空设备后刷新不应恢复默认设备
    return parsed.filter(isDevice).map(migrateDeviceName)
  } catch {
    return fallback
  }
}

export function storeDevices(devices: Device[], accountId: string): void {
  window.localStorage.setItem(scopedKey(deviceStorageKey, accountId), JSON.stringify(devices))
}

function isPet(value: unknown): value is Pet {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const item = value as Partial<Pet>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.birthday === 'string' &&
    (item.gender === 'male' || item.gender === 'female') &&
    typeof item.breed === 'string' &&
    typeof item.model === 'object' &&
    item.model !== null &&
    (item.media === null || item.media === undefined || typeof item.media === 'object')
  )
}

/** 读取已持久化的宠物列表；视频（blobURL）重启后失效，读取时降级为 null */
export function readStoredPets(accountId?: string): Pet[] {
  try {
    const raw = window.localStorage.getItem(scopedKey(petStorageKey, accountId))
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isPet).map((pet) =>
      pet.media?.kind === 'video' ? { ...pet, media: null } : pet,
    )
  } catch {
    return []
  }
}

const petWrites = new Map<string, Promise<void>>()
export async function storePets(pets: Pet[], accountId: string): Promise<void> {
  const snapshot = pets.map((pet) => ({ ...pet }))
  const previous = petWrites.get(accountId) ?? Promise.resolve()
  const job = previous.catch(() => {}).then(async () => {
    for (const pet of snapshot) {
      if (pet.media) await writeMedia(`pet:${accountId}:${pet.id}`, pet.media)
    }
    window.localStorage.setItem(scopedKey(petStorageKey, accountId),
      JSON.stringify(snapshot.map((pet) => ({ ...pet, media: null }))))
  })
  petWrites.set(accountId, job)
  try { await job } finally { if (petWrites.get(accountId) === job) petWrites.delete(accountId) }
}

function scopedKey(key: string, accountId?: string): string {
  return accountId ? `${key}:${encodeURIComponent(accountId)}` : key
}

/** Claim the old shared records once; never expose them to a second account. */
export function migrateLegacyWorkspace(accountId: string): void {
  const profileKey = `silifield:profile:${accountId}`
  const current = localStorage.getItem('pet-smart-app:account')
  if (current && localStorage.getItem(profileKey) === null) {
    const profile = JSON.parse(current) as { id?: string }
    if (profile.id === accountId) localStorage.setItem(profileKey, current)
  }
  const ownerKey = 'pet-smart-app:legacy-owner'
  const owner = localStorage.getItem(ownerKey)
  if (owner && owner !== accountId) return
  localStorage.setItem(ownerKey, accountId)
  for (const key of [deviceStorageKey, petStorageKey]) {
    const target = scopedKey(key, accountId)
    if (localStorage.getItem(target) === null) {
      const old = localStorage.getItem(key)
      if (old !== null) localStorage.setItem(target, old)
    }
  }
}

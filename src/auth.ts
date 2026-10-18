import type { Account, AccountMethod } from './nav'

const accountStorageKey = 'pet-smart-app:account'
const deviceProfileStorageKey = 'pet-smart-app:device-profile'

const simulatedDeviceProfile = {
  phone: '13800138000',
  wechat: 'silifield_demo',
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function readStoredAccount(): Account | null {
  try {
    const raw = window.localStorage.getItem(accountStorageKey)
    if (!raw) {
      return null
    }

    const account = JSON.parse(raw) as Account
    if (
      (account.method === 'phone' || account.method === 'wechat') &&
      typeof account.identifier === 'string' &&
      account.identifier.trim().length > 0
    ) {
      return account
    }
  } catch {
    return null
  }

  return null
}

export function storeAccount(account: Account): void {
  window.localStorage.setItem(accountStorageKey, JSON.stringify(account))
}

export function clearStoredAccount(): void {
  window.localStorage.removeItem(accountStorageKey)
}

export async function detectDeviceAccount(method: AccountMethod): Promise<string | null> {
  await delay(650)

  if (typeof window === 'undefined') {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  if (params.get('demoNoDeviceAccount') === '1') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(deviceProfileStorageKey)
    if (raw) {
      const profile = JSON.parse(raw) as Partial<Record<AccountMethod, string>>
      return profile[method] ?? null
    }
  } catch {
    // Fall through to the default simulated device profile.
  }

  window.localStorage.setItem(deviceProfileStorageKey, JSON.stringify(simulatedDeviceProfile))
  return simulatedDeviceProfile[method]
}

export function maskAccount(method: AccountMethod, identifier: string): string {
  if (method === 'phone' && identifier.length >= 7) {
    return `${identifier.slice(0, 3)}****${identifier.slice(-4)}`
  }
  if (identifier.length <= 3) {
    return identifier
  }
  return `${identifier.slice(0, 2)}***${identifier.slice(-2)}`
}

export function isValidAccount(method: AccountMethod, identifier: string): boolean {
  const value = identifier.trim()
  return method === 'phone' ? /^1\d{10}$/.test(value) : /^[A-Za-z][A-Za-z0-9_-]{5,19}$/.test(value)
}

export function accountId(method: AccountMethod, identifier: string): string {
  return `${method}:${identifier.trim()}`
}

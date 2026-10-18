/** Large media and capture drafts stay out of localStorage. No external upload. */
let opening: Promise<IDBDatabase> | undefined
function database(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('silifield-media', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('records')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { opening = undefined; reject(request.error) }
    request.onblocked = () => { opening = undefined; reject(new Error('本地存储暂不可用，请关闭其他页面后重试')) }
  })
  return opening
}
export async function readMedia<T>(key: string): Promise<T | undefined> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('records', 'readonly')
    const request = transaction.objectStore('records').get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}
export async function writeMedia(key: string, value: unknown): Promise<void> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('records', 'readwrite')
    transaction.objectStore('records').put(value, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error ?? new Error('本地保存失败'))
  })
}
export async function deleteMedia(key: string): Promise<void> {
  const db = await database()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('records', 'readwrite')
    transaction.objectStore('records').delete(key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

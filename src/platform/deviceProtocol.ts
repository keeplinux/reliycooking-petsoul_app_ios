/** Silifield BLE provisioning v1. Credentials are AES-256-GCM encrypted end-to-end. */
export const SERVICE = '28a00001-8c31-4a3b-9d61-425350455431'
export const INFO = '28a00002-8c31-4a3b-9d61-425350455431'
export const CONFIG = '28a00003-8c31-4a3b-9d61-425350455431'
export const STATUS = '28a00004-8c31-4a3b-9d61-425350455431'
export const hex = (bytes: Uint8Array) => Array.from(bytes, (n) => n.toString(16).padStart(2, '0')).join('')
export function unhex(text: string): Uint8Array<ArrayBuffer> {
  if (!/^(?:[a-f0-9]{2})+$/i.test(text)) throw new Error('设备密钥或报文格式错误')
  return Uint8Array.from(text.match(/../g)!, (part) => parseInt(part, 16))
}
export async function seal(key: string, aad: string, value: unknown): Promise<string> {
  const secret = await crypto.subtle.importKey('raw', unhex(key), 'AES-GCM', false, ['encrypt'])
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: new TextEncoder().encode(aad) }, secret, new TextEncoder().encode(JSON.stringify(value)))
  return JSON.stringify({ v: 1, nonce: hex(nonce), cipher: hex(new Uint8Array(cipher)) })
}
export async function open(key: string, aad: string, raw: string): Promise<unknown> {
  const envelope = JSON.parse(raw) as { v: number; nonce: string; cipher: string }
  if (envelope.v !== 1 || !/^[a-f0-9]{24}$/i.test(envelope.nonce) || envelope.cipher.length > 4096) throw new Error('设备回执格式错误')
  const secret = await crypto.subtle.importKey('raw', unhex(key), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unhex(envelope.nonce), additionalData: new TextEncoder().encode(aad) }, secret, unhex(envelope.cipher))
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(plain))
}
export function frames(text: string): DataView[] {
  const bytes = new TextEncoder().encode(text)
  if (bytes.length > 2048) throw new Error('设备报文过长')
  return Array.from({ length: Math.ceil(bytes.length / 18) }, (_, index) => {
    const chunk = bytes.slice(index * 18, (index + 1) * 18)
    const packet = new Uint8Array(chunk.length + 2)
    packet[0] = index; packet[1] = (index + 1) * 18 >= bytes.length ? 1 : 0
    packet.set(chunk, 2)
    return new DataView(packet.buffer)
  })
}
export class FrameReader {
  private bytes: number[] = []
  private next = 0
  push(packet: DataView): string | undefined {
    if (packet.byteLength < 3 || packet.byteLength > 20) throw new Error('设备分片长度错误')
    if (packet.getUint8(0) === 0) { this.bytes = []; this.next = 0 }
    if (packet.getUint8(0) !== this.next++ || packet.getUint8(1) > 1) throw new Error('设备分片顺序错误')
    for (let i = 2; i < packet.byteLength; i++) this.bytes.push(packet.getUint8(i))
    if (this.bytes.length > 2048) throw new Error('设备报文过长')
    if (packet.getUint8(1) === 1) {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(this.bytes))
      this.next = 0; this.bytes = []; return text
    }
  }
}

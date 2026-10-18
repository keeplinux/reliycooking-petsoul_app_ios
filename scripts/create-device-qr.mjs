import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import QRCode from 'qrcode'
const sn = process.argv[2]
const product = process.argv[3] ?? 'smart-water'
if (!sn || !/^[A-Z0-9-]{4,32}$/.test(sn)) throw new Error('用法：node scripts/create-device-qr.mjs SF000001 smart-water（序列号为4–32位大写字母、数字或横线）')
if (!['smart-water','smart-feeder','auto-litter','pet-camera','pet-tracker'].includes(product)) throw new Error('未知型号')
const output = resolve('.build/factory', sn)
try { await access(output); throw new Error('该设备目录已存在，不会覆盖既有密钥。请保留原二维码。') } catch (e) { if (e.code !== 'ENOENT') throw e }
await mkdir(output, { recursive: true, mode: 0o700 })
const key = randomBytes(32).toString('hex')
const payload = JSON.stringify({ v: 1, p: product, sn, key })
await writeFile(resolve(output, 'qr-payload.json'), payload, { mode: 0o600 })
await QRCode.toFile(resolve(output, 'device-qr.png'), payload, { width: 800, margin: 4, errorCorrectionLevel: 'M' })
const config = `#pragma once\n#define DEVICE_SN "${sn}"\n#define DEVICE_PRODUCT "${product}"\n#define DEVICE_KEY_HEX "${key}"\n`
await writeFile(resolve(output, 'device_config.h'), config, { mode: 0o600 })
console.log(`设备 ${sn} 已生成二维码与固件配置：${output}\n请妥善保管；二维码包含设备密钥，不要提交 Git 或公开发布。`)

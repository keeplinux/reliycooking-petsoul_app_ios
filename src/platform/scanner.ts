import { Capacitor } from '@capacitor/core'
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner'
import jsQR from 'jsqr'

export interface ScannerAdapter { scanDeviceQr(): Promise<string> }
let adapter: ScannerAdapter | undefined
export function configureScannerAdapter(next: ScannerAdapter): void { adapter = next }
export async function scanDeviceQr(): Promise<string> {
  if (adapter) return adapter.scanDeviceQr()
  if (!Capacitor.isNativePlatform()) throw new Error('请在手机 App 中打开相机扫码，或从相册选择二维码')
  const result = await CapacitorBarcodeScanner.scanBarcode({ hint: CapacitorBarcodeScannerTypeHint.QR_CODE, scanInstructions: '扫描设备机身二维码', scanButton: false })
  if (!result.ScanResult) throw new Error('未识别到二维码')
  return result.ScanResult
}
export async function readQrImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) throw new Error('请选择不超过 20MB 的二维码图片')
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('无法读取图片')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const result = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
    if (!result) throw new Error('图片中没有可识别的二维码，请选择清晰原图')
    return result.data
  } finally { URL.revokeObjectURL(url) }
}

/**
 * 自定义头像图片处理：把相册/相机返回的图片居中裁切成方形并压缩，
 * 控制 localStorage 持久化体积（256×256 JPEG，约 10-30KB）。
 */
export async function toSquareAvatarImage(dataUrl: string, size = 256): Promise<string> {
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('canvas 不可用')
  }
  const side = Math.min(image.width, image.height)
  const sx = (image.width - side) / 2
  const sy = (image.height - side) / 2
  ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = src
  })
}

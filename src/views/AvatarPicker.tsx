import { useState } from 'react'
import { Camera as CameraIcon, Check, ImageUp, LoaderCircle } from 'lucide-react'
import { Camera, CameraResultType, CameraSource } from '../platform/camera'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { AvatarBadge } from '../components/AvatarBadge'
import { avatarPresets, getAvatarPreset } from '../avatars'
import { toSquareAvatarImage } from '../avatarImage'

export function AvatarPickerView() {
  const { navigate, account, updateAccount } = useApp()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const currentId = account?.avatarId
  const currentLabel = account?.avatarImage ? '自定义图片' : getAvatarPreset(currentId).label

  function select(id: string) {
    updateAccount({ avatarId: id, avatarImage: undefined })
  }

  async function pickImage(source: CameraSource) {
    setSheetOpen(false)
    setImportError(null)
    setImporting(true)
    try {
      const photo = await Camera.getPhoto({
        source,
        resultType: CameraResultType.DataUrl,
        width: 512,
        quality: 85,
        correctOrientation: true,
      })
      if (!photo.dataUrl) {
        throw new Error('未获取到图片')
      }
      const avatarImage = await toSquareAvatarImage(photo.dataUrl)
      updateAccount({ avatarImage, avatarId: undefined })
    } catch (error) {
      // 用户取消或拒绝权限（安卓上插件会请求相机/相册系统权限）不提示
      const message = error instanceof Error ? error.message : String(error)
      if (!/cancel|denied/i.test(message)) {
        setImportError('图片读取失败，请重试')
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <TopBar title="自定义头像" onBack={() => navigate({ name: 'settings' })} />
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 safe-bottom">
        <section className="flex flex-col items-center gap-3 pt-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="更换头像（拍照或从相册选择）"
            className="relative rounded-full transition hover:opacity-85"
          >
            <AvatarBadge account={account} size={96} />
            <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border-2 border-[#f7f7f8] bg-[#171717] text-white">
              {importing ? <LoaderCircle size={16} className="animate-spin" /> : <CameraIcon size={16} />}
            </span>
          </button>
          <p className="m-0 text-sm font-medium">{currentLabel}</p>
          <p className="m-0 text-xs text-[#171717]/45">点击头像，从相册选择或使用相机拍摄</p>
          {importError && <p className="m-0 text-xs text-[#b3261e]">{importError}</p>}
        </section>

        <section>
          <p className="m-0 px-1 pb-2 text-xs text-[#171717]/45">选择形象</p>
          <div className="grid grid-cols-4 gap-3">
            {avatarPresets.map((item) => {
              const Icon = item.icon
              const selected = !account?.avatarImage && item.id === currentId
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  aria-pressed={selected}
                  aria-label={item.label}
                  className="relative flex flex-col items-center gap-1.5 rounded-lg py-2 hover:bg-[#171717]/4"
                >
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-full transition ${
                      selected ? 'ring-2 ring-[#171717] ring-offset-2 ring-offset-[#f7f7f8]' : ''
                    }`}
                    style={{ backgroundColor: item.bg, color: item.fg }}
                  >
                    <Icon size={26} strokeWidth={1.8} />
                  </span>
                  <span className="text-[11px] text-[#171717]/60">{item.label}</span>
                  {selected && (
                    <span className="absolute right-1.5 top-1 grid h-4.5 w-4.5 place-items-center rounded-full bg-[#171717] text-white">
                      <Check size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      </main>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <section className="relative safe-bottom-lg rounded-t-2xl bg-white px-5 pt-4">
            <span className="mx-auto block h-1 w-10 rounded-full bg-[#171717]/15" />
            <button
              type="button"
              onClick={() => void pickImage(CameraSource.Camera)}
              className="mt-4 flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-[#171717]/5"
            >
              <CameraIcon size={19} /> 使用相机拍摄
            </button>
            <button
              type="button"
              onClick={() => void pickImage(CameraSource.Photos)}
              className="mt-1 flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-[#171717]/5"
            >
              <ImageUp size={19} /> 从相册选择
            </button>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="mt-3 h-10 w-full rounded-lg text-sm font-medium text-[#171717]/55 hover:bg-[#171717]/5"
            >
              取消
            </button>
          </section>
        </div>
      )}
    </>
  )
}

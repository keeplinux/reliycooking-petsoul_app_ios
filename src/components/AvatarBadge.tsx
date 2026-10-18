import type { Account } from '../nav'
import { getAvatarPreset } from '../avatars'

/**
 * 统一头像徽章：自定义图片（相册/相机）优先，否则回退预设形象。
 * Settings 与 AvatarPicker 共用，保证两处回显一致。
 */
export function AvatarBadge({
  account,
  size = 44,
  className = '',
}: {
  account: Account | null | undefined
  size?: number
  className?: string
}) {
  const image = account?.avatarImage
  if (image) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#171717]/5 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={image}
          alt="自定义头像"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
    )
  }

  const preset = getAvatarPreset(account?.avatarId)
  const Icon = preset.icon
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: preset.bg, color: preset.fg }}
    >
      <Icon size={Math.round(size * 0.52)} strokeWidth={1.8} />
    </span>
  )
}

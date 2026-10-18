import { Bot, Cat, Dog, Moon, Rabbit, Rocket, Sparkles, Star } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AvatarPreset = {
  id: string
  label: string
  icon: LucideIcon
  /** 圆形底色 */
  bg: string
  /** 图标颜色（统一白色系） */
  fg: string
}

/** 默认头像：宇航猫（宇宙叙事主角） */
export const DEFAULT_AVATAR_ID = 'cat'

export const avatarPresets: AvatarPreset[] = [
  { id: 'cat', label: '宇航猫', icon: Cat, bg: '#153C2A', fg: '#ffffff' },
  { id: 'rocket', label: '火箭', icon: Rocket, bg: '#3B4E9B', fg: '#ffffff' },
  { id: 'star', label: '星星', icon: Star, bg: '#B4771E', fg: '#ffffff' },
  { id: 'moon', label: '月亮', icon: Moon, bg: '#3D4A5C', fg: '#ffffff' },
  { id: 'sparkles', label: '星尘', icon: Sparkles, bg: '#9B4A5E', fg: '#ffffff' },
  { id: 'bot', label: '机器人', icon: Bot, bg: '#2E6E62', fg: '#ffffff' },
  { id: 'dog', label: '太空犬', icon: Dog, bg: '#8A5A2B', fg: '#ffffff' },
  { id: 'rabbit', label: '月兔', icon: Rabbit, bg: '#6B4E8C', fg: '#ffffff' },
]

export function getAvatarPreset(id: string | undefined): AvatarPreset {
  return avatarPresets.find((preset) => preset.id === id) ?? avatarPresets[0]
}

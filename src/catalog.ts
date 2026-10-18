import type { DeviceKind, Product } from './nav'

export const products: Product[] = [
  {
    id: 'smart-feeder',
    name: '智能投食机',
    category: '喂食',
    description: '定时定量投喂、远程控制',
    image: '/products/smart-feeder.svg',
    variants: [
      { model: '标准版', color: '星舰白', bg: '#EEF0F2' },
      { model: '标准版', color: '月岩灰', bg: '#E3E4E8' },
      { model: '大容量版', color: '星云紫', bg: '#ECE6F4' },
      { model: '大容量版', color: '火星橙', bg: '#F6E7DB' },
    ],
  },
  {
    id: 'auto-litter',
    name: '自动猫砂盆',
    category: '清洁',
    description: '自动清洁、除臭抑菌',
    image: '/products/auto-litter.svg',
    variants: [
      { model: '单猫版', color: '星舰白', bg: '#EEF0F2' },
      { model: '单猫版', color: '极光青', bg: '#E0F0ED' },
      { model: '双猫版', color: '月岩灰', bg: '#E3E4E8' },
      { model: '双猫版', color: '星云紫', bg: '#ECE6F4' },
    ],
  },
  {
    id: 'smart-water',
    name: '饮水舱',
    category: '饮水',
    description: '流动活水、滤芯提醒',
    image: '/products/smart-water.svg',
    variants: [
      { model: '标准版', color: '星海蓝', bg: '#E4EAF2' },
      { model: '标准版', color: '星舰白', bg: '#EEF0F2' },
      { model: '无线版', color: '极光青', bg: '#E0F0ED' },
      { model: '无线版', color: '月尘米', bg: '#F0EAE0' },
    ],
  },
  {
    id: 'pet-camera',
    name: '宠物摄像头',
    category: '看护',
    description: '高清监控、双向语音',
    image: '/products/pet-camera.svg',
    variants: [
      { model: '高清版', color: '星舰白', bg: '#EEF0F2' },
      { model: '高清版', color: '深空灰', bg: '#DEE0E4' },
      { model: '云台版', color: '星云紫', bg: '#ECE6F4' },
      { model: '云台版', color: '火星橙', bg: '#F6E7DB' },
    ],
  },
  {
    id: 'pet-tracker',
    name: '宠物定位器',
    category: '安全',
    description: '实时定位、防走失',
    image: '/products/pet-tracker.svg',
    variants: [
      { model: '轻量版', color: '火星橙', bg: '#F6E7DB' },
      { model: '轻量版', color: '极光青', bg: '#E0F0ED' },
      { model: '长续航版', color: '星舰白', bg: '#EEF0F2' },
      { model: '长续航版', color: '月岩灰', bg: '#E3E4E8' },
    ],
  },
]

export function kindForProduct(productId: string): DeviceKind {
  switch (productId) {
    case 'smart-feeder':
      return 'feeder'
    case 'auto-litter':
      return 'litter'
    case 'smart-water':
      return 'water'
    case 'pet-camera':
      return 'camera'
    case 'pet-tracker':
      return 'tracker'
    default:
      return 'generic'
  }
}

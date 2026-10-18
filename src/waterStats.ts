import type { Pet } from './nav'

export type WaterStatPeriod = 'day' | 'week' | 'month'

export type PetWaterSeries = {
  petId: string
  name: string
  color: string
  series: Record<WaterStatPeriod, number[]>
}

/** 各周期的数据点数（图表布局用，不再依赖具体宠物序列） */
export const periodPoints: Record<WaterStatPeriod, number> = {
  day: 24,
  week: 7,
  month: 30,
}

export const periodTabLabels: Record<WaterStatPeriod, string> = {
  day: '日',
  week: '周',
  month: '月',
}

export const periodTicks: Record<WaterStatPeriod, { indexes: number[]; labels: string[] }> = {
  day: {
    indexes: [0, 3, 6, 9, 12, 15, 18, 21],
    labels: ['0', '3', '6', '9', '12', '15', '18', '21'],
  },
  week: {
    indexes: [0, 1, 2, 3, 4, 5, 6],
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
  month: {
    indexes: [0, 5, 10, 15, 20, 25, 29],
    labels: ['1', '6', '11', '16', '21', '26', '30'],
  },
}

/** 图例配色（按宠物顺序轮换） */
const statColors = ['#f59e0b', '#0d9488', '#8b5cf6', '#ec4899', '#3b82f6', '#14b8a6']

/** 日序列基准形状：猫早晚各一个饮水高峰（ml） */
const dayBase = [
  0, 0, 8, 15, 22, 40, 52, 65, 58, 38, 28, 20, 14, 10, 12, 18, 25, 34, 46, 60, 52, 32, 14, 5,
]
/** 周序列基准（每日总量 ml） */
const weekBase = [360, 430, 410, 480, 445, 520, 500]
/** 月序列基准（每日总量 ml） */
const monthBase = [
  320, 355, 340, 380, 410, 395, 420, 445, 430, 460, 475, 450, 440, 465, 480, 495, 470, 460, 485,
  500, 510, 490, 480, 505, 515, 500, 510, 525, 520, 535,
]

/** 字符串 → 稳定散列种子（同一宠物每次生成的序列一致） */
function hashSeed(text: string): number {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 0xffffffff
  }
  return hash || 1
}

/** mulberry32：确定性伪随机，保证演示数据跨会话稳定 */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 日序列合计（当日总饮水量） */
export function dayTotal(series: PetWaterSeries): number {
  return series.series.day.reduce((sum, value) => sum + value, 0)
}

/**
 * 按实际录入的宠物生成饮水统计序列：
 * 数量与 pets 严格一致（0 只 → 空数组），序列数值按宠物 id+名字哈希稳定生成。
 */
export function buildWaterStatPets(pets: Pet[]): PetWaterSeries[] {
  return pets.map((pet, index) => {
    const rand = makeRandom(hashSeed(`${pet.id}:${pet.name}`))
    // 每只宠物 0.8 - 1.2 倍的稳定缩放，个体间有差异但形状一致
    const scale = 0.8 + rand() * 0.4
    return {
      petId: pet.id,
      name: pet.name,
      color: statColors[index % statColors.length],
      series: {
        day: dayBase.map((value) => Math.round(value * scale)),
        week: weekBase.map((value) => Math.round(value * scale)),
        month: monthBase.map((value) => Math.round(value * scale)),
      },
    }
  })
}

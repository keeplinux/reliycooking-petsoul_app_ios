import type { Pet } from './nav'
import { buildWaterStatPets, dayTotal } from './waterStats'

export type SmartWaterDeviceData = {
  name: string
  online: boolean
  location: string
  /** 当日总饮水量（ml）；未录入宠物时为 0 */
  todayWaterMl: number
  bottleEquivalent: number
  /** 设备侧读数：无宠物数据时为 null（页面显示空白） */
  waterLevelPercent: number | null
  waterLevelText: string | null
  waterTemperatureC: number | null
  waterTemperatureText: string | null
  waterQualityPercent: number | null
  waterQualityText: string | null
  flowEnabled: boolean
  lightEnabled: boolean
}

/**
 * 按实际录入的宠物生成饮水舱数据：
 * - 当日饮水量 = 各宠物日序列合计（与图表数据同源，0 只宠物时为 0）
 * - 剩余水量/水温/水质为设备上报读数：尚未录入宠物（数据为空）时全部为 null，
 *   页面显示空白；录入后按设备读数展示
 */
export function buildSmartWaterData(pets: Pet[]): SmartWaterDeviceData {
  const statPets = buildWaterStatPets(pets)
  const todayWaterMl = statPets.reduce((sum, pet) => sum + dayTotal(pet), 0)
  const empty = pets.length === 0
  return {
    name: '饮水舱',
    online: true,
    location: '客厅',
    todayWaterMl,
    bottleEquivalent: Math.round((todayWaterMl / 250) * 10) / 10,
    waterLevelPercent: empty ? null : 85,
    waterLevelText: empty ? null : '充足',
    waterTemperatureC: empty ? null : 26.5,
    waterTemperatureText: empty ? null : '适宜',
    waterQualityPercent: empty ? null : 96,
    waterQualityText: empty ? null : '健康',
    flowEnabled: true,
    lightEnabled: true,
  }
}

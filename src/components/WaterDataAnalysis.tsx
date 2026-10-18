import { useMemo, useState } from 'react'
import type { Pet } from '../nav'
import type { PetWaterSeries, WaterStatPeriod } from '../waterStats'
import { buildWaterStatPets, periodPoints, periodTabLabels, periodTicks } from '../waterStats'

const periods: WaterStatPeriod[] = ['day', 'week', 'month']

export function WaterDataAnalysis({ pets }: { pets: Pet[] }) {
  const [period, setPeriod] = useState<WaterStatPeriod>('day')
  const [point, setPoint] = useState(0)
  const [hiddenPets, setHiddenPets] = useState<Set<string>>(new Set())

  // 序列按实际录入的宠物生成：数量一致、数值按宠物哈希稳定
  const statPets = useMemo(() => buildWaterStatPets(pets), [pets])

  if (statPets.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-[#171717]/15 bg-white px-4 py-10 text-center">
        <p className="m-0 text-sm font-medium text-[#171717]/60">暂无宠物饮水数据</p>
        <p className="m-0 mt-1 text-xs text-[#171717]/45">
          添加宠物后可预览示例统计；真实监测数据尚未接入
        </p>
      </section>
    )
  }

  const visiblePets = statPets.filter((pet) => !hiddenPets.has(pet.petId))
  const allValues = visiblePets.flatMap((pet) => pet.series[period])
  const yMax = Math.max(50, Math.ceil(Math.max(0, ...allValues) / 50) * 50)
  const now = new Date()
  const date = now.toLocaleDateString('zh-CN')
  const range = period === 'day' ? `${date} · 截至 ${now.getHours()} 时` : period === 'week' ? '本周一至今天' : `${now.getMonth() + 1} 月 1 日至今天`
  const selectedPoint = Math.min(point, (statPets[0]?.series[period].length ?? 1) - 1)

  function togglePet(petId: string) {
    setHiddenPets((prev) => {
      const next = new Set(prev)
      if (next.has(petId)) {
        next.delete(petId)
      } else {
        next.add(petId)
      }
      return next
    })
  }

  return (
    <section className="py-1">
      <h2 className="m-0 text-lg">{period === 'day' ? '今日' : period === 'week' ? '本周' : '本月'}饮水量</h2>
      <p className="mb-3 mt-1 text-sm text-[#666]">示例数据 · {range} · 单位 ml</p>
      <div className="mb-3 flex items-center justify-end">
        <div className="grid grid-cols-3 rounded-lg bg-[#171717]/5 p-0.5 text-xs">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setPeriod(item); setPoint(0) }}
              aria-pressed={period === item}
              className={`rounded-md px-3 py-1 font-medium ${
                period === item ? 'bg-[#171717] text-white' : 'text-[#171717]/50'
              }`}
            >
              {periodTabLabels[item]}
            </button>
          ))}
        </div>
      </div>

      {visiblePets.length > 0 ? <WaterChart pets={visiblePets} period={period} yMax={yMax} /> : <p role="status" className="rounded-xl bg-[#eee] p-4 text-sm">已隐藏全部宠物，点击下方名字重新显示。</p>}
      <label className="mt-3 flex min-h-11 items-center justify-between gap-3 text-sm">查看时段
        <select aria-label="查看饮水时段" className="min-h-11 rounded-lg border bg-white px-3" value={selectedPoint} onChange={(event) => setPoint(Number(event.target.value))}>
          {statPets[0].series[period].map((_, index) => <option key={index} value={index}>{period === 'day' ? `${index}:00–${index}:59` : period === 'week' ? `周${['一','二','三','四','五','六','日'][index]}` : `${index + 1} 日`}</option>)}
        </select>
      </label>
      <p role="status" className="text-sm text-[#555]">{visiblePets.map((pet) => `${pet.name}：${pet.series[period][selectedPoint] ?? 0} ml`).join('；') || '请先显示一只宠物'}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {statPets.map((pet) => {
          const hidden = hiddenPets.has(pet.petId)
          return (
            <button
              key={pet.petId}
              type="button"
              onClick={() => togglePet(pet.petId)}
              aria-pressed={!hidden}
              className={`flex items-center gap-2 rounded-lg bg-[#171717]/4 px-3 py-2 text-xs transition ${
                hidden ? 'opacity-40' : ''
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pet.color }} />
              <span className="font-medium">{pet.name}</span>
              <span className="text-[#171717]/50">{formatLiters(totalFor(pet, period))} L</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function WaterChart({
  pets,
  period,
  yMax,
}: {
  pets: PetWaterSeries[]
  period: WaterStatPeriod
  yMax: number
}) {
  const width = 320
  const height = 140
  const padX = 34
  const padTop = 18
  const padBottom = 20
  const innerWidth = width - padX * 2
  const innerHeight = height - padTop - padBottom
  // 数据点数按周期固定，不依赖具体宠物（避免 0 只宠物时取值崩溃）
  const pointCount = periodPoints[period]
  const ticks = periodTicks[period]
  const slotW = innerWidth / pointCount
  const barGap = 1.5
  const barW = Math.max(
    2,
    Math.min(7, (slotW * 0.72 - barGap * Math.max(0, pets.length - 1)) / Math.max(1, pets.length)),
  )
  const groupW = barW * pets.length + barGap * Math.max(0, pets.length - 1)
  const baseline = padTop + innerHeight

  function slotCenter(index: number) {
    return padX + index * slotW + slotW / 2
  }

  function pointY(value: number) {
    return padTop + innerHeight - (value / yMax) * innerHeight
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`${periodTabLabels[period]}期饮水量条形图`}
    >
      <text x="0" y="11" fontSize="10" fill="#555">ml</text>
      {[0, 0.5, 1].map((fraction) => <text key={fraction} x={padX - 5} y={padTop + innerHeight * (1 - fraction) + 3} textAnchor="end" fontSize="10" fill="#555">{Math.round(yMax * fraction)}</text>)}
      {[0.25, 0.5, 0.75].map((fraction) => (
        <line
          key={fraction}
          x1={padX}
          x2={width - padX}
          y1={pointY(yMax * fraction)}
          y2={pointY(yMax * fraction)}
          stroke="#171717"
          strokeOpacity={0.08}
        />
      ))}

      <line
        x1={padX}
        x2={width - padX}
        y1={baseline}
        y2={baseline}
        stroke="#171717"
        strokeOpacity={0.12}
      />

      {ticks.indexes.map((index, i) => (
        <text
          key={index}
          x={slotCenter(index)}
          y={height - 6}
          textAnchor="middle"
          fontSize="9"
          fill="#171717"
          fillOpacity="0.45"
        >
          {ticks.labels[i]}
        </text>
      ))}

      {pets.map((pet, petIndex) => (
        <g key={pet.petId}>
          {pet.series[period].map((value, i) => {
            if (value <= 0) {
              return null
            }
            const barH = Math.max((value / yMax) * innerHeight, 1.5)
            const x = padX + i * slotW + (slotW - groupW) / 2 + petIndex * (barW + barGap)
            return (
              <rect
                key={i}
                x={x}
                y={baseline - barH}
                width={barW}
                height={barH}
                rx={Math.min(1.5, barW / 2)}
                fill={pet.color}
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

function totalFor(pet: PetWaterSeries, period: WaterStatPeriod) {
  return pet.series[period].reduce((sum, value) => sum + value, 0)
}

/** 毫升转升展示：大数值保留 1 位小数，小数值保留 2 位 */
function formatLiters(ml: number) {
  const liters = ml / 1000
  return liters >= 10 ? liters.toFixed(1) : liters.toFixed(2)
}

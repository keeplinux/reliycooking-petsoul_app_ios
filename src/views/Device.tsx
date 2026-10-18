import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Camera, ChevronLeft, Pause, Play, QrCode, Video, Wifi } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { WaterDataAnalysis } from '../components/WaterDataAnalysis'
import { buildSmartWaterData } from '../deviceData'
import { payloadFromDevice } from '../provisioning'
import type { Pet } from '../nav'

/** 一段录像：start 为当天起始分钟，duration 单位分钟 */
type RecordClip = {
  start: number
  duration: number
  title: string
  petName: string
  waterMl: number
  photo: string
}

/** 一个录像日：dateKey 为 YYYY-MM-DD */
type RecordDay = {
  dateKey: string
  label: string
  clips: RecordClip[]
}

function dateKeyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/** 演示照片素材（按宠物与片段轮换） */
const clipPhotos = [
  '/clips/clip-nuomi-day.jpg',
  '/clips/clip-tuanzi.jpg',
  '/clips/clip-nuomi-night.jpg',
]

/** 片段命名（宇宙叙事风格），按哈希稳定挑选 */
const clipTitles = [
  '清晨巡航饮水',
  '早餐补给饮水',
  '上午远征饮水',
  '午后探索饮水',
  '傍晚星航饮水',
  '夜间巡航饮水',
  '晨间巡游饮水',
]

/** 常见饮水时段（起始小时）：猫早晚饮水高峰 */
const clipHours = [6, 7, 8, 9, 15, 16, 20, 21]

function hashSeed(text: string): number {
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 0xffffffff
  }
  return hash || 1
}

/** mulberry32：确定性伪随机，同一宠物跨会话生成相同的录像记录 */
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

/**
 * 按实际录入的宠物生成近三天演示录像：宠物数量与名字和实际绑定数量一致
 * （0 只 → 空数组，录像区展示空态）；单次饮水时长不超过 3 分钟。
 */
function buildRecordDays(pets: Pet[]): RecordDay[] {
  if (pets.length === 0) {
    return []
  }
  const now = new Date()
  const back = (days: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - days)
  return [0, 1, 2].map((dayOffset) => {
    const clips: RecordClip[] = []
    pets.forEach((pet, petIndex) => {
      const rand = makeRandom(hashSeed(`${pet.id}:${pet.name}:${dayOffset}`))
      const count = rand() < 0.65 ? 2 : 1
      const usedHours = new Set<number>()
      for (let i = 0; i < count; i += 1) {
        let hour = clipHours[Math.floor(rand() * clipHours.length)]
        // 同一只宠物同一天的两段录像错开时段
        while (usedHours.has(hour)) {
          hour = clipHours[Math.floor(rand() * clipHours.length)]
        }
        usedHours.add(hour)
        clips.push({
          start: hour * 60 + Math.floor(rand() * 50),
          duration: 1 + Math.floor(rand() * 3),
          title: clipTitles[Math.floor(rand() * clipTitles.length)],
          petName: pet.name,
          waterMl: 60 + Math.floor(rand() * 61),
          photo: clipPhotos[(petIndex + i) % clipPhotos.length],
        })
      }
    })
    clips.sort((a, b) => a.start - b.start)
    return {
      dateKey: dateKeyOf(back(dayOffset)),
      label: dayOffset === 0 ? '今天' : dayOffset === 1 ? '昨天' : '前天',
      clips,
    }
  })
}

export function DeviceView({ deviceId }: { deviceId: string }) {
  const { navigate, devices, pets } = useApp()
  const device = devices.find((item) => item.id === deviceId)
  // 设备数据按实际录入的宠物生成（数量一致；未录入时为空数据）
  const data = useMemo(() => buildSmartWaterData(pets), [pets])
  const recordDays = useMemo(() => buildRecordDays(pets), [pets])
  const [flowOn, setFlowOn] = useState(data.flowEnabled)
  const [lightOn, setLightOn] = useState(data.lightEnabled)

  if (!device) {
    return (
      <>
        <TopBar title="设备" onBack={() => navigate({ name: 'home' })} />
        <main className="flex flex-1 items-center justify-center p-4">
          <p className="m-0 text-sm text-[#171717]/45">设备不存在</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={device.name} onBack={() => navigate({ name: 'home' })} />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 safe-bottom">
        {device.status === 'unbound' ? (
          <div className="flex flex-col gap-2.5 rounded-lg bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <QrCode size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-amber-800">该设备尚未绑定</p>
                <p className="m-0 mt-0.5 text-xs leading-5 text-amber-700">
                  扫描机身二维码完成绑定与配网，饮水数据将按已录入的宠物自动生成。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate({ name: 'scan', expectProductId: device.productId })}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
            >
              <QrCode size={15} /> 扫码绑定
            </button>
          </div>
        ) : device.status === 'pending' ? (
          <div className="flex flex-col gap-2.5 rounded-lg bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <Wifi size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="m-0 text-sm font-medium text-amber-800">该设备尚未配网</p>
                <p className="m-0 mt-0.5 text-xs leading-5 text-amber-700">
                  通过保底热点自动发现（{device.sn}），完成 WiFi 配网后即可正常使用。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                navigate({
                  name: 'provision',
                  payload: payloadFromDevice(device),
                  source: 'hotspot',
                })
              }
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
            >
              <Wifi size={15} /> 立即配网
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-1 text-sm font-medium">
            <span
              className={`h-2 w-2 rounded-full ${device.online ? 'bg-emerald-400' : 'bg-[#171717]/30'}`}
            />
            <span className={`ml-2 ${device.online ? '' : 'text-[#171717]/45'}`}>
              {device.online ? '在线' : '离线'}
            </span>
          </div>
        )}

        {/* 数据区仅绑定后展示；未绑定设备数据为空，只保留绑定引导 */}
        {device.status !== 'unbound' && device.kind === 'water' ? (
          <>
            <WaterDataAnalysis pets={pets} />

            <div className="flex items-center justify-center gap-12">
              <Metric
                label="剩余水量"
                value={formatMetric(data.waterLevelPercent, '%')}
                sub={data.waterLevelText ?? undefined}
              />
              <Metric
                label="水温"
                value={formatMetric(data.waterTemperatureC, '°C')}
                sub={data.waterTemperatureText ?? undefined}
              />
              <Metric
                label="水质"
                value={formatMetric(data.waterQualityPercent, '%')}
                sub={data.waterQualityText ?? undefined}
              />
            </div>

            <section className="py-1">
              <ToggleRow label="流动水" value={flowOn} onChange={setFlowOn} />
              <ToggleRow label="氛围灯" value={lightOn} onChange={setLightOn} />
            </section>

            <CameraSection recordDays={recordDays} />
          </>
        ) : device.kind !== 'water' ? (
          <section className="rounded-lg border border-[#171717]/10 bg-white p-4">
            <p className="m-0 text-sm font-medium">控制界面待接入</p>
            <p className="m-0 mt-1 text-xs text-[#171717]/45">
              {device.name} 的控制功能将在后续版本提供
            </p>
          </section>
        ) : null}
      </main>
    </>
  )
}

function CameraSection({ recordDays }: { recordDays: RecordDay[] }) {
  const [tab, setTab] = useState<'live' | 'history'>('live')
  const [selectedDay, setSelectedDay] = useState<RecordDay | null>(null)
  const [pendingStart, setPendingStart] = useState<number | null>(null)
  const today = recordDays[0]

  // 未录入宠物：没有录像记录，整块展示空态
  if (!today) {
    return (
      <section className="rounded-lg border border-dashed border-[#171717]/15 bg-white px-4 py-10 text-center">
        <Video size={26} className="mx-auto text-[#171717]/25" />
        <p className="m-0 mt-2 text-sm font-medium text-[#171717]/60">暂无饮水录像</p>
        <p className="m-0 mt-1 text-xs text-[#171717]/45">
          录入宠物数字形象后，饮水舱将自动记录宠物的饮水片段
        </p>
      </section>
    )
  }

  return (
    <section className="py-1">
      <div className="mb-3 flex items-center justify-end">
        <div className="grid grid-cols-2 rounded-lg bg-[#171717]/5 p-0.5 text-xs">
          <TabButton active={tab === 'live'} onClick={() => setTab('live')}>
            实时
          </TabButton>
          <TabButton
            active={tab === 'history'}
            onClick={() => {
              setTab('history')
              setSelectedDay(null)
            }}
          >
            历史
          </TabButton>
        </div>
      </div>

      {tab === 'live' ? (
        <div className="flex flex-col gap-3">
          <LiveView />
          <ClipList
            clips={today.clips}
            onSelect={(clip) => {
              setPendingStart(clip.start)
              setSelectedDay(today)
              setTab('history')
            }}
          />
        </div>
      ) : selectedDay ? (
        <HistoryPlayer day={selectedDay} initialStart={pendingStart} onBack={() => setSelectedDay(null)} />
      ) : (
        <CalendarView
          days={recordDays}
          onSelect={(day) => {
            setPendingStart(null)
            setSelectedDay(day)
          }}
        />
      )}
    </section>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1 font-medium ${
        active ? 'bg-[#171717] text-white' : 'text-[#171717]/50'
      }`}
    >
      {children}
    </button>
  )
}

function LiveView() {
  return (
    <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[#171717]">
      <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-[#171717]">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> 实时
      </span>
      <Camera size={38} className="text-white/60" />
    </div>
  )
}

/** 日历选择器：有录像的日期可选，选中后进入当天回放 */
function CalendarView({
  days,
  onSelect,
}: {
  days: RecordDay[]
  onSelect: (day: RecordDay) => void
}) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // 周一为 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const byKey = new Map(days.map((day) => [day.dateKey, day]))
  const todayKey = dateKeyOf(now)
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日']

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="m-0 text-sm font-semibold">
        {year}年{month + 1}月
      </p>
      <div className="grid w-full max-w-72 grid-cols-7">
        {weekLabels.map((label) => (
          <span
            key={label}
            className="grid h-8 place-items-center text-[10px] text-[#171717]/40"
          >
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} />
          }
          const key = dateKeyOf(new Date(year, month, day))
          const record = byKey.get(key)
          const isToday = key === todayKey
          return (
            <button
              key={key}
              type="button"
              disabled={!record}
              onClick={() => record && onSelect(record)}
              className={`relative grid h-10 place-items-center rounded-full text-sm ${
                record
                  ? 'font-medium hover:bg-[#171717]/8'
                  : 'text-[#171717]/25'
              } ${isToday ? 'outline outline-1 outline-offset-2 outline-[#171717]/40' : ''}`}
            >
              {day}
              {record && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#171717]/55" />
              )}
            </button>
          )
        })}
      </div>
      <p className="m-0 text-[10px] text-[#171717]/40">带圆点的日期有录像记录</p>
    </div>
  )
}

/** 分钟数转 H:MM（小时不补零，如 6:47） */
function fmtMinute(minute: number) {
  const clamped = Math.max(0, Math.min(1439, Math.round(minute)))
  return `${Math.floor(clamped / 60)}:${String(clamped % 60).padStart(2, '0')}`
}

/** 饮水片段截取列表：宠物名 + 饮用量 + 时间，右侧实拍照片贴合行边框 */
function ClipList({
  clips,
  activeStart,
  onSelect,
}: {
  clips: RecordClip[]
  activeStart?: number | null
  onSelect: (clip: RecordClip) => void
}) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {clips.map((clip) => {
        const active = activeStart != null && activeStart === clip.start
        return (
          <li key={`${clip.start}-${clip.title}`}>
            <button
              type="button"
              onClick={() => onSelect(clip)}
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-lg py-3 pl-3 pr-[6.5rem] text-left ${
                active ? 'bg-[#171717]/10' : 'bg-[#171717]/4'
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171717]/5">
                <Play size={15} fill="currentColor" className="ml-0.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {clip.petName} · {clip.title}
                </span>
                <span className="mt-0.5 flex items-center gap-3 text-xs text-[#171717]/45">
                  <span>{fmtMinute(clip.start)}</span>
                  <span>{clip.waterMl}ml</span>
                  <span>{clip.duration}分钟</span>
                </span>
              </span>
              <img
                src={clip.photo}
                alt={`${clip.petName}饮水照片`}
                className="absolute right-0 top-0 h-full w-24 object-cover"
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

const PX_PER_MIN = 4
const DAY_MINUTES = 24 * 60

/** 历史回放：画面内嵌 24 小时时间轴，拖动滚动条自由拉取时间段 */
function HistoryPlayer({
  day,
  initialStart,
  onBack,
}: {
  day: RecordDay
  initialStart: number | null
  onBack: () => void
}) {
  const [minute, setMinute] = useState(() => initialStart ?? day.clips[0]?.start ?? 0)
  const [playing, setPlaying] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const activeClip =
    day.clips.find((clip) => minute >= clip.start && minute < clip.start + clip.duration) ?? null

  // 挂载 / 换日期 / 指定起始片段时定位时间轴
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollLeft = (initialStart ?? day.clips[0]?.start ?? 0) * PX_PER_MIN
    }
  }, [day, initialStart])

  // 播放推进：每 200ms 前进 0.1 分钟（演示倍速，单次饮水 1-3 分钟），离开片段自动停止
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      const el = scrollRef.current
      if (!el) {
        setPlaying(false)
        return
      }
      const next = el.scrollLeft + 0.1 * PX_PER_MIN
      el.scrollLeft = next
      const m = next / PX_PER_MIN
      const inClip = day.clips.some((clip) => m >= clip.start && m < clip.start + clip.duration)
      if (!inClip || m >= DAY_MINUTES - 1) {
        setPlaying(false)
      }
    }, 200)
    return () => clearInterval(timer)
  }, [playing, day])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    setMinute(el.scrollLeft / PX_PER_MIN)
  }

  const clipProgress =
    activeClip && activeClip.duration > 0
      ? Math.min(1, Math.max(0, (minute - activeClip.start) / activeClip.duration))
      : 0

  function jumpToClip(clip: RecordClip) {
    setPlaying(false)
    const el = scrollRef.current
    if (el) {
      el.scrollLeft = clip.start * PX_PER_MIN
      setMinute(clip.start)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-[#171717]">
        <span className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-[#171717]">
            {day.label} {fmtMinute(minute)}
          </span>
          {activeClip && (
            <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-[#171717]">
              {activeClip.title}
            </span>
          )}
        </span>

      <button
        type="button"
        onClick={onBack}
        className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-medium text-white/85 hover:bg-white/20"
      >
        <ChevronLeft size={12} /> 换日期
      </button>

      {activeClip ? (
        <>
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? '暂停' : '播放'}
            className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#171717]"
          >
            {playing ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <div className="absolute inset-x-3 bottom-14">
            <div className="h-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${clipProgress * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-white/80">
              <span>{fmtMinute(activeClip.start)}</span>
              <span>{fmtMinute(activeClip.start + activeClip.duration)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 text-white/50">
          <Video size={30} />
          <span className="text-xs">该时间段无录像</span>
        </div>
      )}

      {/* 画面内嵌 24 小时时间轴：拖动滚动条拉取时间段，中心线为当前时间 */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="relative bg-black/45">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="timeline-scroll h-10 overflow-x-auto"
          >
            <div className="relative h-10" style={{ width: DAY_MINUTES * PX_PER_MIN, margin: '0 50%' }}>
              {day.clips.map((clip) => (
                <span
                  key={clip.start}
                  className="absolute top-1.5 h-1.5 rounded-full bg-amber-400/90"
                  style={{
                    left: clip.start * PX_PER_MIN,
                    width: Math.max(6, clip.duration * PX_PER_MIN),
                  }}
                />
              ))}
              {Array.from({ length: 96 }, (_, i) =>
                i % 4 === 0 ? null : (
                  <span
                    key={`tick-${i}`}
                    className="absolute bottom-3.5 h-1 w-px bg-white/20"
                    style={{ left: i * 15 * PX_PER_MIN }}
                  />
                ),
              )}
              {Array.from({ length: 24 }, (_, h) => (
                <span key={`hour-${h}`} className="absolute bottom-0 h-10" style={{ left: h * 60 * PX_PER_MIN }}>
                  <span className="absolute bottom-3.5 h-2 w-px bg-white/40" />
                  <span className="absolute bottom-0.5 left-0 -translate-x-1/2 text-[8px] text-white/55">
                    {String(h).padStart(2, '0')}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <span className="pointer-events-none absolute left-1/2 top-0 h-10 w-0.5 -translate-x-1/2 rounded-full bg-white" />
        </div>
      </div>
      </div>

      {/* 当天饮水片段截取列表：点击定位到时间轴对应位置 */}
      <ClipList clips={day.clips} activeStart={activeClip?.start ?? null} onSelect={jumpToClip} />
    </div>
  )
}

/** 设备读数格式化：无数据（null）时显示空白占位 */
function formatMetric(value: number | null, unit: string): string {
  return value == null ? '--' : `${value}${unit}`
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="m-0 whitespace-nowrap text-[10px] text-[#171717]/45">{label}</p>
      <p className="m-0 mt-1 whitespace-nowrap text-sm font-semibold leading-none">{value}</p>
      {sub && <p className="m-0 mt-1 whitespace-nowrap text-[10px] text-[#171717]/50">{sub}</p>}
    </div>
  )
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-3">
      <span className="text-sm text-[#171717]/60">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          value ? 'bg-[#171717]' : 'bg-[#171717]/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-[left] ${
            value ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

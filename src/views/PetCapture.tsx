import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import * as THREE from 'three'
import { Camera, Check, Image as ImageIcon, LoaderCircle, RotateCw, Upload, Video } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { buildPetModelSeed, recognizePetBreed } from '../petModel'
import type { PetGender, PetMedia } from '../nav'

type BuildPhase = 'editing' | 'uploading' | 'building' | 'returning'
type MediaMode = 'photos' | 'video'
type ViewSlot = 'front' | 'left' | 'right' | 'back'

const buildPhaseLabel: Record<BuildPhase, string> = {
  editing: '',
  uploading: '正在上传资料…',
  building: '正在识别品种并构建模型…',
  returning: '模型回传中…',
}

/** 四视图引导顺序：模型连续正向转身（正 → 左 → 背 → 右），姿态角依次 +90° */
const captureOrder: { key: ViewSlot; angle: number; label: string; hint: string }[] = [
  { key: 'front', angle: 0, label: '正视图', hint: '宠物的面部朝镜头' },
  { key: 'left', angle: Math.PI / 2, label: '左侧视图', hint: '宠物的左侧朝镜头' },
  { key: 'back', angle: Math.PI, label: '后背视图', hint: '宠物的背面朝镜头' },
  { key: 'right', angle: Math.PI * 1.5, label: '右侧视图', hint: '宠物的右侧朝镜头' },
]

/** 未拍缩略图占位单字 */
const viewShort: Record<ViewSlot, string> = { front: '正', left: '左', back: '背', right: '右' }

/** 将任意 yaw 磁吸到最近的 90° 姿态角（保持连续值，不取模） */
function snapYaw(yaw: number): number {
  const step = Math.PI / 2
  return Math.round(yaw / step) * step
}

/** 当前正对镜头的视图在 captureOrder 中的序号 */
function nearestViewIndex(yaw: number): number {
  const TWO_PI = Math.PI * 2
  const normalized = ((yaw % TWO_PI) + TWO_PI) % TWO_PI
  return Math.round(normalized / (Math.PI / 2)) % 4
}

/** 图片压缩为 dataURL（最长边 640），便于 localStorage 持久化 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxSide = 640
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('canvas 不可用'))
          return
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      image.onerror = () => reject(new Error('图片读取失败'))
      image.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export function PetCapture() {
  const { navigate, addPet } = useApp()
  const cameraRef = useRef<HTMLInputElement>(null)
  const albumRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const pendingViewRef = useRef<ViewSlot>('front')
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [gender, setGender] = useState<PetGender>('male')

  const [mediaMode, setMediaMode] = useState<MediaMode>('photos')
  const [views, setViews] = useState<Record<ViewSlot, string | null>>({
    front: null,
    left: null,
    right: null,
    back: null,
  })
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [captureIndex, setCaptureIndex] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [phase, setPhase] = useState<BuildPhase>('editing')

  const building = phase !== 'editing'
  const currentView = captureOrder[captureIndex]
  const photosReady = captureOrder.every((item) => views[item.key])
  /** 已录入的视图：3D 引导模型对应面被上色点亮 */
  const filledViews = captureOrder.filter((item) => views[item.key]).map((item) => item.key)
  const mediaReady = mediaMode === 'photos' ? photosReady : videoUrl !== null
  const formReady = name.trim().length > 0 && mediaReady

  function pickPhoto(picker: 'camera' | 'album') {
    pendingViewRef.current = currentView.key
    const input = picker === 'camera' ? cameraRef.current : albumRef.current
    input?.click()
  }

  function pickVideo() {
    videoRef.current?.click()
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('image/')) {
      return
    }
    const slot = pendingViewRef.current
    try {
      const dataUrl = await compressImage(file)
      setViews((prev) => ({ ...prev, [slot]: dataUrl }))
      // 模型转身到下一个视图（连续正向旋转）
      const shotIndex = captureOrder.findIndex((item) => item.key === slot)
      setCaptureIndex((shotIndex + 1) % captureOrder.length)
    } catch {
      // 读取失败保持该视图未采集
    }
  }

  function handleVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !file.type.startsWith('video/')) {
      return
    }
    setVideoUrl(URL.createObjectURL(file))
  }

  function switchMode(mode: MediaMode) {
    if (building) {
      return
    }
    setMediaMode(mode)
  }

  function submit() {
    if (!formReady || building) {
      return
    }
    setPhase('uploading')
    // 模拟服务器链路：上传 → 构建 → 回传（demo 阶段本地生成假模型参数）
    window.setTimeout(() => setPhase('building'), 900)
    window.setTimeout(() => setPhase('returning'), 2100)
    window.setTimeout(() => {
      const media: PetMedia | null =
        mediaMode === 'photos'
          ? {
              kind: 'photos',
              front: views.front!,
              left: views.left!,
              right: views.right!,
              back: views.back!,
            }
          : { kind: 'video', url: videoUrl! }
      addPet({
        id: `pet-${Date.now()}`,
        name: name.trim(),
        birthday,
        gender,
        // 品种由云服务器按录入媒体识别回传（demo 模拟识别）
        breed: recognizePetBreed({ name: name.trim(), birthday }),
        media,
        model: buildPetModelSeed({ name: name.trim(), birthday }),
      })
      navigate({ name: 'home' })
    }, 2600)
  }

  return (
    <>
      <TopBar title="录入宠物数字形象" onBack={() => navigate({ name: 'home' })} />
      <main className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-4 safe-bottom">
        {/* 采集模式切换 */}
        <div className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-lg bg-[#171717]/5 p-1">
          <button
            type="button"
            onClick={() => switchMode('photos')}
            aria-pressed={mediaMode === 'photos'}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${
              mediaMode === 'photos' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#171717]/50'
            }`}
          >
            <ImageIcon size={14} /> 四视图照片
          </button>
          <button
            type="button"
            onClick={() => switchMode('video')}
            aria-pressed={mediaMode === 'video'}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition ${
              mediaMode === 'video' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#171717]/50'
            }`}
          >
            <Video size={14} /> 环绕视频
          </button>
        </div>

        {mediaMode === 'photos' ? (
          /* 3D 模型转身引导采集：点击模型拍摄，拍完自动转身到下一视图 */
          <div className="w-full max-w-sm">
            <p className="m-0 mb-2 text-xs text-[#171717]/55">
              跟随模型转身，依次拍摄 4 张视图
            </p>
            <div className="relative aspect-square overflow-hidden rounded-xl border border-[#171717]/10 bg-white">
              <CaptureStage
                targetView={currentView.key}
                filledViews={filledViews}
                draggable={photosReady && !building}
                onShoot={() => setSheetOpen(true)}
                onViewSpin={(view) => {
                  const index = captureOrder.findIndex((item) => item.key === view)
                  if (index >= 0 && index !== captureIndex) {
                    setCaptureIndex(index)
                  }
                }}
                disabled={building}
              />
              <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white">
                {captureIndex + 1} / 4 · {currentView.label}
              </span>
              <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-3 py-1 text-[11px] text-[#171717]/60 shadow-sm">
                {currentView.hint} · 点击模型拍摄
              </span>
            </div>
            {/* 进度缩略图：点击跳转到对应视图并直接弹出采集选项（添加/更换照片） */}
            <div className="mt-2 grid grid-cols-4 gap-2">
              {captureOrder.map((item, index) => {
                const image = views[item.key]
                const current = index === captureIndex
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={building}
                    onClick={() => {
                      // 模型转身到该视图 + 直接进入采集选项
                      setCaptureIndex(index)
                      setSheetOpen(true)
                    }}
                    aria-pressed={current}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition disabled:opacity-60 ${
                      current ? 'border-[#171717]/80 ring-1 ring-[#171717]/40' : 'border-[#171717]/10'
                    } ${image ? '' : 'bg-[#171717]/5'}`}
                  >
                    {image ? (
                      <img src={image} alt={item.label} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-sm font-medium text-[#171717]/35">
                        {viewShort[item.key]}
                      </span>
                    )}
                    {image && (
                      <span className="absolute left-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-[#171717] text-white">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {!photosReady && (
              <p className="m-0 mt-2 text-center text-[11px] text-[#171717]/40">
                还差 {captureOrder.filter((item) => !views[item.key]).length} 张视图
              </p>
            )}
          </div>
        ) : (
          /* 环绕视频采集 */
          <div className="w-full max-w-sm">
            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#171717]/20 bg-white">
              {videoUrl ? (
                <video src={videoUrl} controls className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 px-8 text-center text-[#171717]/40">
                  <RotateCw size={24} />
                  <span className="text-xs leading-5">
                    请围绕宠物录制一圈（360° 环拍），
                    <br />
                    确保收集全面的外表信息
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={building}
                onClick={pickVideo}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#171717]/15 bg-white py-3 text-sm font-medium hover:bg-[#171717]/3 disabled:opacity-50"
              >
                <Video size={18} /> 选择环绕视频
              </button>
              <button
                type="button"
                disabled={building || !videoUrl}
                onClick={pickVideo}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#171717]/15 bg-white py-3 text-sm font-medium hover:bg-[#171717]/3 disabled:opacity-50"
              >
                <RotateCw size={16} /> 重新选择
              </button>
            </div>
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handlePhoto} />
        <input ref={albumRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        <input ref={videoRef} type="file" accept="video/*" hidden onChange={handleVideo} />

        {/* 基础资料 */}
        <div className="flex w-full max-w-sm flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs text-[#171717]/55">
            宠物名字
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={building}
              maxLength={12}
              placeholder="比如：咪咪"
              className="rounded-lg border border-[#171717]/15 bg-white px-3 py-2.5 text-sm text-[#171717] outline-none placeholder:text-[#171717]/30 focus:border-[#171717]/40"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-[#171717]/55">
            生日
            <input
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
              disabled={building}
              type="date"
              className="rounded-lg border border-[#171717]/15 bg-white px-3 py-2.5 text-sm text-[#171717] outline-none focus:border-[#171717]/40"
            />
          </label>

          <div className="flex flex-col gap-1.5 text-xs text-[#171717]/55">
            性别
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={building}
                  onClick={() => setGender(option)}
                  aria-pressed={gender === option}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                    gender === option
                      ? 'border-[#171717]/60 bg-[#171717]/5 text-[#171717]'
                      : 'border-[#171717]/15 bg-white text-[#171717]/55 hover:bg-[#171717]/3'
                  }`}
                >
                  {option === 'male' ? '弟弟 ♂' : '妹妹 ♀'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 提交与构建状态 */}
        <button
          type="button"
          disabled={!formReady || building}
          onClick={submit}
          className={`flex w-full max-w-sm items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition ${
            formReady && !building
              ? 'bg-[#171717] text-white hover:bg-[#171717]/85'
              : 'cursor-not-allowed bg-[#171717]/10 text-[#171717]/40'
          }`}
        >
          {building ? (
            <>
              <LoaderCircle size={18} className="animate-spin" /> {buildPhaseLabel[phase]}
            </>
          ) : (
            <>
              <Upload size={18} /> 上传并开始构建
            </>
          )}
        </button>
      </main>

      {/* 采集选项弹层：拍照 / 相册 */}
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
            <p className="m-0 mt-3 text-center text-xs text-[#171717]/50">{currentView.label}</p>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false)
                pickPhoto('camera')
              }}
              className="mt-3 flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-[#171717]/5"
            >
              <Camera size={19} /> 使用相机拍摄
            </button>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false)
                pickPhoto('album')
              }}
              className="mt-1 flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-[#171717]/5"
            >
              <ImageIcon size={19} /> 从相册选择
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

/** 引导模型部件：实体填充层 + 线框层双层渲染，按所属视图面分组上色 */
type GuidePart = {
  fill: THREE.Mesh
  wire: THREE.Mesh
  /** 上色后的固有色（橘猫主体 / 黑眼睛） */
  baseColor: number
}

/** 上色/褪色动画任务 */
type PaintAnim = {
  part: GuidePart
  start: number
  colored: boolean
}

/** 未录入态：淡色数字模板 */
const GHOST_FILL = 0xc3d2e4
const GHOST_WIRE = 0x7e9cc4
/** 已录入态：橘猫主体色 */
const PAINT_BODY = 0xe08a4e

/**
 * 引导模型：几何沿用 App 的猫体，但身体椭球拆为 4 个 90° 扇区（正面/左侧/背面/右侧），
 * 各部件按朝向归入所属视图面——录入对应视图后该面部件整体上色点亮。
 */
function createGuideModel(): { group: THREE.Group; faces: Record<ViewSlot, GuidePart[]> } {
  const group = new THREE.Group()
  const faces: Record<ViewSlot, GuidePart[]> = { front: [], left: [], back: [], right: [] }

  function addPart(geometry: THREE.BufferGeometry, face: ViewSlot, baseColor = PAINT_BODY) {
    const fill = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: GHOST_FILL,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        roughness: 0.9,
      }),
    )
    const wire = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: GHOST_WIRE,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      }),
    )
    wire.renderOrder = 2
    group.add(fill, wire)
    faces[face].push({ fill, wire, baseColor })
  }

  // 身体椭球按经度拆 4 个 90° 扇区（phi：0=-X 左侧，π/2=+Z 正面，π=+X 右侧，±3π/2=-Z 背面；
  // 扇区中心对准各面，边界落在 45° 斜角上，left 用负 phiStart 跨零点衔接）
  const bodySectors: { face: ViewSlot; phiStart: number }[] = [
    { face: 'front', phiStart: Math.PI / 4 },
    { face: 'left', phiStart: -Math.PI / 4 },
    { face: 'back', phiStart: -(Math.PI * 3) / 4 },
    { face: 'right', phiStart: (Math.PI * 3) / 4 },
  ]
  for (const sector of bodySectors) {
    const geometry = new THREE.SphereGeometry(0.24, 6, 12, sector.phiStart, Math.PI / 2)
    geometry.scale(1.15, 0.85, 1.25)
    geometry.translate(0, 0.3, 0)
    addPart(geometry, sector.face)
  }

  // 头 / 耳 / 眼朝前，归属正面
  const headGeometry = new THREE.SphereGeometry(0.18, 16, 12)
  headGeometry.translate(0, 0.54, 0.2)
  addPart(headGeometry, 'front')

  for (const [x, tilt] of [
    [-0.1, -0.25],
    [0.1, 0.25],
  ] as const) {
    const earGeometry = new THREE.ConeGeometry(0.07, 0.12, 4)
    earGeometry.rotateZ(tilt)
    earGeometry.translate(x, 0.68, 0.18)
    addPart(earGeometry, 'front')
  }

  for (const x of [-0.07, 0.07]) {
    const eyeGeometry = new THREE.SphereGeometry(0.028, 8, 6)
    eyeGeometry.translate(x, 0.56, 0.34)
    addPart(eyeGeometry, 'front', 0x171717)
  }

  // 尾巴在后侧，归属背面
  const tailGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.38, 8)
  tailGeometry.rotateX(1.1)
  tailGeometry.rotateZ(0.4)
  tailGeometry.translate(-0.2, 0.4, -0.2)
  addPart(tailGeometry, 'back')

  return { group, faces }
}

/**
 * 3D 引导采集台：引导模型以淡色线框的"数字模板"形态展示，
 * 每录入一个视图，模型对应的一面被上色点亮；点击模型触发采集选项。
 */
function CaptureStage({
  targetView,
  filledViews,
  draggable,
  onShoot,
  onViewSpin,
  disabled,
}: {
  targetView: ViewSlot
  filledViews: ViewSlot[]
  /** 四视图采集完毕后允许拖拽自由旋转 */
  draggable: boolean
  onShoot: () => void
  /** 拖拽旋转中当前正对镜头的视图变化回调（缩略图高亮同步） */
  onViewSpin: (view: ViewSlot) => void
  disabled: boolean
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const facesRef = useRef<Record<ViewSlot, GuidePart[]> | null>(null)
  const targetYawRef = useRef(0)
  const disabledRef = useRef(disabled)
  const onShootRef = useRef(onShoot)
  const filledViewsRef = useRef(filledViews)
  const draggableRef = useRef(draggable)
  const onViewSpinRef = useRef(onViewSpin)
  const draggingRef = useRef(false)
  const faceStateRef = useRef<Record<ViewSlot, boolean>>({
    front: false,
    left: false,
    back: false,
    right: false,
  })
  const animsRef = useRef<PaintAnim[]>([])

  // 事件回调走 ref，避免画布重建；每次渲染后同步最新值
  useEffect(() => {
    disabledRef.current = disabled
    onShootRef.current = onShoot
    filledViewsRef.current = filledViews
    draggableRef.current = draggable
    onViewSpinRef.current = onViewSpin
    const canvas = mountRef.current?.firstElementChild
    if (canvas instanceof HTMLElement) {
      canvas.style.cursor = disabled ? 'default' : draggable ? 'grab' : 'pointer'
    }
  })

  // 目标视图变化：计算正向最短增量，模型连续转身（不倒转）；
  // 拖拽旋转中跳过（跟手优先），松手时统一磁吸
  useEffect(() => {
    if (draggingRef.current) return
    const angle = captureOrder.find((item) => item.key === targetView)?.angle ?? 0
    const TWO_PI = Math.PI * 2
    const current = targetYawRef.current
    const currentMod = ((current % TWO_PI) + TWO_PI) % TWO_PI
    const delta = ((angle - currentMod) + TWO_PI) % TWO_PI
    targetYawRef.current = current + delta
  }, [targetView])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20)
    camera.position.set(0, 1.1, 2.6)
    camera.lookAt(0, 0.45, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'pointer'
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbcc7d1, 1.5))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6)
    keyLight.position.set(2, 3, 2)
    scene.add(keyLight)

    const guide = createGuideModel()
    groupRef.current = guide.group
    facesRef.current = guide.faces
    scene.add(guide.group)

    // 挂载即按当前已录入照片恢复上色（定格，不做动画）。
    // StrictMode 双挂载下 ref 状态会跨批次残留，初始状态必须以数据为准重建，
    // 不能依赖联动 effect 的差异对比；后续增量变化才走渐入动画。
    animsRef.current = []
    const filled = filledViewsRef.current
    for (const item of captureOrder) {
      const colored = filled.includes(item.key)
      faceStateRef.current[item.key] = colored
      if (!colored) continue
      for (const part of guide.faces[item.key]) {
        const fillMat = part.fill.material as THREE.MeshStandardMaterial
        fillMat.color.set(part.baseColor)
        fillMat.opacity = 1
        fillMat.transparent = false
        fillMat.depthWrite = true
        part.wire.visible = false
      }
    }

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 32),
      new THREE.MeshStandardMaterial({ color: 0x171717, transparent: true, opacity: 0.06 }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // 指针交互：涂色完毕后可横向拖拽自由旋转（跟手 + 松手磁吸回正 + 视图回调同步）；
    // 短按且射线命中模型则触发采集选项
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const el = renderer.domElement
    let pressed = false
    let dragging = false
    let downX = 0
    let downY = 0
    let lastX = 0
    let lastSpin: ViewSlot | null = null
    const onPointerDown = (event: PointerEvent) => {
      pressed = true
      dragging = false
      downX = event.clientX
      downY = event.clientY
      lastX = event.clientX
      if (draggableRef.current) {
        el.setPointerCapture(event.pointerId)
        el.style.cursor = 'grabbing'
      }
    }
    const onPointerMove = (event: PointerEvent) => {
      if (!pressed || !draggableRef.current) return
      if (!dragging && Math.abs(event.clientX - downX) > 6) {
        dragging = true
        draggingRef.current = true
      }
      if (!dragging) return
      const model = groupRef.current
      if (!model) return
      const rect = el.getBoundingClientRect()
      const dx = event.clientX - lastX
      lastX = event.clientX
      // 跟手旋转（拖满画布宽约转半圈），同步目标角防回弹
      model.rotation.y += dx * (Math.PI / Math.max(rect.width, 1))
      targetYawRef.current = model.rotation.y
      // 实时回调当前正对镜头的视图（缩略图高亮同步）
      const view = captureOrder[nearestViewIndex(model.rotation.y)].key
      if (view !== lastSpin) {
        lastSpin = view
        onViewSpinRef.current(view)
      }
    }
    const onPointerUp = (event: PointerEvent) => {
      pressed = false
      el.style.cursor = disabledRef.current ? 'default' : draggableRef.current ? 'grab' : 'pointer'
      if (dragging) {
        // 松手：磁吸到最近的 90° 视图姿态
        dragging = false
        draggingRef.current = false
        const model = groupRef.current
        if (model) {
          targetYawRef.current = snapYaw(model.rotation.y)
        }
        return
      }
      const dx = event.clientX - downX
      const dy = event.clientY - downY
      if (dx * dx + dy * dy > 36) return
      const rect = el.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      if (groupRef.current && raycaster.intersectObject(groupRef.current, true).length > 0) {
        onShootRef.current()
      }
    }
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)

    let raf = 0
    const resize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(mount)

    const tick = (time: number) => {
      const model = groupRef.current
      if (model) {
        // 姿态平滑过渡（指数缓出）+ 轻微待机浮动
        model.rotation.y += (targetYawRef.current - model.rotation.y) * 0.08
        model.position.y = Math.sin(time * 0.0016) * 0.015
      }
      // 上色动画推进（渐入点亮 / 渐出褪色）
      const anims = animsRef.current
      for (let i = anims.length - 1; i >= 0; i--) {
        const anim = anims[i]
        const progress = Math.min(1, (time - anim.start) / 300)
        const fillMat = anim.part.fill.material as THREE.MeshStandardMaterial
        const wireMat = anim.part.wire.material as THREE.MeshBasicMaterial
        if (anim.colored) {
          fillMat.color.set(anim.part.baseColor)
          fillMat.opacity = 0.32 + progress * 0.68
          fillMat.transparent = progress < 1
          fillMat.depthWrite = progress >= 1
          wireMat.opacity = 0.5 * (1 - progress)
          if (progress >= 1) {
            anim.part.wire.visible = false
            anims.splice(i, 1)
          }
        } else {
          fillMat.color.set(GHOST_FILL)
          fillMat.transparent = true
          fillMat.opacity = 0.32 + (1 - progress) * 0.68
          fillMat.depthWrite = false
          anim.part.wire.visible = true
          wireMat.opacity = 0.5 * progress
          if (progress >= 1) {
            anims.splice(i, 1)
          }
        }
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick(performance.now())

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const material = object.material
          if (Array.isArray(material)) {
            material.forEach((item) => item.dispose())
          } else {
            material.dispose()
          }
        }
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  // 已录入视图变化：对应面渐入上色（300ms）。
  // 必须声明在场景初始化 effect 之后：挂载时按声明序执行，
  // 确保画布重建（如切换采集模式返回）时 facesRef 已就绪，已有照片立即恢复上色。
  useEffect(() => {
    const faces = facesRef.current
    if (!faces) return
    for (const item of captureOrder) {
      const colored = filledViews.includes(item.key)
      if (faceStateRef.current[item.key] === colored) continue
      faceStateRef.current[item.key] = colored
      for (const part of faces[item.key]) {
        animsRef.current.push({ part, start: performance.now(), colored })
      }
    }
  }, [filledViews])

  return <div ref={mountRef} className="h-full w-full" />
}

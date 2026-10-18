import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bluetooth,
  Check,
  CircleAlert,
  CircleCheckBig,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Link2,
  LoaderCircle,
  QrCode,
  RefreshCw,
  Signal,
  TriangleAlert,
  Wifi,
} from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { products } from '../catalog'
import { scanRecognizeMs } from '../config'
import { HOTSPOT_SSID } from '../hotspot'
import {
  bleSteps,
  buildProvisionResult,
  hotspotSteps,
  isFiveGhzSsid,
  makeFailure,
  provisionSteps,
  randomRssi,
  runSimSteps,
  simulateQrRecognition,
  sourceLabel,
} from '../provisioning'
import type { ProvisionFailure, ProvisionResult, QrPayload } from '../provisioning'
import type { ProvisionSource } from '../nav'

/**
 * 配网向导阶段：
 * scan 扫码识别 → ble 自动连接设备 BLE / hotspot 校验保底热点会话
 * → wifi 填写 WiFi 信息 → provision 下发配网并云端绑定 → success / error
 */
type Phase =
  | { name: 'scan' }
  | { name: 'ble'; payload: QrPayload }
  | { name: 'hotspot'; payload: QrPayload }
  | { name: 'wifi'; payload: QrPayload }
  | { name: 'provision'; payload: QrPayload; ssid: string }
  | { name: 'success'; payload: QrPayload; result: ProvisionResult }
  | { name: 'error'; failure: ProvisionFailure; payload: QrPayload }

const scanLabels = ['扫码识别', 'BLE 连接', 'WiFi 配网', '绑定完成']
const hotspotLabels = ['热点发现', '会话校验', 'WiFi 配网', '绑定完成']

export function ScanView({
  initialPayload,
  source = 'scan',
  expectProductId,
}: {
  initialPayload?: QrPayload
  source?: ProvisionSource
  /** 从未绑定设备的「扫码绑定」入口进入时锁定产品型号，只识别该产品 */
  expectProductId?: string
}) {
  const { navigate, devices, addDevice } = useApp()
  const [phase, setPhase] = useState<Phase>(() => {
    if (!initialPayload) {
      return { name: 'scan' }
    }
    return source === 'hotspot'
      ? { name: 'hotspot', payload: initialPayload }
      : { name: 'ble', payload: initialPayload }
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [rssi, setRssi] = useState(-52)
  const [recognizing, setRecognizing] = useState(false)
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [wifiError, setWifiError] = useState<string | null>(null)
  const [fallbackPrompt, setFallbackPrompt] = useState(false)
  // 本次扫码会话开始前设备是否已绑定（用于成功页「更新绑定信息」提示）
  const [ownedAtSession, setOwnedAtSession] = useState(false)
  const recognizeTimer = useRef<number | undefined>(undefined)

  const labels = source === 'hotspot' ? hotspotLabels : scanLabels

  useEffect(() => () => window.clearTimeout(recognizeTimer.current), [])

  /** 进入失败态；扫码通道失败时主动提示改用保底热点直连 */
  const fail = useCallback(
    (failure: ProvisionFailure, payload: QrPayload) => {
      setPhase({ name: 'error', failure, payload })
      if (failure.suggestHotspot && source === 'scan') {
        setFallbackPrompt(true)
      }
    },
    [source],
  )

  // 各阶段均为分步流程，阶段变化时自动驱动
  useEffect(() => {
    if (phase.name === 'success') {
      // 配网成功即写入绑定：之后无论点「完成」「再配一台」还是直接返回，
      // 已成功的绑定都不会丢失（addDevice 按 sn 幂等 upsert）
      addDevice({
        productId: phase.payload.productId,
        sn: phase.payload.sn,
        mac: phase.payload.mac,
        wifiSsid: phase.result.ssid,
        status: 'bound',
        source,
      })
      return undefined
    }
    if (phase.name === 'ble') {
      return runSimSteps(bleSteps, {
        onStep: setStepIndex,
        onDone: () => setPhase({ name: 'wifi', payload: phase.payload }),
        onError: (failure) => fail(failure, phase.payload),
      })
    }
    if (phase.name === 'hotspot') {
      return runSimSteps(hotspotSteps, {
        onStep: setStepIndex,
        onDone: () => setPhase({ name: 'wifi', payload: phase.payload }),
        onError: (failure) => fail(failure, phase.payload),
      })
    }
    if (phase.name === 'provision') {
      // 设备固件无法加入 5GHz 频段，属于真实硬件限制
      const failure = isFiveGhzSsid(phase.ssid) ? makeFailure('WIFI_UNSUPPORTED_BAND') : null
      return runSimSteps(
        provisionSteps,
        {
          onStep: setStepIndex,
          onDone: () =>
            setPhase({
              name: 'success',
              payload: phase.payload,
              result: buildProvisionResult(phase.ssid),
            }),
          onError: (next) => fail(next, phase.payload),
        },
        failure,
      )
    }
    return undefined
  }, [phase, fail, addDevice, source])

  function beginSession(payload: QrPayload) {
    setRssi(randomRssi())
    setStepIndex(0)
    setFallbackPrompt(false)
    // 快照会话开始前的绑定状态：成功页的「已在设备列表」提示不受本次会话写入影响
    setOwnedAtSession(devices.some((device) => device.sn === payload.sn && device.status === 'bound'))
    setPhase(source === 'hotspot' ? { name: 'hotspot', payload } : { name: 'ble', payload })
  }

  function startRecognize() {
    if (recognizing) {
      return
    }
    setRecognizing(true)
    recognizeTimer.current = window.setTimeout(() => {
      setRecognizing(false)
      beginSession(simulateQrRecognition(expectProductId))
    }, scanRecognizeMs)
  }

  function submitWifi(payload: QrPayload) {
    const trimmedSsid = ssid.trim()
    if (!trimmedSsid) {
      setWifiError('请输入 WiFi 名称')
      return
    }
    if (password.length < 8) {
      setWifiError('WiFi 密码至少 8 位')
      return
    }
    setWifiError(null)
    setSsid(trimmedSsid)
    setStepIndex(0)
    setPhase({ name: 'provision', payload, ssid: trimmedSsid })
  }

  function resetWizard() {
    setPhase({ name: 'scan' })
    setRecognizing(false)
    setSsid('')
    setPassword('')
    setWifiError(null)
    setFallbackPrompt(false)
  }

  function finishBinding() {
    if (phase.name !== 'success') {
      return
    }
    // 绑定已在配网成功时写入，这里只负责返回首页
    navigate({ name: 'home' })
  }

  function handleBack() {
    if (phase.name === 'scan' || initialPayload) {
      navigate({ name: 'home' })
      return
    }
    resetWizard()
  }

  function goHotspotFallback() {
    setFallbackPrompt(false)
    navigate({ name: 'hotspot' })
  }

  function wizardIndex(): number {
    switch (phase.name) {
      case 'scan':
        return 0
      case 'ble':
      case 'hotspot':
        return 1
      case 'wifi':
        return 2
      case 'provision':
      case 'success':
        return 3
      case 'error':
        return phase.failure.stage === 'provision' ? 3 : 1
    }
  }

  return (
    <>
      <TopBar title={source === 'hotspot' ? '保底配网' : '扫码配网'} onBack={handleBack} />
      <StepBar labels={labels} current={wizardIndex()} completed={phase.name === 'success'} />
      <main className="flex flex-1 flex-col items-center gap-4 overflow-y-auto p-4 safe-bottom">
        {phase.name === 'scan' && (
          <ScanPanel recognizing={recognizing} onStart={startRecognize} expectProductId={expectProductId} />
        )}
        {phase.name === 'ble' && (
          <SessionPanel
            title="设备蓝牙连接"
            hint="正在连接设备 BLE，请保持手机靠近设备"
            payload={phase.payload}
            rssi={rssi}
            stepIndex={stepIndex}
            steps={bleSteps}
          />
        )}
        {phase.name === 'hotspot' && (
          <SessionPanel
            title="保底热点会话"
            hint={`正在通过 ${HOTSPOT_SSID} 热点与设备建立会话`}
            payload={phase.payload}
            rssi={rssi}
            stepIndex={stepIndex}
            steps={hotspotSteps}
          />
        )}
        {phase.name === 'wifi' && (
          <WifiPanel
            payload={phase.payload}
            source={source}
            ssid={ssid}
            password={password}
            showPassword={showPassword}
            error={wifiError}
            onSsidChange={(value) => {
              setSsid(value)
              setWifiError(null)
            }}
            onPasswordChange={(value) => {
              setPassword(value)
              setWifiError(null)
            }}
            onToggleShow={() => setShowPassword((value) => !value)}
            onSubmit={() => submitWifi(phase.payload)}
          />
        )}
        {phase.name === 'provision' && (
          <ProvisionPanel
            payload={phase.payload}
            source={source}
            ssid={phase.ssid}
            stepIndex={stepIndex}
          />
        )}
        {phase.name === 'success' && (
          <SuccessPanel
            payload={phase.payload}
            source={source}
            result={phase.result}
            owned={ownedAtSession}
            onFinish={finishBinding}
            onAgain={() => {
              if (initialPayload) {
                navigate({ name: 'scan', expectProductId })
                return
              }
              resetWizard()
            }}
          />
        )}
        {phase.name === 'error' && (
          <ErrorPanel
            failure={phase.failure}
            source={source}
            onRetry={() => beginSession(phase.payload)}
            onBackToWifi={() => setPhase({ name: 'wifi', payload: phase.payload })}
            onRescan={() => {
              if (initialPayload) {
                navigate({ name: 'scan', expectProductId })
                return
              }
              resetWizard()
            }}
            onUseHotspot={goHotspotFallback}
          />
        )}
      </main>

      {fallbackPrompt && (
        <FallbackSheet onConfirm={goHotspotFallback} onDismiss={() => setFallbackPrompt(false)} />
      )}
    </>
  )
}

function StepBar({
  labels,
  current,
  completed,
}: {
  labels: string[]
  current: number
  completed: boolean
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-[#171717]/10 bg-white px-5 py-3">
      {labels.map((label, index) => {
        const done = completed || index < current
        const active = !completed && index === current
        return (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                done
                  ? 'bg-[#171717] text-white'
                  : active
                    ? 'border-2 border-[#171717] text-[#171717]'
                    : 'border border-[#171717]/20 text-[#171717]/40'
              }`}
            >
              {done ? <Check size={11} strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={`text-[11px] ${
                active
                  ? 'font-semibold text-[#171717]'
                  : done
                    ? 'text-[#171717]/70'
                    : 'text-[#171717]/40'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function ScanPanel({
  recognizing,
  onStart,
  expectProductId,
}: {
  recognizing: boolean
  onStart: () => void
  expectProductId?: string
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const expected = products.find((item) => item.id === expectProductId)

  return (
    <>
      <button
        type="button"
        onClick={onStart}
        aria-label="扫描产品机身二维码"
        className="relative flex aspect-[3/4] w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-[#171717]"
      >
        <span className="absolute left-5 top-5 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-white/75" />
        <span className="absolute right-5 top-5 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-white/75" />
        <span className="absolute bottom-5 left-5 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-white/75" />
        <span className="absolute bottom-5 right-5 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-white/75" />
        <span className="absolute inset-x-10 h-0.5 animate-[dsh-scanline_2.6s_ease-in-out_infinite] rounded-full bg-white/85 shadow-[0_0_14px_rgba(255,255,255,0.85)]" />

        {recognizing ? (
          <span className="flex flex-col items-center gap-2.5 text-white/85">
            <LoaderCircle size={32} className="animate-spin" />
            <span className="text-xs">正在识别二维码…</span>
          </span>
        ) : (
          <QrCode size={68} className="text-white/22" />
        )}

        <span className="absolute inset-x-0 bottom-6 mx-auto w-fit rounded-full bg-white/12 px-3 py-1 text-[10px] text-white/80">
          {expected ? `将${expected.name}机身二维码放入框内` : '将二维码放入框内'}
        </span>
      </button>

      <p className="m-0 w-full max-w-sm text-center text-xs leading-5 text-[#171717]/45">
        二维码位于产品机身底部，识别成功后手机将自动连接设备并进入配网
      </p>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-11 w-full max-w-sm items-center justify-center gap-2 rounded-lg border border-[#171717]/15 bg-white text-sm font-medium hover:bg-[#171717]/3"
      >
        <ImageIcon size={17} /> 从相册选择二维码
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          if (event.target.files?.length) {
            onStart()
          }
        }}
      />
    </>
  )
}

function SessionPanel({
  title,
  hint,
  payload,
  rssi,
  stepIndex,
  steps,
}: {
  title: string
  hint: string
  payload: QrPayload
  rssi: number
  stepIndex: number
  steps: { key: string; label: string }[]
}) {
  const product = products.find((item) => item.id === payload.productId)

  return (
    <>
      <section className="w-full max-w-sm rounded-xl border border-[#171717]/10 bg-white p-4">
        <h2 className="m-0 text-sm font-semibold">{title}</h2>
        <div className="mt-3 flex items-center gap-3">
          <img src={product?.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-semibold">{product?.name ?? '未知设备'}</p>
            <p className="m-0 mt-0.5 text-xs text-[#171717]/45">SN {payload.sn}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#171717]/5 px-2 py-1 text-[10px] text-[#171717]/55">
            <Signal size={12} /> {rssi} dBm
          </span>
        </div>
        <p className="m-0 mt-3 rounded-lg bg-[#f7f7f8] px-3 py-2 font-mono text-[10px] text-[#171717]/50">
          MAC {payload.mac}
        </p>
      </section>

      <section className="w-full max-w-sm rounded-xl border border-[#171717]/10 bg-white p-2">
        {steps.map((step, index) => (
          <StepRow key={step.key} label={step.label} state={stepState(index, stepIndex)} />
        ))}
      </section>

      <p className="m-0 w-full max-w-sm text-center text-xs text-[#171717]/45">{hint}</p>
    </>
  )
}

function WifiPanel({
  payload,
  source,
  ssid,
  password,
  showPassword,
  error,
  onSsidChange,
  onPasswordChange,
  onToggleShow,
  onSubmit,
}: {
  payload: QrPayload
  source: ProvisionSource
  ssid: string
  password: string
  showPassword: boolean
  error: string | null
  onSsidChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onToggleShow: () => void
  onSubmit: () => void
}) {
  const product = products.find((item) => item.id === payload.productId)

  return (
    <>
      <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-[#171717]/10 bg-white px-4 py-3 text-sm">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <span className="font-medium">{product?.name ?? '设备'}</span>
        <span className="text-xs text-[#171717]/45">
          {source === 'hotspot' ? '热点会话已建立' : 'BLE 已连接'}
        </span>
      </div>

      <section className="w-full max-w-sm rounded-xl border border-[#171717]/10 bg-white p-4">
        <h2 className="m-0 flex items-center gap-1.5 text-sm font-semibold">
          <Wifi size={15} /> WiFi 配网
        </h2>
        <p className="m-0 mt-1 text-xs text-[#171717]/45">
          填入 WiFi 信息，发送给设备完成联网。设备通常只支持 2.4GHz 频段。
        </p>

        <label className="mt-4 block space-y-1.5">
          <span className="text-xs font-medium text-[#171717]/60">WiFi 名称</span>
          <input
            value={ssid}
            onChange={(event) => onSsidChange(event.target.value)}
            placeholder="请输入 WiFi 名称"
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-[#171717]/15 bg-white px-3 text-sm outline-none focus:border-[#171717]/45"
          />
        </label>

        {isFiveGhzSsid(ssid) && (
          <div className="mt-2">
            <Notice text="该网络看起来是 5GHz 频段，设备可能无法连接，建议改用 2.4GHz" />
          </div>
        )}

        <label className="mt-3 block space-y-1.5">
          <span className="text-xs font-medium text-[#171717]/60">WiFi 密码</span>
          <div className="relative">
            <input
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              placeholder="至少 8 位"
              autoComplete="off"
              className="h-11 w-full rounded-lg border border-[#171717]/15 bg-white px-3 pr-11 text-sm outline-none focus:border-[#171717]/45"
            />
            <button
              type="button"
              onClick={onToggleShow}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="absolute right-0 top-0 grid h-11 w-11 place-items-center text-[#171717]/45 hover:text-[#171717]"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>

        {error && <p className="m-0 mt-3 text-xs text-[#b3261e]">{error}</p>}

        <button
          type="button"
          onClick={onSubmit}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          {source === 'hotspot' ? <Link2 size={16} /> : <Bluetooth size={16} />} 开始配网
        </button>
      </section>

      <p className="m-0 w-full max-w-sm text-center text-xs text-[#171717]/40">
        配网时请保持设备通电，且手机与设备距离在 1 米内
      </p>
    </>
  )
}

function ProvisionPanel({
  payload,
  source,
  ssid,
  stepIndex,
}: {
  payload: QrPayload
  source: ProvisionSource
  ssid: string
  stepIndex: number
}) {
  const product = products.find((item) => item.id === payload.productId)

  return (
    <>
      <section className="w-full max-w-sm rounded-xl border border-[#171717]/10 bg-white p-4">
        <div className="flex items-center gap-3">
          <img src={product?.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="m-0 text-sm font-semibold">{product?.name ?? '未知设备'}</p>
            <p className="m-0 mt-0.5 flex items-center gap-1 text-xs text-[#171717]/45">
              <Wifi size={12} /> {ssid}
            </p>
          </div>
        </div>
        <p className="m-0 mt-3 text-[11px] text-[#171717]/45">
          下发通道：{sourceLabel[source]}
        </p>
      </section>

      <section className="w-full max-w-sm rounded-xl border border-[#171717]/10 bg-white p-2">
        {provisionSteps.map((step, index) => (
          <StepRow key={step.key} label={step.label} state={stepState(index, stepIndex)} />
        ))}
      </section>

      <p className="m-0 w-full max-w-sm text-center text-xs text-[#171717]/45">
        正在向设备发送 WiFi 配置，请勿关闭页面或远离设备
      </p>
    </>
  )
}

function SuccessPanel({
  payload,
  source,
  result,
  owned,
  onFinish,
  onAgain,
}: {
  payload: QrPayload
  source: ProvisionSource
  result: ProvisionResult
  owned: boolean
  onFinish: () => void
  onAgain: () => void
}) {
  const product = products.find((item) => item.id === payload.productId)

  return (
    <section className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-[#171717]/10 bg-white p-6">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
        <CircleCheckBig size={30} />
      </span>
      <div className="text-center">
        <h2 className="m-0 text-base font-semibold">配网并绑定成功</h2>
        <p className="m-0 mt-1 text-xs text-[#171717]/45">
          {product?.name ?? '设备'} 已接入 WiFi 并绑定到你的账号
        </p>
      </div>

      <div className="mt-1 w-full rounded-lg bg-[#f7f7f8] p-3">
        <InfoLine label="设备 SN" value={payload.sn} />
        <InfoLine label="WiFi" value={`${result.ssid} · ${result.ip}`} />
        <InfoLine label="配网方式" value={sourceLabel[source]} />
        <InfoLine label="绑定时间" value={result.boundAt} />
      </div>

      {owned && <Notice text="该设备已在设备列表中，本次为更新绑定信息" />}

      <button
        type="button"
        onClick={onFinish}
        className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
      >
        <CircleCheckBig size={16} /> 完成
      </button>
      <button
        type="button"
        onClick={onAgain}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#171717]/20 text-sm font-medium hover:bg-[#171717]/5"
      >
        <RefreshCw size={15} /> 再配一台
      </button>
    </section>
  )
}

function ErrorPanel({
  failure,
  source,
  onRetry,
  onBackToWifi,
  onRescan,
  onUseHotspot,
}: {
  failure: ProvisionFailure
  source: ProvisionSource
  onRetry: () => void
  onBackToWifi: () => void
  onRescan: () => void
  onUseHotspot: () => void
}) {
  const canFallback = failure.suggestHotspot && source !== 'hotspot'

  return (
    <section className="flex w-full max-w-sm flex-col items-center gap-3 rounded-xl border border-[#171717]/10 bg-white p-6">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-500">
        <CircleAlert size={30} />
      </span>
      <div className="text-center">
        <h2 className="m-0 text-base font-semibold">{failure.title}</h2>
        <p className="m-0 mt-1 text-sm">{failure.message}</p>
      </div>

      <p className="m-0 w-full rounded-lg bg-[#f7f7f8] px-3 py-2.5 text-xs leading-5 text-[#171717]/60">
        {failure.hint}
      </p>

      <p className="m-0 font-mono text-[10px] text-[#171717]/35">错误码 {failure.code}</p>

      {failure.stage === 'provision' ? (
        <button
          type="button"
          onClick={onBackToWifi}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          <Wifi size={16} /> 重新填写 WiFi
        </button>
      ) : (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          <RefreshCw size={16} /> {failure.stage === 'hotspot' ? '重新检测' : '重试连接'}
        </button>
      )}

      {canFallback && (
        <button
          type="button"
          onClick={onUseHotspot}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#171717] text-sm font-medium hover:bg-[#171717]/5"
        >
          <Wifi size={16} /> 改用保底配网
        </button>
      )}

      <button
        type="button"
        onClick={onRescan}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#171717]/20 text-sm font-medium hover:bg-[#171717]/5"
      >
        <QrCode size={15} /> 重新扫码
      </button>
    </section>
  )
}

/** 配网失败后自动弹出的保底配网引导 */
function FallbackSheet({
  onConfirm,
  onDismiss,
}: {
  onConfirm: () => void
  onDismiss: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="关闭"
        onClick={onDismiss}
        className="absolute inset-0 bg-black/40"
      />
      <section className="relative safe-bottom-lg rounded-t-2xl bg-white px-5 pt-4">
        <span className="mx-auto block h-1 w-10 rounded-full bg-[#171717]/15" />
        <div className="mt-4 flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600">
            <Wifi size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-base font-semibold">试试保底配网</h2>
            <p className="m-0 mt-1 text-xs leading-5 text-[#171717]/55">
              设备没有完成配网。可以让手机直连设备自己的「{HOTSPOT_SSID}」热点，
              App 会自动发现这台设备并重新下发 WiFi 配置，不需要机身二维码。
              二维码丢失、蓝牙连不上时同样适用。
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          <Wifi size={16} /> 改用保底配网
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 h-10 w-full rounded-lg text-sm font-medium text-[#171717]/55 hover:bg-[#171717]/5"
        >
          稍后再说
        </button>
      </section>
    </div>
  )
}

type StepState = 'pending' | 'active' | 'done'

function stepState(index: number, current: number): StepState {
  if (index < current) {
    return 'done'
  }
  if (index === current) {
    return 'active'
  }
  return 'pending'
}

function StepRow({ label, state }: { label: string; state: StepState }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center">
        {state === 'done' ? (
          <span className="grid h-full w-full place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={14} strokeWidth={3} />
          </span>
        ) : state === 'active' ? (
          <LoaderCircle size={20} className="animate-spin text-[#171717]/70" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-[#171717]/20" />
        )}
      </span>
      <span className={`text-sm ${state === 'pending' ? 'text-[#171717]/40' : 'font-medium'}`}>
        {label}
      </span>
    </div>
  )
}

function Notice({ text }: { text: string }) {
  return (
    <p className="m-0 flex w-full max-w-sm items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
      <TriangleAlert size={14} className="shrink-0" />
      {text}
    </p>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-[#171717]/45">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

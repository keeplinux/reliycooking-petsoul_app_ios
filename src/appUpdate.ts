/**
 * 演示版应用内更新：模拟「检查 → 下载 → 校验 → 安装」进度流。
 * 真机上对应 OTA 差分包下发 + WebView 资源热替换（Capacitor Live Update），
 * demo 阶段以定时推进的进度回调代替，完成后会话内版本号前滚。
 */

export type AppUpdatePhase = 'checking' | 'downloading' | 'verifying' | 'installing' | 'done'

export type AppUpdateState = {
  phase: AppUpdatePhase
  /** 0-100，仅 downloading 阶段有值 */
  progress: number
}

/** 下一版本号：当前 patch + 1（演示用） */
export function nextAppVersion(current: string): string {
  const parts = current.split('.')
  const patch = Number(parts[2] ?? 0)
  return `${parts[0]}.${parts[1] ?? 0}.${patch + 1}`
}

export const APP_UPDATE_NOTES = [
  '优化首页星球拖拽手感与惯性滑行',
  '修复部分机型顶栏被状态栏遮挡的问题',
  '自定义头像支持相机拍摄与相册选择',
]

/** 模拟一次完整更新流程，进度经 onTick 回调上报；返回取消函数。 */
export function runAppUpdate(onTick: (state: AppUpdateState) => void): () => void {
  let cancelled = false
  const timers: ReturnType<typeof setTimeout>[] = []

  const schedule = (delay: number, fn: () => void) => {
    const timer = setTimeout(() => {
      if (!cancelled) {
        fn()
      }
    }, delay)
    timers.push(timer)
  }

  onTick({ phase: 'checking', progress: 0 })

  // 下载进度：0 → 100，分 10 段推进
  for (let step = 1; step <= 10; step += 1) {
    schedule(step * 180, () => {
      onTick({ phase: 'downloading', progress: step * 10 })
    })
  }
  // 校验 → 安装 → 完成
  schedule(2100, () => onTick({ phase: 'verifying', progress: 100 }))
  schedule(2600, () => onTick({ phase: 'installing', progress: 100 }))
  schedule(3100, () => onTick({ phase: 'done', progress: 100 }))

  return () => {
    cancelled = true
    timers.forEach(clearTimeout)
  }
}

export const updatePhaseLabel: Record<AppUpdatePhase, string> = {
  checking: '正在检查更新…',
  downloading: '正在下载新版本…',
  verifying: '正在校验安装包…',
  installing: '正在安装更新…',
  done: '更新完成',
}

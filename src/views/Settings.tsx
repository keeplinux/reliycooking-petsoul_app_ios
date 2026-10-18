import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronRight,
  CircleCheck,
  Download,
  Info,
  LoaderCircle,
  LogOut,
  QrCode,
  Radar,
  Trash2,
  TriangleAlert,
  Wifi,
} from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { AvatarBadge } from '../components/AvatarBadge'
import { payloadFromDevice, statusLabel } from '../provisioning'
import {
  APP_UPDATE_NOTES,
  nextAppVersion,
  runAppUpdate,
  updatePhaseLabel,
  type AppUpdateState,
} from '../appUpdate'
import type { Device } from '../nav'

export function SettingsView() {
  const { navigate, devices, removeDevice, pets, account, signOut } = useApp()
  const [notifications, setNotifications] = useState(true)
  const [deviceToRemove, setDeviceToRemove] = useState<Device | null>(null)

  // —— 应用内更新（demo 模拟）——
  const currentVersion = __APP_VERSION__
  const [updatedVersion, setUpdatedVersion] = useState<string | null>(null)
  const [updateSheetOpen, setUpdateSheetOpen] = useState(false)
  const [updateState, setUpdateState] = useState<AppUpdateState>({ phase: 'checking', progress: 0 })
  const cancelUpdateRef = useRef<(() => void) | null>(null)

  const version = updatedVersion ?? currentVersion
  const nextVersion = nextAppVersion(currentVersion)
  const updateDone = updateState.phase === 'done'

  useEffect(
    () => () => {
      cancelUpdateRef.current?.()
    },
    [],
  )

  function startUpdate() {
    setUpdateSheetOpen(true)
    setUpdateState({ phase: 'checking', progress: 0 })
    cancelUpdateRef.current?.()
    cancelUpdateRef.current = runAppUpdate((state) => {
      setUpdateState(state)
      if (state.phase === 'done') {
        setUpdatedVersion(nextVersion)
      }
    })
  }

  function closeUpdateSheet() {
    if (!updateDone) {
      return // 更新进行中不允许关闭，避免半途而废
    }
    setUpdateSheetOpen(false)
  }

  return (
    <>
      <TopBar title="设置" onBack={() => navigate({ name: 'home' })} />
      <main className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 safe-bottom">
        <section className="rounded-lg p-0">
          <button
            type="button"
            onClick={() => navigate({ name: 'avatarPicker' })}
            className="flex w-full items-center gap-3 rounded-lg p-4 text-left hover:bg-[#171717]/3"
          >
            <AvatarBadge account={account} size={44} />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm font-medium">用户账号</p>
              {account ? (
                <p className="m-0 text-xs text-[#171717]/45">
                  {account.method === 'phone' ? '本机手机号' : '微信账户'}：{account.identifier}
                </p>
              ) : (
                <p className="m-0 text-xs text-[#171717]/45">未登录</p>
              )}
              <p className="m-0 text-xs text-[#171717]/45">
                {pets.length > 0 ? `已录入宠物：${pets.length} 只` : '未录入宠物数字形象'}
              </p>
            </div>
            <ChevronRight size={18} className="shrink-0 text-[#171717]/35" />
          </button>
        </section>

        <section className="rounded-lg p-2">
          <button
            type="button"
            role="switch"
            aria-checked={notifications}
            onClick={() => setNotifications((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-[#171717]/3"
          >
            <span className="flex items-center gap-3">
              <Bell size={18} />
              <span className="text-sm font-medium">消息通知</span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                notifications ? 'bg-[#171717]' : 'bg-[#171717]/20'
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                  notifications ? 'left-6' : 'left-1'
                }`}
              />
            </span>
          </button>
        </section>

        <section className="rounded-lg p-2">
          <p className="m-0 flex items-center gap-3 px-3 pt-2 pb-1 text-sm font-medium">
            <Radar size={18} className="shrink-0" /> 探针状态
          </p>
          {devices.length === 0 ? (
            <p className="px-3 pb-3 text-sm text-[#171717]/45">暂无设备</p>
          ) : (
            devices.map((device) => (
              <div key={device.id} className="rounded-lg px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-medium">{device.name}</p>
                    <p className="m-0 mt-0.5 text-[11px] text-[#171717]/45">
                      {device.sn}
                      {device.wifiSsid ? ` · ${device.wifiSsid}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        device.status === 'bound'
                          ? 'bg-[#171717]/5 text-[#171717]/55'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {statusLabel[device.status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeviceToRemove(device)}
                      aria-label={`解绑 ${device.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-[#171717]/50 hover:bg-[#171717]/8 hover:text-[#171717]"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                {device.status === 'unbound' && (
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'scan', expectProductId: device.productId })}
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#171717]/5 text-xs font-medium hover:bg-[#171717]/10"
                  >
                    <QrCode size={14} /> 扫码绑定
                  </button>
                )}
                {device.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        name: 'provision',
                        payload: payloadFromDevice(device),
                        source: 'hotspot',
                      })
                    }
                    className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#171717]/5 text-xs font-medium hover:bg-[#171717]/10"
                  >
                    <Wifi size={14} /> 手动配网
                  </button>
                )}
              </div>
            ))
          )}
        </section>

        <section className="rounded-lg p-2">
          <p className="m-0 flex items-center gap-3 px-3 py-3 text-sm font-medium">
            <Info size={18} className="shrink-0" /> 关于
          </p>
          <div className="px-3 pb-3">
            <p className="m-0 text-xs leading-5 text-[#171717]/50">
              品牌：硅宠场域 silifield
            </p>
            <p className="m-0 text-xs leading-5 text-[#171717]/50">
              公司：上海硅宠场域科技有限公司
            </p>
            <div className="mt-1 flex items-center justify-between">
              <p className="m-0 text-xs leading-5 text-[#171717]/50">版本：{version}</p>
              {!updatedVersion && (
                <button
                  type="button"
                  onClick={startUpdate}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  新版本 v{nextVersion} · 点击更新
                </button>
              )}
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={signOut}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-[#171717]/5 py-3 text-sm font-medium text-[#b3261e] hover:bg-[#b3261e]/8"
        >
          <LogOut size={17} /> 退出登录
        </button>
      </main>

      {deviceToRemove && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="关闭"
            onClick={() => setDeviceToRemove(null)}
            className="absolute inset-0 bg-black/40"
          />
          <section className="relative safe-bottom-lg rounded-t-2xl bg-white px-5 pt-4">
            <span className="mx-auto block h-1 w-10 rounded-full bg-[#171717]/15" />
            <div className="mt-4 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#b3261e]/10 text-[#b3261e]">
                <TriangleAlert size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 text-base font-semibold">解绑「{deviceToRemove.name}」</h2>
                <p className="m-0 mt-1 text-xs leading-5 text-[#171717]/55">
                  解绑后设备将从账号中移除，本地数据（配网信息、饮水记录）将被清空，
                  且操作不可恢复。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                removeDevice(deviceToRemove.id)
                setDeviceToRemove(null)
              }}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#b3261e] text-sm font-medium text-white hover:bg-[#b3261e]/85"
            >
              <Trash2 size={16} /> 确认解绑
            </button>
            <button
              type="button"
              onClick={() => setDeviceToRemove(null)}
              className="mt-2 h-10 w-full rounded-lg text-sm font-medium text-[#171717]/55 hover:bg-[#171717]/5"
            >
              取消
            </button>
          </section>
        </div>
      )}

      {updateSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {updateDone ? (
            <button
              type="button"
              aria-label="关闭"
              onClick={closeUpdateSheet}
              className="absolute inset-0 bg-black/40"
            />
          ) : (
            <span className="absolute inset-0 bg-black/40" />
          )}
          <section className="relative safe-bottom-lg rounded-t-2xl bg-white px-5 pt-4">
            <span className="mx-auto block h-1 w-10 rounded-full bg-[#171717]/15" />
            <div className="mt-4 flex items-start gap-3">
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  updateDone ? 'bg-emerald-100 text-emerald-600' : 'bg-[#171717]/5 text-[#171717]'
                }`}
              >
                {updateDone ? (
                  <CircleCheck size={19} />
                ) : (
                  <Download size={19} className={updateState.phase === 'downloading' ? 'animate-pulse' : ''} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 text-base font-semibold">
                  {updateDone ? `已更新至 v${nextVersion}` : `发现新版本 v${nextVersion}`}
                </h2>
                <p className="m-0 mt-1 text-xs leading-5 text-[#171717]/55">
                  {updateDone
                    ? '更新内容已生效，尽情探索新的星际旅程。'
                    : updatePhaseLabel[updateState.phase]}
                </p>
                {!updateDone && updateState.phase === 'checking' && (
                  <ul className="m-0 mt-2 list-disc pl-4 text-xs leading-5 text-[#171717]/45">
                    {APP_UPDATE_NOTES.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {!updateDone ? (
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#171717]/10">
                  <div
                    className="h-full rounded-full bg-[#171717] transition-[width] duration-200"
                    style={{
                      width: `${updateState.phase === 'downloading' ? updateState.progress : 0}%`,
                    }}
                  />
                </div>
                <p className="m-0 mt-1.5 flex items-center gap-1 text-[11px] text-[#171717]/45">
                  {updateState.phase === 'downloading' && (
                    <>
                      <LoaderCircle size={11} className="animate-spin" />
                      {updateState.progress}%
                    </>
                  )}
                  {updateState.phase !== 'downloading' && updatePhaseLabel[updateState.phase]}
                </p>
              </div>
            ) : (
              <button
                type="button"
                onClick={closeUpdateSheet}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
              >
                好的
              </button>
            )}
          </section>
        </div>
      )}
    </>
  )
}

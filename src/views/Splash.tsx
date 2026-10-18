import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Check, LoaderCircle, LogIn, MessageCircle, Smartphone, UserPlus } from 'lucide-react'
import { LogoMark } from '../components/LogoMark'
import { useApp } from '../appContext'
import {
  accountId,
  detectDeviceAccount,
  isValidAccount,
  maskAccount,
} from '../auth'
import type { AccountMethod } from '../nav'

type DetectionState = {
  phone: string | null
  wechat: string | null
}

export function Splash() {
  const { signIn } = useApp()
  const [method, setMethod] = useState<AccountMethod>('phone')
  const [identifier, setIdentifier] = useState('')
  const [detection, setDetection] = useState<DetectionState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([detectDeviceAccount('phone'), detectDeviceAccount('wechat')]).then(
      ([phone, wechat]) => {
        if (!active) {
          return
        }
        setDetection({ phone, wechat })
        setIdentifier(phone ?? '')
      },
    )

    return () => {
      active = false
    }
  }, [])

  const selectMethod = (next: AccountMethod) => {
    setMethod(next)
    setError(null)
    setIdentifier(detection?.[next] ?? '')
  }

  const submit = () => {
    if (!isValidAccount(method, identifier)) {
      setError(method === 'phone' ? '请输入 11 位手机号' : '请输入 6-20 位微信号')
      return
    }

    signIn({
      id: accountId(method, identifier),
      method,
      identifier: identifier.trim(),
    })
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-white safe-top">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-10">
        <section className="space-y-4 text-center">
          <div className="flex justify-center">
            <LogoMark size="lg" />
          </div>
          <div className="space-y-1">
            <h1 className="m-0 text-2xl font-semibold tracking-wide">硅宠场域</h1>
            <p className="m-0 text-xs uppercase tracking-[0.25em] text-[#171717]/45">silifield</p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#f2f2f3] p-1">
            <MethodButton
              active={method === 'phone'}
              icon={<Smartphone size={17} />}
              title="本机手机号"
              onClick={() => selectMethod('phone')}
            />
            <MethodButton
              active={method === 'wechat'}
              icon={<MessageCircle size={17} />}
              title="微信账户"
              onClick={() => selectMethod('wechat')}
            />
          </div>

          <div className="flex min-h-6 items-center gap-1.5 text-xs text-[#171717]/50">
            {detection === null ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                正在自动检索账号
              </>
            ) : detection[method] ? (
              <>
                <Check size={14} className="text-emerald-700" />
                已自动读取 {maskAccount(method, detection[method] as string)}
              </>
            ) : (
              '未检索到账号，请手动输入'
            )}
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-medium text-[#171717]/60">
              {method === 'phone' ? '手机号' : '微信号'}
            </span>
            <input
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value)
                setError(null)
              }}
              inputMode={method === 'phone' ? 'numeric' : 'text'}
              autoComplete={method === 'phone' ? 'tel' : 'username'}
              placeholder={method === 'phone' ? '请输入手机号' : '请输入微信号'}
              className="h-11 w-full rounded-lg border border-[#171717]/15 bg-white px-3 text-sm outline-none focus:border-[#171717]/45"
            />
          </label>

          {error && <p className="m-0 text-xs text-[#b3261e]">{error}</p>}
        </section>

        <section className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={submit}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
          >
            <LogIn size={16} /> 登录
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg border border-[#171717]/20 text-sm font-medium hover:bg-[#171717]/5"
          >
            <UserPlus size={16} /> 注册
          </button>
        </section>
      </div>
      <p className="shrink-0 text-center text-xs text-[#171717]/40 safe-bottom-lg">
        上海硅宠场域科技有限公司
      </p>
    </main>
  )
}

function MethodButton({
  active,
  icon,
  title,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition ${
        active ? 'bg-white text-[#171717] shadow-sm' : 'text-[#171717]/50 hover:text-[#171717]'
      }`}
    >
      {icon}
      {title}
    </button>
  )
}

import { ArrowLeft } from 'lucide-react'

export function TopBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-[#171717]/10 bg-white px-4 pb-3 safe-top">
      <button
        type="button"
        onClick={onBack}
        aria-label="返回"
        className="grid h-9 w-9 place-items-center rounded-full text-[#171717] hover:bg-[#171717]/5"
      >
        <ArrowLeft size={19} />
      </button>
      <h1 className="m-0 text-[15px] font-semibold">{title}</h1>
    </header>
  )
}

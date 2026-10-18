import { useRef, useState } from 'react'
import type { UIEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { products } from '../catalog'
import type { Product } from '../nav'

export function Mall() {
  const { navigate } = useApp()
  const [index, setIndex] = useState(0)
  const scrollRef = useRef<HTMLElement | null>(null)

  function handleScroll(event: UIEvent<HTMLElement>) {
    const el = event.currentTarget
    const next = Math.round(el.scrollTop / el.clientHeight)
    if (next !== index) {
      setIndex(next)
    }
  }

  function scrollToProduct(target: number) {
    const el = scrollRef.current
    if (!el) {
      return
    }
    el.scrollTo({ top: target * el.clientHeight, behavior: 'smooth' })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <TopBar title="探针" onBack={() => navigate({ name: 'home' })} />
      <main
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 snap-y snap-mandatory flex-col overflow-y-auto"
      >
        {products.map((product, i) => (
          <ProductSlide
            key={product.id}
            product={product}
            index={i}
            total={products.length}
            onPurchase={() => navigate({ name: 'purchase', productId: product.id })}
          />
        ))}
      </main>

      {/* 产品滚动进度指示（替代滚动条） */}
      <nav
        aria-label="产品进度"
        className="absolute right-2.5 top-1/2 z-10 flex -translate-y-1/2 flex-col items-center gap-2.5"
      >
        {products.map((product, i) => (
          <button
            key={product.id}
            type="button"
            aria-label={`查看第 ${i + 1} 件：${product.name}`}
            aria-current={i === index}
            onClick={() => scrollToProduct(i)}
            className={`p-0 transition-all ${
              i === index
                ? 'h-5 w-1.5 rounded-full bg-[#171717]/70'
                : 'h-1.5 w-1.5 rounded-full bg-[#171717]/25 hover:bg-[#171717]/40'
            }`}
          />
        ))}
      </nav>
    </div>
  )
}

function ProductSlide({
  product,
  index,
  total,
  onPurchase,
}: {
  product: Product
  index: number
  total: number
  onPurchase: () => void
}) {
  const [variant, setVariant] = useState(0)
  const variantRef = useRef<HTMLDivElement | null>(null)

  function handleVariantScroll(event: UIEvent<HTMLDivElement>) {
    const el = event.currentTarget
    const next = Math.round(el.scrollLeft / el.clientWidth)
    if (next !== variant) {
      setVariant(next)
    }
  }

  function scrollToVariant(target: number) {
    const el = variantRef.current
    if (!el) {
      return
    }
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' })
  }

  const current = product.variants[variant] ?? product.variants[0]

  return (
    <section className="flex min-h-0 flex-none basis-full snap-start snap-always flex-col">
      {/* 型号/配色横向轮播区 */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={variantRef}
          onScroll={handleVariantScroll}
          className="flex h-full snap-x snap-mandatory overflow-x-auto"
        >
          {product.variants.map((item) => (
            <div
              key={`${item.model}-${item.color}`}
              className="flex h-full w-full flex-none snap-start snap-always flex-col items-center justify-center gap-5 px-10 transition-colors duration-300"
              style={{ backgroundColor: item.bg }}
            >
              <span className="grid h-40 w-40 place-items-center rounded-2xl bg-white/85 shadow-lg shadow-[#171717]/8">
                <img
                  src={product.image}
                  alt={`${product.name} ${item.model} ${item.color}`}
                  draggable={false}
                  className="h-32 w-32 object-contain"
                />
              </span>
              <span className="text-sm font-medium text-[#171717]/70">
                {item.model} · {item.color}
              </span>
            </div>
          ))}
        </div>

        {/* 变体切换箭头 */}
        {variant > 0 && (
          <button
            type="button"
            aria-label="上一个型号"
            onClick={() => scrollToVariant(variant - 1)}
            className="absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#171717]/70 shadow-md backdrop-blur hover:bg-white"
          >
            <ChevronLeft size={17} />
          </button>
        )}
        {variant < product.variants.length - 1 && (
          <button
            type="button"
            aria-label="下一个型号"
            onClick={() => scrollToVariant(variant + 1)}
            className="absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[#171717]/70 shadow-md backdrop-blur hover:bg-white"
          >
            <ChevronRight size={17} />
          </button>
        )}

        {/* 变体圆点指示 */}
        <nav
          aria-label="型号与配色"
          className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2"
        >
          {product.variants.map((item, i) => (
            <button
              key={`${item.model}-${item.color}`}
              type="button"
              aria-label={`${item.model} ${item.color}`}
              aria-current={i === variant}
              onClick={() => scrollToVariant(i)}
              className={`h-1.5 rounded-full bg-[#171717]/30 transition-all ${
                i === variant ? 'w-4' : 'w-1.5 bg-[#171717]/20 hover:bg-[#171717]/35'
              }`}
            />
          ))}
        </nav>
      </div>

      {/* 产品信息区 */}
      <div className="shrink-0 px-4 pb-4 safe-bottom">
        <span className="inline-block rounded-full bg-[#171717]/5 px-2.5 py-1 text-[11px] font-medium text-[#171717]/60">
          {product.category} · {current.model} · {current.color}
        </span>
        <h2 className="m-0 mt-2 text-lg font-semibold leading-tight">{product.name}</h2>
        <p className="m-0 mt-1 text-sm leading-snug text-[#171717]/55">{product.description}</p>

        <button
          type="button"
          onClick={onPurchase}
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#171717] text-sm font-medium text-white hover:bg-[#171717]/85"
        >
          前往购买 <ChevronRight size={16} />
        </button>

        <p className="m-0 mt-3 text-center text-[11px] text-[#171717]/40">
          {index === 0
            ? '左右滑动选型号配色 · 上下滑动浏览全部产品'
            : index === total - 1
              ? '左右滑动选型号配色 · 已经是最后一件啦'
              : `第 ${index + 1} / ${total} 件 · 左右选型号 · 上下换产品`}
        </p>
      </div>
    </section>
  )
}

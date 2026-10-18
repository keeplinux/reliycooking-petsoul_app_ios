import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { products } from '../catalog'

export function PurchaseView({ productId, variant = 0 }: { productId: string; variant?: number }) {
  const { navigate } = useApp()
  const product = products.find((item) => item.id === productId)
  const selected = product?.variants[variant] ?? product?.variants[0]
  return <>
    <TopBar title={product?.name ?? '产品详情'} onBack={() => navigate({ name: 'mall' })} />
    <main className="flex flex-1 flex-col gap-5 overflow-y-auto p-5 safe-bottom">
      {product && selected ? <>
        <img src={product.image} alt={product.name} className="aspect-square w-full max-w-sm self-center rounded-2xl p-10" style={{ background: selected.bg }} />
        <h2 className="m-0 text-xl">{product.name}</h2>
        <p className="m-0 text-base">已选：{selected.model} · {selected.color}</p>
        <p className="m-0 text-sm text-[#555]">{product.description}</p>
        <section className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="m-0 font-semibold">产品方案展示 · 暂未开放购买</p><p className="mb-0">官方商品链接尚未配置，当前不会跳转商城首页或提交订单。实际功能与发售型号以后续正式说明为准。</p></section>
      </> : <p>商品不存在</p>}
    </main>
  </>
}

import { ExternalLink, ShoppingBag } from 'lucide-react'
import { useApp } from '../appContext'
import { TopBar } from '../components/TopBar'
import { products } from '../catalog'

const purchaseTargets = [
  { id: 'taobao', name: '淘宝', url: 'https://www.taobao.com' },
  { id: 'jd', name: '京东', url: 'https://www.jd.com' },
]

export function PurchaseView({ productId }: { productId: string }) {
  const { navigate } = useApp()
  const product = products.find((item) => item.id === productId)

  if (!product) {
    return (
      <>
        <TopBar title="购买" onBack={() => navigate({ name: 'mall' })} />
        <main className="flex flex-1 items-center justify-center p-4">
          <p className="m-0 text-sm text-[#171717]/45">商品不存在</p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar title={product.name} onBack={() => navigate({ name: 'mall' })} />
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 safe-bottom">
        <section className="rounded-lg border border-[#171717]/10 bg-white p-4">
          <p className="m-0 text-sm font-semibold">{product.name}</p>
          <p className="m-0 mt-1 text-xs text-[#171717]/45">{product.description}</p>
        </section>

        <section className="rounded-lg border border-[#171717]/10 bg-white p-2">
          {purchaseTargets.map((target) => (
            <a
              key={target.id}
              href={target.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-3 hover:bg-[#171717]/3"
            >
              <span className="flex items-center gap-3">
                <ShoppingBag size={18} />
                <span className="text-sm font-medium">{target.name} 购买</span>
              </span>
              <ExternalLink size={17} className="text-[#171717]/40" />
            </a>
          ))}
        </section>
      </main>
    </>
  )
}

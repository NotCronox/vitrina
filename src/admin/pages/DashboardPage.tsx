import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Package, Palette, Plus, TriangleAlert } from 'lucide-react'
import { useSnapshot } from '@/data'
import { cn, formatMoney } from '@/lib/format'
import { imageUrl } from '@/lib/images'
import { buttonClass } from '@/components/ui/Button'
import type { Order } from '@/types'
import { AdminPage } from '../AdminLayout'
import { useOrders } from '../hooks'
import { STATUS, isSale, timeAgo } from '../orders'
import { Card, PageHeader } from '../ui'

const DAY = 86_400_000

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** Ventas por dia de los ultimos 7 dias: una sola serie, barras con tooltip. */
function SalesChart({ orders, money }: { orders: Order[]; money: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null)
  const days = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const start = today.getTime() - (6 - i) * DAY
      const dayOrders = orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return isSale(o) && t >= start && t < start + DAY
      })
      return {
        label: new Date(start).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''),
        date: new Date(start).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
        total: dayOrders.reduce((s, o) => s + o.total, 0),
        count: dayOrders.length,
      }
    })
  }, [orders])

  const max = Math.max(...days.map((d) => d.total), 1)
  const total = days.reduce((s, d) => s + d.total, 0)

  return (
    <Card title="Ventas de los últimos 7 días" description={`${money(total)} en pedidos confirmados y entregados`}>
      <div className="relative flex h-48 items-end gap-2 border-b border-line pt-6">
        {days.map((d, i) => (
          <div
            key={i}
            className="relative flex h-full flex-1 cursor-default items-end justify-center"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            aria-label={`${d.date}: ${money(d.total)}, ${d.count} ${d.count === 1 ? 'pedido' : 'pedidos'}`}
          >
            <div
              className={cn('w-full max-w-10 rounded-t-[4px] transition-[height,opacity] duration-500', d.total ? 'bg-accent' : 'bg-ink/8')}
              style={{ height: d.total ? `${(d.total / max) * 100}%` : '3px', opacity: hover === null || hover === i ? 1 : 0.45 }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg bg-ink px-3 py-2 text-center text-xs whitespace-nowrap text-bg shadow-lg">
                <p className="font-semibold tabular-nums">{money(d.total)}</p>
                <p className="opacity-70">
                  {d.date} · {d.count} {d.count === 1 ? 'pedido' : 'pedidos'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {days.map((d, i) => (
          <span key={i} className={cn('flex-1 text-center text-[0.7rem] capitalize', i === 6 ? 'font-semibold text-ink' : 'text-muted')}>
            {i === 6 ? 'Hoy' : d.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Ventas por día</caption>
        <tbody>
          {days.map((d, i) => (
            <tr key={i}>
              <th>{d.date}</th>
              <td>{money(d.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

export function DashboardPage() {
  const { config, products } = useSnapshot()
  const { data: orders = [] } = useOrders()
  const money = (n: number) => formatMoney(n, config.business.currency, config.business.locale)

  const stats = useMemo(() => {
    const since = Date.now() - 30 * DAY
    const recent = orders.filter((o) => new Date(o.createdAt).getTime() >= since)
    const sales = recent.filter(isSale)
    const revenue = sales.reduce((s, o) => s + o.total, 0)
    return {
      revenue,
      count: recent.filter((o) => o.status !== 'cancelled').length,
      ticket: sales.length ? revenue / sales.length : 0,
      pending: orders.filter((o) => o.status === 'pending').length,
    }
  }, [orders])

  const topProducts = useMemo(() => {
    const qty = new Map<string, number>()
    for (const o of orders.filter((o) => o.status !== 'cancelled'))
      for (const item of o.items) qty.set(item.productId, (qty.get(item.productId) ?? 0) + item.qty)
    return [...qty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, units]) => ({ product: products.find((p) => p.id === id), units }))
      .filter((x) => x.product)
  }, [orders, products])

  const lowStock = products
    .filter((p) => p.active)
    .flatMap((p) => p.variants.filter((v) => v.stock !== null && v.stock <= 3).map((v) => ({ product: p, variant: v })))
    .slice(0, 6)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <AdminPage>
      <PageHeader
        title={greeting}
        description={`Así va ${config.business.name} en los últimos 30 días.`}
        actions={
          <>
            <Link to="/admin/personalizar" className={buttonClass('outline', 'sm')}>
              <Palette className="size-4" /> Personalizar
            </Link>
            <Link to="/admin/productos/nuevo" className={buttonClass('primary', 'sm')}>
              <Plus className="size-4" /> Nuevo producto
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Ventas" value={money(stats.revenue)} hint="Pedidos confirmados y entregados" />
        <StatTile label="Pedidos" value={String(stats.count)} hint="Sin contar cancelados" />
        <StatTile label="Ticket promedio" value={money(stats.ticket)} />
        <StatTile label="Por confirmar" value={String(stats.pending)} hint={stats.pending ? 'Responde por WhatsApp' : 'Todo al día'} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SalesChart orders={orders} money={money} />

        <Card
          title="Últimos pedidos"
          actions={
            <Link to="/admin/pedidos" className="flex items-center gap-1 text-xs font-semibold text-accent">
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          }
          bodyClassName="!p-0"
        >
          <ul className="divide-y divide-line">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <Link to={`/admin/pedidos?pedido=${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink/3">
                  <span className={cn('size-2 shrink-0 rounded-full', STATUS[o.status].dot)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{o.customer.name}</span>
                    <span className="block text-xs text-muted">
                      {o.number} · {timeAgo(o.createdAt)}
                    </span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{money(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Más pedidos" description="Unidades en pedidos no cancelados" bodyClassName="!p-0">
          {topProducts.length ? (
            <ol className="divide-y divide-line">
              {topProducts.map(({ product, units }, i) => (
                <li key={product!.id}>
                  <Link to={`/admin/productos/${product!.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink/3">
                    <span className="w-4 text-xs text-muted tabular-nums">{i + 1}</span>
                    <img src={imageUrl(product!.images[0], 120)} alt="" className="size-10 rounded-lg object-cover" />
                    <span className="flex-1 truncate text-sm font-medium">{product!.name}</span>
                    <span className="text-sm text-muted tabular-nums">{units} u.</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-5 text-sm text-muted">Aún no hay pedidos.</p>
          )}
        </Card>

        <Card title="Inventario bajo" description="Variantes con 3 unidades o menos" bodyClassName="!p-0">
          {lowStock.length ? (
            <ul className="divide-y divide-line">
              {lowStock.map(({ product, variant }) => (
                <li key={product.id + variant.id}>
                  <Link to={`/admin/productos/${product.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink/3">
                    {variant.stock === 0 ? (
                      <TriangleAlert className="size-4 shrink-0 text-red-600" />
                    ) : (
                      <Package className="size-4 shrink-0 text-amber-600" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{product.name}</span>
                      <span className="block text-xs text-muted">{variant.label}</span>
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', variant.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900')}>
                      {variant.stock === 0 ? 'Agotado' : `Quedan ${variant.stock}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-5 text-sm text-muted">Todo el inventario está en buen nivel.</p>
          )}
        </Card>
      </div>
    </AdminPage>
  )
}

import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Inbox, MapPin, MessageSquareText, Phone, Search, Truck, CreditCard, X } from 'lucide-react'
import { useSnapshot } from '@/data'
import { cn, formatMoney } from '@/lib/format'
import { imageUrl } from '@/lib/images'
import { waLink } from '@/lib/whatsapp'
import { Button, buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/Icon'
import type { Order, OrderStatus } from '@/types'
import { AdminPage } from '../AdminLayout'
import { confirm, toast } from '../core'
import { useOrders, useUpdateOrderStatus } from '../hooks'
import { NEXT_STATUS, STATUS, timeAgo } from '../orders'
import { EmptyState, IconButton, PageHeader, Segmented, TextInput } from '../ui'

type Filter = OrderStatus | 'all'

function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', STATUS[status].className)}>{STATUS[status].label}</span>
}

/** Telefono colombiano de 10 digitos -> formato internacional para wa.me. */
const toWhatsapp = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 ? `57${digits}` : digits
}

export function OrdersPage() {
  const { config } = useSnapshot()
  const { data: orders = [], isPending } = useOrders()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const money = (n: number) => formatMoney(n, config.business.currency, config.business.locale)

  const selected = orders.find((o) => o.id === params.get('pedido')) ?? null
  const select = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('pedido', id)
    else next.delete('pedido')
    setParams(next, { replace: true })
  }

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: orders.length, pending: 0, confirmed: 0, delivered: 0, cancelled: 0 }
    for (const o of orders) c[o.status]++
    return c
  }, [orders])

  const list = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false
    if (!q.trim()) return true
    const text = `${o.number} ${o.customer.name} ${o.customer.phone ?? ''} ${o.customer.address ?? ''}`.toLowerCase()
    return text.includes(q.trim().toLowerCase())
  })

  return (
    <AdminPage>
      <PageHeader title="Pedidos" description="Cada pedido enviado por WhatsApp desde la tienda queda registrado aquí." />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as Filter[]).map((f) => ({
            value: f,
            label: (
              <>
                {f === 'all' ? 'Todos' : STATUS[f].label}
                <span className="text-muted tabular-nums">{counts[f]}</span>
              </>
            ),
          }))}
        />
        <label className="relative lg:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Número, cliente, teléfono..." className="!pl-9" aria-label="Buscar pedidos" />
        </label>
      </div>

      {!isPending && !list.length ? (
        <EmptyState icon={<Inbox className="size-5" />} title="No hay pedidos aquí" body="Cuando un cliente envíe un pedido desde la tienda, aparecerá en esta lista." />
      ) : (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="hidden grid-cols-[110px_1.4fr_1fr_90px_120px_130px] gap-4 border-b border-line px-5 py-2.5 text-xs font-medium text-muted md:grid">
            <span>Pedido</span>
            <span>Cliente</span>
            <span>Entrega</span>
            <span>Productos</span>
            <span className="text-right">Total</span>
            <span>Estado</span>
          </div>
          <ul className="divide-y divide-line">
            {list.map((o) => (
              <li key={o.id}>
                <button
                  onClick={() => select(o.id)}
                  className={cn(
                    'grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-3.5 text-left text-sm transition-colors hover:bg-ink/3 md:grid-cols-[110px_1.4fr_1fr_90px_120px_130px] md:items-center',
                    selected?.id === o.id && 'bg-accent/6',
                  )}
                >
                  <span className="font-semibold tabular-nums">
                    {o.number}
                    <span className="block text-xs font-normal text-muted">{timeAgo(o.createdAt)}</span>
                  </span>
                  <span className="truncate max-md:order-3">{o.customer.name}</span>
                  <span className="truncate text-muted max-md:hidden">{o.deliveryLabel}</span>
                  <span className="text-muted max-md:hidden">{o.items.reduce((s, i) => s + i.qty, 0)} u.</span>
                  <span className="text-right font-semibold tabular-nums max-md:order-2">{money(o.total)}</span>
                  <span className="max-md:order-4 max-md:justify-self-end">
                    <StatusBadge status={o.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AnimatePresence>{selected && <OrderDetail order={selected} money={money} onClose={() => select(null)} />}</AnimatePresence>
    </AdminPage>
  )
}

function OrderDetail({ order, money, onClose }: { order: Order; money: (n: number) => string; onClose: () => void }) {
  const { config } = useSnapshot()
  const update = useUpdateOrderStatus()
  const next = NEXT_STATUS[order.status]
  const phone = order.customer.phone ? toWhatsapp(order.customer.phone) : null

  const setStatus = async (status: OrderStatus) => {
    if (status === 'cancelled') {
      const ok = await confirm({ title: `¿Cancelar ${order.number}?`, body: 'El pedido quedará como cancelado y no contará en las ventas.', confirmLabel: 'Cancelar pedido', danger: true })
      if (!ok) return
    }
    await update.mutateAsync({ id: order.id, status })
    toast.success(`${order.number}: ${STATUS[status].label.toLowerCase()}`)
  }

  const reply = phone
    ? waLink(phone, `Hola ${order.customer.name.split(' ')[0]}, te escribimos de ${config.business.name} sobre tu pedido ${order.number}.`)
    : null

  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog"
        aria-label={`Pedido ${order.number}`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-lg font-semibold">{order.number}</p>
            <p className="text-xs text-muted">
              {new Date(order.createdAt).toLocaleString(config.business.locale, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <IconButton label="Cerrar" onClick={onClose}>
              <X className="size-4" />
            </IconButton>
          </div>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm">
          <section>
            <h3 className="mb-2 text-xs font-semibold text-muted uppercase">Cliente</h3>
            <p className="font-semibold">{order.customer.name}</p>
            {order.customer.phone && (
              <p className="mt-1 flex items-center gap-2 text-muted">
                <Phone className="size-3.5" /> {order.customer.phone}
              </p>
            )}
            {order.customer.address && (
              <p className="mt-1 flex items-start gap-2 text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" /> {order.customer.address}
              </p>
            )}
            {order.customer.notes && (
              <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-amber-50 p-3 text-amber-950">
                <MessageSquareText className="mt-0.5 size-3.5 shrink-0" /> {order.customer.notes}
              </p>
            )}
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[10px] bg-ink/4 p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Truck className="size-3.5" /> Entrega
              </p>
              <p className="mt-1 font-medium">{order.deliveryLabel}</p>
            </div>
            <div className="rounded-[10px] bg-ink/4 p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <CreditCard className="size-3.5" /> Pago
              </p>
              <p className="mt-1 font-medium">{order.payment}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold text-muted uppercase">Productos</h3>
            <ul className="divide-y divide-line rounded-[10px] border border-line">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 p-3">
                  {item.image && <img src={imageUrl(item.image, 120)} alt="" className="size-11 rounded-lg object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.variantLabel} · {item.qty} × {money(item.price)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{money(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Envío</dt>
                <dd className="tabular-nums">{order.deliveryFee ? money(order.deliveryFee) : 'Gratis'}</dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <footer className="space-y-2 border-t border-line p-4">
          {reply && (
            <a href={reply} target="_blank" rel="noreferrer" className={buttonClass('whatsapp', 'md', 'w-full')}>
              <WhatsAppIcon className="size-4" /> Escribir al cliente
            </a>
          )}
          <div className="flex gap-2">
            {next && (
              <Button className="flex-1" onClick={() => setStatus(next.status)} disabled={update.isPending}>
                {next.label}
              </Button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button variant="outline" onClick={() => setStatus('cancelled')} disabled={update.isPending}>
                Cancelar
              </Button>
            )}
            {(order.status === 'cancelled' || order.status === 'delivered') && (
              <Button variant="outline" className="flex-1" onClick={() => setStatus('pending')} disabled={update.isPending}>
                Reabrir pedido
              </Button>
            )}
          </div>
        </footer>
      </motion.aside>
    </>
  )
}

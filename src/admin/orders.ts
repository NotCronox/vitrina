import type { Order, OrderStatus } from '@/types'

export const STATUS: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  pending: { label: 'Por confirmar', className: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmado', className: 'bg-sky-100 text-sky-900', dot: 'bg-sky-500' },
  delivered: { label: 'Entregado', className: 'bg-emerald-100 text-emerald-900', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelado', className: 'bg-stone-200 text-stone-600', dot: 'bg-stone-400' },
}

/** Siguiente paso natural de un pedido. */
export const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'confirmed', label: 'Confirmar pedido' },
  confirmed: { status: 'delivered', label: 'Marcar entregado' },
}

/** Pedidos que cuentan como venta. */
export const isSale = (o: Order) => o.status === 'confirmed' || o.status === 'delivered'

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return days === 1 ? 'ayer' : `hace ${days} días`
}

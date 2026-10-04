import type { Order, StoreConfig } from '@/types'
import { cleanPhone, formatMoney } from './format'

export function waLink(phone: string, text?: string) {
  const base = `https://wa.me/${cleanPhone(phone)}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

/** Mensaje de pedido listo para enviar. Usa *negritas* de WhatsApp. */
export function buildOrderMessage(order: Order, config: StoreConfig) {
  const { currency, locale } = config.business
  const money = (n: number) => formatMoney(n, currency, locale)

  const lines = [
    config.checkout.greeting,
    '',
    `*Pedido ${order.number}*`,
    ...order.items.map((item) => `• ${item.qty} × ${item.name} (${item.variantLabel}) — ${money(item.price * item.qty)}`),
    '',
    `Subtotal: ${money(order.subtotal)}`,
    `Entrega: ${order.deliveryLabel}${order.deliveryFee ? ` (${money(order.deliveryFee)})` : ''}`,
    `*Total: ${money(order.total)}*`,
    '',
    `Nombre: ${order.customer.name}`,
  ]
  if (order.customer.phone) lines.push(`Teléfono: ${order.customer.phone}`)
  if (order.customer.address) lines.push(`Dirección: ${order.customer.address}`)
  lines.push(`Pago: ${order.payment}`)
  if (order.customer.notes) lines.push(`Notas: ${order.customer.notes}`)
  lines.push('', config.checkout.closing)

  return lines.join('\n')
}

export function productInquiryMessage(storeName: string, productName: string, variantLabel: string, url: string) {
  return `Hola ${storeName}, me interesa ${productName} (${variantLabel}). ¿Está disponible?\n${url}`
}

import { deliveryFee } from '@/lib/checkout'
import { defaultVariant } from '@/lib/catalog'
import type { Order, OrderStatus, StoreSnapshot } from '@/types'

const NAMES = ['Mariana López', 'Juan Pablo Ríos', 'Catalina Gómez', 'Andrés Herrera', 'Sofía Martínez', 'Daniel Castro', 'Valeria Pérez', 'Santiago Mejía', 'Laura Restrepo', 'Felipe Vargas']
const ADDRESSES = ['Cra. 11 #93-45, Chicó', 'Calle 53 #45-12, Laureles', 'Av. 19 #120-30, Usaquén', 'Calle 10 #43D-25, El Poblado', 'Cra. 7 #72-41, Rosales']
const STATUSES: OrderStatus[] = ['pending', 'pending', 'confirmed', 'delivered', 'delivered', 'cancelled', 'delivered', 'delivered', 'confirmed', 'delivered', 'delivered', 'delivered']

/** Generador pseudoaleatorio con semilla: los pedidos de ejemplo salen igual en cada instalacion. */
function random(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/**
 * Pedidos de ejemplo para que el panel de la demo no arranque vacio.
 * Se reparten en los ultimos siete dias a partir de la fecha actual.
 */
export function sampleOrders(snapshot: StoreSnapshot, firstSeq: number): Order[] {
  const rand = random(snapshot.config.id.length * 97)
  const products = snapshot.products.filter((p) => p.active)
  const { checkout } = snapshot.config
  const now = Date.now()

  return STATUSES.map((status, i) => {
    const count = 1 + Math.floor(rand() * 3)
    const items = Array.from({ length: count }, () => {
      const product = products[Math.floor(rand() * products.length)]
      const variant = rand() > 0.7 ? product.variants[Math.floor(rand() * product.variants.length)] : defaultVariant(product)
      return {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel: variant.label,
        price: variant.price,
        qty: rand() > 0.8 ? 2 : 1,
        image: product.images[0],
      }
    })
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
    const delivery = checkout.deliveryOptions[Math.floor(rand() * checkout.deliveryOptions.length)]
    const fee = deliveryFee(delivery, subtotal)
    const hoursAgo = i * 13 + Math.floor(rand() * 6) + 1

    return {
      id: `sample_${i}`,
      number: `${checkout.orderPrefix}-${firstSeq - i}`,
      createdAt: new Date(now - hoursAgo * 3600_000).toISOString(),
      status,
      customer: {
        name: NAMES[i % NAMES.length],
        phone: `30${Math.floor(10000000 + rand() * 89999999)}`,
        address: delivery?.requiresAddress ? ADDRESSES[i % ADDRESSES.length] : undefined,
        notes: i === 1 ? 'Es un regalo, por favor sin factura dentro.' : undefined,
      },
      deliveryId: delivery?.id ?? '',
      deliveryLabel: delivery?.label ?? '',
      payment: checkout.paymentOptions[i % checkout.paymentOptions.length] ?? '',
      items,
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

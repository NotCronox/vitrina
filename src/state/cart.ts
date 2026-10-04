import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, StoreSnapshot, Variant } from '@/types'

export interface CartLine {
  productId: string
  variantId: string
  qty: number
}

interface CartState {
  /** Una bolsa por tienda, para que cambiar de plantilla no mezcle productos. */
  carts: Record<string, CartLine[]>
  add: (storeId: string, line: CartLine) => void
  setQty: (storeId: string, productId: string, variantId: string, qty: number) => void
  remove: (storeId: string, productId: string, variantId: string) => void
  clear: (storeId: string) => void
}

const same = (a: CartLine, productId: string, variantId: string) => a.productId === productId && a.variantId === variantId

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      add: (storeId, line) =>
        set((s) => {
          const lines = s.carts[storeId] ?? []
          const existing = lines.find((l) => same(l, line.productId, line.variantId))
          const next = existing
            ? lines.map((l) => (l === existing ? { ...l, qty: l.qty + line.qty } : l))
            : [...lines, line]
          return { carts: { ...s.carts, [storeId]: next } }
        }),
      setQty: (storeId, productId, variantId, qty) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [storeId]: (s.carts[storeId] ?? [])
              .map((l) => (same(l, productId, variantId) ? { ...l, qty } : l))
              .filter((l) => l.qty > 0),
          },
        })),
      remove: (storeId, productId, variantId) =>
        set((s) => ({
          carts: { ...s.carts, [storeId]: (s.carts[storeId] ?? []).filter((l) => !same(l, productId, variantId)) },
        })),
      clear: (storeId) => set((s) => ({ carts: { ...s.carts, [storeId]: [] } })),
    }),
    { name: 'vitrina:cart' },
  ),
)

export interface ResolvedLine extends CartLine {
  product: Product
  variant: Variant
  lineTotal: number
}

/**
 * Cruza la bolsa con el catalogo actual. Los precios siempre salen del
 * catalogo, asi un cambio hecho desde el panel se refleja en la bolsa.
 */
export function resolveCart(lines: CartLine[], snapshot: StoreSnapshot) {
  const resolved: ResolvedLine[] = []
  for (const line of lines) {
    const product = snapshot.products.find((p) => p.id === line.productId && p.active)
    const variant = product?.variants.find((v) => v.id === line.variantId)
    if (!product || !variant) continue
    resolved.push({ ...line, product, variant, lineTotal: variant.price * line.qty })
  }
  const subtotal = resolved.reduce((sum, l) => sum + l.lineTotal, 0)
  const count = resolved.reduce((sum, l) => sum + l.qty, 0)
  return { lines: resolved, subtotal, count }
}

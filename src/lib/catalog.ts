import type { AttributeDef, AttributeValue, Product, StoreSnapshot, Variant } from '@/types'

/* ---------- Atributos ---------- */

export function optionLabel(def: AttributeDef, value: string) {
  return def.options?.find((o) => o.value === value)?.label ?? value
}

/** Convierte cualquier valor de atributo en una lista de textos legibles. */
export function displayValues(def: AttributeDef, value: AttributeValue | undefined): string[] {
  if (value === undefined || value === null || value === '') return []
  switch (def.type) {
    case 'select':
      return [optionLabel(def, String(value))]
    case 'multi':
      return (value as string[]).map((v) => optionLabel(def, v))
    case 'tags':
      return value as string[]
    case 'boolean':
      return value ? [def.label] : []
    case 'scale':
      return [`${value}/${def.max ?? 5}`]
    default:
      return [String(value)]
  }
}

/* ---------- Precios e inventario ---------- */

export const inStock = (v: Variant) => v.stock === null || v.stock > 0

/** Precio de referencia: el de la presentacion principal. */
export const basePrice = (product: Product) => defaultVariant(product).price

/** La primera variante es la presentacion principal; si esta agotada, la siguiente disponible. */
export function defaultVariant(product: Product) {
  return product.variants.find(inStock) ?? product.variants[0]
}

export const isSoldOut = (product: Product) => !product.variants.some(inStock)

/* ---------- Secciones ---------- */

export function productsForSource(snapshot: StoreSnapshot, source: string, limit: number) {
  const active = snapshot.products.filter((p) => p.active)
  let list: Product[]
  if (source === 'featured') list = active.filter((p) => p.featured)
  else if (source === 'new') list = [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  else if (source.startsWith('badge:')) list = active.filter((p) => p.badges.includes(source.slice(6)))
  else if (source.startsWith('category:')) list = active.filter((p) => p.categoryId === source.slice(9))
  else list = active
  return list.slice(0, limit)
}

/* ---------- Filtros del catalogo ---------- */

export type SortKey = 'relevance' | 'new' | 'price-asc' | 'price-desc' | 'name'

export interface CatalogFilters {
  q: string
  category: string | null
  sort: SortKey
  /** attributeId -> valores elegidos. Para `scale` es el minimo; para `boolean`, 'true'. */
  attrs: Record<string, string[]>
  maxPrice: number | null
  inStockOnly: boolean
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function filterProducts(snapshot: StoreSnapshot, filters: CatalogFilters) {
  const { attributes } = snapshot.config.catalog
  const q = normalize(filters.q.trim())

  const result = snapshot.products.filter((product) => {
    if (!product.active) return false
    if (filters.category && product.categoryId !== filters.category) return false
    if (filters.inStockOnly && isSoldOut(product)) return false
    if (filters.maxPrice !== null && basePrice(product) > filters.maxPrice) return false

    if (q) {
      const haystack = normalize(
        [
          product.name,
          product.brand,
          product.summary,
          ...attributes.flatMap((def) => displayValues(def, product.attributes[def.id])),
        ].join(' '),
      )
      if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false
    }

    for (const [attrId, selected] of Object.entries(filters.attrs)) {
      if (!selected.length) continue
      const def = attributes.find((a) => a.id === attrId)
      const value = product.attributes[attrId]
      if (!def) continue
      if (def.type === 'scale') {
        if (typeof value !== 'number' || value < Number(selected[0])) return false
      } else if (def.type === 'boolean') {
        if (value !== true) return false
      } else if (def.type === 'multi' || def.type === 'tags') {
        const values = (value as string[] | undefined) ?? []
        if (!selected.some((s) => values.includes(s))) return false
      } else if (!selected.includes(String(value))) {
        return false
      }
    }
    return true
  })

  const byPrice = basePrice
  switch (filters.sort) {
    case 'new':
      return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'price-asc':
      return result.sort((a, b) => byPrice(a) - byPrice(b))
    case 'price-desc':
      return result.sort((a, b) => byPrice(b) - byPrice(a))
    case 'name':
      return result.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    default:
      return result.sort((a, b) => Number(b.featured) - Number(a.featured))
  }
}

/** Cuantos productos activos tienen cada opcion, para mostrar el conteo junto al filtro. */
export function optionCounts(products: Product[], def: AttributeDef) {
  const counts = new Map<string, number>()
  for (const p of products) {
    if (!p.active) continue
    const value = p.attributes[def.id]
    const values = Array.isArray(value) ? value : value === undefined ? [] : [String(value)]
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return counts
}

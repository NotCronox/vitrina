import type { RealtimeChannel } from '@supabase/supabase-js'
import { getTemplate } from '@/config/templates'
import type { Category, Order, OrderStatus, Product, StoreConfig, Variant } from '@/types'
import type { CatalogRepository, ChangeScope } from './repository'
import { friendlyError, getSupabase } from './supabase-client'

/* ---------- Filas de la base de datos (snake_case) ---------- */

interface CategoryRow {
  id: string
  slug: string
  name: string
  description: string | null
  image: string | null
  sort_order: number
}

interface ProductRow {
  id: string
  slug: string
  name: string
  category_id: string
  summary: string
  description: string
  images: string[]
  variants: Variant[]
  attributes: Product['attributes']
  badges: string[]
  featured: boolean
  active: boolean
  created_at: string
}

interface OrderRow {
  id: string
  number: string
  status: OrderStatus
  customer: Order['customer']
  delivery_id: string
  delivery_label: string
  payment: string
  items: Order['items']
  subtotal: number | string
  delivery_fee: number | string
  total: number | string
  created_at: string
}

const fromCategory = (r: CategoryRow): Category => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? undefined,
  image: r.image ?? undefined,
  order: r.sort_order,
})

const toCategory = (c: Category): CategoryRow => ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description ?? null,
  image: c.image ?? null,
  sort_order: c.order,
})

const fromProduct = (r: ProductRow): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  categoryId: r.category_id,
  summary: r.summary,
  description: r.description,
  images: r.images ?? [],
  variants: r.variants,
  attributes: r.attributes ?? {},
  badges: r.badges ?? [],
  featured: r.featured,
  active: r.active,
  createdAt: r.created_at,
})

// sort_order no se envia: al editar se conserva el orden y al crear queda primero.
const toProduct = (p: Product): Omit<ProductRow, never> => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category_id: p.categoryId,
  summary: p.summary,
  description: p.description,
  images: p.images,
  variants: p.variants,
  attributes: p.attributes,
  badges: p.badges,
  featured: p.featured,
  active: p.active,
  created_at: p.createdAt,
})

const fromOrder = (r: OrderRow): Order => ({
  id: r.id,
  number: r.number,
  status: r.status,
  customer: r.customer,
  deliveryId: r.delivery_id,
  deliveryLabel: r.delivery_label,
  payment: r.payment,
  items: r.items,
  subtotal: Number(r.subtotal),
  deliveryFee: Number(r.delivery_fee),
  total: Number(r.total),
  createdAt: r.created_at,
})

/**
 * Repositorio de produccion: una base de datos de Supabase por cliente.
 * Toda la seguridad vive en la base (RLS y funciones), no en el navegador.
 */
export function createSupabaseRepository(templateId: string): CatalogRepository {
  return {
    mode: 'supabase',

    async getSnapshot() {
      const sb = await getSupabase()
      const [config, categories, products] = await Promise.all([
        sb.from('store_config').select('config').eq('id', 1).maybeSingle(),
        sb.from('categories').select('*').order('sort_order'),
        sb.from('products').select('*').order('sort_order').order('created_at', { ascending: false }),
      ])
      const error = config.error ?? categories.error ?? products.error
      if (error) throw friendlyError(error, 'No se pudo cargar la tienda.')

      // Base recien creada: se muestra la plantilla hasta que el dueño la publique desde el panel.
      if (!config.data) return { ...structuredClone(getTemplate(templateId).snapshot), uninitialized: true }

      return {
        config: config.data.config as StoreConfig,
        categories: (categories.data as CategoryRow[]).map(fromCategory),
        products: (products.data as ProductRow[]).map(fromProduct),
      }
    },

    async saveConfig(config) {
      const sb = await getSupabase()
      const { error } = await sb.from('store_config').upsert({ id: 1, config })
      if (error) throw friendlyError(error, 'No se pudo guardar la configuración.')
      return config
    },

    async saveProduct(product) {
      const sb = await getSupabase()
      const { error } = await sb.from('products').upsert(toProduct(product))
      if (error) throw friendlyError(error, 'No se pudo guardar el producto.')
      return product
    },

    async deleteProduct(id) {
      const sb = await getSupabase()
      const { error } = await sb.from('products').delete().eq('id', id)
      if (error) throw friendlyError(error, 'No se pudo eliminar el producto.')
    },

    async saveCategory(category) {
      const sb = await getSupabase()
      const { error } = await sb.from('categories').upsert(toCategory(category))
      if (error) throw friendlyError(error, 'No se pudo guardar la categoría.')
      return category
    },

    async saveCategories(categories) {
      const sb = await getSupabase()
      const { error } = await sb.from('categories').upsert(categories.map(toCategory))
      if (error) throw friendlyError(error, 'No se pudo guardar el orden.')
      return categories
    },

    async deleteCategory(id) {
      const sb = await getSupabase()
      const { error } = await sb.from('categories').delete().eq('id', id)
      if (error) throw friendlyError(error, 'No se pudo eliminar la categoría.')
    },

    // Los precios y el total los recalcula la base de datos: el navegador solo envia que se pidio.
    async createOrder(input) {
      const sb = await getSupabase()
      const { data, error } = await sb.rpc('create_order', {
        payload: {
          customer: input.customer,
          deliveryId: input.deliveryId,
          payment: input.payment,
          items: input.items.map(({ productId, variantId, qty }) => ({ productId, variantId, qty })),
        },
      })
      if (error) throw friendlyError(error, 'No se pudo registrar el pedido.')
      return fromOrder(data as OrderRow)
    },

    async listOrders() {
      const sb = await getSupabase()
      const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false }).limit(500)
      if (error) throw friendlyError(error, 'No se pudieron cargar los pedidos.')
      return (data as OrderRow[]).map(fromOrder)
    },

    async updateOrderStatus(id, status) {
      const sb = await getSupabase()
      const { data, error } = await sb.from('orders').update({ status }).eq('id', id).select().single()
      if (error) throw friendlyError(error, 'No se pudo actualizar el pedido.')
      return fromOrder(data as OrderRow)
    },

    async replaceSnapshot(snapshot) {
      const sb = await getSupabase()
      const { error } = await sb.rpc('replace_catalog', {
        snapshot: { config: snapshot.config, categories: snapshot.categories, products: snapshot.products },
      })
      if (error) throw friendlyError(error, 'No se pudieron publicar los datos.')
    },

    async uploadImage(dataUrl) {
      if (!dataUrl.startsWith('data:')) return dataUrl
      const sb = await getSupabase()
      const blob = await (await fetch(dataUrl)).blob()
      const ext = blob.type.split('/')[1] ?? 'webp'
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`
      const { error } = await sb.storage.from('media').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
      if (error) throw new Error(`No se pudo subir la imagen (${error.message}).`)
      return sb.storage.from('media').getPublicUrl(path).data.publicUrl
    },

    subscribe(onChange: (scope: ChangeScope) => void) {
      let channel: RealtimeChannel | null = null
      let closed = false
      getSupabase().then((sb) => {
        if (closed) return
        const store = () => onChange('store')
        channel = sb
          .channel(`vitrina-${crypto.randomUUID()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'store_config' }, store)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, store)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, store)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => onChange('orders'))
          .subscribe()
      })
      return () => {
        closed = true
        if (channel) getSupabase().then((sb) => sb.removeChannel(channel!))
      }
    },
  }
}

import { getTemplate } from '@/config/templates'
import { uid } from '@/lib/format'
import type { Order, StoreSnapshot } from '@/types'
import { StorageFullError, type CatalogRepository } from './repository'
import { sampleOrders } from './sample-orders'

interface DemoState extends StoreSnapshot {
  orders: Order[]
  orderSeq: number
}

export const STORAGE_VERSION = 'v2'

/** Pequeña espera para que la demo se comporte como una API real (estados de carga). */
const latency = (ms = 120) => new Promise((r) => setTimeout(r, ms))
const clone = <T>(value: T): T => structuredClone(value)

const isQuotaError = (e: unknown) =>
  e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')

/**
 * Repositorio de demo: guarda la tienda completa en localStorage.
 * Cada plantilla tiene su propio espacio, asi los cambios hechos en Ámbar
 * no afectan a Lumière.
 */
export function createLocalRepository(templateId: string): CatalogRepository {
  const key = `vitrina:${templateId}:${STORAGE_VERSION}`
  /** Copia en memoria por si el navegador bloquea el almacenamiento (modo privado, etc.). */
  let memory: DemoState | null = null

  const seed = (): DemoState => {
    const snapshot = clone(getTemplate(templateId).snapshot)
    return { ...snapshot, orders: sampleOrders(snapshot, 1040), orderSeq: 1040 }
  }

  const write = (state: DemoState) => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch (e) {
      if (isQuotaError(e)) throw new StorageFullError()
      /* almacenamiento bloqueado: la demo sigue funcionando en memoria */
    }
    memory = state
    channel?.postMessage({ key })
  }

  const read = (): DemoState => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw) as DemoState
    } catch {
      /* almacenamiento bloqueado o corrupto */
    }
    if (memory) return clone(memory)
    // Primera visita: se guarda la plantilla para que los pedidos de ejemplo sean estables.
    const initial = seed()
    try {
      write(initial)
    } catch {
      memory = initial
    }
    return clone(initial)
  }

  const update = (fn: (state: DemoState) => void) => {
    const state = read()
    fn(state)
    write(state)
    return state
  }

  return {
    mode: 'demo',

    async getSnapshot() {
      await latency()
      const { config, categories, products } = read()
      return { config, categories, products }
    },

    async saveConfig(config) {
      await latency()
      update((s) => {
        s.config = config
      })
      return config
    },

    async saveProduct(product) {
      await latency()
      update((s) => {
        const i = s.products.findIndex((p) => p.id === product.id)
        if (i >= 0) s.products[i] = product
        else s.products.unshift(product)
      })
      return product
    },

    async deleteProduct(id) {
      await latency()
      update((s) => {
        s.products = s.products.filter((p) => p.id !== id)
      })
    },

    async saveCategory(category) {
      await latency()
      update((s) => {
        const i = s.categories.findIndex((c) => c.id === category.id)
        if (i >= 0) s.categories[i] = category
        else s.categories.push(category)
      })
      return category
    },

    async saveCategories(categories) {
      await latency()
      update((s) => {
        s.categories = categories
      })
      return categories
    },

    async deleteCategory(id) {
      await latency()
      update((s) => {
        s.categories = s.categories.filter((c) => c.id !== id)
      })
    },

    async createOrder(input) {
      await latency(250)
      let order!: Order
      update((s) => {
        s.orderSeq += 1
        order = {
          ...input,
          id: uid('ord_'),
          number: `${s.config.checkout.orderPrefix}-${s.orderSeq}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
        }
        s.orders.unshift(order)
      })
      return order
    },

    async listOrders() {
      await latency()
      return read().orders
    },

    async updateOrderStatus(id, status) {
      await latency()
      let found: Order | undefined
      update((s) => {
        found = s.orders.find((o) => o.id === id)
        if (found) found.status = status
      })
      if (!found) throw new Error('Pedido no encontrado')
      return found
    },

    async replaceSnapshot(snapshot) {
      await latency()
      update((s) => {
        s.config = { ...snapshot.config, id: templateId }
        s.categories = snapshot.categories
        s.products = snapshot.products
      })
    },

    // En la demo la imagen comprimida se guarda tal cual dentro de los datos.
    async uploadImage(dataUrl) {
      return dataUrl
    },

    subscribe(onChange) {
      const bc = channel
      if (!bc) return () => {}
      const onMessage = (e: MessageEvent<{ key: string }>) => {
        if (e.data?.key !== key) return
        onChange('store')
        onChange('orders')
      }
      bc.addEventListener('message', onMessage)
      return () => bc.removeEventListener('message', onMessage)
    },

    async reset() {
      await latency()
      write(seed())
    },
  }
}

/** Canal para avisar a otras pestañas (tienda y panel abiertos a la vez). */
export const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('vitrina') : null

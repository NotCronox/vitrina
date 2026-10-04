import type { Category, Order, OrderStatus, Product, StoreConfig, StoreSnapshot } from '@/types'

/**
 * Contrato unico de acceso a datos.
 * La interfaz no sabe si detras hay localStorage (modo demo) o Supabase
 * (modo cliente): los componentes solo hablan con esta interfaz.
 */
export interface CatalogRepository {
  readonly mode: 'demo' | 'supabase'
  getSnapshot(): Promise<StoreSnapshot>
  saveConfig(config: StoreConfig): Promise<StoreConfig>

  saveProduct(product: Product): Promise<Product>
  deleteProduct(id: string): Promise<void>

  saveCategory(category: Category): Promise<Category>
  /** Guarda todas las categorias de una vez (por ejemplo, al reordenarlas). */
  saveCategories(categories: Category[]): Promise<Category[]>
  deleteCategory(id: string): Promise<void>

  createOrder(order: Omit<Order, 'id' | 'number' | 'createdAt' | 'status'>): Promise<Order>
  listOrders(): Promise<Order[]>
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order>

  /** Reemplaza configuracion, categorias y productos (importar un respaldo). */
  replaceSnapshot(snapshot: StoreSnapshot): Promise<void>

  /** Guarda una imagen ya comprimida (data URL) y devuelve la direccion con la que se mostrara. */
  uploadImage(dataUrl: string): Promise<string>

  /** Avisa cuando cambian los datos en otra pestaña o dispositivo. Devuelve la funcion para dejar de escuchar. */
  subscribe(onChange: (scope: ChangeScope) => void): () => void

  /** Solo demo: vuelve al estado inicial de la plantilla. */
  reset?(): Promise<void>
}

export type ChangeScope = 'store' | 'orders'

/** El navegador no tiene espacio para guardar mas datos (casi siempre por imagenes). */
export class StorageFullError extends Error {
  constructor() {
    super('El almacenamiento de la demo está lleno. Usa imágenes más livianas o elimina algunas.')
    this.name = 'StorageFullError'
  }
}

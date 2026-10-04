import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useDemo } from '@/state/demo'
import { useCart, resolveCart } from '@/state/cart'
import { usePreview } from '@/state/preview'
import type { Order, StoreSnapshot } from '@/types'
import { USE_SUPABASE } from '@/config/mode'
import { createLocalRepository } from './local-repository'
import type { CatalogRepository } from './repository'
import { createSupabaseRepository } from './supabase-repository'

const repositories = new Map<string, CatalogRepository>()

export function getRepository(templateId: string) {
  let repo = repositories.get(templateId)
  if (!repo) {
    repo = USE_SUPABASE ? createSupabaseRepository(templateId) : createLocalRepository(templateId)
    repositories.set(templateId, repo)
  }
  return repo
}

export function useRepository() {
  const templateId = useDemo((s) => s.templateId)
  return useMemo(() => getRepository(templateId), [templateId])
}

export const storeKey = (templateId: string) => ['store', templateId] as const

/** Carga una tienda antes de mostrarla (la usa el cambio de plantilla). */
export function prefetchStore(client: QueryClient, templateId: string) {
  return client.prefetchQuery({
    queryKey: storeKey(templateId),
    queryFn: () => getRepository(templateId).getSnapshot(),
    staleTime: Infinity,
  })
}

/**
 * Tienda completa (configuracion, categorias y productos).
 * En la vista previa del editor, la configuracion se reemplaza por el borrador.
 */
export function useStore() {
  const templateId = useDemo((s) => s.templateId)
  const repo = useRepository()
  const draft = usePreview((s) => s.draft)
  const select = useCallback((data: StoreSnapshot) => (draft ? { ...data, config: draft } : data), [draft])
  return useQuery({
    queryKey: storeKey(templateId),
    queryFn: () => repo.getSnapshot(),
    staleTime: Infinity,
    select,
  })
}

/** Igual que useStore, pero para componentes que solo se montan con la tienda ya cargada. */
export function useSnapshot() {
  const { data } = useStore()
  if (!data) throw new Error('useSnapshot se usó antes de cargar la tienda')
  return data
}

export function useCartSummary() {
  const snapshot = useSnapshot()
  const lines = useCart((s) => s.carts[snapshot.config.id])
  return useMemo(() => resolveCart(lines ?? [], snapshot), [lines, snapshot])
}

export function useCreateOrder() {
  const repo = useRepository()
  const client = useQueryClient()
  return useMutation({
    mutationFn: (order: Omit<Order, 'id' | 'number' | 'createdAt' | 'status'>) => repo.createOrder(order),
    onSuccess: () => client.invalidateQueries({ queryKey: ['orders'] }),
  })
}

/** Mantiene sincronizadas las pestañas y dispositivos abiertos (por ejemplo, tienda y panel). */
export function useLiveSync() {
  const client = useQueryClient()
  const repo = useRepository()
  useEffect(
    () => repo.subscribe((scope) => client.invalidateQueries({ queryKey: [scope] })),
    [client, repo],
  )
}

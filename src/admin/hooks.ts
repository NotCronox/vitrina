import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { storeKey, useRepository, useSnapshot } from '@/data'
import { useDemo } from '@/state/demo'
import type { Category, OrderStatus, Product, StoreConfig, StoreSnapshot } from '@/types'
import { toast } from './core'

const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.')

function useInvalidate() {
  const client = useQueryClient()
  const templateId = useDemo((s) => s.templateId)
  return useCallback(
    () =>
      Promise.all([
        client.invalidateQueries({ queryKey: storeKey(templateId) }),
        client.invalidateQueries({ queryKey: ['orders', templateId] }),
      ]),
    [client, templateId],
  )
}

/* ---------- Configuracion ---------- */

export function useSaveConfig() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (config: StoreConfig) => repo.saveConfig(config), onSuccess: invalidate, onError })
}

/**
 * Borrador de la configuracion: se edita libremente y solo se guarda al pulsar
 * "Guardar". Lo usan el editor visual y la pagina de campos.
 */
export function useConfigDraft() {
  const saved = useSnapshot().config
  const [draft, setDraft] = useState<StoreConfig>(saved)
  const save = useSaveConfig()

  const savedJson = useMemo(() => JSON.stringify(saved), [saved])
  const dirty = useMemo(() => JSON.stringify(draft) !== savedJson, [draft, savedJson])

  // Si la configuracion cambia desde otra pestaña y aqui no habia cambios pendientes, se toma la nueva.
  const draftRef = useRef(draft)
  draftRef.current = draft
  const prevSaved = useRef(savedJson)
  useEffect(() => {
    if (prevSaved.current === savedJson) return
    const wasClean = JSON.stringify(draftRef.current) === prevSaved.current
    prevSaved.current = savedJson
    if (wasClean) setDraft(saved)
  }, [savedJson, saved])

  const update = useCallback((fn: (draft: StoreConfig) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev)
      fn(next)
      return next
    })
  }, [])

  return {
    draft,
    dirty,
    saving: save.isPending,
    update,
    discard: () => setDraft(saved),
    save: async () => {
      await save.mutateAsync(draft)
      toast.success('Cambios guardados')
    },
  }
}

export type ConfigDraft = ReturnType<typeof useConfigDraft>

/* ---------- Productos y categorias ---------- */

export function useSaveProduct() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (p: Product) => repo.saveProduct(p), onSuccess: invalidate, onError })
}

export function useDeleteProduct() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (id: string) => repo.deleteProduct(id), onSuccess: invalidate, onError })
}

export function useSaveCategory() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (c: Category) => repo.saveCategory(c), onSuccess: invalidate, onError })
}

export function useSaveCategories() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (list: Category[]) => repo.saveCategories(list), onSuccess: invalidate, onError })
}

export function useDeleteCategory() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (id: string) => repo.deleteCategory(id), onSuccess: invalidate, onError })
}

/* ---------- Pedidos ---------- */

export function useOrders() {
  const repo = useRepository()
  const templateId = useDemo((s) => s.templateId)
  return useQuery({ queryKey: ['orders', templateId], queryFn: () => repo.listOrders() })
}

export function useUpdateOrderStatus() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => repo.updateOrderStatus(id, status),
    onSuccess: invalidate,
    onError,
  })
}

/* ---------- Respaldo ---------- */

export function useReplaceSnapshot() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({ mutationFn: (s: StoreSnapshot) => repo.replaceSnapshot(s), onSuccess: invalidate, onError })
}

export function useResetStore() {
  const repo = useRepository()
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async () => {
      if (!repo.reset) throw new Error('Esta acción solo está disponible en la demo.')
      await repo.reset()
    },
    onSuccess: invalidate,
    onError,
  })
}

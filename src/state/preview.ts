import { create } from 'zustand'
import type { StoreConfig } from '@/types'

/**
 * Vista previa en vivo del editor.
 * El panel carga la tienda dentro de un iframe con `?preview` y le envia la
 * configuracion en borrador por postMessage; la tienda la pinta sin guardarla.
 */
export const IS_PREVIEW = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview')

export type PreviewMessage =
  | { type: 'vitrina:draft'; config: StoreConfig }
  | { type: 'vitrina:scroll'; sectionId: string }
  | { type: 'vitrina:preview-ready' }

interface PreviewState {
  draft: StoreConfig | null
  setDraft: (config: StoreConfig | null) => void
}

export const usePreview = create<PreviewState>()((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
}))

let started = false

/** Se ejecuta una vez dentro del iframe de vista previa. */
export function startPreviewBridge() {
  if (!IS_PREVIEW || started) return
  started = true
  window.addEventListener('message', (event: MessageEvent<PreviewMessage>) => {
    if (event.origin !== window.location.origin) return
    const msg = event.data
    if (msg?.type === 'vitrina:draft') usePreview.getState().setDraft(msg.config)
    if (msg?.type === 'vitrina:scroll') {
      document
        .querySelector(`[data-section="${CSS.escape(msg.sectionId)}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

export function announcePreviewReady() {
  if (IS_PREVIEW) window.parent.postMessage({ type: 'vitrina:preview-ready' } satisfies PreviewMessage, window.location.origin)
}

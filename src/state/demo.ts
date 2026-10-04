import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INITIAL_TEMPLATE, LOCKED_TEMPLATE, templateFromUrl } from '@/config/mode'

interface DemoState {
  templateId: string
  setTemplate: (id: string) => void
}

/**
 * Plantilla activa. En la demo se recuerda entre visitas; un enlace con
 * `?plantilla=` tiene prioridad sobre lo recordado. En modo cliente es fija.
 */
export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      templateId: INITIAL_TEMPLATE,
      setTemplate: (templateId) => {
        if (!LOCKED_TEMPLATE) set({ templateId })
      },
    }),
    {
      name: 'vitrina:demo',
      merge: (persisted, current) =>
        LOCKED_TEMPLATE ? { ...current, templateId: LOCKED_TEMPLATE } : { ...current, ...(persisted as Partial<DemoState>) },
    },
  ),
)

// Un enlace `?plantilla=` se guarda como la nueva eleccion, para que siga activa al navegar o recargar.
const fromUrl = templateFromUrl()
if (fromUrl) useDemo.getState().setTemplate(fromUrl)

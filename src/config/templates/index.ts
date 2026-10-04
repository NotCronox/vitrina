import type { StoreSnapshot } from '@/types'
import { ambarTemplate } from './ambar'
import { lumiereTemplate } from './lumiere'

export interface TemplateInfo {
  id: string
  name: string
  industry: string
  snapshot: StoreSnapshot
}

/** Plantillas de inicio. Para sumar un rubro nuevo basta con agregar un archivo aqui. */
export const TEMPLATES: TemplateInfo[] = [
  { id: 'ambar', name: 'Ámbar', industry: 'Perfumería', snapshot: ambarTemplate },
  { id: 'lumiere', name: 'Lumière', industry: 'Maquillaje', snapshot: lumiereTemplate },
]

export const DEFAULT_TEMPLATE_ID = 'ambar'

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]
}

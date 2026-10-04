import { DEFAULT_TEMPLATE_ID, TEMPLATES } from './templates'

const isTemplate = (id: string | null | undefined): id is string => Boolean(id && TEMPLATES.some((t) => t.id === id))

/* ---------- Datos ---------- */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

/** Con las llaves de Supabase la tienda guarda todo en la nube; sin ellas, en el navegador (demo). */
export const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/* ---------- Plantilla ---------- */

/**
 * Modo cliente: la instalacion queda fija en una plantilla, sin selector de demo
 * ni textos de portafolio. Se activa con VITE_PLANTILLA, o automaticamente al
 * conectar Supabase (una base de datos = una tienda).
 * Sin nada configurado, la app funciona como vitrina de demostracion.
 */
const envTemplate = import.meta.env.VITE_PLANTILLA?.trim()
export const LOCKED_TEMPLATE: string | null = isTemplate(envTemplate) ? envTemplate : USE_SUPABASE ? DEFAULT_TEMPLATE_ID : null
export const IS_SHOWCASE = LOCKED_TEMPLATE === null

/**
 * Enlace directo a una plantilla en la demo: `/?plantilla=lumiere`.
 * Solo aplica en modo vitrina; en una instalacion de cliente se ignora.
 */
export function templateFromUrl(): string | null {
  if (!IS_SHOWCASE || typeof window === 'undefined') return null
  const id = new URLSearchParams(window.location.search).get('plantilla')
  return isTemplate(id) ? id : null
}

export const INITIAL_TEMPLATE = LOCKED_TEMPLATE ?? templateFromUrl() ?? DEFAULT_TEMPLATE_ID

import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config/mode'

let clientPromise: Promise<SupabaseClient> | null = null

/**
 * Cliente de Supabase cargado bajo demanda: la demo (sin llaves) nunca
 * descarga la libreria, y una tienda de cliente la descarga una sola vez.
 */
export function getSupabase() {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'vitrina:auth' },
    }),
  )
  return clientPromise
}

interface PostgrestLikeError {
  code?: string
  message?: string
}

/** Traduce los errores de la base de datos a mensajes que el dueño entienda. */
export function friendlyError(error: PostgrestLikeError | null | undefined, fallback = 'No se pudo completar la acción.') {
  if (!error) return new Error(fallback)
  switch (error.code) {
    case '23001':
    case '23503':
      return new Error('No se puede eliminar: hay productos que dependen de esto. Muévelos o elimínalos primero.')
    case '23505':
      return new Error('Ya existe un registro con esa dirección web. Usa otro nombre o cambia la dirección.')
    case '42501':
    case 'PGRST301':
      return new Error('Tu sesión no tiene permiso para esto. Vuelve a iniciar sesión.')
    case 'P0001':
      return new Error(error.message ?? fallback)
    default:
      return new Error(error.message ? `${fallback} (${error.message})` : fallback)
  }
}

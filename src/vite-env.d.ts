/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Fija la tienda en una plantilla (modo cliente). Vacio = demo con todas las plantillas. */
  readonly VITE_PLANTILLA?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

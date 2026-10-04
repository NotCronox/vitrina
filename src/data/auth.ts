import { USE_SUPABASE } from '@/config/mode'
import { getSupabase } from './supabase-client'

/**
 * Inicio de sesion del dueño. En la demo cualquier correo entra y la sesion
 * vive en sessionStorage; con Supabase se usa Supabase Auth y ademas se
 * comprueba que la cuenta este en la lista de administradores.
 */
export interface AuthProvider {
  readonly mode: 'demo' | 'supabase'
  currentEmail(): Promise<string | null>
  signIn(email: string, password: string): Promise<string>
  signOut(): Promise<void>
  changePassword(password: string): Promise<void>
  onChange(callback: (email: string | null) => void): () => void
}

const DEMO_KEY = 'vitrina:admin-session'

const demoAuth: AuthProvider = {
  mode: 'demo',
  async currentEmail() {
    try {
      return sessionStorage.getItem(DEMO_KEY)
    } catch {
      return null
    }
  },
  async signIn(email) {
    await new Promise((r) => setTimeout(r, 450))
    try {
      sessionStorage.setItem(DEMO_KEY, email)
    } catch {
      /* sin almacenamiento: la sesion dura mientras la pagina este abierta */
    }
    return email
  },
  async signOut() {
    try {
      sessionStorage.removeItem(DEMO_KEY)
    } catch {
      /* nada que limpiar */
    }
  },
  async changePassword() {
    throw new Error('En la demo no hay contraseñas reales.')
  },
  onChange() {
    return () => {}
  },
}

const supabaseAuth: AuthProvider = {
  mode: 'supabase',
  async currentEmail() {
    const sb = await getSupabase()
    const { data } = await sb.auth.getSession()
    return data.session?.user.email ?? null
  },
  async signIn(email, password) {
    const sb = await getSupabase()
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error) {
      throw new Error(error.message.includes('Invalid login') ? 'Correo o contraseña incorrectos.' : `No se pudo iniciar sesión (${error.message}).`)
    }
    const { data: isAdmin, error: rpcError } = await sb.rpc('is_admin')
    if (rpcError || !isAdmin) {
      await sb.auth.signOut()
      throw new Error('Esta cuenta no tiene acceso al panel de la tienda.')
    }
    return data.user.email ?? email
  },
  async signOut() {
    const sb = await getSupabase()
    await sb.auth.signOut()
  },
  async changePassword(password) {
    if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
    const sb = await getSupabase()
    const { error } = await sb.auth.updateUser({ password })
    if (error) throw new Error(`No se pudo cambiar la contraseña (${error.message}).`)
  },
  onChange(callback) {
    let unsubscribe = () => {}
    let closed = false
    getSupabase().then((sb) => {
      if (closed) return
      const { data } = sb.auth.onAuthStateChange((_event, session) => callback(session?.user.email ?? null))
      unsubscribe = () => data.subscription.unsubscribe()
    })
    return () => {
      closed = true
      unsubscribe()
    }
  },
}

export const auth: AuthProvider = USE_SUPABASE ? supabaseAuth : demoAuth

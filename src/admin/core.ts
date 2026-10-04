import { create } from 'zustand'
import { auth } from '@/data/auth'
import type { ThemeConfig } from '@/types'

/* ---------- Tema propio del panel ---------- */

/** El panel usa siempre la misma apariencia neutra, sin importar el tema de la tienda. */
export const ADMIN_THEME: ThemeConfig = {
  mode: 'light',
  colors: {
    bg: '#f5f5f4',
    surface: '#ffffff',
    ink: '#1c1917',
    muted: '#78716c',
    accent: '#4338ca',
    accentInk: '#ffffff',
    line: '#e7e5e4',
  },
  fonts: { display: 'Inter', body: 'Inter' },
  radius: 12,
  buttonShape: 'soft',
  displayWeight: 600,
  displayItalic: false,
  cardRatio: '1/1',
  cardStyle: 'boxed',
  grain: false,
  logoStyle: 'regular',
}

/* ---------- Sesion ---------- */

interface SessionState {
  status: 'loading' | 'ready'
  email: string | null
  /** Lee la sesion guardada y escucha cambios (por ejemplo, si expira). */
  init: () => () => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

/** Sesion del dueño. Delega en el proveedor de autenticacion (demo o Supabase). */
export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  email: null,
  init: () => {
    auth.currentEmail().then((email) => set({ email, status: 'ready' }))
    return auth.onChange((email) => set({ email }))
  },
  signIn: async (email, password) => {
    const signed = await auth.signIn(email, password)
    set({ email: signed })
  },
  signOut: async () => {
    await auth.signOut()
    set({ email: null })
  },
}))

/* ---------- Avisos ---------- */

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

let toastId = 0

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }].slice(-3) }))
    setTimeout(() => get().dismiss(id), tone === 'error' ? 6000 : 3200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (message: string) => useToasts.getState().push(message, 'success'),
  error: (message: string) => useToasts.getState().push(message, 'error'),
  info: (message: string) => useToasts.getState().push(message, 'info'),
}

/* ---------- Confirmaciones ---------- */

export interface ConfirmOptions {
  title: string
  body?: string
  confirmLabel?: string
  danger?: boolean
}

interface ConfirmState {
  request: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  ask: (options: ConfirmOptions) => Promise<boolean>
  answer: (ok: boolean) => void
}

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  request: null,
  ask: (options) => new Promise<boolean>((resolve) => set({ request: { ...options, resolve } })),
  answer: (ok) => {
    get().request?.resolve(ok)
    set({ request: null })
  },
}))

/** Dialogo de confirmacion propio (reemplaza a window.confirm). */
export const confirm = (options: ConfirmOptions) => useConfirmStore.getState().ask(options)

import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Palette,
  Receipt,
  Settings,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { IS_SHOWCASE } from '@/config/mode'
import { TEMPLATES } from '@/config/templates'
import { useSnapshot } from '@/data'
import { useDemo } from '@/state/demo'
import { cn } from '@/lib/format'
import { useSession } from './core'
import { useOrders } from './hooks'

const NAV = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Receipt },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  { to: '/admin/campos', label: 'Campos y filtros', icon: SlidersHorizontal },
  { to: '/admin/personalizar', label: 'Personalizar tienda', icon: Palette },
  { to: '/admin/ajustes', label: 'Ajustes', icon: Settings },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { config } = useSnapshot()
  const { templateId, setTemplate } = useDemo()
  const { email, signOut } = useSession()
  const pending = useOrders().data?.filter((o) => o.status === 'pending').length ?? 0

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-4 py-4">
        <p className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.16em] text-muted uppercase">
          <span className="grid size-5 place-items-center rounded-md bg-accent text-[0.6rem] text-accent-ink">V</span>
          Vitrina
        </p>
        {IS_SHOWCASE ? (
          <label className="mt-3 block">
            <span className="sr-only">Tienda</span>
            <select
              value={templateId}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full cursor-pointer rounded-[10px] border border-line bg-bg px-3 py-2 text-sm font-semibold"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.id === config.id ? config.business.name : t.name} · {t.industry}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="mt-3 truncate text-sm font-semibold">{config.business.name}</p>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-ink text-bg' : 'text-ink/75 hover:bg-ink/5 hover:text-ink',
              )
            }
          >
            <item.icon className="size-4" strokeWidth={1.8} />
            <span className="flex-1">{item.label}</span>
            {item.to === '/admin/pedidos' && pending > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[0.65rem] leading-5 font-bold text-accent-ink">{pending}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-line p-3">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-ink/75 hover:bg-ink/5 hover:text-ink">
          <ExternalLink className="size-4" strokeWidth={1.8} />
          Ver tienda
        </a>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-ink/75 hover:bg-ink/5 hover:text-ink">
          <LogOut className="size-4" strokeWidth={1.8} />
          <span className="flex-1 text-left">Cerrar sesión</span>
        </button>
        <p className="truncate px-3 pt-2 text-[0.7rem] text-muted">{email}</p>
      </div>
    </div>
  )
}

export function AdminLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { config } = useSnapshot()

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-64 bg-surface shadow-2xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 grid size-8 place-items-center text-muted" aria-label="Cerrar menú">
                <X className="size-4" />
              </button>
              <Sidebar onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="-ml-1 grid size-9 place-items-center" aria-label="Abrir menú">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">{config.business.name}</span>
          <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[0.65rem] font-semibold text-muted">Panel</span>
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/** Contenedor estandar de cada pagina del panel. */
export function AdminPage({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className={cn('mx-auto w-full px-4 py-6 md:px-8 md:py-10', wide ? 'max-w-7xl' : 'max-w-6xl')}>{children}</div>
}

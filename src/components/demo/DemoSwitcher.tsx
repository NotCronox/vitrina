import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, LayoutDashboard, Repeat2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { TEMPLATES, getTemplate } from '@/config/templates'
import { prefetchStore } from '@/data'
import { useDemo } from '@/state/demo'
import { useUi } from '@/state/ui'
import { fontStack, googleFontsUrl } from '@/theme/fonts'
import { cn } from '@/lib/format'

/**
 * Selector flotante de la demo publica: cambia toda la tienda (tema, campos,
 * productos y textos) con una transicion de pantalla completa.
 */
export function DemoSwitcher() {
  const { templateId, setTemplate } = useDemo()
  const cartOpen = useUi((s) => s.cartOpen)
  const navigate = useNavigate()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const current = getTemplate(templateId)

  useEffect(preloadTemplateFonts, [])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onClick)
    return () => document.removeEventListener('pointerdown', onClick)
  }, [open])

  const switchTo = async (id: string) => {
    setOpen(false)
    if (id === templateId) return
    setTarget(id)
    await new Promise((r) => setTimeout(r, 550))
    await prefetchStore(client, id)
    setTemplate(id)
    navigate('/')
    window.scrollTo({ top: 0 })
    await new Promise((r) => setTimeout(r, 450))
    setTarget(null)
  }

  const targetTemplate = target ? getTemplate(target) : null

  return (
    <>
      <div
        ref={panelRef}
        className={cn(
          'demo-switcher fixed bottom-4 left-4 z-40 transition-all duration-300 md:bottom-6 md:left-6',
          cartOpen && 'pointer-events-none opacity-0',
        )}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full left-0 mb-3 w-[min(340px,calc(100vw-2rem))] origin-bottom-left overflow-hidden rounded-2xl border border-white/10 bg-[#141414] font-[system-ui] text-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
                <div>
                  <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-white/50 uppercase">Vitrina · Demo</p>
                  <p className="mt-1 text-sm leading-snug text-white/80">
                    El mismo motor, dos negocios distintos. Cambia de plantilla y mira cómo se transforma todo.
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center text-white/60" aria-label="Cerrar">
                  <X className="size-4" />
                </button>
              </div>
              <ul className="p-2">
                {TEMPLATES.map((t) => {
                  const { theme, business } = t.snapshot.config
                  const active = t.id === templateId
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => switchTo(t.id)}
                        className={cn('flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors', active ? 'bg-white/10' : 'hover:bg-white/5')}
                      >
                        <span
                          className="grid size-12 shrink-0 place-items-center rounded-lg text-lg"
                          style={{ background: theme.colors.bg, color: theme.colors.ink, fontFamily: fontStack(theme.fonts.display), border: `1px solid ${theme.colors.line}` }}
                        >
                          {business.name.charAt(0)}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-semibold">{t.name}</span>
                          <span className="block text-xs text-white/50">{t.industry}</span>
                        </span>
                        <span className="flex gap-1">
                          {[theme.colors.bg, theme.colors.accent, theme.colors.ink].map((c) => (
                            <span key={c} className="size-3 rounded-full ring-1 ring-white/20" style={{ background: c }} />
                          ))}
                        </span>
                        {active && <Check className="size-4 text-white/80" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 border-t border-white/10 px-4 py-3.5 text-sm transition-colors hover:bg-white/5"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-white/10">
                  <LayoutDashboard className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">Abrir el panel</span>
                  <span className="block text-xs text-white/50">Edita productos, diseño y secciones</span>
                </span>
                <ArrowRight className="size-4 text-white/50" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 items-center gap-2.5 rounded-full border border-white/10 bg-[#141414]/95 pr-4 pl-1.5 font-[system-ui] text-white shadow-xl backdrop-blur transition-transform hover:scale-[1.02]"
          aria-expanded={open}
        >
          <span className="grid size-8 place-items-center rounded-full bg-white text-[#141414]">
            <Repeat2 className="size-4" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[0.6rem] font-semibold tracking-[0.14em] text-white/50 uppercase">Plantilla</span>
            <span className="block text-xs font-semibold">{current.name}</span>
          </span>
        </button>
      </div>

      <AnimatePresence>
        {targetTemplate && (
          <motion.div
            className="fixed inset-0 z-[90] grid place-items-center"
            style={{ background: targetTemplate.snapshot.config.theme.colors.bg, color: targetTemplate.snapshot.config.theme.colors.ink }}
            initial={{ clipPath: 'circle(0% at 4% 96%)' }}
            animate={{ clipPath: 'circle(150% at 4% 96%)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <p
                className="text-6xl md:text-8xl"
                style={{ fontFamily: fontStack(targetTemplate.snapshot.config.theme.fonts.display) }}
              >
                {targetTemplate.snapshot.config.business.name}
              </p>
              <p className="mt-3 text-sm tracking-[0.2em] uppercase opacity-60">{targetTemplate.industry}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/** Precarga las tipografias de todas las plantillas para que el cambio sea instantaneo. */
function preloadTemplateFonts() {
  const id = 'vitrina-preview-fonts'
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = googleFontsUrl(TEMPLATES.flatMap((t) => [t.snapshot.config.theme.fonts.display, t.snapshot.config.theme.fonts.body]))
  document.head.appendChild(link)
}

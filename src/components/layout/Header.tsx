import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useCartSummary, useSnapshot } from '@/data'
import { useUi } from '@/state/ui'
import { cn } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/Icon'
import { Logo } from './Logo'

function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function Header() {
  const { config, categories } = useSnapshot()
  const { count } = useCartSummary()
  const { openCart, menuOpen, setMenu } = useUi()
  const location = useLocation()
  const scrolled = useScrolled()

  const hero = config.sections.find((s) => s.enabled)
  const overHero = location.pathname === '/' && hero?.type === 'hero' && hero.props.layout === 'immersive' && !scrolled
  const navCategories = [...categories].sort((a, b) => a.order - b.order).slice(0, 3)

  useEffect(() => setMenu(false), [location.pathname, location.search, setMenu])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn('relative py-1 text-[0.8rem] font-medium tracking-wide transition-opacity hover:opacity-100', isActive ? 'opacity-100' : 'opacity-70')

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 transition-[background-color,border-color,color] duration-500',
          overHero ? 'border-b border-transparent text-white' : 'border-b border-line bg-bg/85 text-ink backdrop-blur-xl',
        )}
        style={overHero ? { marginBottom: 'calc(var(--header-h) * -1)' } : undefined}
      >
        <div className="container-x grid h-[var(--header-h)] grid-cols-[1fr_auto_1fr] items-center gap-4">
          <nav className="flex items-center gap-7">
            <button
              className="-ml-2 grid size-10 place-items-center md:hidden"
              onClick={() => setMenu(true)}
              aria-label="Abrir menú"
            >
              <Menu className="size-5" strokeWidth={1.6} />
            </button>
            <NavLink to="/catalogo" end className={(s) => cn(linkClass(s), 'hidden md:block')}>
              Tienda
            </NavLink>
            {navCategories.map((c) => (
              <Link
                key={c.id}
                to={`/catalogo?categoria=${c.slug}`}
                className={cn(
                  'hidden py-1 text-[0.8rem] font-medium tracking-wide opacity-70 transition-opacity hover:opacity-100 lg:block',
                  location.search.includes(`categoria=${c.slug}`) && 'opacity-100',
                )}
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <Link to="/" aria-label={`${config.business.name}, inicio`} className="justify-self-center">
            <Logo />
          </Link>

          <div className="flex items-center justify-end gap-1">
            <Link to="/catalogo?buscar=1" className="grid size-10 place-items-center" aria-label="Buscar">
              <Search className="size-[1.15rem]" strokeWidth={1.6} />
            </Link>
            <button onClick={openCart} className="relative grid size-10 place-items-center" aria-label={`Abrir bolsa, ${count} productos`}>
              <ShoppingBag className="size-[1.2rem]" strokeWidth={1.6} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className="absolute top-0.5 right-0 grid min-w-[1.15rem] place-items-center rounded-full bg-accent px-1 text-[0.65rem] leading-[1.15rem] font-bold text-accent-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-bg text-ink"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              aria-label="Menú"
            >
              <div className="flex h-[var(--header-h)] items-center justify-between border-b border-line px-5">
                <Logo />
                <button onClick={() => setMenu(false)} className="grid size-10 place-items-center" aria-label="Cerrar menú">
                  <X className="size-5" strokeWidth={1.6} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-6">
                <Link to="/catalogo" className="display border-b border-line py-4 text-3xl">
                  Toda la tienda
                </Link>
                {[...categories]
                  .sort((a, b) => a.order - b.order)
                  .map((c) => (
                    <Link key={c.id} to={`/catalogo?categoria=${c.slug}`} className="display border-b border-line py-4 text-3xl">
                      {c.name}
                    </Link>
                  ))}
              </nav>
              <div className="flex gap-3 border-t border-line p-5 text-sm">
                <a href={waLink(config.business.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-2 opacity-80">
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </a>
                {config.business.instagram && (
                  <a
                    href={`https://instagram.com/${config.business.instagram}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 opacity-80"
                  >
                    <InstagramIcon className="size-4" /> Instagram
                  </a>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

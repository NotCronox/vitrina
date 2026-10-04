import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useSnapshot } from '@/data'
import { filterProducts, type CatalogFilters, type SortKey } from '@/lib/catalog'
import { cn } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Filters, type FilterPatch } from '@/components/catalog/Filters'

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Destacados' },
  { value: 'new', label: 'Más recientes' },
  { value: 'price-asc', label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name', label: 'Nombre' },
]

/** Los filtros viven en la URL: se pueden compartir y sobreviven a recargar. */
function useCatalogFilters() {
  const [params, setParams] = useSearchParams()
  const { categories } = useSnapshot()

  const filters = useMemo<CatalogFilters>(() => {
    const attrs: Record<string, string[]> = {}
    params.forEach((value, key) => {
      if (key.startsWith('f_')) attrs[key.slice(2)] = value.split(',').filter(Boolean)
    })
    const slug = params.get('categoria')
    return {
      q: params.get('q') ?? '',
      category: categories.find((c) => c.slug === slug)?.id ?? null,
      sort: (params.get('orden') as SortKey) || 'relevance',
      attrs,
      maxPrice: params.get('precio') ? Number(params.get('precio')) : null,
      inStockOnly: params.get('stock') === '1',
    }
  }, [params, categories])

  const update = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    next.delete('buscar')
    mutate(next)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  const setOrDelete = (next: URLSearchParams, key: string, value: string | null) => {
    if (value) next.set(key, value)
    else next.delete(key)
  }

  return {
    filters,
    focusSearch: params.get('buscar') === '1',
    setQuery: (q: string) => update((n) => setOrDelete(n, 'q', q)),
    setCategory: (slug: string | null) => update((n) => setOrDelete(n, 'categoria', slug)),
    setSort: (sort: SortKey) => update((n) => setOrDelete(n, 'orden', sort === 'relevance' ? null : sort)),
    patch: (p: FilterPatch) =>
      update((n) => {
        if (p.attr) setOrDelete(n, `f_${p.attr[0]}`, p.attr[1].join(','))
        if ('maxPrice' in p) setOrDelete(n, 'precio', p.maxPrice ? String(p.maxPrice) : null)
        if ('inStockOnly' in p) setOrDelete(n, 'stock', p.inStockOnly ? '1' : null)
      }),
    clear: () =>
      update((n) => {
        for (const key of [...n.keys()]) if (key !== 'categoria') n.delete(key)
      }),
  }
}

export function CatalogPage() {
  const snapshot = useSnapshot()
  const { config, categories } = snapshot
  const { filters, focusSearch, setQuery, setCategory, setSort, patch, clear } = useCatalogFilters()
  const [sheetOpen, setSheetOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => filterProducts(snapshot, filters), [snapshot, filters])
  const category = categories.find((c) => c.id === filters.category)
  const activeCount =
    Object.values(filters.attrs).filter((v) => v.length).length + (filters.maxPrice ? 1 : 0) + (filters.inStockOnly ? 1 : 0)

  useEffect(() => {
    if (focusSearch) searchRef.current?.focus()
  }, [focusSearch])

  useEffect(() => {
    document.title = `${category?.name ?? 'Tienda'} · ${config.business.name}`
  }, [category, config.business.name])

  return (
    <div className="container-x pt-10 md:pt-16">
      <header className="mb-8 md:mb-12">
        <p className="eyebrow mb-4">{config.business.name}</p>
        <motion.h1
          key={category?.id ?? 'all'}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="display text-[clamp(2.8rem,7vw,5.5rem)]"
        >
          {category?.name ?? 'Toda la tienda'}
        </motion.h1>
        <p className="mt-3 max-w-xl text-muted">
          {category?.description ?? `Explora todas nuestras ${config.catalog.productNoun.plural}.`}
        </p>
      </header>

      <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Categorías">
        {[{ id: null, slug: null, name: 'Todo' }, ...[...categories].sort((a, b) => a.order - b.order)].map((c) => {
          const active = (c.id ?? null) === filters.category
          return (
            <button
              key={c.slug ?? 'all'}
              onClick={() => setCategory(c.slug)}
              className={cn(
                'shrink-0 rounded-btn border px-5 py-2.5 text-sm font-medium transition-colors',
                active ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink/40',
              )}
              aria-pressed={active}
            >
              {c.name}
            </button>
          )
        })}
      </nav>

      <div className="sticky top-[var(--header-h)] z-20 -mx-4 mb-8 flex items-center gap-2 border-y border-line bg-bg/90 px-4 py-3 backdrop-blur-xl md:mx-0 md:gap-3 md:px-0">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="search"
            value={filters.q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar ${config.catalog.productNoun.plural}, notas, ingredientes...`}
            className="field !rounded-btn !py-2.5 !pl-10"
            aria-label="Buscar"
          />
        </label>
        <Button variant="outline" className="lg:hidden" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[0.65rem] text-accent-ink">{activeCount}</span>}
        </Button>
        <select
          value={filters.sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="field !w-auto !rounded-btn !py-2.5 text-sm"
          aria-label="Ordenar"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+90px)] max-h-[calc(100vh-var(--header-h)-110px)] overflow-y-auto pr-2 pb-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted">{results.length} resultados</p>
              {activeCount > 0 && (
                <button onClick={clear} className="text-xs font-semibold text-accent">
                  Limpiar
                </button>
              )}
            </div>
            <Filters filters={filters} onChange={patch} />
          </div>
        </aside>

        <div>
          <p className="mb-5 text-sm text-muted lg:hidden">{results.length} resultados</p>
          {results.length ? (
            <motion.div layout className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 md:gap-y-12">
              <AnimatePresence mode="popLayout">
                {results.map((product, i) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                  >
                    <ProductCard product={product} priority={i < 6} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-20 text-center">
              <p className="display text-3xl">Nada por aquí</p>
              <p className="mt-2 max-w-sm text-sm text-muted">No encontramos {config.catalog.productNoun.plural} con esos filtros. Prueba quitando alguno.</p>
              <Button variant="outline" className="mt-6" onClick={clear}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="Filtros"
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[1.5rem] bg-bg text-ink"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="display text-2xl">Filtros</h2>
                <button onClick={() => setSheetOpen(false)} className="grid size-10 place-items-center" aria-label="Cerrar filtros">
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <Filters filters={filters} onChange={patch} />
              </div>
              <div className="flex gap-3 border-t border-line p-4">
                <Button variant="outline" className="flex-1" onClick={clear}>
                  Limpiar
                </Button>
                <Button className="flex-[2]" onClick={() => setSheetOpen(false)}>
                  Ver {results.length} resultados
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Copy, Package, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { useSnapshot } from '@/data'
import { defaultVariant } from '@/lib/catalog'
import { cn, formatMoney, uid } from '@/lib/format'
import { imageUrl } from '@/lib/images'
import { buttonClass } from '@/components/ui/Button'
import type { Product } from '@/types'
import { AdminPage } from '../AdminLayout'
import { confirm, toast } from '../core'
import { useDeleteProduct, useSaveProduct } from '../hooks'
import { EmptyState, IconButton, PageHeader, Segmented, Select, Switch, TextInput } from '../ui'

type Visibility = 'all' | 'active' | 'hidden'

function stockLabel(product: Product) {
  if (product.variants.every((v) => v.stock === null)) return { text: 'Sin control', tone: 'text-muted' }
  const units = product.variants.reduce((s, v) => s + (v.stock ?? 0), 0)
  if (product.variants.every((v) => v.stock === 0)) return { text: 'Agotado', tone: 'text-red-700 font-semibold' }
  return { text: `${units} u.`, tone: units <= 5 ? 'text-amber-700 font-semibold' : 'text-ink' }
}

export function ProductsPage() {
  const { config, products, categories } = useSnapshot()
  const save = useSaveProduct()
  const remove = useDeleteProduct()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('all')
  const money = (n: number) => formatMoney(n, config.business.currency, config.business.locale)
  const noun = config.catalog.productNoun

  const list = products.filter((p) => {
    if (category && p.categoryId !== category) return false
    if (visibility === 'active' && !p.active) return false
    if (visibility === 'hidden' && p.active) return false
    return !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())
  })

  const toggle = (product: Product, patch: Partial<Product>) => save.mutate({ ...product, ...patch })

  const duplicate = async (product: Product) => {
    const copy: Product = {
      ...structuredClone(product),
      id: uid('p_'),
      name: `${product.name} (copia)`,
      slug: `${product.slug}-copia-${Math.random().toString(36).slice(2, 5)}`,
      active: false,
      createdAt: new Date().toISOString(),
    }
    await save.mutateAsync(copy)
    toast.success('Producto duplicado (oculto hasta que lo actives)')
    navigate(`/admin/productos/${copy.id}`)
  }

  const destroy = async (product: Product) => {
    const ok = await confirm({ title: `¿Eliminar ${product.name}?`, body: 'Esta acción no se puede deshacer. Si solo quieres ocultarlo, desactívalo.', confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    await remove.mutateAsync(product.id)
    toast.success('Producto eliminado')
  }

  return (
    <AdminPage>
      <PageHeader
        title="Productos"
        description={`${products.length} ${noun.plural} en el catálogo · ${products.filter((p) => p.active).length} visibles en la tienda`}
        actions={
          <Link to="/admin/productos/nuevo" className={buttonClass('primary', 'sm')}>
            <Plus className="size-4" /> Nuevo {noun.singular}
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${noun.plural}...`} className="!pl-9" aria-label="Buscar" />
        </label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="md:!w-52" aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Segmented<Visibility>
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'active', label: 'Visibles' },
            { value: 'hidden', label: 'Ocultos' },
          ]}
        />
      </div>

      {list.length ? (
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="hidden grid-cols-[1fr_140px_110px_90px_70px_130px] gap-4 border-b border-line px-5 py-2.5 text-xs font-medium text-muted md:grid">
            <span>{noun.singular.charAt(0).toUpperCase() + noun.singular.slice(1)}</span>
            <span>Categoría</span>
            <span className="text-right">Precio</span>
            <span className="text-right">Inventario</span>
            <span className="text-center">Visible</span>
            <span />
          </div>
          <ul className="divide-y divide-line">
            {list.map((p) => {
              const stock = stockLabel(p)
              return (
                <li key={p.id} className={cn('grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 md:grid-cols-[1fr_140px_110px_90px_70px_130px]', !p.active && 'bg-ink/[0.02]')}>
                  <Link to={`/admin/productos/${p.id}`} className="flex min-w-0 items-center gap-3">
                    <img src={imageUrl(p.images[0], 120)} alt="" className={cn('size-12 shrink-0 rounded-lg object-cover', !p.active && 'opacity-50 grayscale')} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {p.variants.length} {p.variants.length === 1 ? 'variante' : config.catalog.variantLabel.toLowerCase() + 's'}
                      </span>
                    </span>
                  </Link>
                  <span className="truncate text-sm text-muted max-md:hidden">{categories.find((c) => c.id === p.categoryId)?.name ?? '—'}</span>
                  <span className="text-right text-sm font-medium tabular-nums">{money(defaultVariant(p).price)}</span>
                  <span className={cn('text-right text-sm tabular-nums max-md:hidden', stock.tone)}>{stock.text}</span>
                  <span className="flex justify-center max-md:hidden">
                    <Switch checked={p.active} onChange={(active) => toggle(p, { active })} />
                  </span>
                  <span className="flex justify-end gap-0.5 max-md:col-span-2 max-md:justify-start">
                    <span className="mr-auto flex items-center gap-2 text-xs text-muted md:hidden">
                      <Switch checked={p.active} onChange={(active) => toggle(p, { active })} /> Visible
                    </span>
                    <IconButton label={p.featured ? 'Quitar de destacados' : 'Destacar'} onClick={() => toggle(p, { featured: !p.featured })}>
                      <Star className={cn('size-4', p.featured && 'fill-amber-400 text-amber-500')} />
                    </IconButton>
                    <IconButton label="Duplicar" onClick={() => duplicate(p)}>
                      <Copy className="size-4" />
                    </IconButton>
                    <Link to={`/admin/productos/${p.id}`} title="Editar" aria-label={`Editar ${p.name}`} className="grid size-9 place-items-center rounded-[8px] text-muted hover:bg-ink/6 hover:text-ink">
                      <Pencil className="size-4" />
                    </Link>
                    <IconButton label="Eliminar" onClick={() => destroy(p)} className="hover:!text-red-600">
                      <Trash2 className="size-4" />
                    </IconButton>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={<Package className="size-5" />}
          title={products.length ? 'Sin resultados' : `Aún no hay ${noun.plural}`}
          body={products.length ? 'Prueba con otra búsqueda o filtro.' : 'Crea el primero para empezar a vender.'}
          action={
            <Link to="/admin/productos/nuevo" className={buttonClass('primary', 'sm')}>
              <Plus className="size-4" /> Nuevo {noun.singular}
            </Link>
          }
        />
      )}
    </AdminPage>
  )
}

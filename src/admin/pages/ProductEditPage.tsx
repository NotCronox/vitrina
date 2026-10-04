import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, ExternalLink, Palette, Plus, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { useSnapshot } from '@/data'
import { cn, slugify, uid } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import type { Product, Variant } from '@/types'
import { AdminPage } from '../AdminLayout'
import { AttributeInput } from '../AttributeInput'
import { confirm, toast } from '../core'
import { useDeleteProduct, useSaveProduct } from '../hooks'
import { SaveBar, UnsavedGuard } from '../UnsavedGuard'
import { Card, Field, GalleryInput, IconButton, MoveButtons, NumberInput, Select, Switch, TextArea, TextInput, moveItem } from '../ui'

const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
  categoryId: z.string().min(1, 'Elige una categoría'),
  variants: z
    .array(
      z.object({
        label: z.string().trim().min(1, 'Cada variante necesita un nombre'),
        price: z.number().min(0, 'El precio no puede ser negativo'),
      }),
    )
    .min(1, 'Agrega al menos una variante'),
})

type Errors = Partial<Record<'name' | 'slug' | 'categoryId' | 'variants', string>>

function blankProduct(categoryId: string): Product {
  return {
    id: uid('p_'),
    slug: '',
    name: '',
    categoryId,
    summary: '',
    description: '',
    images: [],
    variants: [{ id: uid('v_'), label: 'Única', price: 0, stock: null }],
    attributes: {},
    badges: [],
    featured: false,
    active: true,
    createdAt: new Date().toISOString(),
  }
}

export function ProductEditPage() {
  const { id } = useParams()
  const { products, categories } = useSnapshot()
  const existing = products.find((p) => p.id === id)

  if (id !== 'nuevo' && !existing) {
    return (
      <AdminPage>
        <p className="text-muted">Este producto no existe.</p>
        <Link to="/admin/productos" className="mt-4 inline-block text-sm font-semibold text-accent">
          Volver a productos
        </Link>
      </AdminPage>
    )
  }

  const initial = existing ?? blankProduct([...categories].sort((a, b) => a.order - b.order)[0]?.id ?? '')
  return <ProductForm key={initial.id} initial={initial} isNew={!existing} />
}

function ProductForm({ initial, isNew }: { initial: Product; isNew: boolean }) {
  const { config, products, categories } = useSnapshot()
  const { catalog } = config
  const save = useSaveProduct()
  const remove = useDeleteProduct()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product>(initial)
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [errors, setErrors] = useState<Errors>({})
  const [swatches, setSwatches] = useState(initial.variants.some((v) => v.swatch))
  const [leaving, setLeaving] = useState(false)

  // Salir a proposito (despues de crear, eliminar o descartar) no debe disparar el aviso de cambios sin guardar.
  const leave = (to: string) => {
    flushSync(() => setLeaving(true))
    navigate(to, { replace: true })
  }
  // Al pasar de "nuevo" a producto existente (misma instancia del formulario), el aviso vuelve a activarse.
  useEffect(() => setLeaving(false), [isNew])

  const dirty = useMemo(() => JSON.stringify(product) !== JSON.stringify(initial), [product, initial])

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setProduct((p) => ({ ...p, [key]: value }))
  const setVariant = (index: number, patch: Partial<Variant>) =>
    setProduct((p) => ({ ...p, variants: p.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) }))

  const submit = async () => {
    const slug = product.slug || slugify(product.name)
    const parsed = productSchema.safeParse({ ...product, slug })
    const next: Errors = {}
    if (!parsed.success) for (const issue of parsed.error.issues) next[issue.path[0] as keyof Errors] ??= issue.message
    if (products.some((p) => p.slug === slug && p.id !== product.id)) next.slug = 'Ya existe otro producto con esta dirección'
    setErrors(next)
    if (Object.keys(next).length) return toast.error('Revisa los campos marcados')

    const final: Product = {
      ...product,
      slug,
      name: product.name.trim(),
      variants: product.variants.map((v) => (swatches ? v : { ...v, swatch: undefined })),
    }
    await save.mutateAsync(final)
    toast.success(isNew ? 'Producto creado' : 'Producto guardado')
    setProduct(final)
    if (isNew) leave(`/admin/productos/${final.id}`)
  }

  const destroy = async () => {
    const ok = await confirm({ title: `¿Eliminar ${product.name}?`, body: 'Esta acción no se puede deshacer.', confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    await remove.mutateAsync(product.id)
    toast.success('Producto eliminado')
    leave('/admin/productos')
  }

  const groups = [...catalog.groups, { id: '', label: 'Otros', layout: 'list' as const }]

  return (
    <AdminPage>
      <UnsavedGuard when={dirty && !leaving} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link to="/admin/productos" className="grid size-9 place-items-center rounded-[10px] border border-line bg-surface" aria-label="Volver">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="flex-1 truncate text-xl font-semibold tracking-tight">{isNew ? `Nuevo ${catalog.productNoun.singular}` : product.name || 'Sin nombre'}</h1>
        {!isNew && (
          <>
            <a href={`/producto/${product.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-muted hover:text-ink">
              <ExternalLink className="size-4" /> Ver en la tienda
            </a>
            <Button variant="outline" size="sm" onClick={destroy} className="!text-red-600">
              <Trash2 className="size-4" /> Eliminar
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-4 pb-24 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card title="Información">
            <div className="space-y-4">
              <Field label="Nombre" error={errors.name}>
                <TextInput
                  value={product.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setProduct((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }))
                  }}
                  placeholder={catalog.productNoun.singular === 'fragancia' ? 'Ámbar Nocturno' : 'Nombre del producto'}
                />
              </Field>
              <Field label="Resumen" hint="Una frase que aparece bajo el nombre. Vende la idea en pocas palabras.">
                <TextArea value={product.summary} onChange={(e) => set('summary', e.target.value)} className="!min-h-16" />
              </Field>
              <Field label="Descripción">
                <TextArea value={product.description} onChange={(e) => set('description', e.target.value)} className="!min-h-32" />
              </Field>
            </div>
          </Card>

          <Card title="Imágenes" description="La primera es la portada. La segunda aparece al pasar el mouse sobre la tarjeta.">
            <GalleryInput values={product.images} onChange={(images) => set('images', images)} />
          </Card>

          <Card
            title={`${catalog.variantLabel} y precios`}
            description="Cada opción tiene su precio e inventario. La primera es la que se muestra por defecto."
            actions={
              <button
                type="button"
                onClick={() => setSwatches((s) => !s)}
                className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', swatches ? 'border-accent bg-accent/8 text-accent' : 'border-line text-muted')}
              >
                <Palette className="size-3.5" /> Muestras de color
              </button>
            }
          >
            {errors.variants && <p className="mb-3 text-xs text-red-600">{errors.variants}</p>}
            <div className="space-y-2">
              <div className={cn('hidden gap-2 px-1 text-[0.7rem] font-medium text-muted sm:grid', swatches ? 'grid-cols-[24px_44px_1fr_110px_110px_90px_72px]' : 'grid-cols-[24px_1fr_110px_110px_90px_72px]')}>
                <span />
                {swatches && <span>Color</span>}
                <span>Nombre</span>
                <span>Precio</span>
                <span>Antes (tachado)</span>
                <span>Inventario</span>
                <span />
              </div>
              {product.variants.map((v, i) => (
                <div
                  key={v.id}
                  className={cn('grid items-center gap-2 rounded-[10px] bg-ink/[0.025] p-2 sm:bg-transparent sm:p-0', swatches ? 'grid-cols-[24px_44px_1fr] sm:grid-cols-[24px_44px_1fr_110px_110px_90px_72px]' : 'grid-cols-[24px_1fr] sm:grid-cols-[24px_1fr_110px_110px_90px_72px]')}
                >
                  <MoveButtons index={i} length={product.variants.length} onMove={(to) => set('variants', moveItem(product.variants, i, to))} />
                  {swatches && (
                    <label className="relative size-9 cursor-pointer overflow-hidden rounded-full border border-line" style={{ background: v.swatch ?? '#dddddd' }}>
                      <input type="color" value={v.swatch ?? '#dddddd'} onChange={(e) => setVariant(i, { swatch: e.target.value })} className="absolute inset-0 opacity-0" aria-label={`Color de ${v.label}`} />
                    </label>
                  )}
                  <TextInput value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="50 ml, Rosé 01, Talla M..." aria-label="Nombre de la variante" />
                  <div className="col-span-full grid grid-cols-[1fr_1fr_1fr_auto] gap-2 sm:contents">
                    <NumberInput value={v.price} onChange={(price) => setVariant(i, { price: price ?? 0 })} min={0} aria-label="Precio" />
                    <NumberInput value={v.compareAtPrice} allowEmpty onChange={(n) => setVariant(i, { compareAtPrice: n ?? undefined })} placeholder="—" aria-label="Precio anterior" />
                    <NumberInput value={v.stock} allowEmpty onChange={(stock) => setVariant(i, { stock })} placeholder="∞" min={0} aria-label="Inventario (vacío = sin control)" />
                    <IconButton label="Quitar variante" onClick={() => set('variants', product.variants.filter((_, j) => j !== i))} disabled={product.variants.length === 1}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => set('variants', [...product.variants, { id: uid('v_'), label: '', price: product.variants.at(-1)?.price ?? 0, stock: null }])}>
                <Plus className="size-3.5" /> Agregar {catalog.variantLabel.toLowerCase()}
              </Button>
              <p className="text-xs text-muted">Inventario vacío = sin límite.</p>
            </div>
          </Card>

          <Card title="Características" description="Estos campos se definen en Campos y filtros. Alimentan la ficha y los filtros de la tienda.">
            <div className="space-y-6">
              {groups.map((group) => {
                const defs = catalog.attributes.filter((a) => (a.group ?? '') === group.id || (group.id === '' && a.group && !catalog.groups.some((g) => g.id === a.group)))
                if (!defs.length) return null
                return (
                  <div key={group.id || 'otros'}>
                    <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">{group.label}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {defs.map((def) => (
                        <Field key={def.id} label={def.label} hint={def.help} className={cn((def.type === 'multi' || def.type === 'tags') && 'sm:col-span-2')}>
                          <AttributeInput
                            def={def}
                            value={product.attributes[def.id]}
                            onChange={(value) =>
                              setProduct((p) => {
                                const attributes = { ...p.attributes }
                                if (value === undefined) delete attributes[def.id]
                                else attributes[def.id] = value
                                return { ...p, attributes }
                              })
                            }
                          />
                        </Field>
                      ))}
                    </div>
                  </div>
                )
              })}
              {!catalog.attributes.length && (
                <p className="text-sm text-muted">
                  Aún no hay campos. <Link to="/admin/campos" className="font-semibold text-accent">Crea el primero</Link>.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card title="Visibilidad">
            <div className="space-y-4">
              <Switch checked={product.active} onChange={(active) => set('active', active)} label="Visible en la tienda" description="Si lo apagas, nadie lo verá en el catálogo." />
              <Switch checked={product.featured} onChange={(featured) => set('featured', featured)} label="Destacado" description="Aparece en las secciones de destacados." />
            </div>
          </Card>

          <Card title="Organización">
            <div className="space-y-4">
              <Field label="Categoría" error={errors.categoryId}>
                <Select value={product.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  {!categories.length && <option value="">Crea una categoría primero</option>}
                  {[...categories]
                    .sort((a, b) => a.order - b.order)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </Field>

              <div>
                <p className="mb-2 text-[0.78rem] font-medium">Etiquetas</p>
                <div className="flex flex-wrap gap-1.5">
                  {catalog.badges.map((b) => {
                    const on = product.badges.includes(b.id)
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => set('badges', on ? product.badges.filter((x) => x !== b.id) : [...product.badges, b.id])}
                        className={cn('rounded-full border px-3 py-1 text-xs font-medium', on ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:border-ink/30')}
                        aria-pressed={on}
                      >
                        {b.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <Field label="Dirección web" error={errors.slug} hint={`/producto/${product.slug || slugify(product.name) || '...'}`}>
                <TextInput
                  value={product.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    set('slug', slugify(e.target.value))
                  }}
                />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      <SaveBar
        visible={dirty || isNew}
        saving={save.isPending}
        onSave={submit}
        onDiscard={() => (isNew ? leave('/admin/productos') : setProduct(initial))}
        message={isNew ? `Nuevo ${catalog.productNoun.singular}` : 'Cambios sin guardar'}
        saveLabel={isNew ? 'Crear' : 'Guardar'}
      />
    </AdminPage>
  )
}

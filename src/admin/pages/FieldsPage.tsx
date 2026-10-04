import { useEffect, useState } from 'react'
import { Filter, LayoutGrid, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSnapshot } from '@/data'
import { cn, slugify } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import type { AttributeDef, AttributeGroupLayout, AttributeOption, AttributeType, BadgeDef } from '@/types'
import { AdminPage } from '../AdminLayout'
import { confirm, toast } from '../core'
import { useConfigDraft } from '../hooks'
import { SaveBar, UnsavedGuard } from '../UnsavedGuard'
import { Card, Field, IconButton, Modal, MoveButtons, NumberInput, PageHeader, Select, Switch, TagInput, TextInput, moveItem } from '../ui'

export const TYPE_LABELS: Record<AttributeType, { label: string; hint: string }> = {
  text: { label: 'Texto', hint: 'Un dato libre: “Perfumista”, “Material”, “Contenido”.' },
  select: { label: 'Una opción', hint: 'Elegir una de una lista: “Familia”, “Acabado”, “Talla de horma”.' },
  multi: { label: 'Varias opciones', hint: 'Elegir varias de una lista: “Ocasión”, “Tipo de piel”.' },
  tags: { label: 'Etiquetas libres', hint: 'Lista abierta: “Notas de salida”, “Ingredientes”.' },
  scale: { label: 'Escala', hint: 'Un nivel del 1 al máximo: “Intensidad”, “Cobertura”.' },
  boolean: { label: 'Sí / No', hint: 'Una característica que se tiene o no: “Vegano”, “Hecho a mano”.' },
}

const LAYOUTS: { value: AttributeGroupLayout; label: string; hint: string }[] = [
  { value: 'list', label: 'Lista', hint: 'Filas de dato y valor' },
  { value: 'chips', label: 'Chips', hint: 'Etiquetas redondeadas' },
  { value: 'meters', label: 'Medidores', hint: 'Barras para escalas' },
  { value: 'tiers', label: 'Niveles', hint: 'Línea de tiempo (pirámide olfativa)' },
]

const TONES: { value: BadgeDef['tone']; label: string; className: string }[] = [
  { value: 'accent', label: 'Color de acento', className: 'bg-accent text-accent-ink' },
  { value: 'ink', label: 'Oscuro', className: 'bg-ink text-bg' },
  { value: 'soft', label: 'Suave', className: 'border border-line bg-surface text-ink' },
]

export function FieldsPage() {
  const { products } = useSnapshot()
  const { draft, dirty, saving, update, save, discard } = useConfigDraft()
  const { catalog } = draft
  const [editing, setEditing] = useState<{ def: AttributeDef; isNew: boolean } | null>(null)

  const usage = (id: string) => products.filter((p) => p.attributes[id] !== undefined).length

  const removeAttribute = async (def: AttributeDef) => {
    const used = usage(def.id)
    const ok = await confirm({
      title: `¿Eliminar el campo “${def.label}”?`,
      body: used ? `${used} productos tienen este dato. Dejará de mostrarse en la tienda y en los filtros.` : 'Dejará de mostrarse en la tienda.',
      confirmLabel: 'Eliminar campo',
      danger: true,
    })
    if (ok) update((d) => void (d.catalog.attributes = d.catalog.attributes.filter((a) => a.id !== def.id)))
  }

  return (
    <AdminPage>
      <UnsavedGuard when={dirty} />
      <PageHeader
        title="Campos y filtros"
        description="Define qué información tiene cada producto. Con esto se arman solos el formulario de productos, la ficha en la tienda y los filtros del catálogo."
      />

      <div className="space-y-4 pb-24">
        <Card title="Cómo se llaman las cosas" description="Se usan en textos de la tienda y del panel.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Producto (singular)" hint="fragancia, producto, prenda...">
              <TextInput value={catalog.productNoun.singular} onChange={(e) => update((d) => void (d.catalog.productNoun.singular = e.target.value))} />
            </Field>
            <Field label="Producto (plural)">
              <TextInput value={catalog.productNoun.plural} onChange={(e) => update((d) => void (d.catalog.productNoun.plural = e.target.value))} />
            </Field>
            <Field label="Nombre de las variantes" hint="Tamaño, Tono, Talla, Sabor...">
              <TextInput value={catalog.variantLabel} onChange={(e) => update((d) => void (d.catalog.variantLabel = e.target.value))} />
            </Field>
          </div>
        </Card>

        <Card
          title="Campos de producto"
          description="El orden aquí es el orden en la ficha y en los filtros."
          actions={
            <Button
              size="sm"
              onClick={() =>
                setEditing({
                  def: { id: '', label: '', type: 'select', options: [], filterable: true, group: (catalog.groups.find((g) => g.layout === 'list') ?? catalog.groups[0])?.id },
                  isNew: true,
                })
              }
            >
              <Plus className="size-4" /> Nuevo campo
            </Button>
          }
          bodyClassName="!p-0"
        >
          <ul className="divide-y divide-line">
            {catalog.attributes.map((def, i) => (
              <li key={def.id} className="flex items-center gap-3 px-4 py-3">
                <MoveButtons index={i} length={catalog.attributes.length} onMove={(to) => update((d) => void (d.catalog.attributes = moveItem(d.catalog.attributes, i, to)))} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{def.label}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className="rounded bg-ink/6 px-1.5 py-0.5 font-medium text-ink/70">{TYPE_LABELS[def.type].label}</span>
                    {def.options && def.options.length > 0 && <span>{def.options.length} opciones</span>}
                    <span>· {catalog.groups.find((g) => g.id === def.group)?.label ?? 'Sin grupo'}</span>
                    <span>· en {usage(def.id)} productos</span>
                  </p>
                </div>
                {def.filterable && (
                  <span className="hidden items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[0.7rem] font-semibold text-accent sm:flex">
                    <Filter className="size-3" /> Filtro
                  </span>
                )}
                {def.showOnCard && (
                  <span className="hidden items-center gap-1 rounded-full bg-ink/6 px-2 py-0.5 text-[0.7rem] font-semibold sm:flex">
                    <LayoutGrid className="size-3" /> Tarjeta
                  </span>
                )}
                <IconButton label="Editar campo" onClick={() => setEditing({ def, isNew: false })}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton label="Eliminar campo" onClick={() => removeAttribute(def)} className="hover:!text-red-600">
                  <Trash2 className="size-4" />
                </IconButton>
              </li>
            ))}
            {!catalog.attributes.length && <li className="p-5 text-sm text-muted">Aún no hay campos. Crea el primero.</li>}
          </ul>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card
            title="Grupos de la ficha"
            description="Bloques en los que se ordena la información del producto."
            actions={
              <Button variant="outline" size="sm" onClick={() => update((d) => void d.catalog.groups.push({ id: `g_${Date.now().toString(36)}`, label: 'Nuevo grupo', layout: 'list' }))}>
                <Plus className="size-3.5" /> Grupo
              </Button>
            }
          >
            <div className="space-y-3">
              {catalog.groups.map((group, i) => (
                <div key={group.id} className="rounded-[10px] border border-line p-3">
                  <div className="flex items-center gap-2">
                    <MoveButtons index={i} length={catalog.groups.length} onMove={(to) => update((d) => void (d.catalog.groups = moveItem(d.catalog.groups, i, to)))} />
                    <TextInput value={group.label} onChange={(e) => update((d) => void (d.catalog.groups[i].label = e.target.value))} aria-label="Nombre del grupo" />
                    <Select
                      value={group.layout}
                      onChange={(e) => update((d) => void (d.catalog.groups[i].layout = e.target.value as AttributeGroupLayout))}
                      className="!w-36"
                      aria-label="Forma de mostrarse"
                    >
                      {LAYOUTS.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </Select>
                    <IconButton
                      label="Eliminar grupo"
                      onClick={() =>
                        update((d) => {
                          d.catalog.groups.splice(i, 1)
                          d.catalog.attributes.forEach((a) => a.group === group.id && delete a.group)
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                  <p className="mt-2 pl-8 text-xs text-muted">
                    {LAYOUTS.find((l) => l.value === group.layout)?.hint} · {catalog.attributes.filter((a) => a.group === group.id).length} campos
                  </p>
                  {group.layout === 'tiers' && (
                    <div className="mt-2 pl-8">
                      <TagInput values={group.tierLabels ?? []} onChange={(tierLabels) => update((d) => void (d.catalog.groups[i].tierLabels = tierLabels))} placeholder="Nombre de cada nivel: Salida, Corazón, Fondo" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Etiquetas de producto"
            description="Sellos como “Nuevo” u “Oferta” sobre la foto."
            actions={
              <Button variant="outline" size="sm" onClick={() => update((d) => void d.catalog.badges.push({ id: `b_${Date.now().toString(36)}`, label: 'Nueva', tone: 'accent' }))}>
                <Plus className="size-3.5" /> Etiqueta
              </Button>
            }
          >
            <div className="space-y-2">
              {catalog.badges.map((badge, i) => (
                <div key={badge.id} className="flex items-center gap-2">
                  <span className={cn('w-28 shrink-0 truncate rounded-full px-2.5 py-1 text-center text-[0.65rem] font-semibold tracking-wider uppercase', TONES.find((t) => t.value === badge.tone)?.className)}>
                    {badge.label || '—'}
                  </span>
                  <TextInput value={badge.label} onChange={(e) => update((d) => void (d.catalog.badges[i].label = e.target.value))} aria-label="Texto de la etiqueta" />
                  <Select value={badge.tone} onChange={(e) => update((d) => void (d.catalog.badges[i].tone = e.target.value as BadgeDef['tone']))} className="!w-40" aria-label="Estilo">
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                  <IconButton label="Eliminar etiqueta" onClick={() => update((d) => void d.catalog.badges.splice(i, 1))}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <AttributeModal
        state={editing}
        existingIds={catalog.attributes.map((a) => a.id)}
        groups={catalog.groups}
        onClose={() => setEditing(null)}
        onSave={(def, isNew) => {
          update((d) => {
            if (isNew) d.catalog.attributes.push(def)
            else d.catalog.attributes = d.catalog.attributes.map((a) => (a.id === def.id ? def : a))
          })
          setEditing(null)
          toast.info('Campo listo. Recuerda guardar los cambios.')
        }}
      />

      <SaveBar visible={dirty} saving={saving} onSave={save} onDiscard={discard} />
    </AdminPage>
  )
}

function AttributeModal({
  state,
  existingIds,
  groups,
  onClose,
  onSave,
}: {
  state: { def: AttributeDef; isNew: boolean } | null
  existingIds: string[]
  groups: { id: string; label: string }[]
  onClose: () => void
  onSave: (def: AttributeDef, isNew: boolean) => void
}) {
  const [def, setDef] = useState<AttributeDef | null>(state?.def ?? null)
  const [error, setError] = useState('')
  useEffect(() => {
    setDef(state ? structuredClone(state.def) : null)
    setError('')
  }, [state])

  if (!state || !def) return null
  const isNew = state.isNew
  const hasOptions = def.type === 'select' || def.type === 'multi'
  const patch = (p: Partial<AttributeDef>) => setDef({ ...def, ...p })
  const setOption = (i: number, p: Partial<AttributeOption>) => patch({ options: def.options?.map((o, j) => (j === i ? { ...o, ...p } : o)) })

  const submit = () => {
    const label = def.label.trim()
    if (label.length < 2) return setError('Escribe un nombre para el campo')
    let id = def.id
    if (isNew) {
      id = slugify(label).replace(/-/g, '_') || `campo_${Date.now().toString(36)}`
      while (existingIds.includes(id)) id = `${id}_2`
    }
    const options = hasOptions
      ? (def.options ?? [])
          .filter((o) => o.label.trim())
          .map((o) => ({ ...o, label: o.label.trim(), value: o.value || slugify(o.label) }))
      : undefined
    if (hasOptions && !options?.length) return setError('Agrega al menos una opción')
    onSave(
      {
        ...def,
        id,
        label,
        options,
        max: def.type === 'scale' ? def.max ?? 5 : undefined,
        scaleLabels: def.type === 'scale' ? def.scaleLabels : undefined,
      },
      isNew,
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isNew ? 'Nuevo campo' : `Editar “${state.def.label}”`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit}>
            {isNew ? 'Agregar campo' : 'Aplicar'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre del campo" error={error}>
          <TextInput value={def.label} onChange={(e) => patch({ label: e.target.value })} autoFocus placeholder="Material, Sabor, Talla de horma..." />
        </Field>

        <div>
          <p className="mb-2 text-[0.78rem] font-medium">Tipo de dato</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(TYPE_LABELS) as AttributeType[]).map((type) => (
              <button
                type="button"
                key={type}
                disabled={!isNew && type !== def.type}
                onClick={() => patch({ type, options: type === 'select' || type === 'multi' ? def.options ?? [] : def.options })}
                className={cn(
                  'rounded-[10px] border p-3 text-left transition-colors disabled:opacity-35',
                  def.type === type ? 'border-accent bg-accent/6' : 'border-line hover:border-ink/30',
                )}
              >
                <span className="block text-sm font-medium">{TYPE_LABELS[type].label}</span>
                <span className="mt-0.5 block text-xs text-muted">{TYPE_LABELS[type].hint}</span>
              </button>
            ))}
          </div>
          {!isNew && <p className="mt-2 text-xs text-muted">El tipo no se puede cambiar después de crear el campo, para no romper los datos existentes.</p>}
        </div>

        {hasOptions && (
          <div>
            <p className="mb-2 text-[0.78rem] font-medium">Opciones</p>
            <div className="space-y-2">
              {def.options?.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <MoveButtons index={i} length={def.options!.length} onMove={(to) => patch({ options: moveItem(def.options!, i, to) })} />
                  <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-line" style={{ background: o.color ?? 'transparent' }} title="Color opcional">
                    <input type="color" value={o.color ?? '#cccccc'} onChange={(e) => setOption(i, { color: e.target.value })} className="absolute inset-0 opacity-0" aria-label="Color de la opción" />
                    {!o.color && <span className="absolute inset-0 m-auto h-px w-6 rotate-45 bg-ink/30" />}
                  </label>
                  <TextInput value={o.label} onChange={(e) => setOption(i, { label: e.target.value })} placeholder={`Opción ${i + 1}`} />
                  {o.color && (
                    <button type="button" onClick={() => setOption(i, { color: undefined })} className="shrink-0 text-xs text-muted hover:text-ink">
                      Sin color
                    </button>
                  )}
                  <IconButton label="Quitar opción" onClick={() => patch({ options: def.options!.filter((_, j) => j !== i) })}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => patch({ options: [...(def.options ?? []), { value: '', label: '' }] })}>
              <Plus className="size-3.5" /> Opción
            </Button>
          </div>
        )}

        {def.type === 'scale' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Máximo">
              <NumberInput value={def.max ?? 5} min={2} max={10} onChange={(n) => patch({ max: Math.min(10, Math.max(2, n ?? 5)) })} />
            </Field>
            <Field label="Texto del mínimo">
              <TextInput value={def.scaleLabels?.[0] ?? ''} onChange={(e) => patch({ scaleLabels: [e.target.value, def.scaleLabels?.[1] ?? ''] })} placeholder="Suave" />
            </Field>
            <Field label="Texto del máximo">
              <TextInput value={def.scaleLabels?.[1] ?? ''} onChange={(e) => patch({ scaleLabels: [def.scaleLabels?.[0] ?? '', e.target.value] })} placeholder="Intensa" />
            </Field>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grupo en la ficha">
            <Select value={def.group ?? ''} onChange={(e) => patch({ group: e.target.value || undefined })}>
              <option value="">Sin grupo (no se muestra en la ficha)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ayuda para quien carga productos">
            <TextInput value={def.help ?? ''} onChange={(e) => patch({ help: e.target.value || undefined })} placeholder="Opcional" />
          </Field>
        </div>

        <div className="space-y-3 rounded-[10px] bg-ink/4 p-4">
          <Switch checked={Boolean(def.filterable)} onChange={(filterable) => patch({ filterable })} label="Usar como filtro" description="Aparece en el panel de filtros del catálogo." />
          <Switch checked={Boolean(def.showOnCard)} onChange={(showOnCard) => patch({ showOnCard })} label="Mostrar en la tarjeta" description="Se ve sobre el nombre en el listado de productos." />
        </div>
      </div>
    </Modal>
  )
}

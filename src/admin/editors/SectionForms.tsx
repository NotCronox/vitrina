import { Plus, Trash2 } from 'lucide-react'
import { useSnapshot } from '@/data'
import { Button } from '@/components/ui/Button'
import { ICONS } from '@/components/ui/Icon'
import type { Section } from '@/types'
import { Field, IconButton, ImageInput, MoveButtons, NumberInput, Segmented, Select, StringListInput, TextArea, TextInput, moveItem } from '../ui'

const ICON_LABELS: Record<string, string> = {
  droplet: 'Gota',
  gift: 'Regalo',
  heart: 'Corazón',
  leaf: 'Hoja',
  message: 'Mensaje',
  shield: 'Escudo',
  sparkles: 'Destellos',
  star: 'Estrella',
  truck: 'Camión',
}

/** Lista editable de objetos (beneficios, testimonios, preguntas). */
function ItemList<T>({
  items,
  onChange,
  render,
  create,
  addLabel,
}: {
  items: T[]
  onChange: (items: T[]) => void
  render: (item: T, set: (patch: Partial<T>) => void) => React.ReactNode
  create: () => T
  addLabel: string
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-[10px] border border-line p-2.5">
          <MoveButtons index={i} length={items.length} onMove={(to) => onChange(moveItem(items, i, to))} />
          <div className="min-w-0 flex-1 space-y-2">{render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))))}</div>
          <IconButton label="Quitar" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...items, create()])}>
        <Plus className="size-3.5" /> {addLabel}
      </Button>
    </div>
  )
}

/** Formulario de cada tipo de seccion. Recibe la seccion y devuelve sus props actualizadas. */
export function SectionForm({ section, onChange }: { section: Section; onChange: (props: Section['props']) => void }) {
  const { categories, config } = useSnapshot()

  switch (section.type) {
    case 'hero': {
      const p = section.props
      const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch })
      return (
        <div className="space-y-4">
          <Segmented
            value={p.layout}
            onChange={(layout) => set({ layout })}
            options={[
              { value: 'immersive', label: 'Pantalla completa' },
              { value: 'split', label: 'Dividida' },
            ]}
          />
          <Field label="Antetítulo">
            <TextInput value={p.eyebrow ?? ''} onChange={(e) => set({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Título">
            <TextArea value={p.title} onChange={(e) => set({ title: e.target.value })} className="!min-h-16" />
          </Field>
          <Field label="Subtítulo">
            <TextArea value={p.subtitle ?? ''} onChange={(e) => set({ subtitle: e.target.value })} className="!min-h-16" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Botón principal">
              <TextInput value={p.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} />
            </Field>
            <Field label="Botón WhatsApp" hint="Vacío = sin botón">
              <TextInput value={p.secondaryLabel ?? ''} onChange={(e) => set({ secondaryLabel: e.target.value || undefined })} />
            </Field>
          </div>
          <Field label="Imagen">
            <ImageInput value={p.image} onChange={(image) => set({ image: image ?? '' })} />
          </Field>
        </div>
      )
    }

    case 'marquee':
      return <StringListInput values={section.props.items} onChange={(items) => onChange({ items })} addLabel="Frase" />

    case 'categories': {
      const p = section.props
      return (
        <div className="space-y-4">
          <Field label="Título">
            <TextInput value={p.title} onChange={(e) => onChange({ ...p, title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <TextInput value={p.subtitle ?? ''} onChange={(e) => onChange({ ...p, subtitle: e.target.value || undefined })} />
          </Field>
        </div>
      )
    }

    case 'products': {
      const p = section.props
      const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch })
      return (
        <div className="space-y-4">
          <Field label="Título">
            <TextInput value={p.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Subtítulo">
            <TextInput value={p.subtitle ?? ''} onChange={(e) => set({ subtitle: e.target.value || undefined })} />
          </Field>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Field label="Qué productos mostrar">
              <Select value={p.source} onChange={(e) => set({ source: e.target.value })}>
                <option value="featured">Destacados</option>
                <option value="new">Más recientes</option>
                <optgroup label="Por etiqueta">
                  {config.catalog.badges.map((b) => (
                    <option key={b.id} value={`badge:${b.id}`}>
                      {b.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Por categoría">
                  {categories.map((c) => (
                    <option key={c.id} value={`category:${c.id}`}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              </Select>
            </Field>
            <Field label="Cantidad">
              <NumberInput value={p.limit} min={1} max={12} onChange={(n) => set({ limit: Math.min(12, Math.max(1, n ?? 4)) })} />
            </Field>
          </div>
        </div>
      )
    }

    case 'story': {
      const p = section.props
      const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch })
      return (
        <div className="space-y-4">
          <Field label="Antetítulo">
            <TextInput value={p.eyebrow ?? ''} onChange={(e) => set({ eyebrow: e.target.value })} />
          </Field>
          <Field label="Título">
            <TextInput value={p.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Texto">
            <TextArea value={p.body} onChange={(e) => set({ body: e.target.value })} />
          </Field>
          <Field label="Botón" hint="Vacío = sin botón">
            <TextInput value={p.ctaLabel ?? ''} onChange={(e) => set({ ctaLabel: e.target.value || undefined })} />
          </Field>
          <Field label="Imagen">
            <ImageInput value={p.image} onChange={(image) => set({ image: image ?? '' })} aspect="aspect-[4/5]" />
          </Field>
        </div>
      )
    }

    case 'benefits':
      return (
        <ItemList
          items={section.props.items}
          onChange={(items) => onChange({ items })}
          addLabel="Beneficio"
          create={() => ({ icon: 'sparkles', title: 'Nuevo beneficio', text: '' })}
          render={(item, set) => (
            <>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <Select value={item.icon} onChange={(e) => set({ icon: e.target.value })} aria-label="Ícono">
                  {Object.keys(ICONS).map((k) => (
                    <option key={k} value={k}>
                      {ICON_LABELS[k] ?? k}
                    </option>
                  ))}
                </Select>
                <TextInput value={item.title} onChange={(e) => set({ title: e.target.value })} aria-label="Título" />
              </div>
              <TextInput value={item.text} onChange={(e) => set({ text: e.target.value })} placeholder="Descripción corta" />
            </>
          )}
        />
      )

    case 'testimonials': {
      const p = section.props
      return (
        <div className="space-y-4">
          <Field label="Título">
            <TextInput value={p.title} onChange={(e) => onChange({ ...p, title: e.target.value })} />
          </Field>
          <ItemList
            items={p.items}
            onChange={(items) => onChange({ ...p, items })}
            addLabel="Testimonio"
            create={() => ({ quote: '', author: '', detail: '' })}
            render={(item, set) => (
              <>
                <TextArea value={item.quote} onChange={(e) => set({ quote: e.target.value })} placeholder="Lo que dijo el cliente" className="!min-h-16" />
                <div className="grid grid-cols-2 gap-2">
                  <TextInput value={item.author} onChange={(e) => set({ author: e.target.value })} placeholder="Nombre" />
                  <TextInput value={item.detail ?? ''} onChange={(e) => set({ detail: e.target.value })} placeholder="Producto o detalle" />
                </div>
              </>
            )}
          />
        </div>
      )
    }

    case 'faq': {
      const p = section.props
      return (
        <div className="space-y-4">
          <Field label="Título">
            <TextInput value={p.title} onChange={(e) => onChange({ ...p, title: e.target.value })} />
          </Field>
          <ItemList
            items={p.items}
            onChange={(items) => onChange({ ...p, items })}
            addLabel="Pregunta"
            create={() => ({ q: '', a: '' })}
            render={(item, set) => (
              <>
                <TextInput value={item.q} onChange={(e) => set({ q: e.target.value })} placeholder="Pregunta" />
                <TextArea value={item.a} onChange={(e) => set({ a: e.target.value })} placeholder="Respuesta" className="!min-h-16" />
              </>
            )}
          />
        </div>
      )
    }

    case 'cta': {
      const p = section.props
      const set = (patch: Partial<typeof p>) => onChange({ ...p, ...patch })
      return (
        <div className="space-y-4">
          <Field label="Título">
            <TextInput value={p.title} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Texto">
            <TextArea value={p.body} onChange={(e) => set({ body: e.target.value })} className="!min-h-16" />
          </Field>
          <Field label="Botón">
            <TextInput value={p.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} />
          </Field>
        </div>
      )
    }
  }
}

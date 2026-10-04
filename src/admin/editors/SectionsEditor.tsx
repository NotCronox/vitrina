import { useState } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { ChevronDown, Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import type { Section, SectionType } from '@/types'
import { confirm } from '../core'
import type { ConfigDraft } from '../hooks'
import { SECTION_META, newSection, sectionTitle } from '../presets'
import { IconButton, Modal } from '../ui'
import { SectionForm } from './SectionForms'

export function SectionsEditor({ draft, update, onFocusSection }: Pick<ConfigDraft, 'draft' | 'update'> & { onFocusSection: (id: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const sections = draft.sections

  const toggleOpen = (id: string) => {
    const next = openId === id ? null : id
    setOpenId(next)
    if (next) onFocusSection(next)
  }

  const add = (type: SectionType) => {
    const section = newSection(type)
    update((d) => void d.sections.push(section))
    setAdding(false)
    setOpenId(section.id)
    setTimeout(() => onFocusSection(section.id), 300)
  }

  return (
    <div className="p-4">
      <p className="mb-3 px-1 text-xs text-muted">Arrastra para cambiar el orden. El ojo oculta una sección sin borrarla.</p>
      <Reorder.Group
        axis="y"
        values={sections.map((s) => s.id)}
        onReorder={(ids: string[]) => update((d) => void d.sections.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)))}
        className="space-y-2"
      >
        {sections.map((section) => (
          <SectionItem
            key={section.id}
            section={section}
            open={openId === section.id}
            onToggleOpen={() => toggleOpen(section.id)}
            onChange={(patch) => update((d) => void (d.sections = d.sections.map((s) => (s.id === section.id ? ({ ...s, ...patch } as Section) : s))))}
            onDuplicate={() =>
              update((d) => {
                const i = d.sections.findIndex((s) => s.id === section.id)
                d.sections.splice(i + 1, 0, { ...structuredClone(section), id: `${section.type}_${Date.now().toString(36)}` })
              })
            }
            onDelete={async () => {
              const ok = await confirm({ title: `¿Eliminar “${sectionTitle(section)}”?`, body: 'Si solo quieres esconderla, usa el ojo.', confirmLabel: 'Eliminar', danger: true })
              if (ok) update((d) => void (d.sections = d.sections.filter((s) => s.id !== section.id)))
            }}
          />
        ))}
      </Reorder.Group>

      <Button variant="outline" className="mt-3 w-full border-dashed" onClick={() => setAdding(true)}>
        <Plus className="size-4" /> Agregar sección
      </Button>

      <Modal open={adding} onClose={() => setAdding(false)} title="Agregar sección" size="lg">
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(SECTION_META) as SectionType[]).map((type) => {
            const meta = SECTION_META[type]
            return (
              <button
                key={type}
                type="button"
                onClick={() => add(type)}
                className="flex flex-col items-start gap-2 rounded-[12px] border border-line p-4 text-left transition-colors hover:border-accent hover:bg-accent/4"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-ink/5">
                  <meta.icon className="size-4" />
                </span>
                <span className="text-sm font-semibold">{meta.label}</span>
                <span className="text-xs text-muted">{meta.description}</span>
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

function SectionItem({
  section,
  open,
  onToggleOpen,
  onChange,
  onDuplicate,
  onDelete,
}: {
  section: Section
  open: boolean
  onToggleOpen: () => void
  onChange: (patch: Partial<Section>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const controls = useDragControls()
  const meta = SECTION_META[section.type]

  return (
    <Reorder.Item
      value={section.id}
      dragListener={false}
      dragControls={controls}
      className={cn('overflow-hidden rounded-[12px] border bg-surface', open ? 'border-accent/50 shadow-sm' : 'border-line')}
      whileDrag={{ scale: 1.02, boxShadow: '0 16px 32px -12px rgb(0 0 0 / 0.25)' }}
    >
      <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-1">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="grid size-8 shrink-0 cursor-grab touch-none place-items-center text-muted active:cursor-grabbing"
          aria-label="Arrastrar sección"
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={onToggleOpen} className="flex min-w-0 flex-1 items-center gap-2.5 py-1 text-left" aria-expanded={open}>
          <meta.icon className={cn('size-4 shrink-0', section.enabled ? 'text-ink' : 'text-muted')} />
          <span className="min-w-0">
            <span className={cn('block truncate text-sm font-medium', !section.enabled && 'text-muted line-through')}>{sectionTitle(section)}</span>
            <span className="block text-[0.7rem] text-muted">{meta.label}</span>
          </span>
          <ChevronDown className={cn('ml-auto size-4 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
        </button>
        <IconButton label={section.enabled ? 'Ocultar' : 'Mostrar'} onClick={() => onChange({ enabled: !section.enabled })}>
          {section.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </IconButton>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-line p-4">
              <SectionForm section={section} onChange={(props) => onChange({ props } as Partial<Section>)} />
              <div className="mt-5 flex gap-2 border-t border-line pt-3">
                <Button variant="ghost" size="sm" onClick={onDuplicate}>
                  <Copy className="size-3.5" /> Duplicar
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} className="!text-red-600">
                  <Trash2 className="size-3.5" /> Eliminar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  )
}

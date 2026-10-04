import { useEffect, useState } from 'react'
import { Reorder, useDragControls } from 'motion/react'
import { FolderTree, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { useSnapshot } from '@/data'
import { slugify, uid } from '@/lib/format'
import { imageUrl } from '@/lib/images'
import { Button } from '@/components/ui/Button'
import type { Category } from '@/types'
import { AdminPage } from '../AdminLayout'
import { confirm, toast } from '../core'
import { useDeleteCategory, useSaveCategories, useSaveCategory } from '../hooks'
import { EmptyState, Field, IconButton, ImageInput, Modal, PageHeader, TextArea, TextInput } from '../ui'

export function CategoriesPage() {
  const { categories, products } = useSnapshot()
  const saveAll = useSaveCategories()
  const remove = useDeleteCategory()
  const sorted = [...categories].sort((a, b) => a.order - b.order)
  const [items, setItems] = useState(sorted)
  const [editing, setEditing] = useState<Category | null>(null)

  // Se sincroniza con el servidor solo cuando cambian los datos, no en cada render.
  const sortedKey = sorted.map((c) => c.id + c.name + c.order + (c.image ?? '').length).join('|')
  useEffect(() => setItems(sorted), [sortedKey])

  const persistOrder = () => {
    const changed = items.some((c, i) => c.order !== i + 1)
    if (!changed) return
    saveAll.mutate(items.map((c, i) => ({ ...c, order: i + 1 })), { onSuccess: () => toast.success('Orden actualizado') })
  }

  const destroy = async (category: Category) => {
    const count = products.filter((p) => p.categoryId === category.id).length
    if (count) return toast.error(`“${category.name}” tiene ${count} productos. Muévelos a otra categoría antes de eliminarla.`)
    const ok = await confirm({ title: `¿Eliminar “${category.name}”?`, confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    await remove.mutateAsync(category.id)
    toast.success('Categoría eliminada')
  }

  const create = () =>
    setEditing({ id: uid('c_'), slug: '', name: '', description: '', order: categories.length + 1 })

  return (
    <AdminPage>
      <PageHeader
        title="Categorías"
        description="Organizan el catálogo y aparecen en el menú y en el inicio. Arrastra para cambiar el orden."
        actions={
          <Button size="sm" onClick={create}>
            <Plus className="size-4" /> Nueva categoría
          </Button>
        }
      />

      {items.length ? (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
          {items.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              count={products.filter((p) => p.categoryId === category.id).length}
              onDragEnd={persistOrder}
              onEdit={() => setEditing(category)}
              onDelete={() => destroy(category)}
            />
          ))}
        </Reorder.Group>
      ) : (
        <EmptyState
          icon={<FolderTree className="size-5" />}
          title="Sin categorías"
          body="Crea al menos una para poder agregar productos."
          action={
            <Button size="sm" onClick={create}>
              <Plus className="size-4" /> Nueva categoría
            </Button>
          }
        />
      )}

      <CategoryModal category={editing} onClose={() => setEditing(null)} />
    </AdminPage>
  )
}

function CategoryRow({
  category,
  count,
  onDragEnd,
  onEdit,
  onDelete,
}: {
  category: Category
  count: number
  onDragEnd: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
      whileDrag={{ scale: 1.01, boxShadow: '0 12px 30px -12px rgb(0 0 0 / 0.25)' }}
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className="grid size-8 cursor-grab touch-none place-items-center text-muted active:cursor-grabbing"
        aria-label={`Arrastrar ${category.name}`}
      >
        <GripVertical className="size-4" />
      </button>
      {category.image ? (
        <img src={imageUrl(category.image, 160)} alt="" className="size-14 rounded-lg object-cover" />
      ) : (
        <span className="grid size-14 place-items-center rounded-lg bg-ink/5 text-muted">
          <FolderTree className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{category.name}</p>
        <p className="truncate text-xs text-muted">
          {count} productos · /catalogo?categoria={category.slug}
        </p>
      </div>
      <IconButton label="Editar" onClick={onEdit}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton label="Eliminar" onClick={onDelete} className="hover:!text-red-600">
        <Trash2 className="size-4" />
      </IconButton>
    </Reorder.Item>
  )
}

function CategoryModal({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { categories } = useSnapshot()
  const save = useSaveCategory()
  const [draft, setDraft] = useState<Category | null>(category)
  const [error, setError] = useState('')
  const isNew = Boolean(category && !categories.some((c) => c.id === category.id))

  useEffect(() => {
    setDraft(category)
    setError('')
  }, [category])

  const submit = async () => {
    if (!draft) return
    const name = draft.name.trim()
    if (name.length < 2) return setError('Escribe un nombre')
    const slug = draft.slug || slugify(name)
    if (categories.some((c) => c.slug === slug && c.id !== draft.id)) return setError('Ya existe una categoría con ese nombre')
    await save.mutateAsync({ ...draft, name, slug })
    toast.success(isNew ? 'Categoría creada' : 'Categoría guardada')
    onClose()
  }

  return (
    <Modal
      open={Boolean(category)}
      onClose={onClose}
      title={isNew ? 'Nueva categoría' : 'Editar categoría'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit} disabled={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      {draft && (
        <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
          <div className="space-y-4">
            <Field label="Nombre" error={error}>
              <TextInput
                value={draft.name}
                autoFocus
                onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: isNew ? slugify(e.target.value) : draft.slug })}
              />
            </Field>
            <Field label="Descripción" hint="Se muestra como subtítulo en el catálogo.">
              <TextArea value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="!min-h-20" />
            </Field>
            <Field label="Dirección web" hint={`/catalogo?categoria=${draft.slug || '...'}`}>
              <TextInput value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} />
            </Field>
          </div>
          <div>
            <p className="mb-1.5 text-[0.78rem] font-medium">Imagen</p>
            <ImageInput value={draft.image} onChange={(image) => setDraft({ ...draft, image })} aspect="aspect-[3/4]" />
          </div>
        </div>
      )}
    </Modal>
  )
}

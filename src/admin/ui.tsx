import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronUp, Image as ImageIcon, Images, Link as LinkIcon, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useRepository, useSnapshot } from '@/data'
import { cn } from '@/lib/format'
import { imageUrl } from '@/lib/images'
import { Button } from '@/components/ui/Button'
import { toast } from './core'
import { compressImage, dataUrlSizeKb } from './image'

/* ---------- Estructura ---------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={cn('rounded-card border border-line bg-surface', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="text-[0.95rem] font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-ink/5 text-muted">{icon}</span>
      <p className="mt-4 font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ---------- Campos ---------- */

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[0.78rem] font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field !py-2 text-sm', className)} {...props} />
}

export function NumberInput({
  value,
  onChange,
  className,
  allowEmpty = false,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | null | undefined
  onChange: (value: number | null) => void
  allowEmpty?: boolean
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      className={cn('field !py-2 text-sm tabular-nums', className)}
      value={value ?? ''}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') onChange(allowEmpty ? null : 0)
        else onChange(Number(raw))
      }}
      {...props}
    />
  )
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field min-h-24 !py-2 text-sm leading-relaxed', className)} {...props} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('field !py-2 text-sm', className)} {...props}>
      {children}
    </select>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  className,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('flex items-center justify-between gap-4 text-left', label && 'w-full', className)}
    >
      {label && (
        <span>
          <span className="block text-sm font-medium">{label}</span>
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
      <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-ink/15')}>
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-[10px] bg-ink/5 p-1', className)}>
      {options.map((o) => (
        <button
          type="button"
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={cn(
            'flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-medium transition-colors',
            o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ColorInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="flex items-center gap-3">
      <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-[10px] border border-line shadow-inner" style={{ background: value }}>
        <input
          type="color"
          value={value.length === 7 ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label}
        />
      </label>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) onChange(e.target.value.toLowerCase())
          }}
          className="w-full bg-transparent font-mono text-xs text-muted uppercase outline-none"
          aria-label={`${label} en hexadecimal`}
        />
      </div>
    </div>
  )
}

/** Lista simple de textos (avisos, metodos de pago, notas...). */
export function StringListInput({
  values,
  onChange,
  placeholder,
  addLabel = 'Agregar',
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  addLabel?: string
}) {
  return (
    <div className="space-y-2">
      {values.map((value, i) => (
        <div key={i} className="flex gap-2">
          <TextInput value={value} placeholder={placeholder} onChange={(e) => onChange(values.map((v, j) => (j === i ? e.target.value : v)))} />
          <MoveButtons index={i} length={values.length} onMove={(to) => onChange(moveItem(values, i, to))} />
          <IconButton label="Quitar" onClick={() => onChange(values.filter((_, j) => j !== i))}>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...values, ''])}>
        + {addLabel}
      </Button>
    </div>
  )
}

/** Etiquetas libres: se escriben y se agregan con Enter o coma. */
export function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (values: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState('')
  const commit = () => {
    const parts = text
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !values.includes(t))
    if (parts.length) onChange([...values, ...parts])
    setText('')
  }
  return (
    <div className="field flex flex-wrap items-center gap-1.5 !py-1.5">
      {values.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-md bg-ink/6 py-0.5 pr-1 pl-2 text-xs">
          {tag}
          <button type="button" onClick={() => onChange(values.filter((t) => t !== tag))} className="grid size-4 place-items-center rounded text-muted hover:text-ink" aria-label={`Quitar ${tag}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !text && values.length) onChange(values.slice(0, -1))
        }}
        onBlur={commit}
        placeholder={values.length ? '' : placeholder}
        className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none"
      />
    </div>
  )
}

/* ---------- Botones ---------- */

export function IconButton({
  label,
  children,
  onClick,
  className,
  disabled,
}: {
  label: string
  children: ReactNode
  onClick: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn('grid size-9 shrink-0 place-items-center rounded-[8px] text-muted transition-colors hover:bg-ink/6 hover:text-ink disabled:opacity-30', className)}
    >
      {children}
    </button>
  )
}

export function MoveButtons({ index, length, onMove }: { index: number; length: number; onMove: (to: number) => void }) {
  return (
    <div className="flex shrink-0 flex-col">
      <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} className="grid h-[1.1rem] w-6 place-items-center text-muted hover:text-ink disabled:opacity-25" aria-label="Subir">
        <ChevronUp className="size-3.5" />
      </button>
      <button type="button" onClick={() => onMove(index + 1)} disabled={index === length - 1} className="grid h-[1.1rem] w-6 place-items-center text-muted hover:text-ink disabled:opacity-25" aria-label="Bajar">
        <ChevronDown className="size-3.5" />
      </button>
    </div>
  )
}

export function moveItem<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/* ---------- Modal ---------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className={cn(
              'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl',
              size === 'sm' ? 'sm:max-w-md' : size === 'md' ? 'sm:max-w-xl' : 'sm:max-w-3xl',
            )}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">{title}</h2>
              <IconButton label="Cerrar" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Imagenes ---------- */

/** Todas las imagenes que ya usa la tienda, para reutilizarlas sin volver a subirlas. */
function useImageLibrary() {
  const { config, products, categories } = useSnapshot()
  const set = new Set<string>()
  for (const p of products) p.images.forEach((i) => set.add(i))
  for (const c of categories) if (c.image) set.add(c.image)
  for (const s of config.sections) {
    const props = s.props as { image?: string }
    if (props.image) set.add(props.image)
  }
  return [...set]
}

export function ImageLibraryModal({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (src: string) => void }) {
  const images = useImageLibrary()
  return (
    <Modal open={open} onClose={onClose} title="Imágenes de la tienda" size="lg">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {images.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => {
              onPick(src)
              onClose()
            }}
            className="aspect-square overflow-hidden rounded-[10px] ring-accent transition hover:ring-2"
          >
            <img src={imageUrl(src, 240)} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </Modal>
  )
}

function useUpload(onDone: (srcs: string[]) => void, maxSize?: number) {
  const [busy, setBusy] = useState(false)
  const repo = useRepository()
  const inputRef = useRef<HTMLInputElement>(null)
  const handle = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    try {
      const srcs: string[] = []
      // Se comprime en el navegador y luego el repositorio decide donde guardarla (demo o nube).
      for (const file of Array.from(files)) srcs.push(await repo.uploadImage(await compressImage(file, maxSize)))
      onDone(srcs)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cargar la imagen.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  return { busy, inputRef, handle }
}

/** Una sola imagen: subir, pegar URL o elegir de la tienda. */
export function ImageInput({
  value,
  onChange,
  aspect = 'aspect-video',
  maxSize,
  allowEmpty = true,
}: {
  value?: string
  onChange: (src: string | undefined) => void
  aspect?: string
  maxSize?: number
  allowEmpty?: boolean
}) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [url, setUrl] = useState('')
  const upload = useUpload((srcs) => onChange(srcs[0]), maxSize)
  const size = value ? dataUrlSizeKb(value) : null

  return (
    <div>
      <div className={cn('relative overflow-hidden rounded-[10px] border border-line bg-ink/4', aspect)}>
        {value ? (
          <img src={imageUrl(value, 800)} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted">
            <ImageIcon className="size-6" strokeWidth={1.4} />
          </div>
        )}
        {upload.busy && (
          <div className="absolute inset-0 grid place-items-center bg-surface/70">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        {size !== null && <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 text-[0.65rem] text-white">{size} KB</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button variant="outline" size="sm" onClick={() => upload.inputRef.current?.click()}>
          <Upload className="size-3.5" /> Subir
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
          <Images className="size-3.5" /> De la tienda
        </Button>
        <Button variant="outline" size="sm" onClick={() => setUrlOpen((o) => !o)}>
          <LinkIcon className="size-3.5" /> URL
        </Button>
        {value && allowEmpty && (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            Quitar
          </Button>
        )}
      </div>
      {urlOpen && (
        <div className="mt-2 flex gap-2">
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          <Button
            size="sm"
            onClick={() => {
              if (!/^https?:\/\//.test(url)) return toast.error('Pega una URL que empiece por https://')
              onChange(url)
              setUrl('')
              setUrlOpen(false)
            }}
          >
            Usar
          </Button>
        </div>
      )}
      <input ref={upload.inputRef} type="file" accept="image/*" hidden onChange={(e) => upload.handle(e.target.files)} />
      <ImageLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} onPick={onChange} />
    </div>
  )
}

/** Galeria de varias imagenes con orden (la primera es la portada). */
export function GalleryInput({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const valuesRef = useRef(values)
  valuesRef.current = values
  const upload = useUpload((srcs) => onChange([...valuesRef.current, ...srcs]))

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {values.map((src, i) => (
          <div key={src + i} className="group relative aspect-square overflow-hidden rounded-[10px] border border-line">
            <img src={imageUrl(src, 300)} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute top-1.5 left-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">Portada</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
              <div className="flex gap-1">
                <button type="button" onClick={() => onChange(moveItem(values, i, i - 1))} disabled={i === 0} className="grid size-7 place-items-center rounded-md bg-white/90 text-black disabled:opacity-40" aria-label="Mover a la izquierda">
                  <ChevronUp className="size-3.5 -rotate-90" />
                </button>
                <button type="button" onClick={() => onChange(moveItem(values, i, i + 1))} disabled={i === values.length - 1} className="grid size-7 place-items-center rounded-md bg-white/90 text-black disabled:opacity-40" aria-label="Mover a la derecha">
                  <ChevronUp className="size-3.5 rotate-90" />
                </button>
              </div>
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="grid size-7 place-items-center rounded-md bg-white/90 text-red-600" aria-label="Quitar imagen">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => upload.inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-ink/25 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
        >
          {upload.busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" strokeWidth={1.5} />}
          Subir
        </button>
      </div>
      <Button variant="ghost" size="sm" className="mt-2" onClick={() => setLibraryOpen(true)}>
        <Images className="size-3.5" /> Elegir de la tienda
      </Button>
      <input ref={upload.inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload.handle(e.target.files)} />
      <ImageLibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} onPick={(src) => onChange([...values, src])} />
    </div>
  )
}

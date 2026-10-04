import { inStock } from '@/lib/catalog'
import { cn } from '@/lib/format'
import type { Variant } from '@/types'

export function VariantPicker({
  label,
  variants,
  value,
  onChange,
}: {
  label: string
  variants: Variant[]
  value: string
  onChange: (id: string) => void
}) {
  const selected = variants.find((v) => v.id === value)
  const withSwatches = variants.every((v) => v.swatch)

  return (
    <fieldset>
      <legend className="mb-3 flex w-full items-baseline justify-between text-sm">
        <span>
          <span className="font-semibold">{label}:</span> <span className="text-muted">{selected?.label}</span>
        </span>
        {selected?.stock !== null && selected?.stock !== undefined && selected.stock > 0 && selected.stock <= 3 && (
          <span className="text-xs font-semibold text-accent">¡Quedan {selected.stock}!</span>
        )}
      </legend>

      {withSwatches ? (
        <div className="flex flex-wrap gap-2.5">
          {variants.map((v) => {
            const available = inStock(v)
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange(v.id)}
                title={available ? v.label : `${v.label} (agotado)`}
                aria-label={v.label}
                aria-pressed={v.id === value}
                className={cn(
                  'relative size-10 rounded-full ring-offset-2 ring-offset-bg transition-all',
                  v.id === value ? 'ring-2 ring-ink' : 'ring-1 ring-ink/15 hover:ring-ink/40',
                  !available && 'opacity-40',
                )}
                style={{ background: v.swatch }}
              >
                {!available && <span className="absolute inset-0 m-auto h-px w-full rotate-45 bg-ink/60" />}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const available = inStock(v)
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange(v.id)}
                aria-pressed={v.id === value}
                className={cn(
                  'min-w-20 rounded-btn border px-4 py-2.5 text-sm transition-colors',
                  v.id === value ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink/40',
                  !available && 'text-muted line-through',
                )}
              >
                {v.label}
              </button>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}

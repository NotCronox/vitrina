import { cn } from '@/lib/format'
import type { AttributeDef, AttributeValue } from '@/types'
import { Select, Switch, TagInput, TextInput } from './ui'

/** Control de formulario generado a partir de la definicion de un atributo. */
export function AttributeInput({
  def,
  value,
  onChange,
}: {
  def: AttributeDef
  value: AttributeValue | undefined
  onChange: (value: AttributeValue | undefined) => void
}) {
  switch (def.type) {
    case 'text':
      return <TextInput value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || undefined)} />

    case 'select':
      return (
        <Select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
          <option value="">Sin definir</option>
          {def.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      )

    case 'multi': {
      const selected = (value as string[] | undefined) ?? []
      return (
        <div className="flex flex-wrap gap-1.5">
          {def.options?.map((o) => {
            const on = selected.includes(o.value)
            return (
              <button
                type="button"
                key={o.value}
                onClick={() => {
                  const next = on ? selected.filter((v) => v !== o.value) : [...selected, o.value]
                  onChange(next.length ? next : undefined)
                }}
                aria-pressed={on}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  on ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:border-ink/30',
                )}
              >
                {o.color && <span className="size-2 rounded-full" style={{ background: o.color }} />}
                {o.label}
              </button>
            )
          })}
        </div>
      )
    }

    case 'tags':
      return (
        <TagInput
          values={(value as string[] | undefined) ?? []}
          onChange={(v) => onChange(v.length ? v : undefined)}
          placeholder="Escribe y presiona Enter"
        />
      )

    case 'scale': {
      const max = def.max ?? 5
      const current = typeof value === 'number' ? value : 0
      return (
        <div>
          <div className="flex gap-1">
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => onChange(n === current ? undefined : n)}
                className={cn(
                  'h-8 flex-1 rounded-md text-xs font-semibold transition-colors',
                  n <= current ? 'bg-accent text-accent-ink' : 'bg-ink/6 text-muted hover:bg-ink/10',
                )}
                aria-label={`${def.label}: ${n} de ${max}`}
                aria-pressed={n === current}
              >
                {n}
              </button>
            ))}
          </div>
          {def.scaleLabels && (
            <div className="mt-1 flex justify-between text-[0.7rem] text-muted">
              <span>{def.scaleLabels[0]}</span>
              <span>{def.scaleLabels[1]}</span>
            </div>
          )}
        </div>
      )
    }

    case 'boolean':
      return <Switch checked={value === true} onChange={(on) => onChange(on ? true : undefined)} />
  }
}

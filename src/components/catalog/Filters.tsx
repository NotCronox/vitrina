import { Check } from 'lucide-react'
import { useSnapshot } from '@/data'
import { basePrice, optionCounts, type CatalogFilters } from '@/lib/catalog'
import { cn } from '@/lib/format'
import { useMoney } from '@/components/ui/Price'

export type FilterPatch = Partial<Pick<CatalogFilters, 'maxPrice' | 'inStockOnly'>> & { attr?: [string, string[]] }

/** Panel de filtros generado desde los atributos marcados como filtrables. */
export function Filters({ filters, onChange }: { filters: CatalogFilters; onChange: (patch: FilterPatch) => void }) {
  const { config, products } = useSnapshot()
  const money = useMoney()
  const filterable = config.catalog.attributes.filter((a) => a.filterable)

  const prices = products.filter((p) => p.active).map(basePrice)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const step = maxPrice > 100000 ? 10000 : 1000
  const currentMax = filters.maxPrice ?? maxPrice

  return (
    <div className="space-y-8">
      {filterable.map((def) => {
        const selected = filters.attrs[def.id] ?? []

        if (def.type === 'scale') {
          const max = def.max ?? 5
          return (
            <FilterBlock key={def.id} title={`${def.label} mínima`}>
              <div className="flex gap-1.5">
                {Array.from({ length: max }, (_, i) => String(i + 1)).map((v) => {
                  const active = selected[0] === v
                  return (
                    <button
                      key={v}
                      onClick={() => onChange({ attr: [def.id, active ? [] : [v]] })}
                      className={cn(
                        'h-9 flex-1 rounded-btn border text-xs font-semibold transition-colors',
                        active ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:border-ink/40',
                      )}
                      aria-pressed={active}
                    >
                      {v}+
                    </button>
                  )
                })}
              </div>
              {def.scaleLabels && (
                <div className="mt-1.5 flex justify-between text-[0.7rem] text-muted">
                  <span>{def.scaleLabels[0]}</span>
                  <span>{def.scaleLabels[1]}</span>
                </div>
              )}
            </FilterBlock>
          )
        }

        if (def.type === 'boolean') {
          const active = selected[0] === 'true'
          return (
            <Toggle
              key={def.id}
              label={`Solo ${def.label.toLowerCase()}`}
              checked={active}
              onChange={(on) => onChange({ attr: [def.id, on ? ['true'] : []] })}
            />
          )
        }

        const counts = optionCounts(products, def)
        const visible = def.options?.filter((o) => counts.get(o.value)) ?? []
        if (!visible.length) return null
        return (
          <FilterBlock key={def.id} title={def.label}>
            <ul className="space-y-1">
              {visible.map((option) => {
                  const checked = selected.includes(option.value)
                  return (
                    <li key={option.value}>
                      <button
                        onClick={() =>
                          onChange({
                            attr: [def.id, checked ? selected.filter((v) => v !== option.value) : [...selected, option.value]],
                          })
                        }
                        className="group flex w-full items-center gap-3 py-1.5 text-left text-sm"
                        aria-pressed={checked}
                      >
                        <span
                          className={cn(
                            'grid size-4.5 shrink-0 place-items-center rounded-[4px] border transition-colors',
                            checked ? 'border-accent bg-accent text-accent-ink' : 'border-ink/25 group-hover:border-ink/50',
                          )}
                        >
                          {checked && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        {option.color && <span className="size-2.5 rounded-full" style={{ background: option.color }} />}
                        <span className="flex-1">{option.label}</span>
                        <span className="text-xs text-muted tabular-nums">{counts.get(option.value)}</span>
                      </button>
                    </li>
                  )
                })}
            </ul>
          </FilterBlock>
        )
      })}

      <FilterBlock title="Precio máximo">
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={step}
          value={currentMax}
          onChange={(e) => {
            const v = Number(e.target.value)
            onChange({ maxPrice: v >= maxPrice ? null : v })
          }}
          className="w-full accent-[var(--v-accent)]"
          aria-label="Precio máximo"
        />
        <div className="mt-1 flex justify-between text-xs text-muted tabular-nums">
          <span>{money(minPrice)}</span>
          <span className="font-semibold text-ink">{money(currentMax)}</span>
        </div>
      </FilterBlock>

      <Toggle label="Solo disponibles" checked={filters.inStockOnly} onChange={(on) => onChange({ inStockOnly: on })} />
    </div>
  )
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold tracking-[0.14em] uppercase">{title}</h3>
      {children}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 text-sm" role="switch" aria-checked={checked}>
      <span>{label}</span>
      <span className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-ink/15')}>
        <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
      </span>
    </button>
  )
}

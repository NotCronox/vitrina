import { motion } from 'motion/react'
import { useSnapshot } from '@/data'
import { displayValues } from '@/lib/catalog'
import { cn } from '@/lib/format'
import type { AttributeDef, AttributeGroup, Product } from '@/types'

/**
 * Ficha del producto generada a partir del esquema de atributos.
 * Cada grupo elige su forma de mostrarse: niveles, medidores, chips o lista.
 */
export function AttributeGroups({ product }: { product: Product }) {
  const { catalog } = useSnapshot().config

  return (
    <div className="space-y-10">
      {catalog.groups.map((group) => {
        const defs = catalog.attributes.filter(
          (a) => a.group === group.id && displayValues(a, product.attributes[a.id]).length > 0,
        )
        if (!defs.length) return null
        return (
          <section key={group.id}>
            <h3 className="eyebrow mb-4">{group.label}</h3>
            <GroupBody group={group} defs={defs} product={product} />
          </section>
        )
      })}
    </div>
  )
}

function GroupBody({ group, defs, product }: { group: AttributeGroup; defs: AttributeDef[]; product: Product }) {
  const value = (def: AttributeDef) => product.attributes[def.id]

  switch (group.layout) {
    case 'tiers':
      return (
        <ol className="relative space-y-0 border-l border-line pl-6">
          {defs.map((def, i) => (
            <li key={def.id} className="relative pb-6 last:pb-0">
              <span
                className="absolute top-1.5 -left-[1.82rem] size-2.5 rounded-full border-2 border-bg bg-accent"
                style={{ opacity: 1 - i * 0.25 }}
              />
              <p className="text-xs text-muted">{group.tierLabels?.[i] ?? def.label}</p>
              <p className="display mt-1 text-xl leading-snug">{displayValues(def, value(def)).join(' · ')}</p>
            </li>
          ))}
        </ol>
      )

    case 'meters':
      return (
        <div className="space-y-5">
          {defs.map((def) => {
            if (def.type !== 'scale') {
              return (
                <div key={def.id} className="flex justify-between gap-6 text-sm">
                  <span className="font-medium">{def.label}</span>
                  <span className="text-right text-muted">{displayValues(def, value(def)).join(', ')}</span>
                </div>
              )
            }
            const max = def.max ?? 5
            const v = Number(value(def))
            return (
              <div key={def.id}>
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{def.label}</span>
                  {def.scaleLabels && (
                    <span className="text-xs text-muted">
                      {def.scaleLabels[0]} — {def.scaleLabels[1]}
                    </span>
                  )}
                </div>
                <div className="flex gap-1" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={v} aria-label={def.label}>
                  {Array.from({ length: max }, (_, i) => (
                    <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                      <motion.span
                        className="block h-full bg-accent"
                        initial={{ width: 0 }}
                        whileInView={{ width: i < v ? '100%' : 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                      />
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )

    case 'chips':
      return (
        <div className="flex flex-wrap gap-2">
          {defs.flatMap((def) =>
            displayValues(def, value(def)).map((label) => (
              <span
                key={`${def.id}-${label}`}
                className={cn('rounded-btn border border-line px-3.5 py-1.5 text-xs font-medium', def.type === 'boolean' && 'border-accent/40 text-accent')}
              >
                {label}
              </span>
            )),
          )}
        </div>
      )

    case 'list':
      return (
        <dl className="divide-y divide-line border-y border-line text-sm">
          {defs.map((def) => (
            <div key={def.id} className="flex justify-between gap-6 py-3">
              <dt className="text-muted">{def.label}</dt>
              <dd className="text-right font-medium">{displayValues(def, value(def)).join(', ')}</dd>
            </div>
          ))}
        </dl>
      )
  }
}

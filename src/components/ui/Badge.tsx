import { useSnapshot } from '@/data'
import { cn } from '@/lib/format'
import type { BadgeDef } from '@/types'

const tones: Record<BadgeDef['tone'], string> = {
  accent: 'bg-accent text-accent-ink',
  ink: 'bg-ink text-bg',
  soft: 'bg-surface/90 text-ink backdrop-blur',
}

export function ProductBadges({ ids, className }: { ids: string[]; className?: string }) {
  const { badges } = useSnapshot().config.catalog
  const list = ids.map((id) => badges.find((b) => b.id === id)).filter((b): b is BadgeDef => Boolean(b))
  if (!list.length) return null
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {list.map((badge) => (
        <span
          key={badge.id}
          className={cn(
            'rounded-btn px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]',
            tones[badge.tone],
          )}
        >
          {badge.label}
        </span>
      ))}
    </div>
  )
}

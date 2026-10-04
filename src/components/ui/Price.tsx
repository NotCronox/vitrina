import { useSnapshot } from '@/data'
import { cn, formatMoney } from '@/lib/format'

export function useMoney() {
  const { business } = useSnapshot().config
  return (value: number) => formatMoney(value, business.currency, business.locale)
}

export function Price({
  value,
  compareAt,
  className,
}: {
  value: number
  compareAt?: number
  className?: string
}) {
  const money = useMoney()
  const onSale = compareAt !== undefined && compareAt > value
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-2 tabular-nums', className)}>
      <span className={onSale ? 'text-accent' : undefined}>{money(value)}</span>
      {onSale && <s className="text-[0.85em] text-muted">{money(compareAt)}</s>}
    </span>
  )
}

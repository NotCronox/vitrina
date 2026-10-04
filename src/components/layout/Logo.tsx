import { useSnapshot } from '@/data'
import { cn } from '@/lib/format'
import { imageUrl } from '@/lib/images'

export function Logo({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const { business, theme } = useSnapshot().config

  if (business.logoImage) {
    return (
      <img
        src={imageUrl(business.logoImage, 400)}
        alt={business.name}
        className={cn(size === 'lg' ? 'h-14' : 'h-9', 'w-auto object-contain', className)}
      />
    )
  }

  return (
    <span
      className={cn(
        'display leading-none whitespace-nowrap',
        size === 'lg' ? 'text-5xl md:text-6xl' : 'text-[1.6rem]',
        theme.logoStyle === 'caps' && 'uppercase tracking-[0.3em] !font-medium',
        theme.logoStyle === 'caps' && (size === 'lg' ? 'text-4xl md:text-5xl' : 'text-[1.15rem]'),
        theme.logoStyle === 'italic' && 'italic',
        className,
      )}
    >
      {business.logoText}
    </span>
  )
}

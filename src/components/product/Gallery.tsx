import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/format'
import { Img } from '@/components/ui/Media'
import { ProductBadges } from '@/components/ui/Badge'

export function Gallery({ images, name, badges }: { images: string[]; name: string; badges: string[] }) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              className={cn(
                'card-media w-16 shrink-0 overflow-hidden rounded-[min(var(--v-radius),12px)] border-2 transition-opacity md:w-full',
                i === active ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100',
              )}
              aria-label={`Ver imagen ${i + 1} de ${name}`}
            >
              <Img src={src} width={200} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="card-media relative flex-1 overflow-hidden rounded-card bg-ink/5">
        <AnimatePresence initial={false}>
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Img
              src={current}
              width={1200}
              widths={[600, 900, 1300]}
              sizes="(min-width: 1024px) 50vw, 100vw"
              loading="eager"
              alt={name}
              className="size-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        <ProductBadges ids={badges} className="absolute top-4 left-4" />
      </div>
    </div>
  )
}

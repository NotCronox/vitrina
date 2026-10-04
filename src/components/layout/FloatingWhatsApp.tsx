import { motion } from 'motion/react'
import { useSnapshot } from '@/data'
import { useUi } from '@/state/ui'
import { cn } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'
import { WhatsAppIcon } from '@/components/ui/Icon'

export function FloatingWhatsApp() {
  const { business } = useSnapshot().config
  const cartOpen = useUi((s) => s.cartOpen)
  if (!business.floatingWhatsapp) return null

  return (
    <motion.a
      href={waLink(business.whatsapp, `Hola ${business.name}, tengo una pregunta.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 18 }}
      className={cn(
        'floating-wa group fixed right-4 bottom-4 z-40 flex items-center gap-2 md:right-6 md:bottom-6',
        cartOpen && 'pointer-events-none opacity-0',
      )}
    >
      <span className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111b21] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
        ¿Te ayudamos?
      </span>
      <span className="relative grid size-14 place-items-center rounded-full bg-[#1fa855] text-white shadow-xl">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#1fa855] opacity-30 [animation-duration:2.5s]" />
        <WhatsAppIcon className="relative size-7" />
      </span>
    </motion.a>
  )
}

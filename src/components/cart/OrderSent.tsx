import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { useSnapshot } from '@/data'
import { useUi } from '@/state/ui'
import { buildOrderMessage, waLink } from '@/lib/whatsapp'
import { Button, buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/Icon'
import type { Order } from '@/types'

/** Renderiza las *negritas* de WhatsApp en la vista previa del mensaje. */
function WhatsAppText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <span key={i} className="block min-h-[1em]">
          {line.split(/(\*[^*]+\*)/g).map((part, j) =>
            part.startsWith('*') && part.endsWith('*') ? <strong key={j}>{part.slice(1, -1)}</strong> : part,
          )}
        </span>
      ))}
    </>
  )
}

export function OrderSent({ order }: { order: Order }) {
  const { config } = useSnapshot()
  const closeCart = useUi((s) => s.closeCart)
  const message = buildOrderMessage(order, config)
  const time = new Date(order.createdAt).toLocaleTimeString(config.business.locale, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col items-center pt-4 text-center">
          <motion.span
            className="grid size-16 place-items-center rounded-full bg-[#1fa855] text-white"
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          >
            <Check className="size-8" strokeWidth={2.5} />
          </motion.span>
          <p className="display mt-5 text-3xl">¡Pedido {order.number}!</p>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Abrimos WhatsApp con tu pedido listo para enviar. Si no se abrió, usa el botón de abajo.
          </p>
        </div>

        <div className="mt-7 rounded-card bg-[#efe7dd] p-4 dark:bg-[#0b141a]">
          <p className="mb-2 text-center text-[0.65rem] font-semibold tracking-[0.15em] text-black/45 uppercase">Así llega tu mensaje</p>
          <div className="ml-auto max-w-[92%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[0.8rem] leading-snug text-[#111b21] shadow-sm">
            <WhatsAppText text={message} />
            <span className="mt-1 block text-right text-[0.65rem] text-black/45">{time} ✓✓</span>
          </div>
        </div>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-line p-5">
        <a href={waLink(config.business.whatsapp, message)} target="_blank" rel="noreferrer" className={buttonClass('whatsapp', 'lg', 'w-full')}>
          <WhatsAppIcon className="size-5" />
          Abrir WhatsApp
        </a>
        <Button variant="ghost" size="md" className="w-full" onClick={closeCart}>
          Seguir comprando
        </Button>
      </footer>
    </div>
  )
}

import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/format'
import { useConfirmStore, useToasts } from './core'
import { Modal } from './ui'

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl bg-[#1c1917] px-4 py-3 text-sm text-white shadow-2xl"
            role="status"
          >
            {t.tone === 'success' && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />}
            {t.tone === 'error' && <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-400" />}
            {t.tone === 'info' && <Info className="mt-0.5 size-4 shrink-0 text-sky-400" />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/50 hover:text-white" aria-label="Cerrar aviso">
              <X className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function ConfirmDialog() {
  const { request, answer } = useConfirmStore()
  return (
    <Modal
      open={Boolean(request)}
      onClose={() => answer(false)}
      title={request?.title ?? ''}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => answer(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => answer(true)} className={cn(request?.danger && '!bg-red-600 !text-white')}>
            {request?.confirmLabel ?? 'Confirmar'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{request?.body}</p>
    </Modal>
  )
}

import { useEffect } from 'react'
import { useBlocker } from 'react-router'
import { Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Modal } from './ui'

/** Avisa antes de salir de una pagina con cambios sin guardar. */
export function UnsavedGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname)

  useEffect(() => {
    if (!when) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [when])

  return (
    <Modal
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      title="¿Salir sin guardar?"
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => blocker.reset?.()}>
            Seguir editando
          </Button>
          <Button size="sm" className="!bg-red-600 !text-white" onClick={() => blocker.proceed?.()}>
            Salir sin guardar
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">Tienes cambios que todavía no se han guardado y se perderán.</p>
    </Modal>
  )
}

/** Barra fija inferior con los botones de guardar y descartar. */
export function SaveBar({
  visible,
  saving,
  onSave,
  onDiscard,
  message = 'Tienes cambios sin guardar',
  saveLabel = 'Guardar cambios',
}: {
  visible: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
  message?: string
  saveLabel?: string
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-[#1c1917] py-2.5 pr-2.5 pl-5 text-white shadow-2xl lg:left-60"
        >
          <span className="flex-1 text-sm">{message}</span>
          <Button variant="ghost" size="sm" className="!text-white hover:!bg-white/10" onClick={onDiscard} disabled={saving}>
            Descartar
          </Button>
          <Button size="sm" className="!bg-white !text-[#1c1917]" onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {saveLabel}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

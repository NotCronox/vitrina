import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSnapshot } from '@/data'

/** Barra superior con avisos que rotan cada pocos segundos. */
export function AnnouncementBar() {
  const { announcements } = useSnapshot().config
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (announcements.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % announcements.length), 4500)
    return () => clearInterval(timer)
  }, [announcements.length])

  if (!announcements.length) return null
  const text = announcements[index % announcements.length]

  return (
    <div className="relative z-40 h-9 overflow-hidden bg-accent text-accent-ink">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={text}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="flex h-9 items-center justify-center px-4 text-center text-[0.72rem] font-semibold tracking-[0.08em]"
        >
          {text}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}

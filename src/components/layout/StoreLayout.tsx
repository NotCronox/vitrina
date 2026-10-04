import { useEffect } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { IS_SHOWCASE } from '@/config/mode'
import { useLiveSync, useStore } from '@/data'
import { IS_PREVIEW, announcePreviewReady, startPreviewBridge } from '@/state/preview'
import { applyTheme } from '@/theme/applyTheme'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { DemoSwitcher } from '@/components/demo/DemoSwitcher'
import { AnnouncementBar } from './AnnouncementBar'
import { FloatingWhatsApp } from './FloatingWhatsApp'
import { Footer } from './Footer'
import { Header } from './Header'

startPreviewBridge()

export function StoreLayout() {
  useLiveSync()
  const { data, isPending, isError, refetch } = useStore()
  const theme = data?.config.theme
  const ready = Boolean(data)

  useEffect(() => {
    if (theme) applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (ready) announcePreviewReady()
  }, [ready])

  if (isPending) {
    return (
      <div className="grid min-h-screen place-items-center" aria-busy="true">
        <span className="size-2 animate-ping rounded-full bg-ink/40" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <p className="text-lg font-semibold">No pudimos cargar la tienda.</p>
          <button onClick={() => refetch()} className="mt-4 underline">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
      {!IS_PREVIEW && IS_SHOWCASE && <DemoSwitcher />}
      {!IS_PREVIEW && <ScrollRestoration />}
    </>
  )
}

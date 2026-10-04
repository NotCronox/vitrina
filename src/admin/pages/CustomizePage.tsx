import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Eye, Loader2, Monitor, RotateCw, Smartphone, X } from 'lucide-react'
import { useSnapshot } from '@/data'
import { cn } from '@/lib/format'
import type { PreviewMessage } from '@/state/preview'
import { Button } from '@/components/ui/Button'
import { useConfigDraft } from '../hooks'
import { UnsavedGuard } from '../UnsavedGuard'
import { Segmented, Select } from '../ui'
import { BusinessEditor } from '../editors/BusinessEditor'
import { CheckoutEditor } from '../editors/CheckoutEditor'
import { SectionsEditor } from '../editors/SectionsEditor'
import { ThemeEditor } from '../editors/ThemeEditor'

type Tab = 'design' | 'home' | 'business' | 'checkout'
type Device = 'desktop' | 'mobile'

const TABS: { value: Tab; label: string }[] = [
  { value: 'design', label: 'Diseño' },
  { value: 'home', label: 'Inicio' },
  { value: 'business', label: 'Negocio' },
  { value: 'checkout', label: 'Compra' },
]

const DESKTOP_WIDTH = 1280
const MOBILE = { width: 390, height: 844 }

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

export function CustomizePage() {
  const { products } = useSnapshot()
  const { draft, dirty, saving, update, save, discard } = useConfigDraft()
  const [tab, setTab] = useState<Tab>('design')
  const [device, setDevice] = useState<Device>('desktop')
  const [path, setPath] = useState('/')
  const [reloadKey, setReloadKey] = useState(0)
  const [ready, setReady] = useState(false)
  const [mobilePreview, setMobilePreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [stageRef, stage] = useSize<HTMLDivElement>()

  const draftRef = useRef(draft)
  draftRef.current = draft

  const post = useCallback((msg: PreviewMessage) => {
    iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin)
  }, [])

  // La tienda dentro del iframe avisa cuando cargo; entonces recibe el borrador.
  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.origin !== window.location.origin || e.source !== iframeRef.current?.contentWindow) return
      if (e.data?.type === 'vitrina:preview-ready') {
        setReady(true)
        post({ type: 'vitrina:draft', config: draftRef.current })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [post])

  useEffect(() => {
    if (ready) post({ type: 'vitrina:draft', config: draft })
  }, [draft, ready, post])

  const navigatePreview = (next: string) => {
    setReady(false)
    setPath(next)
  }

  const focusSection = (sectionId: string) => {
    if (path !== '/') navigatePreview('/')
    else post({ type: 'vitrina:scroll', sectionId })
  }

  const firstProduct = products.find((p) => p.active)
  const pages = [
    { value: '/', label: 'Inicio' },
    { value: '/catalogo', label: 'Catálogo' },
    ...(firstProduct ? [{ value: `/producto/${firstProduct.slug}`, label: 'Ficha de producto' }] : []),
  ]

  // Escritorio: la tienda se dibuja a 1280 px y se escala para caber en el espacio disponible.
  const scale = device === 'desktop' ? Math.min(1, stage.width / DESKTOP_WIDTH) || 1 : Math.min(1, (stage.height - 32) / MOBILE.height) || 1
  const frame =
    device === 'desktop'
      ? { width: DESKTOP_WIDTH, height: stage.height / scale }
      : { width: MOBILE.width, height: MOBILE.height }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-dvh">
      <UnsavedGuard when={dirty} />

      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <div className="mr-auto">
          <h1 className="font-semibold">Personalizar tienda</h1>
          <p className="text-xs text-muted">{dirty ? 'Cambios sin guardar · la vista previa ya los muestra' : 'Todo guardado'}</p>
        </div>
        <div className="hidden items-center gap-2 lg:flex">
          <Segmented<Device>
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', label: <Monitor className="size-4" aria-label="Escritorio" /> },
              { value: 'mobile', label: <Smartphone className="size-4" aria-label="Celular" /> },
            ]}
          />
          <Select value={path} onChange={(e) => navigatePreview(e.target.value)} className="!w-44" aria-label="Página de la vista previa">
            {pages.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => {
              setReady(false)
              setReloadKey((k) => k + 1)
            }}
            className="grid size-9 place-items-center rounded-[10px] text-muted hover:bg-ink/5 hover:text-ink"
            aria-label="Recargar vista previa"
          >
            <RotateCw className="size-4" />
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={discard} disabled={!dirty || saving}>
          Descartar
        </Button>
        <Button size="sm" onClick={save} disabled={!dirty || saving}>
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          Guardar
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full shrink-0 flex-col border-r border-line bg-surface lg:w-[380px]">
          <div className="shrink-0 border-b border-line p-3">
            <Segmented value={tab} onChange={setTab} options={TABS} className="flex w-full [&>button]:flex-1 [&>button]:justify-center" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-24 lg:pb-6">
            {tab === 'design' && <ThemeEditor draft={draft} update={update} />}
            {tab === 'home' && <SectionsEditor draft={draft} update={update} onFocusSection={focusSection} />}
            {tab === 'business' && <BusinessEditor draft={draft} update={update} />}
            {tab === 'checkout' && <CheckoutEditor draft={draft} update={update} />}
          </div>
        </aside>

        <div
          className={cn(
            'min-w-0 flex-1 flex-col bg-[#e7e5e4]',
            mobilePreview ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex',
          )}
        >
          {mobilePreview && (
            <div className="flex items-center justify-between bg-surface px-4 py-2">
              <span className="text-sm font-semibold">Vista previa</span>
              <button onClick={() => setMobilePreview(false)} className="grid size-9 place-items-center" aria-label="Cerrar vista previa">
                <X className="size-5" />
              </button>
            </div>
          )}
          <div ref={stageRef} className={cn('relative min-h-0 flex-1 overflow-hidden', device === 'mobile' && !mobilePreview && 'grid place-items-center')}>
            <div
              className={cn('origin-top-left overflow-hidden bg-white', device === 'mobile' && !mobilePreview && 'rounded-[2.2rem] shadow-2xl ring-8 ring-[#1c1917]')}
              style={
                mobilePreview
                  ? { width: '100%', height: '100%' }
                  : {
                      width: frame.width,
                      height: frame.height,
                      transform: `scale(${scale})`,
                      transformOrigin: device === 'desktop' ? 'top left' : 'center',
                    }
              }
            >
              <iframe
                key={`${path}-${reloadKey}`}
                ref={iframeRef}
                src={`${path}?preview=1`}
                title="Vista previa de la tienda"
                className="size-full border-0"
              />
            </div>
            {!ready && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <Loader2 className="size-6 animate-spin text-muted" />
              </div>
            )}
          </div>
        </div>
      </div>

      {!mobilePreview && (
        <button
          onClick={() => {
            setDevice('mobile')
            setMobilePreview(true)
          }}
          className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-[#1c1917] px-5 py-3 text-sm font-semibold text-white shadow-2xl lg:hidden"
        >
          <Eye className="size-4" /> Vista previa
        </button>
      )}
    </div>
  )
}

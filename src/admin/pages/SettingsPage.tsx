import { useRef, useState, type FormEvent } from 'react'
import { Database, Download, HardDrive, KeyRound, RotateCcw, Upload } from 'lucide-react'
import { z } from 'zod'
import { useRepository, useSnapshot } from '@/data'
import { auth } from '@/data/auth'
import { STORAGE_VERSION } from '@/data/local-repository'
import { slugify } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import type { StoreSnapshot } from '@/types'
import { AdminPage } from '../AdminLayout'
import { confirm, toast, useSession } from '../core'
import { useReplaceSnapshot, useResetStore } from '../hooks'
import { Card, Field, PageHeader, TextInput } from '../ui'

/** Validacion del respaldo: lo justo para no romper la tienda con un archivo equivocado. */
const snapshotSchema = z.object({
  config: z.looseObject({
    business: z.looseObject({ name: z.string().min(1), whatsapp: z.string() }),
    theme: z.looseObject({
      colors: z.object({ bg: z.string(), surface: z.string(), ink: z.string(), muted: z.string(), accent: z.string(), accentInk: z.string(), line: z.string() }),
      fonts: z.object({ display: z.string(), body: z.string() }),
    }),
    catalog: z.looseObject({ attributes: z.array(z.looseObject({ id: z.string(), label: z.string(), type: z.string() })), groups: z.array(z.any()), badges: z.array(z.any()) }),
    sections: z.array(z.looseObject({ id: z.string(), type: z.string(), enabled: z.boolean(), props: z.any() })),
    checkout: z.looseObject({ deliveryOptions: z.array(z.any()).min(1), paymentOptions: z.array(z.string()) }),
    announcements: z.array(z.string()),
  }),
  categories: z.array(z.looseObject({ id: z.string(), slug: z.string(), name: z.string() })),
  products: z.array(
    z.looseObject({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      categoryId: z.string(),
      images: z.array(z.string()),
      variants: z.array(z.looseObject({ id: z.string(), label: z.string(), price: z.number() })).min(1),
    }),
  ),
})

function PasswordCard() {
  const email = useSession((s) => s.email)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) return toast.error('Las contraseñas no coinciden.')
    setBusy(true)
    try {
      await auth.changePassword(password)
      setPassword('')
      setConfirmPassword('')
      toast.success('Contraseña actualizada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Tu cuenta" description={email ?? undefined}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nueva contraseña">
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} />
          </Field>
          <Field label="Repítela">
            <TextInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <Button type="submit" size="sm" disabled={busy || password.length < 8}>
          <KeyRound className="size-4" /> Cambiar contraseña
        </Button>
      </form>
    </Card>
  )
}

function storageUsage(storeId: string) {
  try {
    const raw = localStorage.getItem(`vitrina:${storeId}:${STORAGE_VERSION}`) ?? ''
    return raw.length * 2
  } catch {
    return 0
  }
}

export function SettingsPage() {
  const snapshot = useSnapshot()
  const repo = useRepository()
  const replace = useReplaceSnapshot()
  const reset = useResetStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [, force] = useState(0)

  const used = storageUsage(snapshot.config.id)
  const quota = 5 * 1024 * 1024
  const pct = Math.min(100, (used / quota) * 100)

  const exportJson = () => {
    const data: StoreSnapshot = { config: snapshot.config, categories: snapshot.categories, products: snapshot.products }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vitrina-${slugify(snapshot.config.business.name)}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Respaldo descargado')
  }

  const importJson = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = snapshotSchema.safeParse(JSON.parse(await file.text()))
      if (!parsed.success) {
        const issue = parsed.error.issues[0]
        return toast.error(`El archivo no es un respaldo válido de Vitrina (${issue.path.join('.') || 'raíz'}: ${issue.message}).`)
      }
      const data = parsed.data as unknown as StoreSnapshot
      const ok = await confirm({
        title: `¿Importar “${data.config.business.name}”?`,
        body: `Se reemplazarán la configuración, ${data.categories.length} categorías y ${data.products.length} productos de esta tienda. Los pedidos se conservan.`,
        confirmLabel: 'Importar',
        danger: true,
      })
      if (!ok) return
      await replace.mutateAsync(data)
      toast.success('Tienda importada')
    } catch {
      toast.error('No se pudo leer el archivo. ¿Es un JSON?')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const resetStore = async () => {
    const ok = await confirm({
      title: '¿Restaurar la demo?',
      body: 'Vuelven los productos, el diseño y los pedidos de ejemplo originales. Perderás todo lo que cambiaste en esta tienda.',
      confirmLabel: 'Restaurar',
      danger: true,
    })
    if (!ok) return
    await reset.mutateAsync()
    force((n) => n + 1)
    toast.success('Demo restaurada')
  }

  return (
    <AdminPage>
      <PageHeader title="Ajustes" description="Respaldo, datos y mantenimiento de la tienda." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Dónde se guardan los datos">
          <div className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
              <Database className="size-5" />
            </span>
            <div className="text-sm">
              <p className="font-semibold">{repo.mode === 'demo' ? 'Modo demo (este navegador)' : 'Supabase'}</p>
              <p className="mt-1 text-muted">
                {repo.mode === 'demo'
                  ? 'Todo se guarda en el almacenamiento local de este navegador. Es ideal para probar; en una tienda real los datos viven en una base de datos en la nube.'
                  : 'Los datos viven en la base de datos del negocio y se sincronizan en todos los dispositivos.'}
              </p>
            </div>
          </div>
          {repo.mode === 'demo' && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <HardDrive className="size-3.5" /> Espacio usado
                </span>
                <span className="text-muted tabular-nums">
                  {(used / 1024 / 1024).toFixed(2)} MB de ~5 MB
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8">
                <div className={pct > 80 ? 'h-full bg-amber-500' : 'h-full bg-accent'} style={{ width: `${Math.max(pct, 1)}%` }} />
              </div>
              <p className="mt-2 text-xs text-muted">Las imágenes subidas son lo que más ocupa. Se comprimen automáticamente al subirlas.</p>
            </div>
          )}
        </Card>

        <Card title="Respaldo" description="Descarga toda la tienda en un archivo o restaura uno anterior.">
          <p className="text-sm text-muted">
            El archivo incluye diseño, secciones, campos, categorías y productos. También sirve para montar la tienda de un cliente nuevo a partir de esta.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" onClick={exportJson}>
              <Download className="size-4" /> Descargar respaldo
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={replace.isPending}>
              <Upload className="size-4" /> Importar archivo
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => importJson(e.target.files?.[0])} />
          </div>
        </Card>

        {auth.mode === 'supabase' && <PasswordCard />}

        {repo.reset && (
          <Card title="Restaurar la demo" className="lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Vuelve al estado original de la plantilla “{snapshot.config.business.name}”. Útil después de experimentar.</p>
              <Button variant="outline" size="sm" onClick={resetStore} disabled={reset.isPending} className="!text-red-600">
                <RotateCcw className="size-4" /> Restaurar demo
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AdminPage>
  )
}

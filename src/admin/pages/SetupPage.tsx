import { useState } from 'react'
import { Check, Loader2, Rocket } from 'lucide-react'
import { TEMPLATES } from '@/config/templates'
import { cn } from '@/lib/format'
import { imageUrl } from '@/lib/images'
import { Button } from '@/components/ui/Button'
import { AdminPage } from '../AdminLayout'
import { toast } from '../core'
import { useReplaceSnapshot } from '../hooks'

/**
 * Primer ingreso a una tienda conectada a una base de datos vacia:
 * se elige la plantilla del rubro y se publica como punto de partida.
 */
export function SetupPage() {
  const publish = useReplaceSnapshot()
  const [selected, setSelected] = useState(TEMPLATES[0].id)

  const start = async () => {
    const template = TEMPLATES.find((t) => t.id === selected)!
    await publish.mutateAsync(structuredClone(template.snapshot))
    toast.success('¡Tu tienda está lista! Ahora personalízala a tu gusto.')
  }

  return (
    <AdminPage>
      <div className="mx-auto max-w-3xl py-6">
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-ink">
          <Rocket className="size-6" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Bienvenido a tu tienda</h1>
        <p className="mt-2 max-w-xl text-muted">
          La base de datos está conectada pero vacía. Elige la plantilla más parecida a tu negocio: después puedes cambiar todo,
          desde los colores hasta los campos de cada producto.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TEMPLATES.map((t) => {
            const { config, products, categories } = t.snapshot
            const active = t.id === selected
            const hero = config.sections.find((s) => s.type === 'hero')?.props as { image?: string } | undefined
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                className={cn(
                  'overflow-hidden rounded-2xl border-2 bg-surface text-left transition',
                  active ? 'border-accent shadow-lg' : 'border-line hover:border-ink/25',
                )}
                aria-pressed={active}
              >
                <div className="relative aspect-[16/9]" style={{ background: config.theme.colors.bg }}>
                  {hero?.image && <img src={imageUrl(hero.image, 700)} alt="" className="size-full object-cover opacity-90" />}
                  {active && (
                    <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-accent text-accent-ink">
                      <Check className="size-4" />
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold">
                    {t.industry} · <span className="text-muted">{t.name}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {categories.length} categorías · {products.length} productos de ejemplo · {config.catalog.attributes.length} campos
                  </p>
                  <div className="mt-3 flex gap-1.5">
                    {Object.values(config.theme.colors)
                      .slice(0, 5)
                      .map((c, i) => (
                        <span key={i} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: c }} />
                      ))}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={start} disabled={publish.isPending}>
            {publish.isPending && <Loader2 className="size-4 animate-spin" />}
            Empezar con esta plantilla
          </Button>
          <p className="text-xs text-muted">Los productos de ejemplo se pueden editar o borrar en cualquier momento.</p>
        </div>
      </div>
    </AdminPage>
  )
}

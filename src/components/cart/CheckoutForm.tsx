import { useState, type FormEvent, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { useCartSummary, useCreateOrder, useSnapshot } from '@/data'
import { useCart } from '@/state/cart'
import { checkoutSchema, deliveryFee, loadCustomer, saveCustomer, type CheckoutForm as FormValues } from '@/lib/checkout'
import { cn } from '@/lib/format'
import { buildOrderMessage, waLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/Icon'
import { useMoney } from '@/components/ui/Price'
import type { Order } from '@/types'

type Errors = Partial<Record<keyof FormValues, string>>

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold tracking-wide">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-red-500">{error}</span> : hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function CheckoutForm({ onSent }: { onSent: (order: Order) => void }) {
  const { config } = useSnapshot()
  const { checkout } = config
  const { lines, subtotal } = useCartSummary()
  const clear = useCart((s) => s.clear)
  const createOrder = useCreateOrder()
  const money = useMoney()

  const [values, setValues] = useState<FormValues>(() => {
    const saved = loadCustomer()
    return {
      name: saved.name ?? '',
      phone: saved.phone ?? '',
      address: saved.address ?? '',
      deliveryId: checkout.deliveryOptions[0]?.id ?? '',
      payment: checkout.paymentOptions[0] ?? '',
      notes: '',
    }
  })
  const [errors, setErrors] = useState<Errors>({})

  const delivery = checkout.deliveryOptions.find((o) => o.id === values.deliveryId)
  const fee = deliveryFee(delivery, subtotal)
  const total = subtotal + fee

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = checkoutSchema(checkout).safeParse(values)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues
        next[key] ??= issue.message
      }
      setErrors(next)
      return
    }

    // La ventana se abre dentro del clic para que el navegador no la bloquee;
    // cuando el pedido queda guardado se le asigna la URL de WhatsApp.
    const popup = window.open('', '_blank')

    const data = parsed.data
    let order: Order
    try {
      order = await createOrder.mutateAsync({
        customer: {
          name: data.name,
          phone: data.phone || undefined,
          address: delivery?.requiresAddress ? data.address : undefined,
          notes: data.notes || undefined,
        },
        deliveryId: data.deliveryId,
        deliveryLabel: delivery?.label ?? '',
        payment: data.payment,
        items: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId,
          name: l.product.name,
          variantLabel: l.variant.label,
          price: l.variant.price,
          qty: l.qty,
          image: l.product.images[0],
        })),
        subtotal,
        deliveryFee: fee,
        total,
      })
    } catch {
      popup?.close()
      setErrors({ notes: 'No pudimos registrar el pedido. Intenta de nuevo.' })
      return
    }

    const url = waLink(config.business.whatsapp, buildOrderMessage(order, config))
    if (popup) popup.location.href = url
    saveCustomer(data)
    clear(config.id)
    onSent(order)
  }

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" error={errors.name}>
            <input className="field" value={values.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="¿Cómo te llamas?" />
          </Field>
          <Field label="Teléfono (opcional)" error={errors.phone}>
            <input
              className="field"
              value={values.phone}
              onChange={(e) => set('phone', e.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="300 123 4567"
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide">¿Cómo lo recibes?</legend>
          <div className="space-y-2">
            {checkout.deliveryOptions.map((option) => {
              const selected = option.id === values.deliveryId
              const optionFee = deliveryFee(option, subtotal)
              return (
                <label
                  key={option.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-[min(var(--v-radius),14px)] border p-3.5 transition-colors',
                    selected ? 'border-accent bg-accent/8' : 'border-line hover:border-ink/30',
                  )}
                >
                  <input
                    type="radio"
                    name="delivery"
                    className="sr-only"
                    checked={selected}
                    onChange={() => set('deliveryId', option.id)}
                  />
                  <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border', selected ? 'border-accent' : 'border-ink/30')}>
                    {selected && <span className="size-2 rounded-full bg-accent" />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{option.label}</span>
                    {option.note && <span className="block text-xs text-muted">{option.note}</span>}
                  </span>
                  <span className={cn('text-sm tabular-nums', optionFee === 0 && 'font-semibold text-accent')}>
                    {optionFee === 0 ? 'Gratis' : money(optionFee)}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {delivery?.requiresAddress && (
          <Field label="Dirección de entrega" error={errors.address} hint="Incluye barrio, ciudad y un punto de referencia.">
            <input
              className="field"
              value={values.address}
              onChange={(e) => set('address', e.target.value)}
              autoComplete="street-address"
              placeholder="Calle, número, barrio, ciudad"
            />
          </Field>
        )}

        <fieldset>
          <legend className="mb-2 text-xs font-semibold tracking-wide">Método de pago</legend>
          <div className="flex flex-wrap gap-2">
            {checkout.paymentOptions.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => set('payment', option)}
                className={cn(
                  'rounded-btn border px-4 py-2 text-xs font-medium transition-colors',
                  values.payment === option ? 'border-accent bg-accent text-accent-ink' : 'border-line hover:border-ink/30',
                )}
                aria-pressed={values.payment === option}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Notas (opcional)" error={errors.notes}>
          <textarea
            className="field min-h-20 resize-none"
            value={values.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="¿Es un regalo? ¿Algún detalle de la entrega?"
          />
        </Field>
      </div>

      <footer className="shrink-0 space-y-1.5 border-t border-line p-5 text-sm">
        <div className="flex justify-between text-muted">
          <span>Subtotal</span>
          <span className="tabular-nums">{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Envío</span>
          <span className="tabular-nums">{fee === 0 ? 'Gratis' : money(fee)}</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="font-semibold">Total</span>
          <span className="display text-2xl tabular-nums">{money(total)}</span>
        </div>
        <Button type="submit" variant="whatsapp" size="lg" className="!mt-4 w-full" disabled={createOrder.isPending || !lines.length}>
          {createOrder.isPending ? <Loader2 className="size-5 animate-spin" /> : <WhatsAppIcon className="size-5" />}
          Enviar pedido por WhatsApp
        </Button>
        <p className="pt-1 text-center text-[0.7rem] text-muted">Confirmamos disponibilidad y pago por WhatsApp. Aún no se cobra nada.</p>
      </footer>
    </form>
  )
}

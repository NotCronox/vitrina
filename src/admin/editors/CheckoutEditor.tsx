import { Plus, Trash2 } from 'lucide-react'
import { uid } from '@/lib/format'
import { buildOrderMessage } from '@/lib/whatsapp'
import { Button } from '@/components/ui/Button'
import type { Order } from '@/types'
import type { ConfigDraft } from '../hooks'
import { Field, IconButton, MoveButtons, NumberInput, StringListInput, Switch, TextArea, TextInput, moveItem } from '../ui'
import { EditorSection } from './EditorSection'

export function CheckoutEditor({ draft, update }: Pick<ConfigDraft, 'draft' | 'update'>) {
  const { checkout } = draft

  const sample: Order = {
    id: 'x',
    number: `${checkout.orderPrefix || 'PED'}-1042`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    customer: { name: 'Ana Pérez', address: 'Cra. 11 #93-45' },
    deliveryId: checkout.deliveryOptions[0]?.id ?? '',
    deliveryLabel: checkout.deliveryOptions[0]?.label ?? 'Entrega',
    payment: checkout.paymentOptions[0] ?? 'Transferencia',
    items: [{ productId: 'x', variantId: 'x', name: 'Producto de ejemplo', variantLabel: 'Única', price: 120000, qty: 1 }],
    subtotal: 120000,
    deliveryFee: 0,
    total: 120000,
  }

  return (
    <div>
      <EditorSection title="Mensaje de WhatsApp" description="Así llega cada pedido a tu teléfono.">
        <div className="space-y-4">
          <Field label="Prefijo del número de pedido" hint="Ej.: AMB → AMB-1042">
            <TextInput
              value={checkout.orderPrefix}
              maxLength={6}
              onChange={(e) => update((d) => void (d.checkout.orderPrefix = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')))}
            />
          </Field>
          <Field label="Saludo">
            <TextInput value={checkout.greeting} onChange={(e) => update((d) => void (d.checkout.greeting = e.target.value))} />
          </Field>
          <Field label="Cierre">
            <TextArea value={checkout.closing} onChange={(e) => update((d) => void (d.checkout.closing = e.target.value))} className="!min-h-16" />
          </Field>
          <div className="rounded-[10px] bg-[#efe7dd] p-3">
            <div className="ml-auto max-w-[95%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-[0.72rem] leading-snug whitespace-pre-line text-[#111b21] shadow-sm">
              {buildOrderMessage(sample, draft).replace(/\*/g, '')}
            </div>
          </div>
        </div>
      </EditorSection>

      <EditorSection title="Formas de entrega">
        <div className="space-y-3">
          {checkout.deliveryOptions.map((o, i) => (
            <div key={o.id} className="space-y-3 rounded-[10px] border border-line p-3">
              <div className="flex items-center gap-2">
                <MoveButtons index={i} length={checkout.deliveryOptions.length} onMove={(to) => update((d) => void (d.checkout.deliveryOptions = moveItem(d.checkout.deliveryOptions, i, to)))} />
                <TextInput value={o.label} onChange={(e) => update((d) => void (d.checkout.deliveryOptions[i].label = e.target.value))} aria-label="Nombre" />
                <IconButton label="Quitar" onClick={() => update((d) => void d.checkout.deliveryOptions.splice(i, 1))} disabled={checkout.deliveryOptions.length === 1}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
              <TextInput value={o.note ?? ''} onChange={(e) => update((d) => void (d.checkout.deliveryOptions[i].note = e.target.value || undefined))} placeholder="Nota: tiempo de entrega, zona..." />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Costo">
                  <NumberInput value={o.fee} min={0} onChange={(n) => update((d) => void (d.checkout.deliveryOptions[i].fee = n ?? 0))} />
                </Field>
                <Field label="Gratis desde">
                  <NumberInput value={o.freeFrom} allowEmpty min={0} placeholder="Nunca" onChange={(n) => update((d) => void (d.checkout.deliveryOptions[i].freeFrom = n ?? undefined))} />
                </Field>
              </div>
              <Switch checked={o.requiresAddress} onChange={(v) => update((d) => void (d.checkout.deliveryOptions[i].requiresAddress = v))} label="Pide dirección" />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => update((d) => void d.checkout.deliveryOptions.push({ id: uid('d_'), label: 'Nueva entrega', fee: 0, requiresAddress: true }))}
          >
            <Plus className="size-3.5" /> Forma de entrega
          </Button>
        </div>
      </EditorSection>

      <EditorSection title="Métodos de pago">
        <StringListInput values={checkout.paymentOptions} onChange={(v) => update((d) => void (d.checkout.paymentOptions = v))} placeholder="Nequi, Daviplata, efectivo..." addLabel="Método" />
      </EditorSection>
    </div>
  )
}

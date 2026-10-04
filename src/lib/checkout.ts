import { z } from 'zod'
import type { CheckoutConfig, DeliveryOption } from '@/types'

export function deliveryFee(option: DeliveryOption | undefined, subtotal: number) {
  if (!option) return 0
  if (option.freeFrom !== undefined && subtotal >= option.freeFrom) return 0
  return option.fee
}

/** Umbral de envio gratis mas bajo entre las opciones, para la barra de progreso. */
export function freeShippingThreshold(checkout: CheckoutConfig) {
  const values = checkout.deliveryOptions.map((o) => o.freeFrom).filter((v): v is number => v !== undefined)
  return values.length ? Math.min(...values) : null
}

/** Esquema del formulario de pedido. Depende de la configuracion de la tienda. */
export function checkoutSchema(checkout: CheckoutConfig) {
  return z
    .object({
      name: z.string().trim().min(2, 'Escribe tu nombre'),
      phone: z
        .string()
        .trim()
        .refine((v) => v === '' || v.replace(/\D/g, '').length >= 7, 'Revisa el número de teléfono'),
      deliveryId: z.string().refine((id) => checkout.deliveryOptions.some((o) => o.id === id), 'Elige cómo quieres recibirlo'),
      address: z.string().trim(),
      payment: z.string().min(1, 'Elige un método de pago'),
      notes: z.string().trim().max(300, 'Máximo 300 caracteres'),
    })
    .superRefine((data, ctx) => {
      const option = checkout.deliveryOptions.find((o) => o.id === data.deliveryId)
      if (option?.requiresAddress && data.address.length < 6) {
        ctx.addIssue({ code: 'custom', path: ['address'], message: 'Necesitamos la dirección de entrega' })
      }
    })
}

export type CheckoutForm = z.infer<ReturnType<typeof checkoutSchema>>

const CUSTOMER_KEY = 'vitrina:customer'

/** Recuerda los datos del cliente en este navegador para su proxima compra. */
export function loadCustomer(): Partial<CheckoutForm> {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveCustomer(form: CheckoutForm) {
  try {
    const { name, phone, address } = form
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name, phone, address }))
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCartSummary, useSnapshot } from '@/data'
import { useCart } from '@/state/cart'
import { useUi } from '@/state/ui'
import { freeShippingThreshold } from '@/lib/checkout'
import { Button, buttonClass } from '@/components/ui/Button'
import { Img } from '@/components/ui/Media'
import { useMoney } from '@/components/ui/Price'
import type { Order } from '@/types'
import { CheckoutForm } from './CheckoutForm'
import { OrderSent } from './OrderSent'

type Step = 'cart' | 'checkout' | 'sent'

export function CartDrawer() {
  const { cartOpen, closeCart } = useUi()
  const [step, setStep] = useState<Step>('cart')
  const [sentOrder, setSentOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [cartOpen, closeCart])

  // Al cerrar despues de enviar un pedido, la proxima apertura empieza en la bolsa.
  useEffect(() => {
    if (!cartOpen && step === 'sent') {
      const t = setTimeout(() => setStep('cart'), 400)
      return () => clearTimeout(t)
    }
  }, [cartOpen, step])

  const title = step === 'cart' ? 'Tu bolsa' : step === 'checkout' ? 'Datos de entrega' : 'Pedido listo'

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-bg text-ink shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 38 }}
          >
            <header className="flex h-[var(--header-h)] shrink-0 items-center gap-2 border-b border-line px-5">
              {step === 'checkout' && (
                <button onClick={() => setStep('cart')} className="-ml-2 grid size-10 place-items-center" aria-label="Volver a la bolsa">
                  <ArrowLeft className="size-5" strokeWidth={1.6} />
                </button>
              )}
              <h2 className="display flex-1 text-2xl">{title}</h2>
              <button onClick={closeCart} className="-mr-2 grid size-10 place-items-center" aria-label="Cerrar">
                <X className="size-5" strokeWidth={1.6} />
              </button>
            </header>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25 }}
              >
                {step === 'cart' && <CartLines onContinue={() => setStep('checkout')} />}
                {step === 'checkout' && (
                  <CheckoutForm
                    onSent={(order) => {
                      setSentOrder(order)
                      setStep('sent')
                    }}
                  />
                )}
                {step === 'sent' && sentOrder && <OrderSent order={sentOrder} />}
              </motion.div>
            </AnimatePresence>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function CartLines({ onContinue }: { onContinue: () => void }) {
  const { config } = useSnapshot()
  const { lines, subtotal } = useCartSummary()
  const { setQty, remove } = useCart()
  const closeCart = useUi((s) => s.closeCart)
  const money = useMoney()
  const threshold = freeShippingThreshold(config.checkout)

  if (!lines.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
        <span className="grid size-20 place-items-center rounded-full bg-ink/5">
          <ShoppingBag className="size-8 text-muted" strokeWidth={1.3} />
        </span>
        <div>
          <p className="display text-3xl">Tu bolsa está vacía</p>
          <p className="mt-2 text-sm text-muted">Explora el catálogo y agrega tus favoritos.</p>
        </div>
        <Link to="/catalogo" onClick={closeCart} className={buttonClass('primary', 'md')}>
          Explorar {config.catalog.productNoun.plural}
        </Link>
      </div>
    )
  }

  const missing = threshold ? Math.max(threshold - subtotal, 0) : null

  return (
    <>
      {missing !== null && (
        <div className="border-b border-line px-5 py-4">
          <p className="text-[0.8rem]">
            {missing > 0 ? (
              <>
                Te faltan <strong className="text-accent">{money(missing)}</strong> para envío gratis
              </>
            ) : (
              <strong className="text-accent">¡Tu pedido tiene envío gratis!</strong>
            )}
          </p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-ink/10">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={false}
              animate={{ width: `${Math.min((subtotal / (threshold ?? 1)) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
      )}

      <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.li
              key={`${line.productId}-${line.variantId}`}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-4 py-5">
                <Link to={`/producto/${line.product.slug}`} onClick={closeCart} className="shrink-0">
                  <Img src={line.product.images[0]} width={200} alt={line.product.name} className="h-24 w-20 rounded-[min(var(--v-radius),12px)] object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/producto/${line.product.slug}`} onClick={closeCart} className="display block truncate text-lg leading-tight">
                        {line.product.name}
                      </Link>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        {line.variant.swatch && <span className="size-2.5 rounded-full" style={{ background: line.variant.swatch }} />}
                        {line.variant.label}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(config.id, line.productId, line.variantId)}
                      className="grid size-8 shrink-0 place-items-center text-muted transition-colors hover:text-ink"
                      aria-label={`Quitar ${line.product.name}`}
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-btn border border-line">
                      <button
                        className="grid size-8 place-items-center"
                        onClick={() => setQty(config.id, line.productId, line.variantId, line.qty - 1)}
                        aria-label="Restar uno"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-7 text-center text-sm tabular-nums">{line.qty}</span>
                      <button
                        className="grid size-8 place-items-center disabled:opacity-30"
                        onClick={() => setQty(config.id, line.productId, line.variantId, line.qty + 1)}
                        disabled={line.variant.stock !== null && line.qty >= line.variant.stock}
                        aria-label="Sumar uno"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{money(line.lineTotal)}</span>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <footer className="shrink-0 border-t border-line p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="display text-2xl tabular-nums">{money(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">El envío se calcula en el siguiente paso.</p>
        <Button size="lg" className="mt-4 w-full" onClick={onContinue}>
          Continuar pedido
        </Button>
      </footer>
    </>
  )
}

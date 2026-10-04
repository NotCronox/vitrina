import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, Minus, Plus, Share2, ShoppingBag, Check } from 'lucide-react'
import { useSnapshot } from '@/data'
import { useCart } from '@/state/cart'
import { useUi } from '@/state/ui'
import { defaultVariant, inStock } from '@/lib/catalog'
import { productInquiryMessage, waLink } from '@/lib/whatsapp'
import { Button, buttonClass } from '@/components/ui/Button'
import { WhatsAppIcon } from '@/components/ui/Icon'
import { Price } from '@/components/ui/Price'
import { Reveal } from '@/components/ui/Reveal'
import { Gallery } from '@/components/product/Gallery'
import { VariantPicker } from '@/components/product/VariantPicker'
import { AttributeGroups } from '@/components/product/AttributeGroups'
import { ProductGrid } from '@/components/catalog/ProductCard'
import type { Product } from '@/types'
import { NotFoundPage } from './NotFoundPage'

export function ProductPage() {
  const { slug } = useParams()
  const { products } = useSnapshot()
  const product = products.find((p) => p.slug === slug && p.active)
  if (!product) return <NotFoundPage />
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }: { product: Product }) {
  const { config, categories, products } = useSnapshot()
  const add = useCart((s) => s.add)
  const openCart = useUi((s) => s.openCart)

  const [variantId, setVariantId] = useState(() => defaultVariant(product).id)
  const [qty, setQty] = useState(1)
  const [shared, setShared] = useState(false)
  const buyRef = useRef<HTMLDivElement>(null)
  const [showSticky, setShowSticky] = useState(false)

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0]
  const available = inStock(variant)
  const maxQty = variant.stock ?? 99
  const category = categories.find((c) => c.id === product.categoryId)
  const related = products.filter((p) => p.active && p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4)

  useEffect(() => {
    document.title = `${product.name} · ${config.business.name}`
    window.scrollTo({ top: 0 })
  }, [product, config.business.name])

  // Barra fija en movil cuando el boton principal sale de la pantalla.
  useEffect(() => {
    const el = buyRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    document.body.toggleAttribute('data-sticky-bar', showSticky)
    return () => document.body.removeAttribute('data-sticky-bar')
  }, [showSticky])

  const addToBag = () => {
    add(config.id, { productId: product.id, variantId: variant.id, qty })
    openCart()
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: product.name, text: product.summary, url })
      else {
        await navigator.clipboard.writeText(url)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      }
    } catch {
      /* el usuario cancelo el dialogo de compartir */
    }
  }

  const inquiry = waLink(
    config.business.whatsapp,
    productInquiryMessage(config.business.name, product.name, variant.label, window.location.href),
  )

  return (
    <>
      <div className="container-x pt-6 md:pt-10">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted" aria-label="Ruta">
          <Link to="/" className="hover:text-ink">
            Inicio
          </Link>
          <ChevronRight className="size-3" />
          <Link to="/catalogo" className="hover:text-ink">
            Tienda
          </Link>
          {category && (
            <>
              <ChevronRight className="size-3" />
              <Link to={`/catalogo?categoria=${category.slug}`} className="hover:text-ink">
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14 lg:gap-20">
          <div className="md:sticky md:top-[calc(var(--header-h)+24px)] md:self-start">
            <Gallery images={product.images} name={product.name} badges={product.badges} />
          </div>

          <div className="pb-8">
            {category && <p className="eyebrow mb-4">{category.name}</p>}
            <h1 className="display text-[clamp(2.6rem,5.5vw,4.6rem)]">{product.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">{product.summary}</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="display mt-6 text-3xl"
              >
                <Price value={variant.price} compareAt={variant.compareAtPrice} />
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 space-y-7 border-t border-line pt-8">
              {product.variants.length > 1 && (
                <VariantPicker
                  label={config.catalog.variantLabel}
                  variants={product.variants}
                  value={variant.id}
                  onChange={(id) => {
                    setVariantId(id)
                    setQty(1)
                  }}
                />
              )}

              <div ref={buyRef} className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-14 items-center justify-between rounded-btn border border-line sm:w-36">
                  <button className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar uno">
                    <Minus className="size-4" />
                  </button>
                  <span className="text-sm font-semibold tabular-nums">{qty}</span>
                  <button
                    className="grid h-full w-12 place-items-center disabled:opacity-30"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    aria-label="Sumar uno"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
                <Button size="lg" className="flex-1" onClick={addToBag} disabled={!available}>
                  <ShoppingBag className="size-[1.1rem]" />
                  {available ? 'Agregar a la bolsa' : 'Agotado'}
                </Button>
              </div>

              <div className="flex gap-3">
                <a href={inquiry} target="_blank" rel="noreferrer" className={buttonClass('outline', 'md', 'flex-1')}>
                  <WhatsAppIcon className="size-4 text-[#1fa855]" />
                  {available ? 'Preguntar por WhatsApp' : 'Avísame cuando llegue'}
                </a>
                <Button variant="outline" onClick={share} aria-label="Compartir" className="!px-4">
                  {shared ? <Check className="size-4 text-accent" /> : <Share2 className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-12 border-t border-line pt-10">
              <h2 className="eyebrow mb-4">Descripción</h2>
              <p className="leading-relaxed text-pretty">{product.description}</p>
            </div>

            <div className="mt-12">
              <AttributeGroups product={product} />
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-x mt-16 border-t border-line pt-16 md:mt-24 md:pt-24">
          <Reveal>
            <h2 className="display mb-10 text-[clamp(2rem,4.5vw,3.2rem)]">También te puede gustar</h2>
            <ProductGrid products={related} />
          </Reveal>
        </section>
      )}

      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-xl md:hidden"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-muted">
                  {variant.label} · <Price value={variant.price} />
                </p>
              </div>
              <Button onClick={addToBag} disabled={!available}>
                {available ? 'Agregar' : 'Agotado'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

import { Link } from 'react-router'
import { Plus } from 'lucide-react'
import { useSnapshot } from '@/data'
import { useCart } from '@/state/cart'
import { useUi } from '@/state/ui'
import { cn } from '@/lib/format'
import { defaultVariant, isSoldOut, optionLabel } from '@/lib/catalog'
import { Img } from '@/components/ui/Media'
import { Price } from '@/components/ui/Price'
import { ProductBadges } from '@/components/ui/Badge'
import type { Product } from '@/types'

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { config } = useSnapshot()
  const { theme, catalog } = config
  const add = useCart((s) => s.add)
  const openCart = useUi((s) => s.openCart)

  const boxed = theme.cardStyle === 'boxed'
  const soldOut = isSoldOut(product)
  const variant = defaultVariant(product)
  const swatches = product.variants.filter((v) => v.swatch)
  const [cover, hover] = product.images

  const cardAttr = catalog.attributes.find((a) => a.showOnCard && product.attributes[a.id] !== undefined)
  const cardAttrValue = cardAttr ? String(product.attributes[cardAttr.id]) : null
  const cardAttrOption = cardAttr?.options?.find((o) => o.value === cardAttrValue)

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    add(config.id, { productId: product.id, variantId: variant.id, qty: 1 })
    openCart()
  }

  return (
    <Link
      to={`/producto/${product.slug}`}
      className={cn('group flex flex-col', boxed && 'rounded-card bg-surface p-2.5 shadow-[0_1px_0_var(--v-line)] transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.35)]')}
    >
      <div className={cn('card-media relative overflow-hidden bg-ink/5', boxed ? 'rounded-[calc(var(--v-radius)-6px)]' : 'rounded-card')}>
        <Img
          src={cover}
          width={700}
          widths={[360, 540, 760]}
          sizes="(min-width: 1024px) 25vw, 50vw"
          loading={priority ? 'eager' : 'lazy'}
          alt={product.name}
          className="absolute inset-0 size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
        {hover && (
          <Img
            src={hover}
            width={700}
            widths={[360, 540, 760]}
            sizes="(min-width: 1024px) 25vw, 50vw"
            alt=""
            className="absolute inset-0 size-full object-cover !opacity-0 transition-opacity duration-700 group-hover:!opacity-100"
          />
        )}

        <ProductBadges ids={product.badges} className="absolute top-3 left-3" />

        {soldOut ? (
          <span className="absolute inset-x-3 bottom-3 rounded-btn bg-bg/85 py-2 text-center text-[0.7rem] font-semibold tracking-[0.15em] text-ink uppercase backdrop-blur">
            Agotado
          </span>
        ) : (
          <button
            onClick={quickAdd}
            aria-label={`Agregar ${product.name} a la bolsa`}
            className={cn(
              'absolute right-3 bottom-3 flex h-10 items-center gap-2 rounded-btn bg-bg/90 px-3 text-ink shadow-lg backdrop-blur transition-all duration-300',
              'hover:bg-accent hover:text-accent-ink',
              'md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100',
            )}
          >
            <Plus className="size-4" strokeWidth={2} />
            <span className="hidden text-xs font-semibold md:inline">Agregar</span>
          </button>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col', boxed ? 'px-1.5 pt-3.5 pb-1.5' : 'pt-4')}>
        {cardAttr && cardAttrValue && (
          <p className="mb-1.5 flex items-center gap-1.5 text-[0.68rem] font-semibold tracking-[0.16em] text-muted uppercase">
            {cardAttrOption?.color && <span className="size-1.5 rounded-full" style={{ background: cardAttrOption.color }} />}
            {optionLabel(cardAttr, cardAttrValue)}
          </p>
        )}
        <h3 className={cn('display', boxed ? 'text-lg leading-snug' : 'text-[1.45rem] leading-tight')}>{product.name}</h3>

        {swatches.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            {swatches.slice(0, 5).map((v) => (
              <span
                key={v.id}
                title={v.label}
                className="size-3.5 rounded-full ring-1 ring-ink/15 ring-offset-1 ring-offset-surface"
                style={{ background: v.swatch }}
              />
            ))}
            {swatches.length > 5 && <span className="text-[0.7rem] text-muted">+{swatches.length - 5}</span>}
          </div>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-2.5 text-sm font-medium">
          <Price value={variant.price} compareAt={variant.compareAtPrice} />
          {!swatches.length && product.variants.length > 1 && (
            <span className="text-[0.7rem] font-normal text-muted">{product.variants.length} opciones</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4', className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  )
}

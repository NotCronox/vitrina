import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { useSnapshot } from '@/data'
import { productsForSource } from '@/lib/catalog'
import { cn } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'
import { buttonClass } from '@/components/ui/Button'
import { NamedIcon, WhatsAppIcon } from '@/components/ui/Icon'
import { Img } from '@/components/ui/Media'
import { Reveal } from '@/components/ui/Reveal'
import { ProductGrid } from '@/components/catalog/ProductCard'
import type {
  BenefitsProps,
  CategoriesProps,
  CtaProps,
  FaqProps,
  MarqueeProps,
  ProductsProps,
  StoryProps,
  TestimonialsProps,
} from '@/types'

function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Reveal className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h2 className="display text-[clamp(2.2rem,5vw,3.6rem)]">{title}</h2>
        {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
      </div>
      {action}
    </Reveal>
  )
}

/* ---------- Marquesina ---------- */

export function Marquee({ props }: { props: MarqueeProps }) {
  const items = [...props.items, ...props.items]
  return (
    <section className="overflow-hidden border-y border-line py-5 md:py-7" aria-label={props.items.join(', ')}>
      <div className="animate-marquee flex w-max items-center" aria-hidden>
        {items.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="display px-6 text-2xl whitespace-nowrap italic md:px-10 md:text-4xl">{item}</span>
            <span className="text-accent">✦</span>
          </span>
        ))}
      </div>
    </section>
  )
}

/* ---------- Categorias ---------- */

export function Categories({ props }: { props: CategoriesProps }) {
  const { categories, products } = useSnapshot()
  const list = [...categories].sort((a, b) => a.order - b.order)

  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeading title={props.title} subtitle={props.subtitle} />
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] md:gap-5 md:overflow-visible md:px-0">
        {list.map((category, i) => {
          const count = products.filter((p) => p.active && p.categoryId === category.id).length
          return (
            <Reveal key={category.id} delay={i * 0.08} className="w-[68%] shrink-0 snap-start sm:w-[42%] md:w-auto">
              <Link to={`/catalogo?categoria=${category.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-card">
                <Img
                  src={category.image}
                  width={700}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <div>
                    <p className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase opacity-75">{count} productos</p>
                    <h3 className="display mt-1 text-3xl">{category.name}</h3>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/40 transition-colors group-hover:bg-white group-hover:text-black">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- Productos ---------- */

export function ProductsSection({ props }: { props: ProductsProps }) {
  const snapshot = useSnapshot()
  const products = productsForSource(snapshot, props.source, props.limit)
  if (!products.length) return null

  const href = props.source === 'new' ? '/catalogo?orden=new' : '/catalogo'
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeading
        title={props.title}
        subtitle={props.subtitle}
        action={
          <Link to={href} className="group flex items-center gap-2 text-sm font-semibold">
            Ver todo
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        }
      />
      <Reveal>
        <ProductGrid products={products} />
      </Reveal>
    </section>
  )
}

/* ---------- Historia ---------- */

export function Story({ props }: { props: StoryProps }) {
  return (
    <section className="container-x py-20 md:py-28">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
        <Reveal>
          <div className="aspect-[4/5] overflow-hidden rounded-card">
            <Img src={props.image} width={1100} widths={[600, 900, 1200]} sizes="(min-width: 768px) 50vw, 100vw" alt="" className="size-full object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          {props.eyebrow && <p className="eyebrow mb-5">{props.eyebrow}</p>}
          <h2 className="display text-[clamp(2.4rem,5vw,4.2rem)]">{props.title}</h2>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-pretty text-muted">{props.body}</p>
          {props.ctaLabel && (
            <Link to="/catalogo?orden=new" className={buttonClass('outline', 'lg', 'mt-9')}>
              {props.ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- Beneficios ---------- */

export function Benefits({ props }: { props: BenefitsProps }) {
  return (
    <section className="border-y border-line">
      <div className="container-x grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-4 md:py-16">
        {props.items.map((item, i) => (
          <Reveal key={item.title} delay={i * 0.07} className="flex flex-col items-start gap-4">
            <span className="grid size-12 place-items-center rounded-full bg-accent/12 text-accent">
              <NamedIcon name={item.icon} className="size-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------- Testimonios ---------- */

export function Testimonials({ props }: { props: TestimonialsProps }) {
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeading title={props.title} />
      <div className="grid gap-5 md:grid-cols-3">
        {props.items.map((item, i) => (
          <Reveal key={item.author} delay={i * 0.1}>
            <figure className="flex h-full flex-col rounded-card border border-line bg-surface p-7 md:p-8">
              <span className="display text-6xl leading-none text-accent" aria-hidden>
                “
              </span>
              <blockquote className="display mt-2 flex-1 text-[1.45rem] leading-snug">{item.quote}</blockquote>
              <figcaption className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5 text-sm">
                <span className="font-semibold">{item.author}</span>
                {item.detail && <span className="text-muted">{item.detail}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* ---------- Preguntas frecuentes ---------- */

export function Faq({ props }: { props: FaqProps }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="container-x py-20 md:py-28">
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <Reveal>
          <h2 className="display text-[clamp(2.2rem,5vw,3.6rem)]">{props.title}</h2>
        </Reveal>
        <Reveal delay={0.1} className="border-t border-line">
          {props.items.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q} className="border-b border-line">
                <button
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-medium">{item.q}</span>
                  <Plus className={cn('size-5 shrink-0 transition-transform duration-300', isOpen && 'rotate-45 text-accent')} strokeWidth={1.5} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-xl pb-6 leading-relaxed text-muted">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

/* ---------- Llamado a la accion ---------- */

export function Cta({ props }: { props: CtaProps }) {
  const { business } = useSnapshot().config
  return (
    <section className="container-x py-12 md:py-20">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[calc(var(--v-radius)*1.5)] bg-ink px-6 py-16 text-center text-bg md:px-16 md:py-24">
          <div
            className="absolute inset-0 -z-10 opacity-50"
            style={{ background: 'radial-gradient(60% 80% at 50% 0%, color-mix(in oklab, var(--v-accent) 45%, transparent), transparent 70%)' }}
            aria-hidden
          />
          <h2 className="display mx-auto max-w-3xl text-[clamp(2.4rem,6vw,4.6rem)]">{props.title}</h2>
          <p className="mx-auto mt-5 max-w-lg text-lg opacity-75">{props.body}</p>
          <a
            href={waLink(business.whatsapp, `Hola ${business.name}, me gustaría recibir asesoría.`)}
            target="_blank"
            rel="noreferrer"
            className={buttonClass('whatsapp', 'lg', 'mt-10')}
          >
            <WhatsAppIcon className="size-5" />
            {props.ctaLabel}
          </a>
        </div>
      </Reveal>
    </section>
  )
}

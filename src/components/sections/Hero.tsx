import { Link } from 'react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useSnapshot } from '@/data'
import { basePrice, productsForSource } from '@/lib/catalog'
import { waLink } from '@/lib/whatsapp'
import { buttonClass } from '@/components/ui/Button'
import { Img } from '@/components/ui/Media'
import { Price } from '@/components/ui/Price'
import { WhatsAppIcon } from '@/components/ui/Icon'
import type { HeroProps } from '@/types'

const ease = [0.22, 1, 0.36, 1] as const

function HeroText({ props, light }: { props: HeroProps; light?: boolean }) {
  const { business } = useSnapshot().config
  const words = props.title.split(' ')
  return (
    <>
      {props.eyebrow && (
        <motion.p
          className="eyebrow mb-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
        >
          {props.eyebrow}
        </motion.p>
      )}
      <h1 className="display text-[clamp(2.9rem,8.5vw,7.2rem)]">
        {words.map((word, i) => (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1, delay: 0.15 + i * 0.07, ease }}
            >
              {word}
              {i < words.length - 1 && ' '}
            </motion.span>
          </span>
        ))}
      </h1>
      {props.subtitle && (
        <motion.p
          className={`mt-6 max-w-xl text-base leading-relaxed text-pretty md:text-lg ${light ? 'text-white/80' : 'text-muted'}`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55, ease }}
        >
          {props.subtitle}
        </motion.p>
      )}
      <motion.div
        className="mt-9 flex flex-wrap gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.7, ease }}
      >
        <Link to="/catalogo" className={buttonClass('primary', 'lg')}>
          {props.ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
        {props.secondaryLabel && (
          <a
            href={waLink(business.whatsapp, `Hola ${business.name}, me gustaría recibir asesoría.`)}
            target="_blank"
            rel="noreferrer"
            className={buttonClass('outline', 'lg', light ? '!border-white/40 !text-white hover:!bg-white/10' : undefined)}
          >
            <WhatsAppIcon className="size-4" />
            {props.secondaryLabel}
          </a>
        )}
      </motion.div>
    </>
  )
}

function ImmersiveHero({ props }: { props: HeroProps }) {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 800], [0, reduce ? 0 : 160])

  return (
    <section className="relative isolate flex min-h-[100svh] items-end overflow-hidden text-white">
      <motion.div className="absolute inset-0 -z-10" style={{ y }}>
        <motion.div
          className="size-full"
          initial={{ scale: reduce ? 1 : 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.4, ease }}
        >
          <Img src={props.image} width={1900} widths={[900, 1400, 1900]} sizes="100vw" loading="eager" alt="" className="size-full object-cover" />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,rgb(0_0_0/0.05)_35%,rgb(0_0_0/0.25)_60%,rgb(0_0_0/0.8)_100%)]" />

      <div className="container-x pt-40 pb-16 md:pb-24">
        <div className="max-w-4xl">
          <HeroText props={props} light />
        </div>
      </div>

      <motion.div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-white/60 md:block"
        animate={reduce ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        aria-hidden
      >
        <ChevronDown className="size-5" />
      </motion.div>
    </section>
  )
}

function SplitHero({ props }: { props: HeroProps }) {
  const snapshot = useSnapshot()
  const spotlight = productsForSource(snapshot, 'badge:top', 1)[0]

  return (
    <section className="relative isolate overflow-hidden">
      <div
        className="absolute -top-40 -right-40 -z-10 size-[42rem] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, color-mix(in oklab, var(--v-accent) 22%, transparent), transparent 70%)' }}
        aria-hidden
      />
      <div className="container-x grid items-center gap-12 pt-10 pb-16 md:grid-cols-[1.05fr_1fr] md:gap-16 md:pt-16 md:pb-24">
        <div>
          <HeroText props={props} />
        </div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease }}
        >
          <div className="aspect-[4/5] overflow-hidden rounded-[calc(var(--v-radius)*2)]">
            <Img src={props.image} width={1200} widths={[700, 1000, 1300]} sizes="(min-width: 768px) 48vw, 100vw" loading="eager" alt="" className="size-full object-cover" />
          </div>

          {spotlight && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease }}
              className="absolute -bottom-6 left-4 md:-left-10"
            >
              <Link
                to={`/producto/${spotlight.slug}`}
                className="flex items-center gap-3 rounded-card bg-surface/95 p-2.5 pr-5 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.35)] backdrop-blur transition-transform hover:-translate-y-0.5"
              >
                <Img src={spotlight.images[0]} width={160} alt="" className="size-16 rounded-[calc(var(--v-radius)-6px)] object-cover" />
                <span>
                  <span className="block text-[0.65rem] font-semibold tracking-[0.16em] text-accent uppercase">Favorito</span>
                  <span className="display block text-lg leading-tight">{spotlight.name}</span>
                  <Price value={basePrice(spotlight)} className="text-sm text-muted" />
                </span>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export function Hero({ props }: { props: HeroProps }) {
  return props.layout === 'immersive' ? <ImmersiveHero props={props} /> : <SplitHero props={props} />
}

/* ------------------------------------------------------------------
 * Modelo de datos de Vitrina.
 * Todo lo que hace distinta a una tienda de otra vive en StoreConfig:
 * el motor solo sabe leer esta configuracion y pintarla.
 * ------------------------------------------------------------------ */

/* ---------- Atributos de producto (esquema configurable) ---------- */

export type AttributeType =
  | 'text' // texto libre corto: "Perfumista", "Contenido"
  | 'select' // una opcion de una lista: "Familia olfativa", "Acabado"
  | 'multi' // varias opciones de una lista: "Ocasion", "Tipo de piel"
  | 'tags' // lista libre de etiquetas: "Notas de salida"
  | 'scale' // valor de 1 a max: "Intensidad", "Cobertura"
  | 'boolean' // si / no: "Vegano"

export interface AttributeOption {
  value: string
  label: string
  /** Color opcional para pintar la opcion como punto o chip. */
  color?: string
}

export interface AttributeDef {
  id: string
  label: string
  type: AttributeType
  options?: AttributeOption[]
  /** Solo para `scale`. */
  max?: number
  /** Solo para `scale`: textos de los extremos, p. ej. ['Suave', 'Intensa']. */
  scaleLabels?: [string, string]
  /** Aparece como filtro en el catalogo. */
  filterable?: boolean
  /** Se muestra en la tarjeta del producto. */
  showOnCard?: boolean
  /** Grupo en la ficha del producto. */
  group?: string
  help?: string
}

export type AttributeGroupLayout = 'tiers' | 'meters' | 'chips' | 'list'

export interface AttributeGroup {
  id: string
  label: string
  layout: AttributeGroupLayout
  /** Subtitulos por nivel, solo para `tiers`. */
  tierLabels?: string[]
}

export type AttributeValue = string | string[] | number | boolean

/* ---------- Catalogo ---------- */

export interface Variant {
  id: string
  label: string
  price: number
  compareAtPrice?: number
  /** null = sin control de inventario. */
  stock: number | null
  /** Color de muestra para tonos (maquillaje, ropa...). */
  swatch?: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand?: string
  categoryId: string
  summary: string
  description: string
  images: string[]
  variants: Variant[]
  attributes: Record<string, AttributeValue>
  badges: string[]
  featured: boolean
  active: boolean
  createdAt: string
}

export interface Category {
  id: string
  slug: string
  name: string
  description?: string
  image?: string
  order: number
}

export interface BadgeDef {
  id: string
  label: string
  tone: 'accent' | 'ink' | 'soft'
}

/* ---------- Tema ---------- */

export interface ThemeColors {
  bg: string
  surface: string
  ink: string
  muted: string
  accent: string
  accentInk: string
  line: string
}

export interface ThemeConfig {
  mode: 'light' | 'dark'
  colors: ThemeColors
  fonts: { display: string; body: string }
  /** Radio base en px para tarjetas, imagenes y campos. */
  radius: number
  /** Botones redondeados tipo pildora o con el mismo radio que las tarjetas. */
  buttonShape: 'pill' | 'soft' | 'square'
  displayWeight: 300 | 400 | 500 | 600 | 700
  displayItalic: boolean
  /** Proporcion de las fotos de producto. */
  cardRatio: '3/4' | '4/5' | '1/1'
  cardStyle: 'editorial' | 'boxed'
  /** Textura de grano sutil sobre el fondo. */
  grain: boolean
  /** Estilo del logotipo de texto. */
  logoStyle: 'caps' | 'regular' | 'italic'
}

/* ---------- Secciones del inicio ---------- */

export interface HeroProps {
  layout: 'immersive' | 'split'
  eyebrow?: string
  title: string
  subtitle?: string
  image: string
  ctaLabel: string
  secondaryLabel?: string
}

export interface MarqueeProps {
  items: string[]
}

export interface CategoriesProps {
  title: string
  subtitle?: string
}

export interface ProductsProps {
  title: string
  subtitle?: string
  /** 'featured' | 'new' | 'badge:<id>' | 'category:<id>' */
  source: string
  limit: number
}

export interface StoryProps {
  eyebrow?: string
  title: string
  body: string
  image: string
  ctaLabel?: string
}

export interface BenefitsProps {
  items: { icon: string; title: string; text: string }[]
}

export interface TestimonialsProps {
  title: string
  items: { quote: string; author: string; detail?: string }[]
}

export interface FaqProps {
  title: string
  items: { q: string; a: string }[]
}

export interface CtaProps {
  title: string
  body: string
  ctaLabel: string
}

interface SectionBase<T extends string, P> {
  id: string
  type: T
  enabled: boolean
  props: P
}

export type Section =
  | SectionBase<'hero', HeroProps>
  | SectionBase<'marquee', MarqueeProps>
  | SectionBase<'categories', CategoriesProps>
  | SectionBase<'products', ProductsProps>
  | SectionBase<'story', StoryProps>
  | SectionBase<'benefits', BenefitsProps>
  | SectionBase<'testimonials', TestimonialsProps>
  | SectionBase<'faq', FaqProps>
  | SectionBase<'cta', CtaProps>

export type SectionType = Section['type']

/* ---------- Negocio y pedidos ---------- */

export interface BusinessInfo {
  name: string
  tagline: string
  /** Palabra o iniciales que se usan como logotipo si no hay imagen. */
  logoText: string
  logoImage?: string
  whatsapp: string
  instagram?: string
  email?: string
  address?: string
  city: string
  hours?: string
  /** Boton flotante de WhatsApp en toda la tienda. */
  floatingWhatsapp?: boolean
  currency: string
  locale: string
}

export interface DeliveryOption {
  id: string
  label: string
  fee: number
  requiresAddress: boolean
  note?: string
  /** Subtotal a partir del cual el envio es gratis. */
  freeFrom?: number
}

export interface CheckoutConfig {
  orderPrefix: string
  deliveryOptions: DeliveryOption[]
  paymentOptions: string[]
  /** Saludo con el que empieza el mensaje de WhatsApp. */
  greeting: string
  closing: string
}

export interface CatalogConfig {
  productNoun: { singular: string; plural: string }
  /** Como se llama la variante: "Tamano", "Tono", "Talla"... */
  variantLabel: string
  attributes: AttributeDef[]
  groups: AttributeGroup[]
  badges: BadgeDef[]
}

export interface StoreConfig {
  id: string
  business: BusinessInfo
  theme: ThemeConfig
  catalog: CatalogConfig
  sections: Section[]
  checkout: CheckoutConfig
  announcements: string[]
}

export interface StoreSnapshot {
  config: StoreConfig
  categories: Category[]
  products: Product[]
  /** La base de datos aun esta vacia y se muestra la plantilla de ejemplo. */
  uninitialized?: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  variantId: string
  name: string
  variantLabel: string
  price: number
  qty: number
  image?: string
}

export interface Order {
  id: string
  number: string
  createdAt: string
  status: OrderStatus
  customer: { name: string; phone?: string; address?: string; notes?: string }
  deliveryId: string
  deliveryLabel: string
  payment: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

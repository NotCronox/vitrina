import {
  GalleryHorizontalEnd,
  HelpCircle,
  LayoutGrid,
  Megaphone,
  MessageSquareQuote,
  Rows3,
  ShoppingBag,
  Sparkles,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import type { Section, SectionType, ThemeColors, ThemeConfig } from '@/types'

/* ---------- Secciones ---------- */

type PropsOf<T extends SectionType> = Extract<Section, { type: T }>['props']

export const SECTION_META: { [T in SectionType]: { label: string; description: string; icon: LucideIcon; defaults: () => PropsOf<T> } } = {
  hero: {
    label: 'Portada',
    description: 'Imagen grande con título y botones.',
    icon: GalleryHorizontalEnd,
    defaults: () => ({ layout: 'split', eyebrow: 'Nueva colección', title: 'Un título que enamore', subtitle: 'Cuenta en una frase por qué tus productos son especiales.', image: '', ctaLabel: 'Ver catálogo', secondaryLabel: 'Escríbenos' }),
  },
  marquee: {
    label: 'Cinta en movimiento',
    description: 'Palabras que se desplazan de lado a lado.',
    icon: Rows3,
    defaults: () => ({ items: ['Envíos a todo el país', 'Pago contra entrega', 'Atención por WhatsApp'] }),
  },
  categories: {
    label: 'Categorías',
    description: 'Tarjetas con foto de cada categoría.',
    icon: LayoutGrid,
    defaults: () => ({ title: 'Compra por categoría' }),
  },
  products: {
    label: 'Productos',
    description: 'Una selección de productos del catálogo.',
    icon: ShoppingBag,
    defaults: () => ({ title: 'Destacados', source: 'featured', limit: 4 }),
  },
  story: {
    label: 'Historia',
    description: 'Imagen y texto para contar quiénes son.',
    icon: BookOpen,
    defaults: () => ({ eyebrow: 'Nosotros', title: 'Nuestra historia', body: 'Cuenta cómo empezó tu negocio y qué lo hace diferente.', image: '', ctaLabel: 'Ver novedades' }),
  },
  benefits: {
    label: 'Beneficios',
    description: 'Íconos con las ventajas de comprarte.',
    icon: Sparkles,
    defaults: () => ({
      items: [
        { icon: 'truck', title: 'Envíos rápidos', text: 'A todo el país.' },
        { icon: 'shield', title: 'Compra segura', text: 'Confirmamos todo por WhatsApp.' },
        { icon: 'gift', title: 'Listo para regalar', text: 'Envoltura sin costo.' },
      ],
    }),
  },
  testimonials: {
    label: 'Testimonios',
    description: 'Lo que dicen tus clientes.',
    icon: MessageSquareQuote,
    defaults: () => ({ title: 'Lo que dicen de nosotros', items: [{ quote: 'Me encantó, llegó rapidísimo.', author: 'Cliente feliz', detail: '' }] }),
  },
  faq: {
    label: 'Preguntas frecuentes',
    description: 'Respuestas a las dudas más comunes.',
    icon: HelpCircle,
    defaults: () => ({ title: 'Preguntas frecuentes', items: [{ q: '¿Cómo hago un pedido?', a: 'Agrega productos a la bolsa y envíanos el pedido por WhatsApp.' }] }),
  },
  cta: {
    label: 'Llamado a la acción',
    description: 'Bloque destacado con botón de WhatsApp.',
    icon: Megaphone,
    defaults: () => ({ title: '¿Necesitas ayuda?', body: 'Escríbenos y te asesoramos.', ctaLabel: 'Hablar por WhatsApp' }),
  },
}

export function newSection(type: SectionType): Section {
  return { id: `${type}_${Date.now().toString(36)}`, type, enabled: true, props: SECTION_META[type].defaults() } as Section
}

export function sectionTitle(section: Section) {
  const props = section.props as { title?: string; items?: unknown[] }
  if (props.title) return props.title
  if (section.type === 'marquee') return (section.props.items ?? []).slice(0, 2).join(' · ')
  return SECTION_META[section.type].label
}

/* ---------- Paletas ---------- */

export interface PalettePreset {
  name: string
  mode: ThemeConfig['mode']
  colors: ThemeColors
}

export const PALETTES: PalettePreset[] = [
  { name: 'Noche ámbar', mode: 'dark', colors: { bg: '#0f0d0b', surface: '#1a1714', ink: '#f3eadb', muted: '#a3967f', accent: '#c9a35b', accentInk: '#14110d', line: '#2e2822' } },
  { name: 'Rosa empolvado', mode: 'light', colors: { bg: '#fbf4ef', surface: '#ffffff', ink: '#2d1b21', muted: '#8a6d74', accent: '#b43c5f', accentInk: '#ffffff', line: '#efdfd8' } },
  { name: 'Lino', mode: 'light', colors: { bg: '#f4f0e8', surface: '#fbf9f4', ink: '#22201b', muted: '#7a7466', accent: '#22201b', accentInk: '#f4f0e8', line: '#e2dccf' } },
  { name: 'Bosque', mode: 'light', colors: { bg: '#f1f3ee', surface: '#ffffff', ink: '#17251b', muted: '#5f6f62', accent: '#2f5d3a', accentInk: '#ffffff', line: '#dbe2d8' } },
  { name: 'Terracota', mode: 'light', colors: { bg: '#f7efe7', surface: '#fffaf5', ink: '#2b1d15', muted: '#8b7262', accent: '#c0532b', accentInk: '#ffffff', line: '#ecdccd' } },
  { name: 'Océano', mode: 'light', colors: { bg: '#f2f6f8', surface: '#ffffff', ink: '#0f2430', muted: '#5b7180', accent: '#0e6e8c', accentInk: '#ffffff', line: '#d8e3e9' } },
  { name: 'Tinta y lima', mode: 'dark', colors: { bg: '#101112', surface: '#191b1d', ink: '#f2f4f1', muted: '#9a9f98', accent: '#d4f05a', accentInk: '#101112', line: '#2a2d30' } },
  { name: 'Ciruela', mode: 'dark', colors: { bg: '#1a1020', surface: '#23172b', ink: '#f6ecf5', muted: '#b39fb4', accent: '#e58fb6', accentInk: '#1a1020', line: '#352640' } },
]

/* ---------- Contraste ---------- */

function luminance(hex: string) {
  const v = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Relacion de contraste WCAG entre dos colores hex. */
export function contrast(a: string, b: string) {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return 21
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

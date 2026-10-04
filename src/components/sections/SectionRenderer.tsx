import type { Section } from '@/types'
import { Hero } from './Hero'
import { Benefits, Categories, Cta, Faq, Marquee, ProductsSection, Story, Testimonials } from './Sections'

/** Pinta una seccion segun su tipo. Agregar un tipo nuevo = un `case` mas. */
export function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case 'hero':
      return <Hero props={section.props} />
    case 'marquee':
      return <Marquee props={section.props} />
    case 'categories':
      return <Categories props={section.props} />
    case 'products':
      return <ProductsSection props={section.props} />
    case 'story':
      return <Story props={section.props} />
    case 'benefits':
      return <Benefits props={section.props} />
    case 'testimonials':
      return <Testimonials props={section.props} />
    case 'faq':
      return <Faq props={section.props} />
    case 'cta':
      return <Cta props={section.props} />
  }
}

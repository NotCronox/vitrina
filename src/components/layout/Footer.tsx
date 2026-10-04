import { Link } from 'react-router'
import { Clock, Mail, MapPin } from 'lucide-react'
import { IS_SHOWCASE } from '@/config/mode'
import { useSnapshot } from '@/data'
import { waLink } from '@/lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '@/components/ui/Icon'
import { Logo } from './Logo'

export function Footer() {
  const { config, categories } = useSnapshot()
  const { business } = config
  const phone = business.whatsapp.replace(/^57(\d{3})(\d{3})(\d{4})$/, '+57 $1 $2 $3')

  return (
    <footer className="mt-24 border-t border-line">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo size="lg" />
          <p className="mt-5 text-sm leading-relaxed text-muted">{business.tagline}. Pide por WhatsApp y te respondemos en minutos.</p>
          <div className="mt-6 flex gap-2">
            <a
              href={waLink(business.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="size-[1.1rem]" />
            </a>
            {business.instagram && (
              <a
                href={`https://instagram.com/${business.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="grid size-11 place-items-center rounded-full border border-line transition-colors hover:border-accent hover:text-accent"
                aria-label="Instagram"
              >
                <InstagramIcon className="size-[1.1rem]" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Tienda</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/catalogo" className="opacity-75 transition-opacity hover:opacity-100">
                Ver todo
              </Link>
            </li>
            {[...categories]
              .sort((a, b) => a.order - b.order)
              .map((c) => (
                <li key={c.id}>
                  <Link to={`/catalogo?categoria=${c.slug}`} className="opacity-75 transition-opacity hover:opacity-100">
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <div>
          <h3 className="eyebrow mb-5">Visítanos</h3>
          <ul className="space-y-3.5 text-sm">
            {business.address && (
              <li className="flex gap-3 opacity-75">
                <MapPin className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                <span>
                  {business.address}
                  <br />
                  {business.city}
                </span>
              </li>
            )}
            {business.hours && (
              <li className="flex gap-3 opacity-75">
                <Clock className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                {business.hours}
              </li>
            )}
            <li className="flex gap-3 opacity-75">
              <WhatsAppIcon className="mt-0.5 size-4 shrink-0" />
              {phone}
            </li>
            {business.email && (
              <li className="flex gap-3 opacity-75">
                <Mail className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
                {business.email}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {business.name}.{IS_SHOWCASE && ' Proyecto de demostración.'}
          </p>
          <p>
            Catálogo creado con <span className="font-semibold text-ink">Vitrina</span> · Rasec Dev
          </p>
        </div>
      </div>
    </footer>
  )
}

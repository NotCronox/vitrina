import type { BusinessInfo } from '@/types'
import type { ConfigDraft } from '../hooks'
import { Field, Select, StringListInput, Switch, TextInput } from '../ui'
import { EditorSection } from './EditorSection'

const CURRENCIES = [
  { code: 'COP', locale: 'es-CO', label: 'Peso colombiano (COP)' },
  { code: 'MXN', locale: 'es-MX', label: 'Peso mexicano (MXN)' },
  { code: 'USD', locale: 'en-US', label: 'Dólar (USD)' },
  { code: 'EUR', locale: 'es-ES', label: 'Euro (EUR)' },
  { code: 'PEN', locale: 'es-PE', label: 'Sol peruano (PEN)' },
  { code: 'CLP', locale: 'es-CL', label: 'Peso chileno (CLP)' },
  { code: 'ARS', locale: 'es-AR', label: 'Peso argentino (ARS)' },
]

export function BusinessEditor({ draft, update }: Pick<ConfigDraft, 'draft' | 'update'>) {
  const b = draft.business
  const set = <K extends keyof BusinessInfo>(key: K, value: BusinessInfo[K]) => update((d) => void (d.business[key] = value))
  const text = (key: keyof BusinessInfo) => ({
    value: (b[key] as string | undefined) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key, e.target.value as never),
  })

  return (
    <div>
      <EditorSection title="Identidad">
        <div className="space-y-4">
          <Field label="Nombre del negocio">
            <TextInput {...text('name')} />
          </Field>
          <Field label="Eslogan" hint="Aparece en el título de la pestaña y en el pie de página.">
            <TextInput {...text('tagline')} />
          </Field>
        </div>
      </EditorSection>

      <EditorSection title="Contacto">
        <div className="space-y-4">
          <Field label="WhatsApp" hint="Con código de país, sin + ni espacios. A este número llegan los pedidos.">
            <TextInput {...text('whatsapp')} inputMode="tel" placeholder="573001234567" />
          </Field>
          <Switch
            checked={Boolean(b.floatingWhatsapp)}
            onChange={(v) => set('floatingWhatsapp', v)}
            label="Botón flotante de WhatsApp"
            description="Un acceso directo visible en todas las páginas."
          />
          <Field label="Instagram" hint="Solo el usuario, sin @.">
            <TextInput {...text('instagram')} />
          </Field>
          <Field label="Correo">
            <TextInput {...text('email')} type="email" />
          </Field>
        </div>
      </EditorSection>

      <EditorSection title="Ubicación y horario">
        <div className="space-y-4">
          <Field label="Dirección">
            <TextInput {...text('address')} />
          </Field>
          <Field label="Ciudad">
            <TextInput {...text('city')} />
          </Field>
          <Field label="Horario">
            <TextInput {...text('hours')} placeholder="Lun a sáb · 9:00 a 19:00" />
          </Field>
        </div>
      </EditorSection>

      <EditorSection title="Moneda">
        <Select
          value={b.currency}
          onChange={(e) => {
            const c = CURRENCIES.find((x) => x.code === e.target.value)!
            update((d) => {
              d.business.currency = c.code
              d.business.locale = c.locale
            })
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </Select>
      </EditorSection>

      <EditorSection title="Barra de avisos" description="Mensajes que rotan arriba de la tienda. Déjala vacía para ocultarla.">
        <StringListInput values={draft.announcements} onChange={(v) => update((d) => void (d.announcements = v))} placeholder="Envío gratis desde $150.000" addLabel="Aviso" />
      </EditorSection>
    </div>
  )
}

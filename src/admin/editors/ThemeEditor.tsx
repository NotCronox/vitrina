import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/format'
import { FONT_OPTIONS, fontStack, googleFontsUrl } from '@/theme/fonts'
import type { ThemeColors, ThemeConfig } from '@/types'
import type { ConfigDraft } from '../hooks'
import { PALETTES, contrast } from '../presets'
import { ColorInput, Field, ImageInput, Segmented, Select, Switch, TextInput } from '../ui'
import { EditorSection } from './EditorSection'

const COLOR_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'bg', label: 'Fondo' },
  { key: 'surface', label: 'Tarjetas y paneles' },
  { key: 'ink', label: 'Texto principal' },
  { key: 'muted', label: 'Texto secundario' },
  { key: 'accent', label: 'Acento (botones)' },
  { key: 'accentInk', label: 'Texto sobre acento' },
  { key: 'line', label: 'Líneas y bordes' },
]

/** Carga todas las tipografias del catalogo para mostrar cada una con su propia letra. */
function useFontPreviews() {
  useEffect(() => {
    const id = 'vitrina-font-previews'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = googleFontsUrl(FONT_OPTIONS.map((f) => f.family))
    document.head.appendChild(link)
  }, [])
}

export function ThemeEditor({ draft, update }: Pick<ConfigDraft, 'draft' | 'update'>) {
  useFontPreviews()
  const { theme, business } = draft
  const setTheme = <K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) => update((d) => void (d.theme[key] = value))

  const textContrast = contrast(theme.colors.ink, theme.colors.bg)
  const buttonContrast = contrast(theme.colors.accentInk, theme.colors.accent)

  return (
    <div>
      <EditorSection title="Paletas listas" description="Un punto de partida. Luego ajusta cada color.">
        <div className="grid grid-cols-2 gap-2">
          {PALETTES.map((p) => {
            const active = JSON.stringify(p.colors) === JSON.stringify(theme.colors)
            return (
              <button
                type="button"
                key={p.name}
                onClick={() =>
                  update((d) => {
                    d.theme.colors = { ...p.colors }
                    d.theme.mode = p.mode
                  })
                }
                className={cn('overflow-hidden rounded-[10px] border text-left transition', active ? 'border-accent ring-2 ring-accent/30' : 'border-line hover:border-ink/30')}
              >
                <span className="flex h-10" style={{ background: p.colors.bg }}>
                  <span className="m-2 flex-1 rounded" style={{ background: p.colors.surface, border: `1px solid ${p.colors.line}` }} />
                  <span className="my-2 mr-2 w-6 rounded-full" style={{ background: p.colors.accent }} />
                </span>
                <span className="block px-2.5 py-1.5 text-xs font-medium">{p.name}</span>
              </button>
            )
          })}
        </div>
      </EditorSection>

      <EditorSection title="Colores">
        <Segmented
          value={theme.mode}
          onChange={(mode) => setTheme('mode', mode)}
          options={[
            { value: 'light', label: 'Modo claro' },
            { value: 'dark', label: 'Modo oscuro' },
          ]}
        />
        <div className="mt-4 grid gap-3">
          {COLOR_FIELDS.map(({ key, label }) => (
            <ColorInput key={key} label={label} value={theme.colors[key]} onChange={(v) => update((d) => void (d.theme.colors[key] = v))} />
          ))}
        </div>
        {(textContrast < 4.5 || buttonContrast < 3) && (
          <div className="mt-4 flex gap-2 rounded-[10px] bg-amber-50 p-3 text-xs text-amber-950">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              {textContrast < 4.5 && <>El texto se lee con dificultad sobre el fondo (contraste {textContrast.toFixed(1)}:1, lo ideal es 4.5:1). </>}
              {buttonContrast < 3 && <>El texto de los botones tiene poco contraste ({buttonContrast.toFixed(1)}:1).</>}
            </p>
          </div>
        )}
      </EditorSection>

      <EditorSection title="Tipografía">
        <div className="space-y-4">
          <Field label="Títulos">
            <Select value={theme.fonts.display} onChange={(e) => update((d) => void (d.theme.fonts.display = e.target.value))}>
              {FONT_OPTIONS.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                </option>
              ))}
            </Select>
          </Field>
          <p
            className="rounded-[10px] bg-ink/4 px-4 py-3 text-3xl leading-tight"
            style={{ fontFamily: fontStack(theme.fonts.display), fontWeight: theme.displayWeight, fontStyle: theme.displayItalic ? 'italic' : 'normal' }}
          >
            {business.name} — Aa Bb
          </p>
          <Segmented
            value={theme.displayWeight}
            onChange={(w) => setTheme('displayWeight', w)}
            options={([300, 400, 500, 600, 700] as const).map((w) => ({ value: w, label: <span style={{ fontWeight: w }}>{w}</span> }))}
          />
          <Switch checked={theme.displayItalic} onChange={(v) => setTheme('displayItalic', v)} label="Títulos en cursiva" />
          <Field label="Textos">
            <Select value={theme.fonts.body} onChange={(e) => update((d) => void (d.theme.fonts.body = e.target.value))}>
              {FONT_OPTIONS.map((f) => (
                <option key={f.family} value={f.family}>
                  {f.family}
                </option>
              ))}
            </Select>
          </Field>
          <p className="rounded-[10px] bg-ink/4 px-4 py-3 text-sm" style={{ fontFamily: fontStack(theme.fonts.body) }}>
            Así se verán las descripciones, los precios y los botones de tu tienda.
          </p>
        </div>
      </EditorSection>

      <EditorSection title="Formas">
        <div className="space-y-5">
          <Field label={`Redondeo de esquinas: ${theme.radius}px`}>
            <input type="range" min={0} max={32} value={theme.radius} onChange={(e) => setTheme('radius', Number(e.target.value))} className="w-full accent-[var(--v-accent)]" />
          </Field>
          <div>
            <p className="mb-1.5 text-[0.78rem] font-medium">Botones</p>
            <Segmented
              value={theme.buttonShape}
              onChange={(v) => setTheme('buttonShape', v)}
              options={[
                { value: 'square', label: 'Rectos' },
                { value: 'soft', label: 'Suaves' },
                { value: 'pill', label: 'Píldora' },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[0.78rem] font-medium">Tarjetas de producto</p>
            <Segmented
              value={theme.cardStyle}
              onChange={(v) => setTheme('cardStyle', v)}
              options={[
                { value: 'editorial', label: 'Editorial' },
                { value: 'boxed', label: 'Con caja' },
              ]}
            />
          </div>
          <div>
            <p className="mb-1.5 text-[0.78rem] font-medium">Proporción de las fotos</p>
            <Segmented
              value={theme.cardRatio}
              onChange={(v) => setTheme('cardRatio', v)}
              options={[
                { value: '3/4', label: 'Vertical 3:4' },
                { value: '4/5', label: '4:5' },
                { value: '1/1', label: 'Cuadrada' },
              ]}
            />
          </div>
          <Switch checked={theme.grain} onChange={(v) => setTheme('grain', v)} label="Textura de grano" description="Un ruido sutil que da sensación de papel." />
        </div>
      </EditorSection>

      <EditorSection title="Logo">
        <div className="space-y-4">
          <Field label="Texto del logo" hint="Se usa si no subes una imagen.">
            <TextInput value={business.logoText} onChange={(e) => update((d) => void (d.business.logoText = e.target.value))} />
          </Field>
          <Segmented
            value={theme.logoStyle}
            onChange={(v) => setTheme('logoStyle', v)}
            options={[
              { value: 'caps', label: 'MAYÚSCULAS' },
              { value: 'regular', label: 'Normal' },
              { value: 'italic', label: <em>Cursiva</em> },
            ]}
          />
          <div>
            <p className="mb-1.5 text-[0.78rem] font-medium">Logo en imagen (opcional)</p>
            <ImageInput value={business.logoImage} onChange={(src) => update((d) => void (d.business.logoImage = src))} aspect="aspect-[3/1]" maxSize={600} />
          </div>
        </div>
      </EditorSection>
    </div>
  )
}

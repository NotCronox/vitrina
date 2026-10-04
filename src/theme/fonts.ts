/**
 * Tipografias disponibles en el editor de tema.
 * `axes` es el fragmento que pide Google Fonts para esa familia.
 */
export interface FontOption {
  family: string
  kind: 'serif' | 'sans' | 'display'
  axes: string
  fallback: string
}

export const FONT_OPTIONS: FontOption[] = [
  { family: 'Cormorant Garamond', kind: 'serif', axes: 'ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500', fallback: 'Georgia, serif' },
  { family: 'Fraunces', kind: 'serif', axes: 'ital,opsz,wght@0,9..144,300..700;1,9..144,300..700', fallback: 'Georgia, serif' },
  { family: 'Playfair Display', kind: 'serif', axes: 'ital,wght@0,400..800;1,400..800', fallback: 'Georgia, serif' },
  { family: 'Bodoni Moda', kind: 'serif', axes: 'ital,opsz,wght@0,6..96,400..800;1,6..96,400..800', fallback: 'Georgia, serif' },
  { family: 'DM Serif Display', kind: 'serif', axes: 'ital@0;1', fallback: 'Georgia, serif' },
  { family: 'Italiana', kind: 'display', axes: 'wght@400', fallback: 'Georgia, serif' },
  { family: 'Syne', kind: 'display', axes: 'wght@400..800', fallback: 'system-ui, sans-serif' },
  { family: 'Bricolage Grotesque', kind: 'display', axes: 'opsz,wght@12..96,300..800', fallback: 'system-ui, sans-serif' },
  { family: 'Space Grotesk', kind: 'sans', axes: 'wght@300..700', fallback: 'system-ui, sans-serif' },
  { family: 'Manrope', kind: 'sans', axes: 'wght@300..800', fallback: 'system-ui, sans-serif' },
  { family: 'Plus Jakarta Sans', kind: 'sans', axes: 'ital,wght@0,300..800;1,300..800', fallback: 'system-ui, sans-serif' },
  { family: 'DM Sans', kind: 'sans', axes: 'ital,opsz,wght@0,9..40,300..800;1,9..40,300..800', fallback: 'system-ui, sans-serif' },
  { family: 'Outfit', kind: 'sans', axes: 'wght@300..800', fallback: 'system-ui, sans-serif' },
  { family: 'Jost', kind: 'sans', axes: 'ital,wght@0,300..800;1,300..800', fallback: 'system-ui, sans-serif' },
  { family: 'Inter', kind: 'sans', axes: 'opsz,wght@14..32,300..800', fallback: 'system-ui, sans-serif' },
]

export function findFont(family: string) {
  return FONT_OPTIONS.find((f) => f.family === family)
}

export function fontStack(family: string) {
  const font = findFont(family)
  return `"${family}", ${font?.fallback ?? 'system-ui, sans-serif'}`
}

export function googleFontsUrl(families: string[]) {
  const params = [...new Set(families)]
    .map(findFont)
    .filter((f): f is FontOption => Boolean(f))
    .map((f) => `family=${f.family.replace(/ /g, '+')}:${f.axes}`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

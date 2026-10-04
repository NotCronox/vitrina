import type { ThemeConfig } from '@/types'
import { fontStack, googleFontsUrl } from './fonts'

const FONT_LINK_ID = 'vitrina-fonts'

/**
 * Traduce la configuracion del tema a variables CSS.
 * Tailwind lee esas variables (ver `@theme inline` en index.css), por eso
 * cambiar el tema no requiere recompilar nada: basta con llamar esta funcion.
 */
export function applyTheme(theme: ThemeConfig, root: HTMLElement = document.documentElement) {
  const { colors } = theme
  const vars: Record<string, string> = {
    '--v-bg': colors.bg,
    '--v-surface': colors.surface,
    '--v-ink': colors.ink,
    '--v-muted': colors.muted,
    '--v-accent': colors.accent,
    '--v-accent-ink': colors.accentInk,
    '--v-line': colors.line,
    '--v-font-display': fontStack(theme.fonts.display),
    '--v-font-body': fontStack(theme.fonts.body),
    '--v-display-weight': String(theme.displayWeight),
    '--v-display-style': theme.displayItalic ? 'italic' : 'normal',
    '--v-radius': `${theme.radius}px`,
    '--v-radius-btn':
      theme.buttonShape === 'pill' ? '999px' : theme.buttonShape === 'soft' ? `${Math.max(theme.radius, 6)}px` : '0px',
    '--v-card-ratio': theme.cardRatio,
    '--v-grain-opacity': theme.grain ? (theme.mode === 'dark' ? '0.07' : '0.05') : '0',
  }

  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value)
  root.dataset.mode = theme.mode
  root.style.colorScheme = theme.mode

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.bg)

  if (root === document.documentElement) loadFonts([theme.fonts.display, theme.fonts.body])
}

export function loadFonts(families: string[]) {
  const href = googleFontsUrl(families)
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = FONT_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

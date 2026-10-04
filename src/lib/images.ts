/**
 * Las imagenes de las plantillas demo vienen de Unsplash (licencia libre).
 * Se guardan como `unsplash:<id>` y se resuelven con el tamano que pida cada
 * componente, asi el catalogo nunca descarga una foto mas grande de lo necesario.
 * Cualquier otra cadena (URL o data URL subida desde el panel) se usa tal cual.
 */
export function imageUrl(src: string | undefined, width = 800) {
  if (!src) return ''
  if (src.startsWith('unsplash:')) {
    const id = src.slice('unsplash:'.length)
    return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=78`
  }
  return src
}

export function imageSrcSet(src: string | undefined, widths = [400, 700, 1000]) {
  if (!src?.startsWith('unsplash:')) return undefined
  return widths.map((w) => `${imageUrl(src, w)} ${w}w`).join(', ')
}

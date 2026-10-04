/**
 * Reduce y comprime una imagen en el navegador antes de guardarla.
 * En la demo las imagenes se guardan como data URL en localStorage, asi que
 * mantenerlas livianas es lo que permite subir varias sin llenar el espacio.
 */
export async function compressImage(file: File, maxSize = 1200, quality = 0.8): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen.')

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  // Los PNG con transparencia (logos) se mantienen en PNG; el resto pasa a WebP.
  const keepPng = file.type === 'image/png' && maxSize <= 600
  return canvas.toDataURL(keepPng ? 'image/png' : 'image/webp', quality)
}

/** Peso aproximado de una data URL en KB, para mostrarlo en el panel. */
export function dataUrlSizeKb(src: string) {
  if (!src.startsWith('data:')) return null
  return Math.round((src.length * 3) / 4 / 1024)
}

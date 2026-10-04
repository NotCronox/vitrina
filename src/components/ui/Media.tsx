import { useState, type ImgHTMLAttributes } from 'react'
import { imageSrcSet, imageUrl } from '@/lib/images'
import { cn } from '@/lib/format'

interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src?: string
  width?: number
  widths?: number[]
}

/** Imagen con carga diferida, srcset automatico y aparicion suave. */
export function Img({ src, width = 800, widths, className, alt = '', loading = 'lazy', sizes, ...rest }: ImgProps) {
  const [loaded, setLoaded] = useState(false)
  if (!src) return <div className={cn('bg-ink/5', className)} aria-hidden />
  return (
    <img
      src={imageUrl(src, width)}
      srcSet={widths ? imageSrcSet(src, widths) : undefined}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn('transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0', className)}
      {...rest}
    />
  )
}

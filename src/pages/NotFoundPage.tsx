import { Link } from 'react-router'
import { buttonClass } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="display mt-4 text-6xl md:text-8xl">No está aquí</h1>
      <p className="mt-4 max-w-md text-muted">Puede que el producto ya no esté disponible o que el enlace haya cambiado.</p>
      <Link to="/catalogo" className={buttonClass('primary', 'lg', 'mt-8')}>
        Ir a la tienda
      </Link>
    </div>
  )
}

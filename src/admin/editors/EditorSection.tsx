import type { ReactNode } from 'react'

/** Bloque con titulo dentro del panel lateral del editor. */
export function EditorSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-5 py-5 last:border-b-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

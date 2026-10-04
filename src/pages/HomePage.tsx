import { useEffect } from 'react'
import { useSnapshot } from '@/data'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

export function HomePage() {
  const { config } = useSnapshot()

  useEffect(() => {
    document.title = `${config.business.name} · ${config.business.tagline}`
  }, [config.business])

  return (
    <>
      {config.sections
        .filter((s) => s.enabled)
        .map((section) => (
          <div key={section.id} data-section={section.id} className="scroll-mt-[var(--header-h)]">
            <SectionRenderer section={section} />
          </div>
        ))}
    </>
  )
}

'use client'

import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { PhaseSection } from '@/components/nutrition/PhaseSection'

type Section = 'hoje' | 'chat' | 'fase' | 'perfil'

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'chat', label: 'Chat' },
  { value: 'fase', label: 'Fase' },
  { value: 'perfil', label: 'Perfil genético' },
]

/** Aba Nutrição (spec 018): Hoje · Chat · Fase · Perfil genético. */
export function NutricaoClient() {
  const [section, setSection] = useState<Section>('fase') // volta para 'hoje' quando a seção Hoje existir (US1, T025)

  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Segmented tabs label="seções da nutrição" options={SECTIONS} value={section} onChange={setSection} />
      </div>
      {section === 'fase' && <PhaseSection />}
      {section !== 'fase' && (
        <p className="t-secondary" style={{ marginTop: 24 }}>
          Esta seção chega nas próximas etapas da spec 018. Comece pela aba Fase.
        </p>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { PhaseSection } from '@/components/nutrition/PhaseSection'
import { TodaySection } from '@/components/nutrition/TodaySection'

type Section = 'hoje' | 'chat' | 'fase' | 'perfil'

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'chat', label: 'Chat' },
  { value: 'fase', label: 'Fase' },
  { value: 'perfil', label: 'Perfil genético' },
]

/** Aba Nutrição (spec 018): Hoje · Chat · Fase · Perfil genético. */
export function NutricaoClient() {
  const [section, setSection] = useState<Section>('hoje')

  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Segmented tabs label="seções da nutrição" options={SECTIONS} value={section} onChange={setSection} />
      </div>
      {section === 'hoje' && <TodaySection onGoToPhase={() => setSection('fase')} />}
      {section === 'fase' && <PhaseSection />}
      {(section === 'chat' || section === 'perfil') && (
        <p className="t-secondary" style={{ marginTop: 24 }}>
          Esta seção chega nas próximas etapas da spec 018.
        </p>
      )}
    </>
  )
}

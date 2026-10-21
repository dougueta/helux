'use client'

import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { PhaseSection } from '@/components/nutrition/PhaseSection'
import { TodaySection } from '@/components/nutrition/TodaySection'
import { NutriProfile } from '@/components/nutrition/NutriProfile'

type Section = 'hoje' | 'fase' | 'perfil'

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'fase', label: 'Fase' },
  { value: 'perfil', label: 'Perfil genético' },
]

/** Aba Nutrição (spec 018): Hoje · Fase · Perfil genético (o chat do nutricionista é da spec 022). */
export function NutricaoClient() {
  const [section, setSection] = useState<Section>('hoje')

  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Segmented tabs label="seções da nutrição" options={SECTIONS} value={section} onChange={setSection} />
      </div>
      {section === 'hoje' && <TodaySection onGoToPhase={() => setSection('fase')} />}
      {section === 'fase' && <PhaseSection />}
      {section === 'perfil' && <NutriProfile />}
    </>
  )
}

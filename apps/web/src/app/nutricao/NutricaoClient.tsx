'use client'

import { useState } from 'react'
import { Segmented } from '@/components/ui/Segmented'
import { PhaseSection } from '@/components/nutrition/PhaseSection'
import { TodaySection } from '@/components/nutrition/TodaySection'
import { NutriProfile } from '@/components/nutrition/NutriProfile'
import { AgentChat } from '@/components/agents/AgentChat'

type Section = 'hoje' | 'chat' | 'fase' | 'perfil'

const SECTIONS: { value: Section; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'chat', label: 'Chat' },
  { value: 'fase', label: 'Fase' },
  { value: 'perfil', label: 'Perfil genético' },
]

/** Aba Nutrição (spec 018): Hoje · Chat (Agente de Nutrição Genética, spec 022) · Fase · Perfil genético. */
export function NutricaoClient() {
  const [section, setSection] = useState<Section>('hoje')

  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Segmented tabs label="seções da nutrição" options={SECTIONS} value={section} onChange={setSection} />
      </div>
      {section === 'hoje' && <TodaySection onGoToPhase={() => setSection('fase')} />}
      {section === 'fase' && <PhaseSection />}
      {section === 'chat' && (
        <AgentChat channel="nutricao" onHandoff={to => window.location.assign(`/equipe?agente=${to}`)} placeholder="Ex.: o que comer no pré-treino hoje e posso tomar café?" />
      )}
      {section === 'perfil' && <NutriProfile />}
    </>
  )
}

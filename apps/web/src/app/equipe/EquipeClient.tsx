'use client'

import { useState } from 'react'
import { CHANNELS, type Channel } from '@helux/types'
import { AgentChat } from '@/components/agents/AgentChat'
import { Segmented } from '@/components/ui/Segmented'

const TABS: { value: Channel; label: string }[] = [
  { value: 'equipe', label: 'Equipe' },
  { value: 'treino', label: 'Treino' },
  { value: 'medicina', label: 'Medicina' },
  { value: 'nutricao', label: 'Nutrição' },
]

const HINT: Record<Channel, string> = {
  equipe: 'Pergunte qualquer coisa: a pergunta vai para o especialista certo.',
  treino: 'Ex.: dá para trocar o supino por algo com halteres?',
  medicina: 'Ex.: sinto dor na frente do ombro ao fazer supino há 3 dias.',
  nutricao: 'Ex.: o que comer no pré-treino hoje e posso tomar café?',
}

/** Chat Equipe Helux e acesso direto a cada especialista (spec 022, FR-023). */
export function EquipeClient({ initial }: { initial: string | null }) {
  const [channel, setChannel] = useState<Channel>(CHANNELS.includes(initial as Channel) ? (initial as Channel) : 'equipe')
  return (
    <>
      <div style={{ marginTop: 16 }}>
        <Segmented tabs label="especialistas" options={TABS} value={channel} onChange={setChannel} />
      </div>
      <AgentChat key={channel} channel={channel} onHandoff={to => setChannel(to)} placeholder={HINT[channel]} />
    </>
  )
}

'use client'

import type { GeneticTrait } from '@helux/types'
import { MarkerStrand } from '@/components/dna/MarkerStrand'
import { TraitCard } from '@/components/dna/TraitCard'
import { Banner } from '@/components/ui/Banner'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { DnaState } from './load-profile'

const STRAND_MAX = 4

/** Genes da fita: no máximo 4, sem repetir, na ordem dos marcadores (risco primeiro) — FR-009. */
export function strandGenes(traits: GeneticTrait[]): string[] {
  return [...new Set(traits.map(t => t.gene))].slice(0, STRAND_MAX)
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2 className="t-section">{title}</h2>
      <p className="t-secondary" style={{ marginTop: 6 }}>
        {text}
      </p>
    </div>
  )
}

/** DNA (FR-022 da 012, spec 020). "Como molda seu treino" fica oculto enquanto não houver dado (FR-024). */
export function DnaClient({ state }: { state: DnaState }) {
  if (state.status === 'error') {
    return (
      <div style={{ marginTop: 24 }}>
        <Banner kind="err" title="Não foi possível carregar seu DNA">
          O serviço do perfil genético não respondeu. Tente de novo mais tarde.
        </Banner>
      </div>
    )
  }
  if (state.status === 'missing') {
    return (
      <Empty
        title="Perfil genético não carregado"
        text="Seu teste genético ainda não foi adicionado ao Helux. Quando ele for carregado, seus marcadores aparecem aqui."
      />
    )
  }

  const traits = state.profile.traits
  if (traits.length === 0) {
    return (
      <Empty
        title="Marcadores ainda não disponíveis"
        text="Seu teste genético foi lido, mas não traz marcadores ligados a treino."
      />
    )
  }

  const n = traits.length
  return (
    <>
      <p className="t-body dim" style={{ marginTop: 8 }}>
        {`${n} ${n === 1 ? 'marcador' : 'marcadores'} do teste Genera definem como o Helux escolhe exercícios, cargas e descanso.`}
      </p>
      <div style={{ marginTop: 24 }}>
        <MarkerStrand genes={strandGenes(traits)} />
      </div>
      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Marcadores genéticos" aside={`${n} de ${n} lidos`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {traits.map(t => (
            <TraitCard
              key={t.key}
              gene={t.gene}
              genotype={t.genotype}
              label={t.label}
              level={t.level}
              note={t.note}
              warn={t.warn}
            />
          ))}
        </div>
      </section>
    </>
  )
}

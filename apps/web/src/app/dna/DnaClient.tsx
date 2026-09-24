'use client'

import { MarkerStrand } from '@/components/dna/MarkerStrand'
import { TraitCard } from '@/components/dna/TraitCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface DnaClientProps {
  profile: Record<string, unknown> | null
}

interface Trait {
  key: string
  label: string
  value?: string
  level: number
  gene: string
  genotype?: string
  note: string
  warn?: boolean
}

/** "COL1A1 C,C" → { gene: 'COL1A1', genotype: 'C,C' }; sem genótipo, só o gene. */
function splitGene(t: Trait): { gene: string; genotype?: string } {
  if (t.genotype) return { gene: t.gene, genotype: t.genotype }
  const m = t.gene.match(/^(\S+)\s+([ACGT],[ACGT])$/)
  return m ? { gene: m[1], genotype: m[2] } : { gene: t.gene }
}

/** DNA (FR-022, handoff 5.4). "Como molda seu treino" fica oculto enquanto não houver dado (FR-024). */
export function DnaClient({ profile }: DnaClientProps) {
  const traits = profile && Array.isArray(profile.traits) ? (profile.traits as Trait[]) : []
  const summary = profile && typeof profile.summary === 'string' ? profile.summary : null
  const markers = traits.map(t => ({ ...t, ...splitGene(t) }))

  if (markers.length === 0) {
    return (
      <div style={{ marginTop: 24 }}>
        <h2 className="t-section">{profile ? 'Marcadores ainda não disponíveis' : 'Perfil genético não carregado'}</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          {profile
            ? 'O perfil genético foi lido, mas ainda não traz os marcadores no formato desta tela.'
            : 'Adicione o arquivo do teste Genera em data/genetics/genera.json na API para ver seus marcadores.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="t-body dim" style={{ marginTop: 8 }}>
        {summary ??
          `${markers.length} ${markers.length === 1 ? 'marcador' : 'marcadores'} do teste Genera definem como o Helux escolhe exercícios, cargas e descanso.`}
      </p>
      <div style={{ marginTop: 24 }}>
        <MarkerStrand genes={markers.map(m => m.gene)} />
      </div>
      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Marcadores genéticos" aside={`${markers.length} de ${markers.length} lidos`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {markers.map(m => (
            <TraitCard
              key={m.key}
              gene={m.gene}
              genotype={m.genotype}
              label={m.label}
              level={m.level}
              note={m.note}
              warn={m.warn}
            />
          ))}
        </div>
      </section>
    </>
  )
}

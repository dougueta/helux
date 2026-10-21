import type { PlanDecision, SourcesUsed } from '@helux/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SOURCE_LABEL } from '@/lib/agentSources'

/** Por que o treino é assim (spec 022, FR-008 e FR-004): decisão → dados que a motivaram. */
export function PlanRationale({ decisions, sourcesUsed }: { decisions: PlanDecision[]; sourcesUsed?: SourcesUsed }) {
  if (decisions.length === 0) return null
  return (
    <section style={{ marginTop: 24 }}>
      <SectionHeader title="Por que este treino" />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {decisions.map((d, i) => (
          <li key={i} className="hx-card" style={{ padding: 14 }}>
            <p className="t-body-m">{d.choice}</p>
            <p className="t-secondary" style={{ marginTop: 4 }}>
              {d.reason}
            </p>
            {d.sources.length > 0 && (
              <p className="t-caption dim" style={{ marginTop: 6 }}>
                {d.sources.map(s => SOURCE_LABEL[s]).join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ul>
      {sourcesUsed && (sourcesUsed.vazia.length > 0 || sourcesUsed.desativada.length > 0) && (
        <p className="t-caption dim" style={{ marginTop: 10 }}>
          {sourcesUsed.vazia.length > 0 && `Sem dados: ${sourcesUsed.vazia.map(s => SOURCE_LABEL[s]).join(', ')}. `}
          {sourcesUsed.desativada.length > 0 && `Desativadas por você: ${sourcesUsed.desativada.map(s => SOURCE_LABEL[s]).join(', ')}.`}
        </p>
      )}
    </section>
  )
}

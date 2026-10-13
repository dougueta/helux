'use client'

import type { DietGoal, DietPhase, DietTargets } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'

export const GOAL_LABEL: Record<DietGoal, string> = {
  perder_gordura: 'Perder gordura',
  ganhar_massa: 'Ganhar massa',
  recomposicao: 'Recomposição',
  manutencao: 'Manutenção',
}

const DAY_MS = 24 * 60 * 60 * 1000

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

/** Semanas completas desde o início da fase. */
function weeksSince(startedOn: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(`${startedOn}T00:00:00`)) / (7 * DAY_MS)))
}

export function TargetsGrid({ targets }: { targets: DietTargets }) {
  return (
    <div style={{ marginTop: 16 }}>
      <p>
        <span className="n-lg">{targets.kcal}</span> <span className="t-secondary">kcal por dia (média da fase)</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 12 }}>
        {[
          ['Proteína', targets.proteinG],
          ['Carboidrato', targets.carbsG],
          ['Gordura', targets.fatG],
        ].map(([label, grams]) => (
          <div key={label}>
            <p className="t-caption dim">{label}</p>
            <p className="n-sm" style={{ color: 'var(--text)' }}>{`${grams} g`}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Fase de dieta ativa (spec 018, US0). */
export function PhaseCard({
  phase,
  bodyFatPct,
  ending,
  onEnd,
  now = new Date(),
}: {
  phase: DietPhase
  bodyFatPct: number | null
  ending: boolean
  onEnd: () => void
  now?: Date
}) {
  const elapsed = weeksSince(phase.startedOn, now)
  const finished = elapsed >= phase.durationWeeks

  return (
    <section className="hx-card" style={{ padding: 16, marginTop: 20 }}>
      <p className="t-caption dim">Fase de dieta</p>
      <h2 className="t-title" style={{ marginTop: 4 }}>
        {GOAL_LABEL[phase.goal]}
      </h2>
      <p className="t-secondary" style={{ marginTop: 4 }}>
        {`Desde ${formatDate(phase.startedOn)} · semana ${Math.min(elapsed + 1, phase.durationWeeks)} de ${phase.durationWeeks}`}
      </p>

      {finished && (
        <div style={{ marginTop: 12 }}>
          <Banner kind="warn" title="Fase concluída">
            A duração planejada terminou. Encerre esta fase e inicie a próxima com o objetivo atual.
          </Banner>
        </div>
      )}

      <TargetsGrid targets={phase.baseTargets} />

      {bodyFatPct !== null && (
        <p className="t-secondary" style={{ marginTop: 12 }}>
          {`Gordura corporal (fita métrica): ${String(bodyFatPct).replace('.', ',')}%`}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <Button kind="ghost" block loading={ending} onClick={onEnd}>
          Encerrar fase
        </Button>
      </div>
    </section>
  )
}

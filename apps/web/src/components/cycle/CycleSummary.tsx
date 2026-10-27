'use client'

import type { CycleSummary as Summary, Goal, PlanDecision, SessionKind } from '@helux/types'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { formatNumber } from '@/lib/format'

const KIND_LABEL: Record<SessionKind, string> = { forca: 'Força', cardio: 'Cardio', mobilidade: 'Mobilidade' }
const GOAL_LABEL: Record<Goal, string> = { condicionamento: 'condicionamento', hipertrofia: 'hipertrofia', forca: 'força', emagrecimento: 'emagrecimento', corrida: 'corrida' }
const METRIC: Record<string, [string, string]> = {
  weight_kg: ['peso', 'kg'],
  waist_cm: ['cintura', 'cm'],
  body_fat_pct: ['gordura', 'pp'],
  squat_kg: ['agachamento', 'kg'],
  bench_kg: ['supino', 'kg'],
  deadlift_kg: ['terra', 'kg'],
}

/** Número com sinal: "−1,2", "+3". */
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumber(Math.abs(n), { decimals: Number.isInteger(n) ? 0 : 1 })}`

/**
 * Resumo do ciclo concluído (spec 024, FR-025/026): aderência, evolução, dores,
 * tendência dos check-ins e o que mudou no novo ciclo. A sugestão de novo
 * objetivo só é aplicada com o aceite do usuário.
 */
export function CycleSummary({
  summary,
  changes,
  onAcceptGoal,
  onDeclineGoal,
}: {
  summary: Summary
  changes: PlanDecision[]
  onAcceptGoal?: (goal: Goal) => void
  onDeclineGoal?: () => void
}) {
  const adherence = (Object.entries(summary.adherence) as [SessionKind, { done: number; planned: number }][]).filter(([, a]) => a.planned > 0)
  const evolution = summary.exercises.filter(e => e.firstE1rm !== null && e.lastE1rm !== null && e.firstE1rm > 0)
  const trend = summary.checkinTrend
  const suggestion = trend?.suggestGoalChange ?? null

  return (
    <section aria-label="resumo do ciclo" style={{ marginTop: 24 }}>
      <SectionHeader title="Como foi o último ciclo" aside={`${summary.weeks} semanas`} />

      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '12px 16px', margin: 0 }}>
        {adherence.map(([kind, a]) => (
          <div key={kind}>
            <dt className="t-caption">{KIND_LABEL[kind]}</dt>
            <dd className="n-md" style={{ margin: '2px 0 0' }}>
              {a.done}/{a.planned}
            </dd>
          </div>
        ))}
      </dl>

      {evolution.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
          {evolution.map(e => {
            const gain = Math.round(((e.lastE1rm! - e.firstE1rm!) / e.firstE1rm!) * 100)
            return (
              <li key={e.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid var(--hairline)' }}>
                <span className="t-body">{e.name}</span>
                <span className="t-secondary" style={{ whiteSpace: 'nowrap' }}>
                  {formatNumber(e.firstE1rm!, { decimals: 0 })} → {formatNumber(e.lastE1rm!, { decimals: 0 })} kg ({gain >= 0 ? '+' : '−'}{Math.abs(gain)}%)
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {summary.pains.length > 0 && (
        <p className="t-secondary" style={{ marginTop: 12 }}>
          Dores relatadas: {summary.pains.map(p => `${p.region} · ${p.count}`).join(', ')}
        </p>
      )}

      {trend && Object.keys(trend.deltas).length > 0 && (
        <p className="t-secondary" style={{ marginTop: 8 }}>
          Check-ins ({trend.from} → {trend.to}):{' '}
          {Object.entries(trend.deltas)
            .filter(([m]) => !trend.implausible.includes(m) && METRIC[m])
            .map(([m, d]) => `${METRIC[m][0]} ${signed(d)} ${METRIC[m][1]}/mês`)
            .join(', ')}
        </p>
      )}

      {summary.missingData.length > 0 && (
        <p className="t-caption" style={{ marginTop: 8 }}>
          Faltou: {summary.missingData.join(', ')}
        </p>
      )}

      {changes.length > 0 && (
        <>
          <h3 className="t-section" style={{ marginTop: 20 }}>
            O que mudou no novo ciclo
          </h3>
          <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
            {changes.map((c, i) => (
              <li key={i} style={{ padding: '8px 0', borderTop: '1px solid var(--hairline)' }}>
                <div className="t-body">{c.choice}</div>
                <div className="t-secondary" style={{ marginTop: 2 }}>
                  {c.reason}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {suggestion && onAcceptGoal && (
        <div className="hx-plain" style={{ marginTop: 20, paddingTop: 16 }}>
          <p className="t-body">Você chegou na meta. Que tal um novo objetivo: {GOAL_LABEL[suggestion]}?</p>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            <Button kind="primary" block onClick={() => onAcceptGoal(suggestion)}>
              Mudar para {GOAL_LABEL[suggestion]}
            </Button>
            <Button kind="ghost" block onClick={onDeclineGoal}>
              Manter objetivo
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

import { compareEffort, effortAdvice, effortTarget, type EffortComparison, type EffortLevel } from '@helux/workouts'

const RESULT_LABELS: Record<EffortComparison, string> = {
  'no-alvo': 'No alvo',
  abaixo: 'Abaixo do alvo',
  acima: 'Acima do alvo',
}

/**
 * Esforço registrado × esforço-alvo (spec 027, US2). Só orienta: não muda
 * carga nem progressão (FR-011). O resultado é texto, não só cor (FR-014).
 */
export function EffortComparisonNote({
  rir,
  level,
  hasPendingSets,
}: {
  rir: number | undefined
  level: EffortLevel | null
  hasPendingSets: boolean
}) {
  const target = effortTarget(rir)
  if (!target || !level) return null
  const result = compareEffort(target, level)
  const advice = effortAdvice(result, hasPendingSets)
  return (
    <p role="status" className="t-secondary" style={{ marginTop: 8 }}>
      <strong style={{ color: 'var(--text)' }}>{RESULT_LABELS[result]}</strong>
      {advice && ` · ${advice}`}
    </p>
  )
}

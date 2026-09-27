import type { PlannedExercise } from '@helux/types'
import { PHASE_LABELS, groupByPhase, isMainExercise } from '@helux/workouts'
import { Fit } from '@/components/ui/Fit'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { resolveExerciseDisplay } from '@/lib/exerciseDisplay'

const ROW_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  gap: '4px 12px',
  padding: '12px 0',
  borderTop: '1px solid var(--hairline)',
  alignItems: 'baseline',
} as const

function MainRow({ exercise }: { exercise: PlannedExercise }) {
  const fit = resolveExerciseDisplay(exercise, undefined).fit
  return (
    <li style={ROW_STYLE}>
      <span className="t-body-m">{exercise.name}</span>
      <span className="n-sm" style={{ color: 'var(--text)', textAlign: 'right' }}>
        {exercise.sets} × {String(exercise.reps).replace('-', '–')}
      </span>
      <span>{fit !== undefined && <Fit value={fit} />}</span>
      <span className="n-sm dim" style={{ textAlign: 'right' }}>
        {exercise.weight}
      </span>
    </li>
  )
}

/** Aquecimento/volta à calma: nome livre e a prescrição descritiva, sem carga nem fit. */
function SimpleRow({ exercise }: { exercise: PlannedExercise }) {
  return (
    <li style={ROW_STYLE}>
      <span className="t-body">{exercise.name}</span>
      <span className="t-secondary" style={{ textAlign: 'right' }}>
        {exercise.reps}
      </span>
    </li>
  )
}

/**
 * Lista do treino do dia (spec 014, FR-004): agrupada por fase quando o plano
 * tem aquecimento/volta à calma; planos antigos (só principal) ficam como antes.
 */
export function PlanExerciseList({ exercises }: { exercises: PlannedExercise[] }) {
  const groups = groupByPhase(exercises)
  const showHeadings = groups.length > 1

  return (
    <div>
      {groups.map(group => (
        <section key={group.phase} style={{ marginTop: showHeadings ? 16 : 0 }}>
          {showHeadings && <SectionHeader level={3} title={PHASE_LABELS[group.phase]} />}
          <ol
            aria-label={PHASE_LABELS[group.phase]}
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {group.items.map(({ exercise, index }) =>
              isMainExercise(exercise) ? (
                <MainRow key={index} exercise={exercise} />
              ) : (
                <SimpleRow key={index} exercise={exercise} />
              ),
            )}
          </ol>
        </section>
      ))}
    </div>
  )
}

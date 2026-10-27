import type { PlannedExercise } from '@helux/types'
import { PHASE_LABELS, groupByPhase, isMainExercise, supersetPartnerIndex } from '@helux/workouts'
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

/** "+2 kg" / "−10 kg" / "mantida" (spec 014, FR-019). */
function progressionDelta(p: NonNullable<PlannedExercise['progression']>): string {
  const delta = Math.round(((p.nextWeightKg ?? 0) - (p.previousWeightKg ?? 0)) * 100) / 100
  if (delta === 0) return 'mantida'
  const kg = String(Math.abs(delta)).replace('.', ',')
  return `${delta > 0 ? '+' : '−'}${kg} kg`
}

function MainRow({ exercise, partner }: { exercise: PlannedExercise; partner: PlannedExercise | null }) {
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
        {exercise.progression && (
          <>
            {' '}
            <span>{progressionDelta(exercise.progression)}</span>
          </>
        )}
      </span>
      {exercise.progression && (
        <span className="t-secondary" style={{ gridColumn: '1 / -1' }}>
          {exercise.progression.reason}
        </span>
      )}
      {exercise.rirTarget !== undefined && (
        <span className="t-secondary" style={{ gridColumn: '1 / -1' }}>
          Deixe {exercise.rirTarget} {exercise.rirTarget === 1 ? 'repetição' : 'repetições'} na reserva
        </span>
      )}
      {partner && (
        <span className="t-secondary" style={{ gridColumn: '1 / -1' }}>
          Biset · com {partner.name}
        </span>
      )}
    </li>
  )
}

/** Aquecimento, volta à calma, cardio e mobilidade: nome e a prescrição descritiva, sem carga nem fit. */
function SimpleRow({ exercise }: { exercise: PlannedExercise }) {
  const detail = exercise.cardio
    ? `${exercise.cardio.minutes} min · zona ${exercise.cardio.zone}`
    : exercise.region
      ? `${exercise.reps} · ${exercise.region}`
      : exercise.reps
  return (
    <li style={ROW_STYLE}>
      <span className="t-body">{exercise.name}</span>
      <span className="t-secondary" style={{ textAlign: 'right' }}>
        {detail}
      </span>
    </li>
  )
}

/** Parceiro de biset válido (FR-012), ou null. */
function partnerOf(exercises: PlannedExercise[], index: number): PlannedExercise | null {
  const partner = supersetPartnerIndex(exercises, index)
  return partner !== null ? exercises[partner] ?? null : null
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
                <MainRow key={index} exercise={exercise} partner={partnerOf(exercises, index)} />
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

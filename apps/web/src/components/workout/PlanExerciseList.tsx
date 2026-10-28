import type { ReactNode } from 'react'
import type { PlannedExercise } from '@helux/types'
import { PHASE_LABELS, groupByPhase, isMainExercise, restSecondsAfterSet, supersetPartnerIndex } from '@helux/workouts'
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

/** Linha da lista; com `onSelect` vira botão que abre o detalhe do exercício (spec 026, FR-016). */
function Row({ name, onSelect, children }: { name: string; onSelect?: () => void; children: ReactNode }) {
  if (!onSelect) return <li style={ROW_STYLE}>{children}</li>
  return (
    <li>
      <button
        type="button"
        aria-label={`ver execução de ${name}`}
        onClick={onSelect}
        style={{
          ...ROW_STYLE,
          width: '100%',
          minHeight: 44,
          border: 0,
          borderTop: ROW_STYLE.borderTop,
          background: 'none',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {children}
      </button>
    </li>
  )
}

/** "+2 kg" / "−10 kg" / "mantida" (spec 014, FR-019). */
function progressionDelta(p: NonNullable<PlannedExercise['progression']>): string {
  const delta = Math.round(((p.nextWeightKg ?? 0) - (p.previousWeightKg ?? 0)) * 100) / 100
  if (delta === 0) return 'mantida'
  const kg = String(Math.abs(delta)).replace('.', ',')
  return `${delta > 0 ? '+' : '−'}${kg} kg`
}

function MainRow({
  exercise,
  partner,
  restSeconds,
  onSelect,
}: {
  exercise: PlannedExercise
  partner: PlannedExercise | null
  restSeconds: number
  onSelect?: () => void
}) {
  const fit = resolveExerciseDisplay(exercise, undefined).fit
  return (
    <Row name={exercise.name} onSelect={onSelect}>
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
      <span className="t-secondary" style={{ gridColumn: '1 / -1' }}>
        {restSeconds > 0 ? `descanso ${restSeconds}s` : 'sem descanso antes do par'}
      </span>
    </Row>
  )
}

/** Aquecimento, volta à calma, cardio e mobilidade: nome e a prescrição descritiva, sem carga nem fit. */
function SimpleRow({ exercise, onSelect }: { exercise: PlannedExercise; onSelect?: () => void }) {
  const detail = exercise.cardio
    ? `${exercise.cardio.minutes} min · zona ${exercise.cardio.zone}`
    : exercise.region
      ? `${exercise.reps} · ${exercise.region}`
      : exercise.reps
  return (
    <Row name={exercise.name} onSelect={onSelect}>
      <span className="t-body">{exercise.name}</span>
      <span className="t-secondary" style={{ textAlign: 'right' }}>
        {detail}
      </span>
    </Row>
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
export function PlanExerciseList({
  exercises,
  onSelect,
}: {
  exercises: PlannedExercise[]
  onSelect?: (index: number) => void
}) {
  const groups = groupByPhase(exercises)
  // Descanso como na sessão antes da 1ª série (spec 026): todos com séries pendentes.
  const hasPendingSets = exercises.map(() => true)
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
                <MainRow
                  key={index}
                  exercise={exercise}
                  partner={partnerOf(exercises, index)}
                  restSeconds={restSecondsAfterSet({ exercises, exerciseIndex: index, hasPendingSets })}
                  onSelect={onSelect && (() => onSelect(index))}
                />
              ) : (
                <SimpleRow key={index} exercise={exercise} onSelect={onSelect && (() => onSelect(index))} />
              ),
            )}
          </ol>
        </section>
      ))}
    </div>
  )
}

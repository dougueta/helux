'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { ExerciseAlternative, PlannedExercise } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { ApiError } from '@/services/api-client'
import { editSessionExercise, getAlternatives, type ExerciseEditInput } from '@/services/agents.service'

const textInput: CSSProperties = { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 15 }

/**
 * Edição manual de um exercício da sessão pendente (spec 022, FR-009a):
 * troca por alternativa compatível e séries/reps/carga. Restrição de
 * segurança → aviso com o motivo e "salvar mesmo assim".
 */
export function SessionEditSheet({
  open,
  sessionIndex,
  exerciseIndex,
  exercise,
  onClose,
  onSaved,
}: {
  open: boolean
  sessionIndex: number
  exerciseIndex: number
  exercise: PlannedExercise
  onClose: () => void
  onSaved: () => void
}) {
  const [alternatives, setAlternatives] = useState<ExerciseAlternative[] | null>(null)
  const [choice, setChoice] = useState<string | null>(null)
  const [sets, setSets] = useState(String(exercise.sets))
  const [reps, setReps] = useState(exercise.reps)
  const [load, setLoad] = useState(exercise.weight)
  const [warning, setWarning] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    getAlternatives(sessionIndex, exerciseIndex).then(setAlternatives, () => setAlternatives([]))
  }, [open, sessionIndex, exerciseIndex])

  function edit(): ExerciseEditInput {
    const e: ExerciseEditInput = {}
    if (choice) e.exerciseId = choice
    if (Number(sets) !== exercise.sets && Number(sets) > 0) e.sets = Number(sets)
    if (reps.trim() && reps !== exercise.reps) e.reps = reps.trim()
    if (load.trim() && load !== exercise.weight) e.load = load.trim()
    return e
  }

  async function save(confirmSafetyOverride = false) {
    const e = edit()
    if (Object.keys(e).length === 0) return onClose()
    setBusy(true)
    setError(null)
    try {
      await editSessionExercise(sessionIndex, exerciseIndex, confirmSafetyOverride ? { ...e, confirmSafetyOverride: true } : e)
      setWarning(null)
      onSaved()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'safety-warning') setWarning((err.body?.reasons as string[]) ?? [err.message])
      else setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  const field = (id: string, label: string, value: string, set: (v: string) => void, numeric = false) => (
    <div className="hx-field" style={{ flex: 1 }}>
      <label htmlFor={id}>{label}</label>
      <div className="hx-input">
        <input id={id} value={value} inputMode={numeric ? 'numeric' : undefined} onChange={e => set(e.target.value)} style={textInput} />
      </div>
    </div>
  )

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={`Editar ${exercise.name}`}
      footer={
        warning ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <Button kind="danger" block loading={busy} onClick={() => save(true)}>
              Salvar mesmo assim
            </Button>
            <Button kind="ghost" block onClick={() => setWarning(null)}>
              Voltar
            </Button>
          </div>
        ) : (
          <Button kind="primary" block loading={busy} onClick={() => save(false)}>
            Salvar
          </Button>
        )
      }
    >
      <h2 className="t-section">{exercise.name}</h2>
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        {field('edit-sets', 'Séries', sets, setSets, true)}
        {field('edit-reps', 'Reps', reps, setReps)}
        {field('edit-load', 'Carga', load, setLoad)}
      </div>

      <p className="t-caption dim" style={{ marginTop: 18 }}>
        Trocar por
      </p>
      {alternatives === null ? (
        <p className="t-secondary">Carregando alternativas…</p>
      ) : alternatives.length === 0 ? (
        <p className="t-secondary">Nenhuma alternativa compatível com seus equipamentos.</p>
      ) : (
        <div role="radiogroup" aria-label="alternativas" style={{ display: 'grid', gap: 6, marginTop: 6 }}>
          {alternatives.map(a => (
            <button
              key={a.exerciseId}
              type="button"
              role="radio"
              aria-checked={choice === a.exerciseId}
              className="hx-row-btn"
              onClick={() => setChoice(choice === a.exerciseId ? null : a.exerciseId)}
            >
              <span style={{ flex: 1 }}>
                <span className="t-body" style={{ display: 'block' }}>
                  {a.name}
                </span>
                {a.violatesSafety && <span className="t-caption" style={{ color: 'var(--warn)' }}>{a.reason}</span>}
              </span>
              {choice === a.exerciseId && <span className="t-caption">escolhido</span>}
            </button>
          ))}
        </div>
      )}

      {warning && (
        <div style={{ marginTop: 14 }}>
          <Banner kind="warn" title="Esta edição fere uma restrição de segurança">
            {warning.join(' ')}
          </Banner>
        </div>
      )}
      {error && (
        <div style={{ marginTop: 14 }}>
          <Banner kind="err" title="Não foi possível salvar">
            {error}
          </Banner>
        </div>
      )}
    </Sheet>
  )
}

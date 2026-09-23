'use client'

import { useRef, useState } from 'react'
import type {
  AdjustedSession,
  AdjustedWorkoutPlanView,
  ExerciseAdjustmentChange,
  PlannedExercise,
  TirednessAssessment,
  TirednessLevel,
} from '@helux/types'
import { previewTirednessChoice, type TirednessChoicePreview } from '@helux/workouts'
import { setTirednessToday } from '@/services/tiredness.service'

export type TirednessFlowMode = 'home' | 'start'
export type TirednessFlowStep = 'question' | 'conflict' | 'changes'
export type ChangesBase = 'current' | 'planned'

interface UseTirednessFlowOptions {
  today: AdjustedSession | null | undefined
  /** `useWorkoutPlan().refetch` — obrigatório após salvar (TD-006). */
  refetch: () => Promise<AdjustedWorkoutPlanView | null>
  onStart: (exercises: PlannedExercise[]) => void
}

interface FlowState {
  open: boolean
  mode: TirednessFlowMode
  step: TirednessFlowStep
  candidate: TirednessLevel
  preview: TirednessChoicePreview | null
  changes: ExerciseAdjustmentChange[]
  changesBase: ChangesBase
}

const CLOSED: FlowState = {
  open: false,
  mode: 'home',
  step: 'question',
  candidate: 'normal',
  preview: null,
  changes: [],
  changesBase: 'current',
}

function emptyAssessment(): TirednessAssessment {
  return {
    date: new Date().toISOString().slice(0, 10),
    manualLevel: null,
    overrideAutomatic: false,
    automaticLevel: null,
    automaticHrv: null,
    effectiveLevel: null,
    source: 'none',
    conflict: false,
  }
}

export function useTirednessFlow({ today, refetch, onStart }: UseTirednessFlowOptions) {
  const [state, setState] = useState<FlowState>(CLOSED)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const busyRef = useRef(false)

  const assessment = today?.tiredness ?? emptyAssessment()
  const currentExercises = today?.exercises ?? []
  const plannedExercises = today?.plannedExercises ?? currentExercises

  function preview(candidate: TirednessLevel, confirmOverride = false) {
    return previewTirednessChoice({ assessment, plannedExercises, currentExercises, candidate, confirmOverride })
  }

  async function commit(mode: TirednessFlowMode, candidate: TirednessLevel, p: TirednessChoicePreview) {
    // Trava síncrona contra toque duplo (FR-019): `saving` só aparece após o
    // re-render e não impede dois cliques no mesmo tick.
    if (busyRef.current) return
    busyRef.current = true
    try {
      let exercises = currentExercises
      if (p.needsSave) {
        setSaving(true)
        setError(null)
        try {
          await setTirednessToday(candidate, p.overrideAutomatic)
          const plan = await refetch()
          exercises = plan?.today?.exercises ?? p.nextExercises
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Erro ao salvar o nível de cansaço')
          return
        } finally {
          setSaving(false)
        }
      }
      setState(CLOSED)
      if (mode === 'start') onStart(exercises)
    } finally {
      busyRef.current = false
    }
  }

  /** Decide a próxima etapa depois que o candidato (e a eventual sobreposição) foi definido. */
  async function advance(mode: TirednessFlowMode, candidate: TirednessLevel, p: TirednessChoicePreview) {
    if (p.conflict && !p.overrideAutomatic) {
      setState({ ...CLOSED, open: true, mode, step: 'conflict', candidate, preview: p })
      return
    }
    let changes: ExerciseAdjustmentChange[] = []
    let changesBase: ChangesBase = 'current'
    if (p.changesFromCurrent.length > 0) {
      changes = p.changesFromCurrent
    } else if (mode === 'start' && p.changesFromPlanned.length > 0) {
      changes = p.changesFromPlanned
      changesBase = 'planned'
    }
    if (changes.length > 0) {
      setState({ ...CLOSED, open: true, mode, step: 'changes', candidate, preview: p, changes, changesBase })
      return
    }
    await commit(mode, candidate, p)
  }

  async function chooseFromHome(level: TirednessLevel) {
    setError(null)
    await advance('home', level, preview(level))
  }

  function openStart() {
    setError(null)
    setState({ ...CLOSED, open: true, mode: 'start', step: 'question', candidate: assessment.effectiveLevel ?? 'normal' })
  }

  function selectCandidate(level: TirednessLevel) {
    setState((s) => ({ ...s, candidate: level }))
  }

  async function continueQuestion() {
    await advance('start', state.candidate, preview(state.candidate))
  }

  async function confirmConflict() {
    await advance(state.mode, state.candidate, preview(state.candidate, true))
  }

  function backOrClose() {
    setError(null)
    if (state.mode === 'start') {
      setState((s) => ({ ...s, step: 'question', preview: null, changes: [] }))
    } else {
      setState(CLOSED)
    }
  }

  async function confirmChanges() {
    if (!state.preview) return
    await commit(state.mode, state.candidate, state.preview)
  }

  function close() {
    setError(null)
    setState(CLOSED)
  }

  return {
    open: state.open,
    mode: state.mode,
    step: state.step,
    candidate: state.candidate,
    changes: state.changes,
    changesBase: state.changesBase,
    assessment,
    saving,
    error,
    chooseFromHome,
    openStart,
    selectCandidate,
    continueQuestion,
    confirmConflict,
    declineConflict: backOrClose,
    confirmChanges,
    cancelChanges: backOrClose,
    close,
  }
}

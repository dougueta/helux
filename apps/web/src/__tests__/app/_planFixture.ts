import type { AdjustedSession, AdjustedWorkoutPlanView, PlannedExercise } from '@helux/types'

// Spec 026: plano de teste compartilhado pelos testes do preview, da Home e da aba Treinos.
export const EXERCISES: PlannedExercise[] = [
  { name: 'Esteira leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' },
  {
    name: 'Supino Reto',
    sets: 4,
    reps: '8-10',
    weight: '60kg',
    phase: 'principal',
    cues: ['Escápulas retraídas'],
    variants: [
      { id: 'v1', rec: true, name: 'Supino Reto', equip: 'Barra', level: 'Intermediário', match: 90, motion: 'press-flat', implement: 'barbell', why: '' },
      { id: 'v2', name: 'Supino com halteres', equip: 'Halteres', level: 'Intermediário', match: 85, motion: 'press-flat', implement: 'dumbbell', why: '' },
    ],
  },
  { name: 'Remada Curvada', sets: 4, reps: '8-10', weight: '50kg', phase: 'principal' },
  { name: 'Alongamento de peitoral', sets: 1, reps: '30s cada lado', weight: '—', phase: 'volta-calma' },
]

export function planWith(overrides: Partial<AdjustedSession> = {}): AdjustedWorkoutPlanView {
  return {
    mesocycleId: null,
    generatedAt: '2026-10-20T10:00:00Z',
    today: { letter: 'A', focus: 'Peito e costas', exercises: EXERCISES, adjusted: false, ...overrides },
    upcoming: [],
    progress: { completed: 2, total: 12 },
  }
}

/** Retorno mínimo de `useTirednessFlow` com o diálogo fechado. */
export function tirednessStub(openStart: () => void = () => {}) {
  return {
    open: false,
    mode: 'start' as const,
    step: 'question' as const,
    candidate: null,
    assessment: { effectiveLevel: null, automaticLevel: null, source: null },
    changes: [],
    changesBase: [],
    saving: false,
    error: null,
    openStart,
    chooseFromHome: () => Promise.resolve(),
    selectCandidate: () => {},
    continueQuestion: () => Promise.resolve(),
    confirmConflict: () => Promise.resolve(),
    declineConflict: () => {},
    confirmChanges: () => Promise.resolve(),
    cancelChanges: () => {},
    close: () => {},
  }
}

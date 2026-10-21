import type {
  AdjustedWorkoutPlanView,
  MesocycleSession,
  PlannedExercise,
  TirednessAssessment,
  WorkoutAnalytics,
} from '@helux/types'
import { buildAdjustedSession } from '@helux/workouts'
import type { MockSessionRow } from '../types'
import { DAY_MS, dateDaysAgo, isoDaysAgo } from './clock'

const ex = (name: string, sets: number, reps: string, weight: string, muscle: string): PlannedExercise => ({
  name,
  sets,
  reps,
  weight,
  muscle,
})

/** Mesociclo ABCD com exercícios do banco (`packages/ai/src/exercise-bank.ts`). */
export const MESOCYCLE_SESSIONS: Omit<MesocycleSession, 'completedAt'>[] = [
  {
    letter: 'A',
    focus: 'Peito e tríceps',
    exercises: [
      ex('Supino Reto (Barra)', 4, '6-8', '80 kg', 'peito'),
      ex('Supino Inclinado (Halteres)', 3, '8-10', '30 kg', 'peito'),
      ex('Crossover no Cabo', 3, '12-15', '15 kg', 'peito'),
      ex('Tríceps Corda (Cabo)', 3, '10-12', '25 kg', 'triceps'),
    ],
  },
  {
    letter: 'B',
    focus: 'Costas e bíceps',
    exercises: [
      ex('Barra Fixa (Peso Corporal)', 4, '6-8', 'peso corporal', 'costas'),
      ex('Remada Curvada (Barra)', 4, '8-10', '70 kg', 'costas'),
      ex('Puxada Alta (Cabo)', 3, '10-12', '60 kg', 'costas'),
      ex('Rosca Direta (Barra)', 3, '8-10', '35 kg', 'biceps'),
    ],
  },
  {
    letter: 'C',
    focus: 'Pernas',
    exercises: [
      ex('Agachamento Livre (Barra)', 4, '6-8', '100 kg', 'quadriceps'),
      ex('Levantamento Terra Romeno (Barra)', 3, '8-10', '90 kg', 'posterior'),
      ex('Leg Press 45°', 3, '10-12', '200 kg', 'quadriceps'),
      ex('Mesa Flexora', 3, '10-12', '45 kg', 'posterior'),
    ],
  },
  {
    letter: 'D',
    focus: 'Ombros e core',
    exercises: [
      ex('Desenvolvimento com Halteres', 4, '8-10', '26 kg', 'ombros'),
      ex('Elevação Lateral (Halteres)', 3, '12-15', '10 kg', 'ombros'),
      ex('Face Pull (Cabo)', 3, '12-15', '20 kg', 'ombros'),
      ex('Prancha Abdominal (Peso Corporal)', 3, '45 s', 'peso corporal', 'core'),
    ],
  },
]

/** Plano de hoje: as sessões antes de `todayIndex` estão concluídas; sem `todayIndex`, não há treino hoje. */
export function latestPlanFixture(tiredness: TirednessAssessment, todayIndex: number | null = 1): AdjustedWorkoutPlanView {
  const completed = todayIndex ?? MESOCYCLE_SESSIONS.length
  const pending = todayIndex === null ? null : MESOCYCLE_SESSIONS[todayIndex]
  return {
    mesocycleId: 'mock-mesocycle-1',
    generatedAt: isoDaysAgo(9),
    today: pending ? buildAdjustedSession(pending, tiredness) : null,
    upcoming: MESOCYCLE_SESSIONS.slice((todayIndex ?? MESOCYCLE_SESSIONS.length) + 1).map(({ letter, focus }) => ({ letter, focus })),
    progress: { completed, total: MESOCYCLE_SESSIONS.length },
  }
}

const parseKg = (w: string) => Number.parseFloat(w) || 0

/** 12 sessões nos últimos 30 dias, mais recentes primeiro (formato de `/api/workouts/history`). */
export function workoutHistoryFixture(): MockSessionRow[] {
  const rows: MockSessionRow[] = []
  for (let i = 0; i < 12; i++) {
    const daysAgo = 1 + Math.floor((i * 29) / 11)
    const session = MESOCYCLE_SESSIONS[(12 - i) % MESOCYCLE_SESSIONS.length]
    const progression = 1 - i * 0.01
    rows.push({
      id: `mock-session-${12 - i}`,
      date: dateDaysAgo(daysAgo),
      duration_s: 3300 + ((i * 137) % 900),
      created_at: isoDaysAgo(daysAgo, 19),
      exercises: session.exercises.map(e => ({
        name: e.name,
        sets: Array.from({ length: e.sets }, (_, s) => ({
          reps: Number.parseInt(e.reps, 10) || 10,
          weight: Math.round(parseKg(e.weight) * progression * 2) / 2,
          effort: 7 + (s === e.sets - 1 ? 1 : 0),
        })),
      })),
    })
  }
  return rows
}

function weekStart(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`)
  const offset = (d.getUTCDay() + 6) % 7
  return new Date(d.getTime() - offset * DAY_MS).toISOString().slice(0, 10)
}

/** Agregados derivados do histórico (como `/api/workouts/analytics`). */
export function analyticsFixture(history: MockSessionRow[]): WorkoutAnalytics {
  const weeks = new Map<string, { tonnage: number; sessions: number }>()
  const records = new Map<string, { maxWeight: number; reps: number; achievedAt: string }>()
  for (const row of history) {
    const w = weeks.get(weekStart(row.date)) ?? { tonnage: 0, sessions: 0 }
    w.sessions += 1
    for (const e of row.exercises) {
      for (const s of e.sets) {
        w.tonnage += s.reps * s.weight
        const best = records.get(e.name)
        if (s.weight > 0 && (!best || s.weight > best.maxWeight)) records.set(e.name, { maxWeight: s.weight, reps: s.reps, achievedAt: row.date })
      }
    }
    weeks.set(weekStart(row.date), w)
  }
  const thisWeek = weekStart(dateDaysAgo(0))
  const weekly = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([ws, v]) => ({ weekStart: ws, ...v }))
  // Semanas seguidas com treino, contando para trás; a semana atual vazia não quebra a sequência.
  let streak = 0
  let ws = new Date(`${thisWeek}T00:00:00Z`).getTime()
  if (!weeks.has(thisWeek)) ws -= 7 * DAY_MS
  while (weeks.has(new Date(ws).toISOString().slice(0, 10))) {
    streak += 1
    ws -= 7 * DAY_MS
  }
  return {
    weeklyVolume: weekly,
    personalRecords: [...records.entries()].slice(0, 5).map(([exerciseName, r]) => ({ exerciseName, ...r })),
    totalSessions: history.length,
    currentStreakWeeks: streak,
    thisWeekSessions: weeks.get(thisWeek)?.sessions ?? 0,
  }
}

export const EMPTY_ANALYTICS: WorkoutAnalytics = {
  weeklyVolume: [],
  personalRecords: [],
  totalSessions: 0,
  currentStreakWeeks: 0,
  thisWeekSessions: 0,
}

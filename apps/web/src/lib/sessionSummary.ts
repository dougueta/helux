import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

export interface SessionSummary {
  /** A sessão não tem nome salvo: usa os 3 primeiros exercícios e "+N". */
  name: string
  sets: number
  durationMin: number | null
  /** Σ reps × kg em toneladas. */
  volumeT: number
}

export function summarizeSession(session: WorkoutSessionRow): SessionSummary {
  const names = session.exercises.slice(0, 3).map(e => e.name).join(', ')
  const extra = session.exercises.length > 3 ? ` +${session.exercises.length - 3}` : ''
  const sets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0)
  const volumeKg = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0,
  )
  return {
    name: names + extra,
    sets,
    durationMin: session.duration_s != null ? Math.round(session.duration_s / 60) : null,
    volumeT: volumeKg / 1000,
  }
}

/** "2026-09-21" → "Segunda, 21 de set." (meio-dia UTC, para não mudar o dia no fuso local). */
export function sessionDateLabel(date: string): string {
  const d = new Date(`${date.slice(0, 10)}T12:00:00Z`)
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' }).replace(/-feira$/, '')
  const dayMonth = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${dayMonth}`
}

import { describe, it, expect } from 'vitest'
import { sessionDateLabel, summarizeSession } from '@/lib/sessionSummary'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

const SESSION: WorkoutSessionRow = {
  id: 's1',
  date: '2026-09-21',
  duration_s: 3120,
  created_at: '2026-09-21T10:00:00Z',
  exercises: [
    { name: 'Agachamento', sets: [{ reps: 8, weight: 100, effort: 8 }, { reps: 8, weight: 100, effort: 8 }] },
    { name: 'Leg Press', sets: [{ reps: 10, weight: 200, effort: 8 }] },
    { name: 'Cadeira Extensora', sets: [] },
    { name: 'Panturrilha', sets: [{ reps: 15, weight: 40, effort: 8 }] },
  ],
}

describe('summarizeSession (spec 012, linha de histórico v2)', () => {
  it('names the session by its first 3 exercises plus "+N"', () => {
    expect(summarizeSession(SESSION).name).toBe('Agachamento, Leg Press, Cadeira Extensora +1')
  })

  it('counts sets, rounds the duration to minutes and sums the volume in tonnes', () => {
    const s = summarizeSession(SESSION)
    expect(s.sets).toBe(4)
    expect(s.durationMin).toBe(52)
    // 1600 + 2000 + 600 = 4200 kg
    expect(s.volumeT).toBeCloseTo(4.2)
  })

  it('has no duration when duration_s is null', () => {
    expect(summarizeSession({ ...SESSION, duration_s: null }).durationMin).toBeNull()
  })
})

describe('sessionDateLabel', () => {
  it('formats a YYYY-MM-DD date as "Segunda, 21 de set." without shifting the day', () => {
    expect(sessionDateLabel('2026-09-21')).toBe('Segunda, 21 de set.')
    expect(sessionDateLabel('2026-09-19')).toBe('Sábado, 19 de set.')
  })
})

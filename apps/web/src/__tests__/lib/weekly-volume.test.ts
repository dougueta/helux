import { describe, it, expect } from 'vitest'
import { getWeekLabel, computeWeekDelta } from '@/lib/weekly-volume'
import type { WeeklyVolume } from '@helux/types'

describe('getWeekLabel', () => {
  it('formats an ISO date into an "S<week>" label', () => {
    expect(getWeekLabel('2026-01-05')).toBe('S2')
  })
})

describe('computeWeekDelta', () => {
  it('returns null when fewer than 2 weeks of data exist', () => {
    const weeks: WeeklyVolume[] = [{ weekStart: '2026-07-13', tonnage: 1000, sessions: 3 }]
    expect(computeWeekDelta(weeks)).toBeNull()
  })

  it('returns null when the previous week has zero tonnage (avoids NaN/Infinity)', () => {
    const weeks: WeeklyVolume[] = [
      { weekStart: '2026-07-06', tonnage: 0, sessions: 0 },
      { weekStart: '2026-07-13', tonnage: 500, sessions: 2 },
    ]
    expect(computeWeekDelta(weeks)).toBeNull()
  })

  it('computes a rounded positive percentage delta between the last two weeks', () => {
    const weeks: WeeklyVolume[] = [
      { weekStart: '2026-07-06', tonnage: 1000, sessions: 3 },
      { weekStart: '2026-07-13', tonnage: 1250, sessions: 3 },
    ]
    expect(computeWeekDelta(weeks)).toBe(25)
  })

  it('computes a negative delta when volume drops', () => {
    const weeks: WeeklyVolume[] = [
      { weekStart: '2026-07-06', tonnage: 1000, sessions: 3 },
      { weekStart: '2026-07-13', tonnage: 800, sessions: 3 },
    ]
    expect(computeWeekDelta(weeks)).toBe(-20)
  })
})

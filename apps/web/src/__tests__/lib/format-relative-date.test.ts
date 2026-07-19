import { describe, it, expect } from 'vitest'
import { formatRelativeWhen } from '@/lib/format-relative-date'

const NOW = new Date('2026-07-18T12:00:00Z')

describe('formatRelativeWhen', () => {
  it('returns "esta semana" for a date within the last 7 days', () => {
    expect(formatRelativeWhen('2026-07-15', NOW)).toBe('esta semana')
  })

  it('returns "semana passada" for a date 7-13 days ago', () => {
    expect(formatRelativeWhen('2026-07-10', NOW)).toBe('semana passada')
  })

  it('returns "há N semanas" for a date several weeks ago', () => {
    expect(formatRelativeWhen('2026-06-20', NOW)).toBe('há 4 semanas')
  })

  it('returns "há N meses" for a date months ago', () => {
    expect(formatRelativeWhen('2026-03-01', NOW)).toBe('há 4 meses')
  })

  it('treats a future date as "esta semana" without crashing', () => {
    expect(formatRelativeWhen('2026-07-25', NOW)).toBe('esta semana')
  })
})

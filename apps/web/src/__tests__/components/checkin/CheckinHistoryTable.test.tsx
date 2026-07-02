import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckinHistoryTable } from '@/components/checkin/CheckinHistoryTable'
import type { BodyCheckin } from '@helux/types'

const rows: BodyCheckin[] = [
  { id: '2', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1, squat_kg: 120, created_at: '2026-06-01T00:00:00Z' },
  { id: '1', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0, squat_kg: 115, created_at: '2026-05-01T00:00:00Z' },
]

describe('CheckinHistoryTable', () => {
  it('renders empty state when no checkins', () => {
    render(<CheckinHistoryTable checkins={[]} />)
    expect(screen.getByText(/Nenhum check-in/)).toBeTruthy()
  })

  it('renders month labels for each row', () => {
    render(<CheckinHistoryTable checkins={rows} />)
    expect(screen.getByText('Jun/2026')).toBeTruthy()
    expect(screen.getByText('Mai/2026')).toBeTruthy()
  })

  it('renders weight values', () => {
    render(<CheckinHistoryTable checkins={rows} />)
    expect(screen.getByText('82.2')).toBeTruthy()
    expect(screen.getByText('83.4')).toBeTruthy()
  })

  it('renders delta for weight (second row vs first)', () => {
    render(<CheckinHistoryTable checkins={rows} />)
    expect(screen.getByText('-1.2')).toBeTruthy()
  })

  it('does not crash when optional fields are null (as returned by Supabase for unset columns)', () => {
    const withNulls = [
      { id: '2', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: null, squat_kg: null, created_at: '2026-06-01T00:00:00Z' },
      { id: '1', month: '2026-05-01', weight_kg: null, body_fat_pct: 19.0, squat_kg: 115, created_at: '2026-05-01T00:00:00Z' },
    ] as unknown as BodyCheckin[]
    expect(() => render(<CheckinHistoryTable checkins={withNulls} />)).not.toThrow()
  })
})

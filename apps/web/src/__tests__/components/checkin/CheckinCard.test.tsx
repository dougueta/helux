import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckinCard } from '@/components/checkin/CheckinCard'
import type { BodyCheckin } from '@helux/types'

const checkin1: BodyCheckin = {
  id: '1', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: 18.1,
  squat_kg: 120, bench_kg: 90, created_at: '2026-06-01T00:00:00Z',
}
const checkin2: BodyCheckin = {
  id: '2', month: '2026-05-01', weight_kg: 83.4, body_fat_pct: 19.0,
  squat_kg: 115, bench_kg: 90, created_at: '2026-05-01T00:00:00Z',
}

describe('CheckinCard', () => {
  it('renders nothing when no checkins', () => {
    const { container } = render(<CheckinCard checkins={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders latest month label with 1 check-in', () => {
    render(<CheckinCard checkins={[checkin1]} />)
    expect(screen.getByText(/Jun\/2026/)).toBeTruthy()
    expect(screen.getByText(/82\.2/)).toBeTruthy()
  })

  it('renders weight delta when 2 check-ins provided (newest first)', () => {
    render(<CheckinCard checkins={[checkin1, checkin2]} />)
    expect(screen.getByText(/Jun\/2026/)).toBeTruthy()
    expect(screen.getByText(/-1\.2/)).toBeTruthy()
  })

  it('renders lift delta for squat', () => {
    render(<CheckinCard checkins={[checkin1, checkin2]} />)
    expect(screen.getByText(/\+5/)).toBeTruthy()
  })

  it('does not crash when optional fields are null (as returned by Supabase for unset columns)', () => {
    const withNulls = {
      id: '3', month: '2026-06-01', weight_kg: 82.2, body_fat_pct: null,
      squat_kg: null, bench_kg: null, created_at: '2026-06-01T00:00:00Z',
    } as unknown as BodyCheckin
    expect(() => render(<CheckinCard checkins={[withNulls]} />)).not.toThrow()
  })
})

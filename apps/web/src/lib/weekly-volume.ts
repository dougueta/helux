import type { WeeklyVolume } from '@helux/types'

// Ported from the old apps/web/src/app/recovery/page.tsx getWeekNum() helper.
export function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(
    ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7
  )
  return `S${weekNum}`
}

export function computeWeekDelta(weeks: WeeklyVolume[]): number | null {
  if (weeks.length < 2) return null
  const last = weeks[weeks.length - 1].tonnage
  const prev = weeks[weeks.length - 2].tonnage
  if (prev === 0) return null
  return Math.round(((last - prev) / prev) * 100)
}

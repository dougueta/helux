/** Datas relativas a "agora": as fixtures sempre parecem atuais. */
export const DAY_MS = 24 * 60 * 60 * 1000

export function isoDaysAgo(days: number, hourUtc = 11): string {
  const d = new Date(Date.now() - days * DAY_MS)
  d.setUTCHours(hourUtc, 0, 0, 0)
  return d.toISOString()
}

export function dateDaysAgo(days: number): string {
  return isoDaysAgo(days).slice(0, 10)
}

export const today = () => dateDaysAgo(0)

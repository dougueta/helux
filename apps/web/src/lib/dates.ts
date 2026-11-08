// Spec 029: datas `YYYY-MM-DD` locais (pesagens e medidas são por dia).

/** Hoje no fuso do navegador, `YYYY-MM-DD`. */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "2026-11-08" → "08/11". */
export function formatDayMonth(date: string): string {
  const [, m, d] = date.split('-')
  return `${d}/${m}`
}

/** "2026-11-08" → "08/11/2026". */
export function formatDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

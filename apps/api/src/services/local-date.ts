// Spec 029: "hoje" do usuário (Brasil), para pesagens e medidas por dia.

const TIME_ZONE = 'America/Sao_Paulo'

/** Data local `YYYY-MM-DD` em America/Sao_Paulo. */
export function localToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** `YYYY-MM-DD` válido no calendário. */
export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false
  const d = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date
}

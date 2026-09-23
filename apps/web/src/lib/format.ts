/**
 * Formatação numérica pt-BR (spec 012, research V7): vírgula decimal e ponto
 * de milhar. Todo número de treino exibido passa por aqui.
 */
const cache = new Map<string, Intl.NumberFormat>()

function formatter(decimals: number | undefined): Intl.NumberFormat {
  const key = String(decimals)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? 2,
      useGrouping: true,
    })
    cache.set(key, f)
  }
  return f
}

export function formatNumber(n: number, opts: { decimals?: number } = {}): string {
  return formatter(opts.decimals).format(n)
}

/** Duração de sessão: "52 min", "1h05"; sem dado vira "—". */
export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return '—'
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`
}

/** Relógio do descanso: "1:12". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

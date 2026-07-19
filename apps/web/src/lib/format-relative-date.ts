export function formatRelativeWhen(dateStr: string, now: Date = new Date()): string {
  const then = new Date(dateStr)
  const diffDays = Math.floor((now.getTime() - then.getTime()) / 86400000)

  if (diffDays < 7) return 'esta semana'
  if (diffDays < 14) return 'semana passada'

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `há ${diffWeeks} semanas`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths <= 1) return 'há 1 mês'
  return `há ${diffMonths} meses`
}

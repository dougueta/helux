import type {
  BodyWeight,
  CalendarDaySummary,
  CalendarGymSessionItem,
  CalendarRoutineItem,
  CalendarWeekRow,
  ComplementaryCategory,
  CuriosityScope,
  EffortClassification,
  ExerciseSet,
  PeriodCuriosity,
  TrainingCalendarMonthView,
  WeeklyBalance,
} from '@helux/types'

export interface CalendarRawGymSession {
  id: string
  /** YYYY-MM-DD (ou ISO cujo prefixo de 10 caracteres é YYYY-MM-DD) */
  date: string
  duration_s?: number | null
  exercises: ExerciseSet[]
  /** RPE pós-treino opcional (1–10, spec 024) */
  rpe?: number | null
}

export interface CalendarRawRoutineLog {
  id: string
  category: ComplementaryCategory
  performed_on: string // YYYY-MM-DD
  duration_minutes: number
  modality?: string | null
  effort?: number | null
}

const WEEKDAY_NAMES_PT = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

const MONTH_SHORT_PT = [
  'jan.',
  'fev.',
  'mar.',
  'abr.',
  'mai.',
  'jun.',
  'jul.',
  'ago.',
  'set.',
  'out.',
  'nov.',
  'dez.',
] as const

const round1 = (n: number): number => Math.round(n * 10) / 10

function toDateOnly(dateStr: string): string {
  return dateStr.slice(0, 10)
}

function parseUtcNoon(dateStr: string): Date {
  return new Date(`${toDateOnly(dateStr)}T12:00:00Z`)
}

function formatIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function addCalendarDays(dateStr: string, days: number): string {
  const d = parseUtcNoon(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return formatIsoDate(d)
}

/** 0 = segunda-feira ... 6 = domingo */
export function getWeekdayIndexMondayFirst(dateStr: string): number {
  const d = parseUtcNoon(dateStr)
  const utcDay = d.getUTCDay() // 0 = domingo, 1 = segunda ... 6 = sábado
  return utcDay === 0 ? 6 : utcDay - 1
}

export function getMondayOfDate(dateStr: string): string {
  const idx = getWeekdayIndexMondayFirst(dateStr)
  return addCalendarDays(dateStr, -idx)
}

export interface CalendarGridBounds {
  month: string
  firstDayOfMonth: string
  lastDayOfMonth: string
  firstMonday: string
  previousWeekMonday: string
  lastSunday: string
  weekStarts: string[]
}

export function buildCalendarGridBounds(month: string): CalendarGridBounds {
  const [yStr, mStr] = month.split('-')
  const year = Number(yStr)
  const monthIdx = Number(mStr) - 1 // 0..11
  const firstDayOfMonth = `${month}-01`
  const lastDayDate = new Date(Date.UTC(year, monthIdx + 1, 0, 12, 0, 0))
  const lastDayOfMonth = formatIsoDate(lastDayDate)

  const firstMonday = getMondayOfDate(firstDayOfMonth)
  const previousWeekMonday = addCalendarDays(firstMonday, -7)
  const lastWeekMonday = getMondayOfDate(lastDayOfMonth)
  const lastSunday = addCalendarDays(lastWeekMonday, 6)

  const weekStarts: string[] = []
  let cursor = firstMonday
  while (cursor <= lastWeekMonday) {
    weekStarts.push(cursor)
    cursor = addCalendarDays(cursor, 7)
  }

  return {
    month,
    firstDayOfMonth,
    lastDayOfMonth,
    firstMonday,
    previousWeekMonday,
    lastSunday,
    weekStarts,
  }
}

export function formatMonthLabelPt(month: string): string {
  const [yStr, mStr] = month.split('-')
  const monthName = MONTH_NAMES_PT[Number(mStr) - 1] ?? month
  return `${monthName} ${yStr}`
}

function formatWeekRangeLabelPt(weekStart: string, weekEnd: string, long = false): string {
  const [, sm, sd] = weekStart.split('-').map(Number)
  const [, em, ed] = weekEnd.split('-').map(Number)
  const endMonthShort = MONTH_SHORT_PT[(em ?? 1) - 1] ?? ''
  if (sm === em) {
    return long ? `${sd} a ${ed} de ${endMonthShort}` : `${sd}–${ed} ${endMonthShort}`
  }
  const startMonthShort = MONTH_SHORT_PT[(sm ?? 1) - 1] ?? ''
  return long
    ? `${sd} de ${startMonthShort} a ${ed} de ${endMonthShort}`
    : `${sd} ${startMonthShort}–${ed} ${endMonthShort}`
}

/**
 * Classifica o esforço médio na escala 1–10:
 * < 6.5 -> 'leve', 6.5–7.9 -> 'moderado', 8.0–8.9 -> 'forte', >= 9.0 -> 'muito-forte'
 */
export function classifyEffort(avgEffort: number | null): EffortClassification | null {
  if (avgEffort === null || Number.isNaN(avgEffort)) return null
  if (avgEffort < 6.5) return 'leve'
  if (avgEffort < 8.0) return 'moderado'
  if (avgEffort < 9.0) return 'forte'
  return 'muito-forte'
}

export function effortClassificationLabelPt(classification: EffortClassification | null): string {
  if (!classification) return 'Sem registro'
  const labels: Record<EffortClassification, string> = {
    leve: 'Leve',
    moderado: 'Moderado',
    forte: 'Forte',
    'muito-forte': 'Muito forte',
  }
  return labels[classification]
}

export function summarizeGymSessionForCalendar(session: CalendarRawGymSession): CalendarGymSessionItem {
  const date = toDateOnly(session.date)
  const exercises = session.exercises ?? []
  const names = exercises.slice(0, 3).map(e => e.name).join(', ')
  const extra = exercises.length > 3 ? ` +${exercises.length - 3}` : ''
  const title = (names + extra).trim() || 'Treino de academia'

  let setsCount = 0
  let tonnageKg = 0
  const setEfforts: number[] = []

  for (const ex of exercises) {
    if (ex.skipped) continue
    for (const s of ex.sets ?? []) {
      setsCount += 1
      tonnageKg += (Number(s.reps) || 0) * (Number(s.weight) || 0)
      if (typeof s.effort === 'number' && s.effort >= 1 && s.effort <= 10) {
        setEfforts.push(s.effort)
      }
    }
  }

  let avgEffort: number | null = null
  if (typeof session.rpe === 'number' && session.rpe >= 1 && session.rpe <= 10) {
    avgEffort = round1(session.rpe)
  } else if (setEfforts.length > 0) {
    const sum = setEfforts.reduce((a, b) => a + b, 0)
    avgEffort = round1(sum / setEfforts.length)
  }

  const durationMin =
    session.duration_s != null && session.duration_s > 0
      ? Math.max(1, Math.round(session.duration_s / 60))
      : null

  return {
    id: session.id,
    date,
    title,
    sets: setsCount,
    tonnageKg: Math.round(tonnageKg),
    durationMin,
    avgEffort,
  }
}

export interface ComputeWeeklyBalanceInput {
  weekStart: string
  sessions: CalendarRawGymSession[]
  routineLogs: CalendarRawRoutineLog[]
  weights: BodyWeight[]
  targetGymDays: number
  previousWeekBalance?: WeeklyBalance | null
}

export function computeWeeklyBalance(input: ComputeWeeklyBalanceInput): WeeklyBalance {
  const { weekStart, sessions, routineLogs, weights, targetGymDays, previousWeekBalance } = input
  const weekEnd = addCalendarDays(weekStart, 6)
  const inWeek = (dateStr: string) => {
    const d = toDateOnly(dateStr)
    return d >= weekStart && d <= weekEnd
  }

  const weekSessions = sessions.filter(s => inWeek(s.date))
  const weekRoutines = routineLogs.filter(r => inWeek(r.performed_on))
  const weekWeights = weights
    .filter(w => inWeek(w.date))
    .sort((a, b) => toDateOnly(a.date).localeCompare(toDateOnly(b.date)))

  const gymDaySet = new Set<string>()
  const activeDaySet = new Set<string>()
  let tonnageKg = 0
  let totalSets = 0
  let activeMinutes = 0
  const effortSamples: number[] = []

  for (const s of weekSessions) {
    const summary = summarizeGymSessionForCalendar(s)
    gymDaySet.add(summary.date)
    activeDaySet.add(summary.date)
    tonnageKg += summary.tonnageKg
    totalSets += summary.sets
    if (summary.durationMin != null) {
      activeMinutes += summary.durationMin
    }
    if (summary.avgEffort != null) {
      effortSamples.push(summary.avgEffort)
    }
  }

  for (const r of weekRoutines) {
    const d = toDateOnly(r.performed_on)
    activeDaySet.add(d)
    activeMinutes += Math.max(0, Math.round(r.duration_minutes || 0))
    if (typeof r.effort === 'number' && r.effort >= 1 && r.effort <= 10) {
      effortSamples.push(r.effort)
    }
  }

  const avgEffort =
    effortSamples.length > 0
      ? round1(effortSamples.reduce((a, b) => a + b, 0) / effortSamples.length)
      : null

  const avgWeightKg =
    weekWeights.length > 0
      ? round1(weekWeights.reduce((sum, w) => sum + w.weight_kg, 0) / weekWeights.length)
      : null
  const latestWeightKg = weekWeights.length > 0 ? round1(weekWeights[weekWeights.length - 1]!.weight_kg) : null

  const activeDays = activeDaySet.size
  const gymDays = gymDaySet.size
  const prev = previousWeekBalance ?? null
  const prevHasActivity = prev != null && (prev.activeDays > 0 || prev.weightEntriesCount > 0)

  const deltas = {
    activeDaysDelta: prev && prev.activeDays > 0 ? activeDays - prev.activeDays : null,
    gymDaysDelta: prev && prev.gymDays > 0 ? gymDays - prev.gymDays : null,
    tonnageKgDelta: prev && prev.tonnageKg > 0 ? Math.round(tonnageKg - prev.tonnageKg) : null,
    avgEffortDelta:
      avgEffort != null && prev?.avgEffort != null ? round1(avgEffort - prev.avgEffort) : null,
    avgWeightKgDelta:
      avgWeightKg != null && prev?.avgWeightKg != null
        ? round1(avgWeightKg - prev.avgWeightKg)
        : null,
  }

  // Se a semana atual e a anterior têm atividades, permite delta mesmo quando um dos lados variou
  if (prevHasActivity && prev) {
    deltas.activeDaysDelta = activeDays - prev.activeDays
    deltas.gymDaysDelta = gymDays - prev.gymDays
  }

  return {
    weekStart,
    weekEnd,
    label: formatWeekRangeLabelPt(weekStart, weekEnd, true),
    activeDays,
    gymDays,
    targetGymDays: Math.max(1, targetGymDays || 4),
    gymSessionsCount: weekSessions.length,
    complementaryCount: weekRoutines.length,
    tonnageKg: Math.round(tonnageKg),
    totalSets,
    activeMinutes,
    avgEffort,
    effortClassification: classifyEffort(avgEffort),
    avgWeightKg,
    latestWeightKg,
    weightEntriesCount: weekWeights.length,
    deltas,
  }
}

export function formatWeightValuePt(kg: number): string {
  return kg.toFixed(1).replace('.', ',')
}

export function formatTonnageValuePt(tonnageKg: number): string {
  if (tonnageKg >= 1000) {
    return `${(tonnageKg / 1000).toFixed(1).replace('.', ',')} t`
  }
  return `${Math.round(tonnageKg)} kg`
}

export function formatTonnageEquivalent(
  tonnageKg: number,
): { highlight: string; comparison: string } | null {
  if (!(tonnageKg > 0)) return null
  const highlight = formatTonnageValuePt(tonnageKg)

  if (tonnageKg >= 3000) {
    const cars = Math.max(1, Math.round(tonnageKg / 1200))
    return {
      highlight,
      comparison:
        cars === 1
          ? 'Equivale a levantar ~1 carro popular inteiro no período.'
          : `Equivale a levantar ~${cars} carros populares no período.`,
    }
  }
  if (tonnageKg >= 800) {
    const pianos = Math.max(1, Math.round(tonnageKg / 400))
    return {
      highlight,
      comparison:
        pianos === 1
          ? 'Equivale a erguer ~1 piano de cauda de concerto.'
          : `Equivale a erguer ~${pianos} pianos de cauda de concerto.`,
    }
  }
  const suitcases = Math.max(1, Math.round(tonnageKg / 23))
  return {
    highlight,
    comparison: `Equivale a levantar ~${suitcases} malas de viagem despachadas (23 kg).`,
  }
}

function formatDurationHoursMinutesPt(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes} min`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export interface ComputePeriodCuriositiesInput {
  scope: CuriosityScope
  sessions: CalendarRawGymSession[]
  routineLogs: CalendarRawRoutineLog[]
  targetGymDays: number
  /** Maior carga registrada antes do início deste período por exercício, para detectar PRs inéditos. */
  priorBestWeightByExercise?: Record<string, number>
}

export function computePeriodCuriosities(input: ComputePeriodCuriositiesInput): PeriodCuriosity[] {
  const { scope, sessions, routineLogs, targetGymDays, priorBestWeightByExercise = {} } = input
  if (sessions.length === 0 && routineLogs.length === 0) {
    return []
  }

  const curiosities: PeriodCuriosity[] = []
  const periodWord = scope === 'mes' ? 'neste mês' : 'nesta semana'

  // Agregações do período
  let totalTonnageKg = 0
  let totalSets = 0
  let gymMinutes = 0
  let bestSet: { exercise: string; weight: number; reps: number; isPr: boolean } | null = null
  const byExercise = new Map<string, { sets: number; tonnageKg: number; topWeight: number }>()
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  const gymDates = new Set<string>()
  const activeDates = new Set<string>()

  for (const s of sessions) {
    const date = toDateOnly(s.date)
    gymDates.add(date)
    activeDates.add(date)
    const wd = getWeekdayIndexMondayFirst(date)
    weekdayCounts[wd] = (weekdayCounts[wd] ?? 0) + 1
    if (s.duration_s && s.duration_s > 0) {
      gymMinutes += Math.max(1, Math.round(s.duration_s / 60))
    }

    for (const ex of s.exercises ?? []) {
      if (ex.skipped) continue
      const prevEx = byExercise.get(ex.name) ?? { sets: 0, tonnageKg: 0, topWeight: 0 }
      for (const set of ex.sets ?? []) {
        const w = Number(set.weight) || 0
        const r = Number(set.reps) || 0
        totalSets += 1
        totalTonnageKg += w * r
        prevEx.sets += 1
        prevEx.tonnageKg += w * r
        if (w > prevEx.topWeight) prevEx.topWeight = w

        if (w > 0) {
          const priorBest = priorBestWeightByExercise[ex.name] ?? 0
          const isPr = priorBest > 0 && w > priorBest
          if (
            !bestSet ||
            (isPr && !bestSet.isPr) ||
            (isPr === bestSet.isPr && w > bestSet.weight)
          ) {
            bestSet = { exercise: ex.name, weight: w, reps: r, isPr }
          }
        }
      }
      byExercise.set(ex.name, prevEx)
    }
  }

  let routineMinutes = 0
  for (const r of routineLogs) {
    activeDates.add(toDateOnly(r.performed_on))
    routineMinutes += Math.max(0, Math.round(r.duration_minutes || 0))
  }

  // 1. Equivalência de tonelagem
  const eq = formatTonnageEquivalent(totalTonnageKg)
  if (eq) {
    curiosities.push({
      id: 'tonelagem-equivalente',
      scope,
      category: 'tonelagem',
      title: scope === 'mes' ? 'Volume total do mês' : 'Volume da semana',
      highlight: eq.highlight,
      description: `${eq.comparison} Foram ${totalSets} séries concluídas ${periodWord}.`,
    })
  }

  // 2. Recorde pessoal (PR) ou maior carga do período
  if (bestSet) {
    const wFormatted =
      Number.isInteger(bestSet.weight) ? `${bestSet.weight} kg` : `${formatWeightValuePt(bestSet.weight)} kg`
    curiosities.push({
      id: bestSet.isPr ? 'recorde-pessoal' : 'maior-carga-periodo',
      scope,
      category: 'forca',
      title: bestSet.isPr ? 'Novo recorde pessoal!' : 'Série mais pesada',
      highlight: `${wFormatted} × ${bestSet.reps}`,
      description: bestSet.isPr
        ? `Você bateu seu recorde em ${bestSet.exercise} ${periodWord}.`
        : `${bestSet.exercise} liderou as cargas máximas ${periodWord}.`,
    })
  }

  // 3. Hábito / Dia mais fiel (no mês) ou Meta cumprida / Dia mais intenso (na semana)
  if (scope === 'mes' && sessions.length >= 2) {
    let bestWd = 0
    let bestCount = 0
    weekdayCounts.forEach((count, idx) => {
      if (count > bestCount) {
        bestCount = count
        bestWd = idx
      }
    })
    if (bestCount >= 2) {
      const wdName = WEEKDAY_NAMES_PT[bestWd] ?? 'Segunda-feira'
      curiosities.push({
        id: 'habito-dia-fiel',
        scope,
        category: 'habito',
        title: 'Seu dia mais fiel',
        highlight: wdName.replace(/-feira$/, ''),
        description: `Você treinou em ${bestCount} ${wdName.toLowerCase()}s neste mês — seu dia mais consistente.`,
      })
    }
  } else if (scope === 'semana' && gymDates.size >= targetGymDays && targetGymDays > 0) {
    curiosities.push({
      id: 'meta-semanal-batida',
      scope,
      category: 'habito',
      title: 'Meta da semana cumprida',
      highlight: `${gymDates.size}/${targetGymDays} dias`,
      description: `Você completou 100% da frequência de academia planejada para a semana.`,
    })
  }

  // 4. Exercício dominante do período
  if (byExercise.size > 0) {
    const sortedEx = [...byExercise.entries()].sort(
      (a, b) => b[1].sets - a[1].sets || b[1].tonnageKg - a[1].tonnageKg,
    )
    const [topName, topStats] = sortedEx[0]!
    if (topStats.sets >= 2) {
      curiosities.push({
        id: 'exercicio-dominante',
        scope,
        category: 'esforco',
        title: 'Exercício mais trabalhado',
        highlight: `${topStats.sets} séries`,
        description: `${topName} foi o movimento com mais séries (${formatTonnageValuePt(topStats.tonnageKg)} acumulados).`,
      })
    }
  }

  // 5. Tempo total investido em saúde (academia + rotinas complementares)
  const totalMinutes = gymMinutes + routineMinutes
  if (totalMinutes > 0) {
    const detail =
      routineMinutes > 0 && gymMinutes > 0
        ? `Soma de ${formatDurationHoursMinutesPt(gymMinutes)} na academia e ${formatDurationHoursMinutesPt(routineMinutes)} em rotinas complementares.`
        : routineMinutes > 0
          ? `Dedicados às suas rotinas complementares em ${activeDates.size} ${activeDates.size === 1 ? 'dia ativo' : 'dias ativos'}.`
          : `Distribuídos em ${activeDates.size} ${activeDates.size === 1 ? 'dia de treino' : 'dias de treino'} ${periodWord}.`
    curiosities.push({
      id: 'tempo-investido',
      scope,
      category: 'tempo',
      title: 'Tempo investido em você',
      highlight: formatDurationHoursMinutesPt(totalMinutes),
      description: detail,
    })
  }

  return curiosities.slice(0, 5)
}

export interface BuildTrainingCalendarMonthInput {
  /** YYYY-MM */
  month: string
  /** YYYY-MM-DD (hoje no fuso local) */
  today: string
  sessions: CalendarRawGymSession[]
  routineLogs: CalendarRawRoutineLog[]
  weights: BodyWeight[]
  targetGymDays?: number
}

export function buildTrainingCalendarMonth(
  input: BuildTrainingCalendarMonthInput,
): TrainingCalendarMonthView {
  const { month, today, sessions, routineLogs, weights, targetGymDays = 4 } = input
  const bounds = buildCalendarGridBounds(month)
  const currentMonthPrefix = today.slice(0, 7)
  const canGoNext = month < currentMonthPrefix

  // Indexar por data YYYY-MM-DD
  const sessionsByDate = new Map<string, CalendarGymSessionItem[]>()
  for (const s of sessions) {
    const item = summarizeGymSessionForCalendar(s)
    const list = sessionsByDate.get(item.date) ?? []
    list.push(item)
    sessionsByDate.set(item.date, list)
  }

  const routinesByDate = new Map<string, CalendarRoutineItem[]>()
  for (const r of routineLogs) {
    const date = toDateOnly(r.performed_on)
    const item: CalendarRoutineItem = {
      id: r.id,
      category: r.category,
      date,
      durationMin: Math.max(1, Math.round(r.duration_minutes || 0)),
      modality: r.modality ?? null,
      effort: typeof r.effort === 'number' ? r.effort : null,
    }
    const list = routinesByDate.get(date) ?? []
    list.push(item)
    routinesByDate.set(date, list)
  }

  const weightByDate = new Map<string, number>()
  for (const w of weights) {
    weightByDate.set(toDateOnly(w.date), round1(w.weight_kg))
  }

  // Montar as linhas semanais da grade
  const weeks: CalendarWeekRow[] = bounds.weekStarts.map(weekStart => {
    const weekEnd = addCalendarDays(weekStart, 6)
    const days: CalendarDaySummary[] = Array.from({ length: 7 }, (_, idx) => {
      const date = addCalendarDays(weekStart, idx)
      const gymSessions = sessionsByDate.get(date) ?? []
      const routines = routinesByDate.get(date) ?? []
      return {
        date,
        dayOfMonth: Number(date.slice(8, 10)),
        weekdayIndex: idx,
        inCurrentMonth: date.slice(0, 7) === month,
        isToday: date === today,
        isFuture: date > today,
        hasGymWorkout: gymSessions.length > 0,
        hasComplementaryRoutine: routines.length > 0,
        gymSessions,
        routines,
        weightKg: weightByDate.get(date) ?? null,
      }
    })

    return {
      weekStart,
      weekEnd,
      label: formatWeekRangeLabelPt(weekStart, weekEnd, false),
      days,
    }
  })

  // Calcular recordes anteriores a cada semana e anteriores ao mês para detectar PRs
  const buildPriorBestMap = (beforeDate: string): Record<string, number> => {
    const best: Record<string, number> = {}
    for (const s of sessions) {
      if (toDateOnly(s.date) >= beforeDate) continue
      for (const ex of s.exercises ?? []) {
        if (ex.skipped) continue
        for (const set of ex.sets ?? []) {
          const w = Number(set.weight) || 0
          if (w > (best[ex.name] ?? 0)) {
            best[ex.name] = w
          }
        }
      }
    }
    return best
  }

  // Calcular WeeklyBalance e Curiosidades de cada semana (incluindo semana anterior à 1ª linha para deltas)
  let prevBalance = computeWeeklyBalance({
    weekStart: bounds.previousWeekMonday,
    sessions,
    routineLogs,
    weights,
    targetGymDays,
  })

  const weeklyBalances: Record<string, WeeklyBalance> = {}
  const weeklyCuriosities: Record<string, PeriodCuriosity[]> = {}

  for (const weekStart of bounds.weekStarts) {
    const weekEnd = addCalendarDays(weekStart, 6)
    const balance = computeWeeklyBalance({
      weekStart,
      sessions,
      routineLogs,
      weights,
      targetGymDays,
      previousWeekBalance: prevBalance,
    })
    weeklyBalances[weekStart] = balance
    prevBalance = balance

    const weekSessions = sessions.filter(s => {
      const d = toDateOnly(s.date)
      return d >= weekStart && d <= weekEnd
    })
    const weekRoutines = routineLogs.filter(r => {
      const d = toDateOnly(r.performed_on)
      return d >= weekStart && d <= weekEnd
    })
    weeklyCuriosities[weekStart] = computePeriodCuriosities({
      scope: 'semana',
      sessions: weekSessions,
      routineLogs: weekRoutines,
      targetGymDays,
      priorBestWeightByExercise: buildPriorBestMap(weekStart),
    })
  }

  // Totais e curiosidades do mês civil YYYY-MM
  const monthSessions = sessions.filter(s => toDateOnly(s.date).slice(0, 7) === month)
  const monthRoutines = routineLogs.filter(r => toDateOnly(r.performed_on).slice(0, 7) === month)

  const monthActiveDaySet = new Set<string>()
  const monthGymDaySet = new Set<string>()
  let monthTonnageKg = 0
  let monthTotalSets = 0
  let monthActiveMinutes = 0

  for (const s of monthSessions) {
    const summary = summarizeGymSessionForCalendar(s)
    monthActiveDaySet.add(summary.date)
    monthGymDaySet.add(summary.date)
    monthTonnageKg += summary.tonnageKg
    monthTotalSets += summary.sets
    if (summary.durationMin != null) monthActiveMinutes += summary.durationMin
  }
  for (const r of monthRoutines) {
    monthActiveDaySet.add(toDateOnly(r.performed_on))
    monthActiveMinutes += Math.max(0, Math.round(r.duration_minutes || 0))
  }

  const monthCuriosities = computePeriodCuriosities({
    scope: 'mes',
    sessions: monthSessions,
    routineLogs: monthRoutines,
    targetGymDays,
    priorBestWeightByExercise: buildPriorBestMap(bounds.firstDayOfMonth),
  })

  // Selecionar semana e dia padrão
  let defaultSelectedDate = bounds.lastDayOfMonth
  let defaultSelectedWeekStart = bounds.weekStarts[bounds.weekStarts.length - 1]!

  if (month === currentMonthPrefix) {
    defaultSelectedDate = today
    defaultSelectedWeekStart = getMondayOfDate(today)
  } else {
    // Último dia do mês com alguma atividade
    const activeDatesInMonth = [...monthActiveDaySet].sort()
    if (activeDatesInMonth.length > 0) {
      defaultSelectedDate = activeDatesInMonth[activeDatesInMonth.length - 1]!
      defaultSelectedWeekStart = getMondayOfDate(defaultSelectedDate)
    }
  }

  return {
    month,
    monthLabel: formatMonthLabelPt(month),
    today,
    canGoNext,
    monthTotals: {
      activeDays: monthActiveDaySet.size,
      gymDays: monthGymDaySet.size,
      complementaryCount: monthRoutines.length,
      tonnageKg: Math.round(monthTonnageKg),
      totalSets: monthTotalSets,
      activeMinutes: monthActiveMinutes,
    },
    weeks,
    weeklyBalances,
    weeklyCuriosities,
    monthCuriosities,
    defaultSelectedWeekStart,
    defaultSelectedDate,
  }
}

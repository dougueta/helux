import type { ComplementaryCategory } from './routines'

/** Faixa qualitativa do esforço médio na escala 1–10. */
export type EffortClassification = 'leve' | 'moderado' | 'forte' | 'muito-forte'

/** Resumo de uma sessão de academia dentro de um dia do calendário. */
export interface CalendarGymSessionItem {
  id: string
  date: string // YYYY-MM-DD
  /** Nome resumido (3 primeiros exercícios + "+N", mesmo padrão do histórico). */
  title: string
  sets: number
  tonnageKg: number
  durationMin: number | null
  avgEffort: number | null
}

/** Resumo de uma rotina complementar concluída dentro de um dia do calendário. */
export interface CalendarRoutineItem {
  id: string
  category: ComplementaryCategory
  date: string // YYYY-MM-DD
  durationMin: number
  modality?: string | null
  effort: number | null
}

/** Estado completo de um dia na grade do calendário (FR-002, FR-003). */
export interface CalendarDaySummary {
  /** YYYY-MM-DD */
  date: string
  /** 1–31 */
  dayOfMonth: number
  /** 0 (segunda) a 6 (domingo) */
  weekdayIndex: number
  inCurrentMonth: boolean
  isToday: boolean
  isFuture: boolean
  hasGymWorkout: boolean
  hasComplementaryRoutine: boolean
  gymSessions: CalendarGymSessionItem[]
  routines: CalendarRoutineItem[]
  weightKg: number | null
}

/** Linha semanal na grade do mês (segunda a domingo). */
export interface CalendarWeekRow {
  /** YYYY-MM-DD da segunda-feira */
  weekStart: string
  /** YYYY-MM-DD do domingo */
  weekEnd: string
  /** Rótulo curto, ex.: "16–22 nov." */
  label: string
  days: CalendarDaySummary[]
}

/** Deltas do Saldo da Semana em relação à semana imediatamente anterior (FR-006). */
export interface WeeklyBalanceDeltas {
  activeDaysDelta: number | null
  gymDaysDelta: number | null
  tonnageKgDelta: number | null
  avgEffortDelta: number | null
  avgWeightKgDelta: number | null
}

/** Cartão de Saldo da Semana para uma semana de segunda a domingo (FR-005, FR-006). */
export interface WeeklyBalance {
  weekStart: string // YYYY-MM-DD (segunda)
  weekEnd: string // YYYY-MM-DD (domingo)
  label: string // ex.: "16 a 22 de nov."
  /** Dias distintos (0–7) com treino de academia ou rotina complementar. */
  activeDays: number
  /** Dias distintos (0–7) com treino de academia. */
  gymDays: number
  /** Meta semanal de dias de academia do perfil/mesociclo (ex.: 4). */
  targetGymDays: number
  /** Total de sessões de academia concluídas na semana. */
  gymSessionsCount: number
  /** Total de rotinas complementares concluídas na semana. */
  complementaryCount: number
  /** Volume total movimentado na semana em kg. */
  tonnageKg: number
  /** Total de séries concluídas na semana. */
  totalSets: number
  /** Minutos totais em atividade (academia + rotinas complementares). */
  activeMinutes: number
  /** Esforço médio na escala 1–10 (null quando não há registro na semana). */
  avgEffort: number | null
  effortClassification: EffortClassification | null
  /** Média das pesagens registradas na semana em kg (null quando sem pesagem). */
  avgWeightKg: number | null
  /** Última pesagem da semana em kg (null quando sem pesagem). */
  latestWeightKg: number | null
  weightEntriesCount: number
  deltas: WeeklyBalanceDeltas
}

export type CuriosityScope = 'semana' | 'mes'
export type CuriosityCategory = 'tonelagem' | 'forca' | 'habito' | 'tempo' | 'esforco'

/** Cartão determinístico de curiosidade da semana ou do mês (FR-007, FR-008). */
export interface PeriodCuriosity {
  id: string
  scope: CuriosityScope
  category: CuriosityCategory
  title: string
  /** Valor curto de impacto visual (ex.: "18,4 t", "100 kg × 8", "Terça-feira", "4h 20min"). */
  highlight: string
  /** Frase comparativa/explicativa determinística. */
  description: string
}

/** Resposta consolidada do calendário para um mês `YYYY-MM`. */
export interface TrainingCalendarMonthView {
  /** YYYY-MM */
  month: string
  /** Rótulo legível, ex.: "Novembro 2026" */
  monthLabel: string
  today: string // YYYY-MM-DD
  canGoNext: boolean
  /** Resumo rápido do mês no topo da grade. */
  monthTotals: {
    activeDays: number
    gymDays: number
    complementaryCount: number
    tonnageKg: number
    totalSets: number
    activeMinutes: number
  }
  weeks: CalendarWeekRow[]
  /** Mapa `weekStart -> WeeklyBalance` para todas as semanas visíveis na grade. */
  weeklyBalances: Record<string, WeeklyBalance>
  /** Mapa `weekStart -> PeriodCuriosity[]` para cada semana visível na grade. */
  weeklyCuriosities: Record<string, PeriodCuriosity[]>
  /** Curiosidades consolidadas do mês `YYYY-MM`. */
  monthCuriosities: PeriodCuriosity[]
  /** Semana selecionada por padrão ao abrir este mês (`weekStart`). */
  defaultSelectedWeekStart: string
  /** Dia selecionado por padrão ao abrir este mês (`YYYY-MM-DD`). */
  defaultSelectedDate: string
}

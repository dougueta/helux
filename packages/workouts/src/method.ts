import { CARDIO_BANK, type CardioZone, type Goal, type MesocycleSession, type MethodPrescription, type PlannedExercise, type StressLevel, type WeekPrescription } from '@helux/types'

// Spec 024 (R5, R7): o método de treino é calculado por regras — a IA escolhe
// exercícios e distribuição dentro desta moldura, e o código confere e expande
// a semana-modelo em todas as semanas do mesociclo.

export type Level = 'iniciante' | 'intermediario' | 'avancado'

export interface MethodModifier {
  source: 'checkin' | 'ciclo' | 'condicao' | 'pausa'
  description: string
  /** Sessões de cardio a mais (ou a menos) por semana. */
  cardioSessionsDelta?: number
  /** Multiplica a faixa de séries semanais por grupo (ex.: 0.85 com cansaço alto). */
  volumeFactor?: number
}

export interface MethodInput {
  goal: Goal
  level: Level
  timeOffMonths: number
  daysAvailable: number
  /** Das condições de saúde (null = sem limite). */
  maxCardioImpact: StressLevel | null
  minRir: number | null
  cardioLikes: string[]
  cardioAvoid: string[]
  modifiers?: MethodModifier[]
}

const RETURN_MONTHS = 3
const BASE_SETS: Record<Level, [number, number]> = { iniciante: [6, 10], intermediario: [10, 16], avancado: [12, 20] }
const GOAL_VOLUME: Record<Goal, number> = { hipertrofia: 1, forca: 0.9, condicionamento: 0.7, emagrecimento: 0.7, corrida: 0.6 }
const REP_RANGES: Record<Goal, MethodPrescription['repRanges']> = {
  hipertrofia: { basicos: [6, 10], acessorios: [10, 15] },
  forca: { basicos: [3, 6], acessorios: [6, 10] },
  condicionamento: { basicos: [8, 12], acessorios: [12, 15] },
  emagrecimento: { basicos: [8, 12], acessorios: [12, 15] },
  corrida: { basicos: [8, 12], acessorios: [12, 15] },
}
const CARDIO_MINUTES: Record<Goal, number> = { emagrecimento: 30, condicionamento: 25, corrida: 25, hipertrofia: 20, forca: 20 }
const DELOAD_FACTOR = 0.55
const DELOAD_RIR = 4

const round2 = (n: number) => Math.round(n * 100) / 100

function splitsFor(strengthDays: number): string[] {
  if (strengthDays <= 2) return ['full-body']
  if (strengthDays === 3) return ['full-body', 'superior-inferior-full']
  if (strengthDays === 4) return ['superior-inferior']
  if (strengthDays === 5) return ['superior-inferior-ppl']
  return ['ppl']
}

/** Dias de força e sessões com cardio (dedicadas ou blocos) por objetivo. */
function allocate(goal: Goal, days: number): { strengthDays: number; cardioSessions: number } {
  const d = Math.max(1, Math.min(7, days))
  if (goal === 'corrida') {
    const cardio = Math.min(3, Math.max(1, d - 2))
    return { strengthDays: Math.max(1, d - cardio), cardioSessions: cardio }
  }
  if (goal === 'emagrecimento' || goal === 'condicionamento') {
    const strength = d <= 2 ? d : d === 3 ? 2 : d === 4 ? 3 : d - 2
    return { strengthDays: strength, cardioSessions: Math.max(2, d - strength) }
  }
  return { strengthDays: Math.min(d, 6), cardioSessions: 1 }
}

/** RIR alvo de uma semana de progressão (de `from` até `to`). */
function rirFor(i: number, progressionWeeks: number, from: number, to: number): number {
  if (progressionWeeks <= 1) return from
  return Math.round(from + ((to - from) * i) / (progressionWeeks - 1))
}

export function prescribeMethod(input: MethodInput): MethodPrescription {
  const returning = input.timeOffMonths >= RETURN_MONTHS
  const weeks = input.level === 'iniciante' || returning ? 4 : input.level === 'intermediario' ? 5 : 6
  const progressionWeeks = weeks - 1
  const modifiers: MethodPrescription['modifiers'] = []

  const { strengthDays, cardioSessions } = allocate(input.goal, input.daysAvailable)
  const cardioDelta = (input.modifiers ?? []).reduce((n, m) => n + (m.cardioSessionsDelta ?? 0), 0)
  const volumeFactor = (input.modifiers ?? []).reduce((n, m) => n * (m.volumeFactor ?? 1), 1)

  // Volume semanal por grupo: nível × objetivo (e ajustes de check-in/ciclo).
  const [lo, hi] = BASE_SETS[input.level]
  const factor = GOAL_VOLUME[input.goal] * volumeFactor
  const weeklySetsPerGroup = { min: Math.max(4, Math.round(lo * factor)), max: Math.max(6, Math.round(hi * factor)) }

  // Progressão: começa mais leve (retorno de pausa ainda mais) e chega a 100% antes do deload.
  const start = returning ? 0.6 : 0.8
  const hardest = input.goal === 'hipertrofia' || input.goal === 'forca' ? (input.level === 'iniciante' ? 2 : 1) : 2
  const floorRir = Math.max(input.minRir ?? 0, input.level === 'iniciante' ? 2 : 0)
  const weekly: WeekPrescription[] = []
  for (let i = 0; i < progressionWeeks; i++) {
    const setsFactor = progressionWeeks <= 1 ? 1 : round2(start + ((1 - start) * i) / (progressionWeeks - 1))
    weekly.push({ week: i + 1, setsFactor, rirTarget: Math.max(floorRir, rirFor(i, progressionWeeks, 3, hardest)), deload: false })
  }
  weekly.push({ week: weeks, setsFactor: DELOAD_FACTOR, rirTarget: Math.max(floorRir, DELOAD_RIR), deload: true })
  if (returning) modifiers.push({ source: 'pausa', description: `Retorno após ${input.timeOffMonths} meses parado: começa com ${Math.round(start * 100)}% do volume e sobe a cada semana.` })

  // Cardio: só modalidades dentro do impacto permitido e que o usuário não evita; preferidas primeiro.
  const maxImpact = (input.maxCardioImpact ?? 2) as StressLevel
  const allowed = CARDIO_BANK.filter(c => c.impact <= maxImpact && !input.cardioAvoid.includes(c.id))
    .sort((a, b) => Number(input.cardioLikes.includes(b.id)) - Number(input.cardioLikes.includes(a.id)) || a.impact - b.impact)
    .map(c => c.id)
  if (input.goal === 'corrida' && maxImpact < 2) {
    modifiers.push({ source: 'condicao', description: 'Corrida fica de fora enquanto as condições de saúde limitarem o impacto; o condicionamento é feito sem impacto e a corrida volta de forma gradual quando liberada.' })
  }
  const zone: CardioZone = returning || input.goal === 'corrida' || input.goal === 'hipertrofia' || input.goal === 'forca' ? 'leve' : 'moderada'

  for (const m of input.modifiers ?? []) modifiers.push({ source: m.source, description: m.description })

  return {
    goal: input.goal,
    weeks,
    deloadWeek: weeks,
    strengthDays,
    cardioSessions: Math.max(0, cardioSessions + cardioDelta),
    mobilitySessions: 1,
    allowedSplits: splitsFor(strengthDays),
    minFrequencyPerGroup: strengthDays >= 2 ? 2 : 1,
    weeklySetsPerGroup,
    weekly,
    repRanges: REP_RANGES[input.goal],
    cardio: { minutes: CARDIO_MINUTES[input.goal], zone, maxImpact, allowed },
    modifiers,
  }
}

const isStrength = (e: PlannedExercise) => (e.phase ?? 'principal') === 'principal' && !e.cardio && !e.region

function scaleExercise(e: PlannedExercise, week: WeekPrescription): PlannedExercise {
  if (e.cardio) {
    if (!week.deload) return e
    const minutes = Math.max(5, Math.round(e.cardio.minutes * 0.7))
    return { ...e, cardio: { ...e.cardio, minutes }, reps: `${minutes} min` }
  }
  if (!isStrength(e)) return e
  return { ...e, sets: Math.max(1, Math.round(e.sets * week.setsFactor)), rirTarget: week.rirTarget }
}

/** Semana-modelo × semanas da prescrição → sessões do mesociclo, na ordem de execução. */
export function expandWeeks(template: MesocycleSession[], method: MethodPrescription): MesocycleSession[] {
  return method.weekly.flatMap(week =>
    template.map(s => ({
      ...s,
      completedAt: null,
      week: week.week,
      kind: s.kind ?? 'forca',
      deload: week.deload,
      exercises: s.exercises.map(e => scaleExercise(e, week)),
    })),
  )
}

const WORD_NUMBERS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12 }

/** Tempo parado em meses a partir do texto livre do perfil ("8 meses", "1 ano e meio", "3 semanas"). */
export function parseTimeOffMonths(text: string | null | undefined): number {
  if (!text) return 0
  const t = text.toLowerCase()
  const num = (re: RegExp): number | null => {
    const m = t.match(re)
    if (!m) return null
    const raw = m[1]
    return /^\d+([.,]\d+)?$/.test(raw) ? Number(raw.replace(',', '.')) : (WORD_NUMBERS[raw] ?? null)
  }
  const years = num(/(\d+(?:[.,]\d+)?|\p{L}+)\s+anos?/u)
  const months = num(/(\d+(?:[.,]\d+)?|\p{L}+)\s+m[eê]s(?:es)?/u)
  const weeks = num(/(\d+(?:[.,]\d+)?|\p{L}+)\s+semanas?/u)
  const half = /e meio/.test(t) && years !== null ? 6 : 0
  return Math.floor((years ?? 0) * 12 + half + (months ?? 0) + (weeks ?? 0) / 4.3)
}

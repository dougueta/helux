import type { CheckinTrend, CycleExerciseSummary, CycleFinding, CycleSummary, ExerciseSet, MesocycleSession, PainReport, Region, SessionKind, TirednessLevel } from '@helux/types'
import { isValidSession } from './session-validity'

// Spec 024 (R11): análise do ciclo concluído em código — números reproduzíveis
// que a IA recebe prontos, em vez de interpretar o histórico cru.

export interface CycleAnalysisInput {
  mesocycleId: string
  /** Início do ciclo (YYYY-MM-DD). */
  startDate: string
  sessions: MesocycleSession[]
  workouts: Array<{ id: string; date: string; duration_s?: number | null; review_status?: string | null; exercises: ExerciseSet[] }>
  checkins: Array<{ phase: 'antes' | 'depois'; date: string; rpe?: number | null; pains: PainReport[] }>
  tiredness: TirednessLevel[]
  trend: CheckinTrend | null
}

const KINDS: SessionKind[] = ['forca', 'cardio', 'mobilidade']
const TIREDNESS_SCORE: Record<TirednessLevel, number> = { otimo: 1, normal: 2, cansado: 3, exausto: 4 }
const STALL_GAIN = 0.02
const STALL_RPE = 8
const PROGRESS_GAIN = 0.05
const LOW_ADHERENCE = 0.6
const HIGH_TIREDNESS = 3

const round1 = (n: number) => Math.round(n * 10) / 10
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const KIND_LABEL: Record<SessionKind, string> = { forca: 'força', cardio: 'cardio', mobilidade: 'mobilidade' }

/** 1RM estimado (Epley) da melhor série com carga. */
function bestE1rm(sets: ExerciseSet['sets']): number | null {
  const loaded = sets.filter(s => s.weight > 0)
  if (loaded.length === 0) return null
  return Math.max(...loaded.map(s => s.weight * (1 + s.reps / 30)))
}

function weekOf(startDate: string, date: string): number {
  const days = Math.floor((Date.parse(date) - Date.parse(startDate)) / 86_400_000)
  return Math.max(1, Math.floor(days / 7) + 1)
}

export function analyzeCycle(input: CycleAnalysisInput): CycleSummary {
  const workouts = input.workouts.filter(isValidSession).sort((a, b) => a.date.localeCompare(b.date))
  const weeks = Math.max(1, ...input.sessions.map(s => s.week ?? 0), ...workouts.map(w => weekOf(input.startDate, w.date)))

  const adherence = Object.fromEntries(
    KINDS.map(k => {
      const of = input.sessions.filter(s => (s.kind ?? 'forca') === k)
      return [k, { done: of.filter(s => s.completedAt).length, planned: of.length }]
    }),
  ) as CycleSummary['adherence']

  // Dores: por região e por exercício.
  const pains = input.checkins.flatMap(c => c.pains)
  const byRegion = new Map<Region, number>()
  for (const p of pains) byRegion.set(p.region, (byRegion.get(p.region) ?? 0) + 1)

  // Evolução por exercício (só sessões válidas, na ordem do ciclo).
  const names = [...new Set(workouts.flatMap(w => w.exercises.filter(e => !e.skipped).map(e => e.name)))]
  const exercises: CycleExerciseSummary[] = names.map(name => {
    const entries = workouts.flatMap(w => w.exercises.filter(e => e.name === name && !e.skipped && e.sets.length > 0))
    const e1rms = entries.map(e => bestE1rm(e.sets)).filter((x): x is number => x !== null)
    const rpe = avg(entries.flatMap(e => e.sets.map(s => s.effort)))
    return {
      name,
      firstE1rm: e1rms.length ? round1(e1rms[0]) : null,
      lastE1rm: e1rms.length ? round1(e1rms[e1rms.length - 1]) : null,
      avgRpe: rpe === null ? null : round1(rpe),
      painReports: pains.filter(p => p.exercise === name).length,
    }
  })

  // RPE por semana: o check-in de depois; sem ele, o esforço relatado nas séries.
  const avgRpeByWeek = Array.from({ length: weeks }, (_, i) => {
    const week = i + 1
    const fromCheckins = input.checkins.filter(c => c.phase === 'depois' && typeof c.rpe === 'number' && weekOf(input.startDate, c.date) === week).map(c => c.rpe as number)
    const fromSets = workouts.filter(w => weekOf(input.startDate, w.date) === week).flatMap(w => w.exercises.flatMap(e => e.sets.map(s => s.effort)))
    return round1(avg(fromCheckins) ?? avg(fromSets) ?? 0)
  })

  const tiredness = avg(input.tiredness.map(l => TIREDNESS_SCORE[l]))
  const tirednessAvg = tiredness === null ? null : round1(tiredness)

  const findings: CycleFinding[] = []
  for (const e of exercises) {
    if (e.firstE1rm === null || e.lastE1rm === null) continue
    const sessions = workouts.filter(w => w.exercises.some(x => x.name === e.name && x.sets.length > 0)).length
    if (sessions < 2) continue
    const gain = (e.lastE1rm - e.firstE1rm) / e.firstE1rm
    const evidence = `1RM estimado ${e.firstE1rm} → ${e.lastE1rm} kg (${gain >= 0 ? '+' : ''}${Math.round(gain * 100)}%), esforço médio ${e.avgRpe}`
    if (gain <= STALL_GAIN && (e.avgRpe ?? 0) >= STALL_RPE) findings.push({ kind: 'estagnacao', subject: e.name, evidence })
    else if (gain >= PROGRESS_GAIN) findings.push({ kind: 'progresso', subject: e.name, evidence })
  }
  for (const e of exercises) {
    if (e.painReports >= 2) findings.push({ kind: 'dor-recorrente', subject: e.name, evidence: `${e.painReports} relatos de dor neste exercício` })
  }
  const withExercise = new Set(pains.filter(p => p.exercise).map(p => p.region))
  for (const [region, count] of byRegion) {
    if (count >= 2 && !withExercise.has(region)) findings.push({ kind: 'dor-recorrente', subject: region, evidence: `${count} relatos de dor no ${region}` })
  }
  for (const k of KINDS) {
    const a = adherence[k]
    if (a.planned > 0 && a.done / a.planned < LOW_ADHERENCE) findings.push({ kind: 'baixa-aderencia', subject: k, evidence: `${a.done} de ${a.planned} sessões de ${KIND_LABEL[k]} feitas` })
  }
  if (tirednessAvg !== null && tirednessAvg >= HIGH_TIREDNESS) findings.push({ kind: 'cansaco-alto', subject: 'cansaço', evidence: `cansaço médio ${tirednessAvg} (1 = ótimo, 4 = exausto)` })

  const missingData: string[] = []
  if (!input.checkins.some(c => c.phase === 'depois')) missingData.push('check-ins de depois do treino')
  if (input.tiredness.length === 0) missingData.push('cansaço do dia')
  if (!input.trend) missingData.push('check-in corporal do mês')

  return {
    mesocycleId: input.mesocycleId,
    weeks,
    adherence,
    exercises,
    avgRpeByWeek,
    pains: [...byRegion].map(([region, count]) => ({ region, count })),
    tirednessAvg,
    checkinTrend: input.trend,
    findings,
    missingData,
  }
}

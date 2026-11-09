/**
 * Recalcula as variantes de planos existentes pela regra nova (028 R8, FR-035).
 * Transformação pura: só `variants` e `match` dos exercícios principais das sessões não concluídas mudam.
 * Sessões concluídas, o exercício planejado e os demais campos ficam como estão. A variante já ativada
 * vive no navegador e, se sair da lista, a tela a monta pelo catálogo (`offList`).
 */
import { buildVariants, NEUTRAL_GENETICS } from '@helux/ai'
import { findStrengthExercise } from '@helux/exercises'
import type { GeneticProfile, MesocycleSession, PlannedExercise } from '@helux/types'

export interface ExerciseChange {
  /** nome do exercício planejado */
  exercise: string
  /** ids que saíram da lista */
  removed: string[]
  /** ids que entraram na lista */
  added: string[]
}

export interface RefreshResult {
  sessions: MesocycleSession[]
  changes: ExerciseChange[]
}

const isMain = (e: PlannedExercise) =>
  e.phase !== 'aquecimento' && e.phase !== 'volta-calma' && !e.cardio && !e.region && !e.catalogId && !e.approachOf

/** JSON com as chaves em ordem: o jsonb do Postgres devolve os objetos com outra ordem de chaves. */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v,
  )

const sameList = (a: PlannedExercise, b: PlannedExercise) => canonical([a.variants, a.match]) === canonical([b.variants, b.match])

function refreshExercise(exercise: PlannedExercise, profile: GeneticProfile): { exercise: PlannedExercise; change?: ExerciseChange } {
  if (!isMain(exercise)) return { exercise }
  const variants = buildVariants(exercise.name, profile)
  if (variants.length === 0) return { exercise }
  const next: PlannedExercise = { ...exercise, variants, match: variants.find((v) => v.rec)?.match }
  if (sameList(exercise, next)) return { exercise }
  const before = new Set((exercise.variants ?? []).map((v) => v.id))
  const after = new Set(variants.map((v) => v.id))
  return {
    exercise: next,
    change: {
      exercise: exercise.name,
      removed: [...before].filter((id) => !after.has(id)),
      added: [...after].filter((id) => !before.has(id)),
    },
  }
}

/** Recalcula as sessões não concluídas com a genética da pessoa ou, sem ela, com o perfil neutro. */
export function refreshPlanSessions(sessions: MesocycleSession[], profile: GeneticProfile | null): RefreshResult {
  const genetics = profile ?? NEUTRAL_GENETICS
  const changes: ExerciseChange[] = []
  const next = sessions.map((session) => {
    if (session.completedAt !== null) return session
    let touched = false
    const exercises = session.exercises.map((e) => {
      const r = refreshExercise(e, genetics)
      if (r.change) {
        changes.push(r.change)
        touched = true
      }
      return r.exercise
    })
    return touched ? { ...session, exercises } : session
  })
  return { sessions: next, changes }
}

export interface RefreshSummary {
  plansRead: number
  plansChanged: number
  exercisesChanged: number
  /** por nome de exercício: quantas vezes mudou e os nomes que saíram e entraram */
  byExercise: Record<string, { count: number; removed: string[]; added: string[] }>
}

/** Resumo para o terminal: só contagens e nomes de exercícios, nunca ids de pessoa ou de plano. */
export function summarizeRefresh(plans: { result: RefreshResult }[], nameOf: (id: string) => string = (id) => findStrengthExercise(id)?.name ?? id): RefreshSummary {
  const byExercise: RefreshSummary['byExercise'] = {}
  let exercisesChanged = 0
  for (const { result } of plans) {
    for (const c of result.changes) {
      exercisesChanged++
      const row = (byExercise[c.exercise] ??= { count: 0, removed: [], added: [] })
      row.count++
      for (const id of c.removed) if (!row.removed.includes(nameOf(id))) row.removed.push(nameOf(id))
      for (const id of c.added) if (!row.added.includes(nameOf(id))) row.added.push(nameOf(id))
    }
  }
  return { plansRead: plans.length, plansChanged: plans.filter((p) => p.result.changes.length > 0).length, exercisesChanged, byExercise }
}

export type RefreshArgs = { mode: 'simulate' } | { mode: 'apply'; backupDir: string } | { mode: 'error'; message: string }

/**
 * Argumentos do script (R8): simula por padrão; `--apply` exige `--backup <dir>` fora do repositório,
 * porque o backup guarda planos de pessoas e o repositório é público.
 */
export function parseRefreshArgs(argv: string[], repoRoot: string, resolvePath: (p: string) => string): RefreshArgs {
  const apply = argv.includes('--apply')
  const i = argv.indexOf('--backup')
  const backup = i >= 0 ? argv[i + 1] : undefined
  if (!apply) return { mode: 'simulate' }
  if (!backup || backup.startsWith('--')) return { mode: 'error', message: '--apply exige --backup <dir> fora do repositório' }
  const norm = (p: string) => resolvePath(p).replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase()
  const dir = norm(backup)
  const root = norm(repoRoot)
  if (dir === root || dir.startsWith(`${root}/`)) return { mode: 'error', message: 'o backup não pode ficar dentro do repositório, que é público' }
  return { mode: 'apply', backupDir: resolvePath(backup) }
}

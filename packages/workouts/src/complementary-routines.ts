import {
  CARDIO_BANK,
  COMPLEMENTARY_CATEGORIES,
  CORE_ROUTINE_ITEMS,
  STRETCH_MOBILITY_BANK,
  type CardioZone,
  type ComplementaryCategory,
  type ComplementaryCategoryProgress,
  type ComplementaryPreferences,
  type ComplementaryRoutine,
  type ComplementaryRoutineItem,
  type ComplementaryRoutineLog,
  type Goal,
  type HardConstraints,
  type Joint,
  type MesocycleSession,
  type PlannedExercise,
  type Region,
  type StressLevel,
} from '@helux/types'
import type { Level } from './method'

export interface PrescribeComplementaryInput {
  goal: Goal
  level: Level
  constraints: HardConstraints
  conditionRegions: Region[]
  flaredRegions: Region[]
  mesocycleGroups: string[]
  preferences: ComplementaryPreferences
  cardioLikes?: string[]
  cardioAvoid?: string[]
  todayGymSession?: Pick<MesocycleSession, 'focus' | 'exercises'> | null
}

const CARDIO_DEFAULT_MINUTES: Record<Goal, number> = {
  emagrecimento: 30,
  condicionamento: 25,
  corrida: 25,
  hipertrofia: 20,
  forca: 20,
}

const CARDIO_DEFAULT_DAYS: Record<Goal, number> = {
  emagrecimento: 3,
  condicionamento: 3,
  corrida: 3,
  hipertrofia: 2,
  forca: 2,
}

const REGION_LABEL: Record<Region, string> = {
  joelho: 'joelho',
  ombro: 'ombro',
  lombar: 'lombar',
  quadril: 'quadril',
  tornozelo: 'tornozelo',
  cotovelo: 'cotovelo',
  punho: 'punho',
  sistemica: 'corpo todo',
}

function exceedsJointStress(
  stress: { joelho: StressLevel; ombro: StressLevel; lombar: StressLevel },
  constraints: HardConstraints,
  flaredRegions: Region[],
): boolean {
  const joints: Joint[] = ['joelho', 'ombro', 'lombar']
  for (const j of joints) {
    const max = constraints.maxJointStress[j] ?? 2
    if (stress[j] > max) return true
    if (flaredRegions.includes(j) && stress[j] > 0) return true
  }
  return false
}

function clampDays(days: number | undefined, fallback: number): number {
  if (typeof days !== 'number' || !Number.isFinite(days)) return fallback
  return Math.max(1, Math.min(7, Math.round(days)))
}

function stretchCountForMinutes(minutes: number): number {
  if (minutes <= 5) return 3
  if (minutes <= 10) return 5
  if (minutes <= 15) return 7
  return 9
}

function coreCountForMinutes(minutes: number): number {
  if (minutes <= 5) return 2
  if (minutes <= 10) return 3
  if (minutes <= 15) return 4
  return 5
}

/**
 * Se a sessão de academia pendente hoje trabalha membros inferiores, recomenda
 * manter o cardio complementar em intensidade leve e sem impacto (FR-015).
 */
export function checkCardioLegDayConflict(
  todayGymSession?: Pick<MesocycleSession, 'focus' | 'exercises'> | null,
): string | null {
  if (!todayGymSession) return null
  const lowerFocus = /inferior|perna|quadr[ií]ceps|posterior|gl[uú]teo/i.test(todayGymSession.focus ?? '')
  const lowerExercise = todayGymSession.exercises.some(e => {
    const phase = e.phase ?? 'principal'
    if (phase !== 'principal') return false
    const muscle = (e.muscle ?? '').toLowerCase()
    const name = e.name.toLowerCase()
    return (
      muscle === 'quadriceps' ||
      muscle === 'posterior' ||
      muscle === 'gluteo' ||
      muscle === 'panturrilha' ||
      /agachamento|leg press|extensora|flexora|stiff|levantamento terra|afundo|b[uú]lgaro|eleva[cç][aã]o p[eé]lvica/.test(name)
    )
  })
  if (!lowerFocus && !lowerExercise) return null
  return 'Hoje você tem treino de membros inferiores na academia: se fizer o cardio antes do treino, mantenha ritmo leve e sem impacto para preservar a força das pernas à noite.'
}

function prescribeStretchMobility(input: PrescribeComplementaryInput): ComplementaryRoutine {
  const pref = input.preferences['alongamento-mobilidade']
  const defaultDays = input.conditionRegions.length > 0 ? 7 : 5
  const daysPerWeek = clampDays(pref?.daysPerWeek, defaultDays)
  const estimatedMinutes = pref?.targetMinutes ? Math.max(5, Math.min(30, Math.round(pref.targetMinutes))) : 10
  const wantedCount = stretchCountForMinutes(estimatedMinutes)

  // Regiões prioritárias: foco escolhido pelo usuário + condições ativas (+ quadril/tornozelo quando há condição no joelho).
  const priorityRegions = new Set<Region>([
    ...(pref?.focusRegions ?? []),
    ...input.conditionRegions,
  ])
  if (priorityRegions.has('joelho')) {
    priorityRegions.add('quadril')
    priorityRegions.add('tornozelo')
  }

  const allowed = STRETCH_MOBILITY_BANK.filter(
    entry =>
      !exceedsJointStress(entry.stress, input.constraints, input.flaredRegions) &&
      !entry.regions.some(r => input.flaredRegions.includes(r) && (entry.stress.joelho > 0 || entry.stress.ombro > 0 || entry.stress.lombar > 0)),
  )

  const scored = allowed
    .map((entry, idx) => {
      let score = 0
      if (pref?.focusRegions?.some(r => entry.regions.includes(r))) score += 10
      if (entry.regions.some(r => priorityRegions.has(r))) score += 6
      if (entry.targetGroups.some(g => input.mesocycleGroups.includes(g))) score += 3
      return { entry, score, idx }
    })
    .sort((a, b) => b.score - a.score || a.idx - b.idx)

  const picked = scored.slice(0, wantedCount).map(({ entry }): ComplementaryRoutineItem => ({
    id: entry.id,
    name: entry.name,
    mode: entry.mode,
    sets: 1,
    seconds: entry.defaultSeconds,
    reps: entry.defaultReps,
    unilateral: entry.unilateral,
    restSeconds: 10,
    cues: entry.cues,
    motion: entry.motion,
    regions: entry.regions,
  }))

  const focusList = [...new Set([...(pref?.focusRegions ?? []), ...input.conditionRegions])].map(r => REGION_LABEL[r])
  const purpose =
    focusList.length > 0
      ? `Protege ${focusList.join(', ')}, melhora a amplitude articular e acelera a recuperação entre as sessões de força do mesociclo.`
      : 'Melhora a amplitude articular, reduz rigidez pós-treino e prepara o corpo para progredir carga com segurança na academia.'

  return {
    category: 'alongamento-mobilidade',
    title: 'Alongamento & Mobilidade',
    subtitle: `${picked.length} movimentos · ${estimatedMinutes} min`,
    purpose,
    daysPerWeek,
    estimatedMinutes,
    items: picked,
  }
}

function prescribeCoreRoutine(input: PrescribeComplementaryInput): ComplementaryRoutine {
  const pref = input.preferences['core-abdominal']
  const daysPerWeek = clampDays(pref?.daysPerWeek, 3)
  const estimatedMinutes = pref?.targetMinutes ? Math.max(5, Math.min(30, Math.round(pref.targetMinutes))) : 10
  const wantedCount = coreCountForMinutes(estimatedMinutes)

  const avoid = new Set([...input.constraints.exercisesToAvoid, ...input.constraints.blockedExercises])
  const allowed = CORE_ROUTINE_ITEMS.filter(
    entry =>
      !avoid.has(entry.id) &&
      !avoid.has(entry.name) &&
      !exceedsJointStress(entry.stress, input.constraints, input.flaredRegions),
  )

  // Equilibra anti-extensão, anti-rotação e flexão controlada mantendo ordem determinística.
  const picked = allowed.slice(0, wantedCount).map((entry): ComplementaryRoutineItem => ({
    id: entry.id,
    name: entry.name,
    mode: entry.mode,
    sets: entry.defaultSets,
    seconds: entry.defaultSeconds,
    reps: entry.defaultReps,
    unilateral: entry.unilateral,
    restSeconds: entry.restSeconds,
    cues: entry.cues,
    motion: entry.motion,
  }))

  const hasLumbarCare = (input.constraints.maxJointStress.lombar ?? 2) < 2 || input.conditionRegions.includes('lombar')
  const purpose = hasLumbarCare
    ? 'Fortalece o cinturão abdominal e estabiliza a coluna sem comprimir a lombar, dando firmeza para os exercícios compostos da academia.'
    : 'Aumenta a estabilidade do tronco e a transferência de força nos exercícios básicos da academia em uma sequência rápida sem aparelhos.'

  return {
    category: 'core-abdominal',
    title: 'Core / Abdominal',
    subtitle: `${picked.length} exercícios · ${estimatedMinutes} min`,
    purpose,
    daysPerWeek,
    estimatedMinutes,
    items: picked,
  }
}

function prescribeCardioRoutine(input: PrescribeComplementaryInput): ComplementaryRoutine {
  const pref = input.preferences.cardio
  const daysPerWeek = clampDays(pref?.daysPerWeek, CARDIO_DEFAULT_DAYS[input.goal])
  const estimatedMinutes = pref?.targetMinutes
    ? Math.max(10, Math.min(90, Math.round(pref.targetMinutes)))
    : CARDIO_DEFAULT_MINUTES[input.goal]

  const maxImpact = (input.constraints.maxCardioImpact ?? 2) as StressLevel
  const avoid = new Set(input.cardioAvoid ?? [])
  const likes = new Set(input.cardioLikes ?? [])

  const allowedEntries = CARDIO_BANK.filter(
    c =>
      c.impact <= maxImpact &&
      !avoid.has(c.id) &&
      !exceedsJointStress(c.stress, input.constraints, input.flaredRegions),
  ).sort((a, b) => Number(likes.has(b.id)) - Number(likes.has(a.id)) || a.impact - b.impact)

  const fallback = CARDIO_BANK[0]
  const chosen =
    (pref?.preferredModality ? allowedEntries.find(c => c.id === pref.preferredModality) : undefined) ??
    allowedEntries[0] ??
    fallback

  const zone: CardioZone =
    input.goal === 'hipertrofia' || input.goal === 'forca' ? 'leve' : 'moderada'

  const legDayWarning = checkCardioLegDayConflict(input.todayGymSession)

  const purpose =
    maxImpact === 0
      ? `Condicionamento aeróbico sem impacto articular (${chosen.name}), melhorando o fôlego entre séries e a recuperação sem sobrecarregar o joelho.`
      : `Eleva a capacidade aeróbica e o gasto calórico na zona ${zone}, acelerando a recuperação entre séries na academia.`

  return {
    category: 'cardio',
    title: 'Cardio Complementar',
    subtitle: `${chosen.name} · ${estimatedMinutes} min (${zone})`,
    purpose,
    daysPerWeek,
    estimatedMinutes,
    legDayWarning,
    items: [
      {
        id: chosen.id,
        name: chosen.name,
        mode: 'cardio',
        sets: 1,
        reps: `${estimatedMinutes} min`,
        restSeconds: 0,
        cues: [...chosen.cues, chosen.zoneGuidance[zone]],
        motion: chosen.motion,
        cardio: {
          modality: chosen.id,
          minutes: estimatedMinutes,
          zone,
          allowedModalities: allowedEntries.map(c => c.id),
        },
      },
    ],
  }
}

/**
 * Monta deterministicamente as 3 rotinas complementares fixas do ciclo (FR-001a, FR-005).
 */
export function prescribeComplementaryRoutines(
  input: PrescribeComplementaryInput,
): Record<ComplementaryCategory, ComplementaryRoutine> {
  return {
    'alongamento-mobilidade': prescribeStretchMobility(input),
    'core-abdominal': prescribeCoreRoutine(input),
    cardio: prescribeCardioRoutine(input),
  }
}

/** Início da semana (segunda-feira, YYYY-MM-DD) para a data de referência. */
function mondayOfWeek(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const day = dt.getUTCDay() // 0 = domingo, 1 = segunda ...
  const diffToMonday = day === 0 ? -6 : 1 - day
  dt.setUTCDate(dt.getUTCDate() + diffToMonday)
  return dt.toISOString().slice(0, 10)
}

/**
 * Calcula o progresso semanal (segunda a domingo) e o status hoje de cada categoria (FR-012).
 */
export function computeWeeklyRoutineProgress(
  logs: ComplementaryRoutineLog[],
  routines: Record<ComplementaryCategory, ComplementaryRoutine>,
  todayDate: string,
): Record<ComplementaryCategory, ComplementaryCategoryProgress> {
  const weekStart = mondayOfWeek(todayDate)
  const out = {} as Record<ComplementaryCategory, ComplementaryCategoryProgress>

  for (const category of COMPLEMENTARY_CATEGORIES) {
    const ofCategory = logs
      .filter(l => l.category === category && l.performed_on <= todayDate)
      .sort((a, b) => b.performed_on.localeCompare(a.performed_on))

    const inWeek = ofCategory.filter(l => l.performed_on >= weekStart && l.performed_on <= todayDate)
    const doneToday = ofCategory.some(l => l.performed_on === todayDate)

    out[category] = {
      category,
      doneToday,
      completedThisWeek: inWeek.length,
      targetPerWeek: routines[category]?.daysPerWeek ?? 3,
      lastPerformedOn: ofCategory[0]?.performed_on ?? null,
    }
  }

  return out
}

/** Categorias concluídas hoje (FR-014). */
export function completedComplementaryCategoriesToday(
  logs: Pick<ComplementaryRoutineLog, 'category' | 'performed_on'>[],
  todayDate: string,
): ComplementaryCategory[] {
  const set = new Set<ComplementaryCategory>()
  for (const log of logs) {
    if (log.performed_on === todayDate) set.add(log.category)
  }
  return COMPLEMENTARY_CATEGORIES.filter(c => set.has(c))
}

/**
 * Indica se um item da fase `volta-calma` (ou cardio da sessão) já foi cumprido
 * hoje numa rotina complementar (FR-014, SC-004).
 */
export function isCooldownSatisfiedByRoutines(
  exercise: Pick<PlannedExercise, 'name' | 'phase' | 'cardio' | 'region'>,
  completedToday: readonly ComplementaryCategory[],
): { satisfied: boolean; label?: string } {
  if (completedToday.length === 0) return { satisfied: false }
  const isCooldown = exercise.phase === 'volta-calma'
  const isCardioItem = Boolean(exercise.cardio) || /bike|esteira|el[ií]ptico|remo|caminhada|corrida|cardio/i.test(exercise.name)

  if (isCardioItem && (isCooldown || exercise.phase !== 'aquecimento') && completedToday.includes('cardio')) {
    return { satisfied: true, label: 'Já cumprido hoje nas Rotinas (Cardio)' }
  }
  if (isCooldown && !isCardioItem && completedToday.includes('alongamento-mobilidade')) {
    return { satisfied: true, label: 'Já cumprido hoje nas Rotinas (Alongamento)' }
  }
  return { satisfied: false }
}

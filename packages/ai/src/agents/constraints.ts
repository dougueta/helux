import type { ConstraintViolation, ExerciseAlternative, HardConstraints, MesocycleSession, PlannedExercise } from '@helux/types'
import { EXERCISE_BANK, type ExerciseBankEntry } from '../exercise-bank'

const WARMUP_MIN = 5
const EXECUTION_S_PER_SET = 40
const DEFAULT_REST_S = 90

/** Catálogo enxuto do banco para a web (spec 022): id, nome, grupo, equipamento e padrão. */
export const EXERCISE_CATALOG = EXERCISE_BANK.map(({ id, name, muscleGroup, equipment, pattern }) => ({ id, name, muscleGroup, equipment, pattern }))

const BY_NAME = new Map(EXERCISE_BANK.map(e => [e.name, e]))
const BY_ID = new Map(EXERCISE_BANK.map(e => [e.id, e]))

/** Exercício do banco pelo id ou pelo nome. */
export function findBankExercise(idOrName: string): ExerciseBankEntry | undefined {
  return BY_ID.get(idOrName) ?? BY_NAME.get(idOrName)
}

/** Aquecimento e volta à calma têm nome livre e ficam fora das regras (014). */
const isMainExercise = (e: PlannedExercise) => e.phase !== 'aquecimento' && e.phase !== 'volta-calma'

/** Lista de ids/nomes contém o exercício (pelo id ou pelo nome)? */
const listHas = (list: string[], entry: ExerciseBankEntry) => list.includes(entry.id) || list.includes(entry.name)

/** Minutos estimados: 5 de aquecimento + séries × (40 s de execução + 90 s de descanso) (R7). */
export function estimateSessionMinutes(session: Pick<MesocycleSession, 'exercises'>): number {
  const sets = session.exercises.filter(isMainExercise).reduce((n, e) => n + e.sets, 0)
  return WARMUP_MIN + Math.round((sets * (EXECUTION_S_PER_SET + DEFAULT_REST_S)) / 60)
}

/** Motivos de segurança (restrições compartilhadas ativas) que bloqueiam o exercício. */
function safetyReasons(entry: ExerciseBankEntry, c: HardConstraints): ConstraintViolation['rule'][] {
  const rules: ConstraintViolation['rule'][] = []
  if (c.blockedPatterns.includes(entry.pattern)) rules.push('padrao-bloqueado')
  if (listHas(c.blockedExercises, entry)) rules.push('exercicio-bloqueado')
  return rules
}

const MESSAGES: Record<ConstraintViolation['rule'], (name: string) => string> = {
  'fora-do-banco': n => `${n} não está no banco de exercícios`,
  evitar: n => `${n} está na lista de exercícios a evitar`,
  equipamento: n => `${n} usa equipamento indisponível`,
  duracao: () => 'duração estimada acima do máximo por sessão',
  'padrao-bloqueado': n => `${n} usa um padrão de movimento bloqueado por restrição de segurança`,
  'exercicio-bloqueado': n => `${n} está bloqueado por restrição de segurança`,
  'carga-articular': n => `${n} carrega demais uma articulação com condição de saúde registrada`,
  impacto: n => `${n} tem impacto acima do permitido pelas condições de saúde`,
  esforco: n => `${n} pede esforço acima do permitido pelas condições de saúde`,
  'metodo-frequencia': n => `${n} é treinado menos vezes por semana do que o método pede`,
  'metodo-volume': n => `${n} está com séries semanais fora da faixa do método`,
  'metodo-cardio': () => 'faltam sessões de cardio pedidas pelo método',
  'metodo-mobilidade': () => 'faltam sessões de mobilidade pedidas pelo método',
  'metodo-estrutura': () => 'número de dias de força diferente do pedido pelo método',
}

/** Violações das restrições rígidas (R7). Puro: roda depois da IA e na edição/adaptação. */
export function validatePlanAgainstConstraints(sessions: MesocycleSession[], c: HardConstraints): ConstraintViolation[] {
  const out: ConstraintViolation[] = []
  sessions.forEach((session, sessionIndex) => {
    for (const exercise of session.exercises.filter(isMainExercise)) {
      const push = (rule: ConstraintViolation['rule']) => out.push({ sessionIndex, exercise: exercise.name, rule, message: MESSAGES[rule](exercise.name) })
      const entry = findBankExercise(exercise.name)
      if (!entry) {
        push('fora-do-banco')
        continue
      }
      if (listHas(c.exercisesToAvoid, entry)) push('evitar')
      if (c.availableEquipment.length > 0 && !c.availableEquipment.includes(entry.equipment)) push('equipamento')
      safetyReasons(entry, c).forEach(push)
    }
    if (c.maxSessionMinutes !== null) {
      const minutes = estimateSessionMinutes(session)
      if (minutes > c.maxSessionMinutes) {
        out.push({ sessionIndex, exercise: null, rule: 'duracao', message: `${MESSAGES.duracao('')} (${minutes} > ${c.maxSessionMinutes} min)` })
      }
    }
  })
  return out
}

/**
 * Alternativas para trocar um exercício (FR-009a): mesmo grupo e padrão (ou só o
 * grupo, se não houver nenhuma), equipamento disponível e fora da lista a evitar.
 * Restrições de segurança não excluem: marcam `violatesSafety` com o motivo.
 */
export function compatibleAlternatives(exerciseIdOrName: string, c: HardConstraints): ExerciseAlternative[] {
  const current = findBankExercise(exerciseIdOrName)
  if (!current) return []
  const allowed = EXERCISE_BANK.filter(
    e =>
      e.id !== current.id &&
      e.muscleGroup === current.muscleGroup &&
      (c.availableEquipment.length === 0 || c.availableEquipment.includes(e.equipment)) &&
      !listHas(c.exercisesToAvoid, e),
  )
  const samePattern = allowed.filter(e => e.pattern === current.pattern)
  return (samePattern.length > 0 ? samePattern : allowed).map(e => {
    const reasons = safetyReasons(e, c)
    return {
      exerciseId: e.id,
      name: e.name,
      equipment: e.equipment,
      violatesSafety: reasons.length > 0,
      ...(reasons.length > 0 ? { reason: reasons.map(r => MESSAGES[r](e.name)).join('; ') } : {}),
    }
  })
}

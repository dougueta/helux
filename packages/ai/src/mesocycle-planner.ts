import type {
  CheckinTrend,
  ConstraintViolation,
  CycleSummary,
  MethodPrescription,
  GeneticProfile,
  HardConstraints,
  IntegratedProfile,
  LoadProgression,
  MesocyclePlan,
  MesocycleSession,
  PlanDecision,
  PlannedExercise,
  UsageRecord,
} from '@helux/types'
import type { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import { buildMesocycleRequest, buildRetryRequest, buildTrainingMethod } from './mesocycle-prompts'
import { EXERCISE_BANK, MUSCLE_GROUP_LABEL } from './exercise-bank'
import { buildVariants } from './variants'
import { allowedExercises, validatePlanAgainstConstraints } from './agents/constraints'
import { ensureFeasible } from './agents/feasibility'
import { fitPlanToMethod } from './agents/method-repair'
import { renderProfile } from './agents/render-profile'
import { buildMesocycleSchema, rawToPlanned, type RawMesocycleOutput } from './agents/mesocycle-schema'
import { validateAgainstMethod } from './agents/method-validation'
import { AGENT_MODEL, AgentRefusalError, anthropic, FALLBACK_PARAMS, messageText, usagesFromMessage } from './agents/client'

const NEUTRAL_GENETICS: GeneticProfile = { metabolismo: 'moderado', recuperacaoMuscular: 'media', riscoCardiovascular: 'baixo', predisposicao: 'misto', alertas: [] }

/** As restrições rígidas não foram atendidas nem na nova tentativa (R7). */
export class ConstraintsUnsatisfiableError extends Error {
  readonly code = 'constraints-unsatisfiable'
  constructor(
    readonly violations: ConstraintViolation[],
    readonly usages: UsageRecord[],
  ) {
    super('Não foi possível gerar um plano que respeite todas as restrições')
  }
}

/** A resposta veio cortada (`max_tokens`) em todas as tentativas (024, FR-030). */
export class IncompleteResponseError extends Error {
  readonly code = 'incomplete-response'
  constructor(readonly usages: UsageRecord[]) {
    super('A resposta da IA veio incompleta')
  }
}

export type AgentEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/** Esforço padrão da geração (024 R12): a mais cara e importante das chamadas, ~1×/ciclo. */
export const MESOCYCLE_EFFORT: AgentEffort = 'xhigh'

export interface GenerateMesocycleInput {
  profile: IntegratedProfile
  constraints: HardConstraints
  /** Prescrição de método (024 R5): moldura que a semana-modelo precisa respeitar. */
  method: MethodPrescription
  /** Condições de saúde com as regras em texto, para o prompt. */
  conditions: { label: string; rules: string[] }[]
  /** Achados do ciclo anterior (024 R11). */
  cycle?: CycleSummary
  /** Tendência dos check-ins (024 R10). */
  checkinTrend?: CheckinTrend
  /** Para as variantes por exercício (spec 010/013); sem genética, perfil neutro. */
  geneticProfile?: GeneticProfile | null
  /** Progressão de carga do mesociclo anterior (spec 014). */
  loadProgression?: LoadProgression[]
  /** Esforço do modelo; padrão `MESOCYCLE_EFFORT` (o eval varia). */
  effort?: AgentEffort
}

export interface GenerateMesocycleResult {
  /** `sessions` é a semana-modelo; a API expande as semanas com `expandWeeks`. */
  plan: Omit<MesocyclePlan, 'id'>
  decisions: PlanDecision[]
  usages: UsageRecord[]
  /** Método depois da conferência de viabilidade (R17): é o que a API expande e salva. */
  method: MethodPrescription
}

/**
 * Agente de Treino (spec 022 R7; 024 R12): semana-modelo a partir do Perfil
 * Integrado e da prescrição de método, com structured outputs, validação
 * determinística das restrições e do método e uma nova tentativa com as
 * violações. Sem conformidade → erro; o treino vigente continua (FR-024).
 *
 * R17: antes da chamada, o método é ajustado ao que tem solução e o schema só
 * aceita exercícios e cardio permitidos; depois, séries e duração são acertadas
 * por código; a nova tentativa corrige a resposta anterior em vez de refazê-la.
 */
export async function generateMesocyclePlan(input: GenerateMesocycleInput): Promise<GenerateMesocycleResult> {
  const client = anthropic()
  const usages: UsageRecord[] = []
  const system = [
    { type: 'text' as const, text: buildTrainingMethod(), cache_control: { type: 'ephemeral' as const, ttl: '1h' as const } },
    { type: 'text' as const, text: renderProfile(input.profile), cache_control: { type: 'ephemeral' as const } },
  ]

  const feasible = ensureFeasible(input.method, input.constraints)
  if (feasible.infeasible) {
    throw new ConstraintsUnsatisfiableError([{ sessionIndex: 0, exercise: null, rule: 'metodo-estrutura', message: feasible.infeasible }], usages)
  }
  const method = feasible.method
  const schema = buildMesocycleSchema({ exercises: allowedExercises(input.constraints).map(e => e.name), cardio: method.cardio.allowed })
  const request = buildMesocycleRequest({
    method,
    constraints: input.constraints,
    conditions: input.conditions,
    cycle: input.cycle,
    checkinTrend: input.checkinTrend,
    loadProgression: input.loadProgression,
  })
  // O pedido fica em cache (5 min) para a nova tentativa, que só acrescenta turnos.
  const messages: BetaMessageParam[] = [{ role: 'user', content: [{ type: 'text', text: request, cache_control: { type: 'ephemeral' } }] }]

  let violations: ConstraintViolation[] = []
  let incomplete = false
  for (let attempt = 0; attempt < 2; attempt++) {
    const message = await client.beta.messages
      .stream({
        model: AGENT_MODEL,
        max_tokens: 64000,
        ...FALLBACK_PARAMS,
        betas: [...FALLBACK_PARAMS.betas],
        output_config: { effort: input.effort ?? MESOCYCLE_EFFORT, format: { type: 'json_schema', schema } },
        system,
        messages,
      })
      .finalMessage()

    usages.push(...usagesFromMessage(message, 'mesociclo', 'treino'))
    if (message.stop_reason === 'refusal') throw new AgentRefusalError()
    // Resposta cortada: JSON incompleto, descarta e tenta de novo (FR-030).
    incomplete = message.stop_reason === 'max_tokens'
    if (incomplete) continue

    const text = messageText(message)
    const raw = JSON.parse(text) as RawMesocycleOutput
    const sessions = fitPlanToMethod(toSessions(raw, input.geneticProfile ?? NEUTRAL_GENETICS), method, input.constraints)
    violations = [...validatePlanAgainstConstraints(sessions, input.constraints), ...validateAgainstMethod(sessions, method)]
    if (violations.length === 0) {
      return {
        plan: { generatedAt: new Date().toISOString(), daysPerWeek: sessions.length, splitType: raw.splitType, rationale: raw.rationale, sessions },
        decisions: withRealSources(raw.decisions as PlanDecision[], input.profile),
        usages,
        method,
      }
    }
    // Só o texto da resposta volta: o pensamento não é necessário para corrigir.
    messages.push({ role: 'assistant', content: text }, { role: 'user', content: buildRetryRequest(violations) })
  }
  if (incomplete) throw new IncompleteResponseError(usages)
  throw new ConstraintsUnsatisfiableError(violations, usages)
}

/** Fontes de cada decisão só entre as que têm dados no Perfil Integrado (R17b): nada de citar fonte vazia. */
export function withRealSources(decisions: PlanDecision[], profile: IntegratedProfile): PlanDecision[] {
  return decisions.map(d => ({ ...d, sources: d.sources.filter(k => profile.sources[k]?.status === 'ativa') }))
}

function toSessions(raw: RawMesocycleOutput, genetics: GeneticProfile): MesocycleSession[] {
  return raw.weekTemplate.map(day => ({
    letter: day.letter,
    focus: day.focus,
    kind: day.kind,
    completedAt: null,
    exercises: day.exercises.map(e => enrichExercise(rawToPlanned(e), genetics)),
  }))
}

function attachCues(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find(entry => entry.name === exercise.name)
  if (!bankEntry) return exercise
  return { ...exercise, cues: bankEntry.cues }
}

function attachMuscleAndTempo(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find(entry => entry.name === exercise.name)
  if (!bankEntry) return exercise
  return {
    ...exercise,
    muscle: MUSCLE_GROUP_LABEL[bankEntry.muscleGroup] ?? bankEntry.muscleGroup,
    muscles: bankEntry.muscles,
    tempo: bankEntry.tempo,
  }
}

function attachVariants(exercise: PlannedExercise, geneticProfile: GeneticProfile): PlannedExercise {
  const variants = buildVariants(exercise.name, geneticProfile)
  if (variants.length === 0) return exercise
  const rec = variants.find(v => v.rec)
  return { ...exercise, variants, match: rec?.match }
}

/** Enriquece o exercício principal com cues, músculos, tempo e variantes; exportado para a adaptação de sessões. */
export function enrichExercise(exercise: PlannedExercise, geneticProfile: GeneticProfile = NEUTRAL_GENETICS): PlannedExercise {
  // Spec 014: aquecimento e volta à calma têm nome livre (fora do catálogo) —
  // não recebem cues/músculos/variantes mesmo que o nome coincida com o catálogo.
  if (exercise.phase === 'aquecimento' || exercise.phase === 'volta-calma' || exercise.cardio || exercise.region) return exercise
  return attachVariants(attachMuscleAndTempo(attachCues(exercise)), geneticProfile)
}

export type { MesocycleSession }

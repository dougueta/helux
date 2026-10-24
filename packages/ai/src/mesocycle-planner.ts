import type {
  ConstraintViolation,
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
import { buildMesocycleMethod, buildMesocycleRequest } from './mesocycle-prompts'
import { EXERCISE_BANK, MUSCLE_GROUP_LABEL } from './exercise-bank'
import { buildVariants } from './variants'
import { validatePlanAgainstConstraints } from './agents/constraints'
import { renderProfile } from './agents/render-profile'
import { MESOCYCLE_SCHEMA, type RawMesocycleOutput } from './agents/mesocycle-schema'
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
  daysPerWeek: number
  /** Para as variantes por exercício (spec 010/013); sem genética, perfil neutro. */
  geneticProfile?: GeneticProfile | null
  /** Progressão de carga do mesociclo anterior (spec 014). */
  loadProgression?: LoadProgression[]
  /** Limite de cardio das fases de aquecimento/volta à calma. */
  cardioLimit?: string
  /** Esforço do modelo; padrão `MESOCYCLE_EFFORT` (o eval varia). */
  effort?: AgentEffort
}

export interface GenerateMesocycleResult {
  plan: Omit<MesocyclePlan, 'id'>
  decisions: PlanDecision[]
  usages: UsageRecord[]
}

/**
 * Agente de Treino (spec 022, R7): mesociclo a partir do Perfil Integrado,
 * com structured output, validação determinística das restrições rígidas e
 * uma nova tentativa com as violações. Sem conformidade → erro; o treino
 * vigente continua (FR-024).
 */
export async function generateMesocyclePlan(input: GenerateMesocycleInput): Promise<GenerateMesocycleResult> {
  const client = anthropic()
  const usages: UsageRecord[] = []
  const system = [
    { type: 'text' as const, text: buildMesocycleMethod(input.cardioLimit), cache_control: { type: 'ephemeral' as const, ttl: '1h' as const } },
    { type: 'text' as const, text: renderProfile(input.profile), cache_control: { type: 'ephemeral' as const } },
  ]

  let violations: ConstraintViolation[] = []
  let incomplete = false
  for (let attempt = 0; attempt < 2; attempt++) {
    const message = await client.beta.messages
      .stream({
        model: AGENT_MODEL,
        max_tokens: 64000,
        ...FALLBACK_PARAMS,
        betas: [...FALLBACK_PARAMS.betas],
        output_config: { effort: input.effort ?? MESOCYCLE_EFFORT, format: { type: 'json_schema', schema: MESOCYCLE_SCHEMA } },
        system,
        messages: [
          {
            role: 'user',
            content: buildMesocycleRequest({ constraints: input.constraints, daysPerWeek: input.daysPerWeek, loadProgression: input.loadProgression, violations }),
          },
        ],
      })
      .finalMessage()

    usages.push(...usagesFromMessage(message, 'mesociclo', 'treino'))
    if (message.stop_reason === 'refusal') throw new AgentRefusalError()
    // Resposta cortada: JSON incompleto, descarta e tenta de novo (FR-030).
    incomplete = message.stop_reason === 'max_tokens'
    if (incomplete) continue

    const raw = JSON.parse(messageText(message)) as RawMesocycleOutput
    const sessions = toSessions(raw, input.geneticProfile ?? NEUTRAL_GENETICS)
    violations = validatePlanAgainstConstraints(sessions, input.constraints)
    if (violations.length === 0) {
      return {
        plan: { generatedAt: new Date().toISOString(), daysPerWeek: raw.daysPerWeek, splitType: raw.splitType, rationale: raw.rationale, sessions },
        decisions: raw.decisions as PlanDecision[],
        usages,
      }
    }
  }
  if (incomplete) throw new IncompleteResponseError(usages)
  throw new ConstraintsUnsatisfiableError(violations, usages)
}

function toSessions(raw: RawMesocycleOutput, genetics: GeneticProfile): MesocycleSession[] {
  return raw.sessions.map(session => ({
    letter: session.letter,
    focus: session.focus,
    completedAt: null,
    exercises: session.exercises.map(e => {
      const exercise: PlannedExercise = { name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, phase: e.phase }
      if (e.notes) exercise.notes = e.notes
      if (e.supersetGroup) exercise.supersetGroup = e.supersetGroup
      return enrichExercise(exercise, genetics)
    }),
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
  if (exercise.phase === 'aquecimento' || exercise.phase === 'volta-calma') return exercise
  return attachVariants(attachMuscleAndTempo(attachCues(exercise)), geneticProfile)
}

export type { MesocycleSession }

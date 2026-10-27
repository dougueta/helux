import { z } from 'zod'
import { CARDIO_BANK } from '@helux/ai'
import { GOALS, type Goal, type Sex, type UserTrainingProfile } from '@helux/types'

// Perfil de treino (008) + objetivo estruturado e onboarding (024): linha do banco ↔ tipo.

export interface ProfileRow {
  goal: string | null
  level: 'iniciante' | 'intermediario' | 'avancado' | null
  training_time: string | null
  time_off: string | null
  current_injury: string | null
  height_cm?: number | string | null
  birth_date?: string | null
  sex?: Sex | null
  goal_primary?: Goal | null
  goal_secondary?: Goal | null
  goal_target?: string | null
  cardio_likes?: string[] | null
  cardio_avoid?: string[] | null
  onboarding_step?: number | null
  onboarding_completed_at?: string | null
  updated_at: string
}

export function toProfile(row: ProfileRow): UserTrainingProfile {
  return {
    goal: row.goal,
    level: row.level,
    trainingTime: row.training_time,
    timeOff: row.time_off,
    currentInjury: row.current_injury,
    heightCm: row.height_cm != null ? Number(row.height_cm) : null,
    birthDate: row.birth_date ?? null,
    sex: row.sex ?? null,
    goalPrimary: row.goal_primary ?? null,
    goalSecondary: row.goal_secondary ?? null,
    goalTarget: row.goal_target ?? null,
    cardioLikes: row.cardio_likes ?? [],
    cardioAvoid: row.cardio_avoid ?? [],
    onboardingStep: row.onboarding_step ?? null,
    onboardingCompletedAt: row.onboarding_completed_at ?? null,
    updatedAt: row.updated_at,
  }
}

const cardioId = z.string().refine(id => CARDIO_BANK.some(c => c.id === id), 'modalidade fora do catálogo')

/** Campos do objetivo estruturado e das preferências de cardio (024). */
export const GoalFieldsSchema = z.object({
  goalPrimary: z.enum(GOALS).nullable().optional(),
  goalSecondary: z.enum(GOALS).nullable().optional(),
  goalTarget: z.string().max(140).nullable().optional(),
  cardioLikes: z.array(cardioId).optional(),
  cardioAvoid: z.array(cardioId).optional(),
})

type GoalFields = z.infer<typeof GoalFieldsSchema>

/** Regras entre campos: objetivos diferentes e cardio sem estar nas duas listas. */
export function goalFieldsProblem(g: GoalFields): string | null {
  if (g.goalPrimary && g.goalSecondary && g.goalPrimary === g.goalSecondary) return 'o objetivo secundário deve ser diferente do principal'
  if (g.cardioLikes && g.cardioAvoid && g.cardioLikes.some(c => g.cardioAvoid!.includes(c))) return 'a mesma modalidade está em gosto e em evitar'
  return null
}

export function goalFieldsToRow(g: GoalFields): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  if (g.goalPrimary !== undefined) fields.goal_primary = g.goalPrimary
  if (g.goalSecondary !== undefined) fields.goal_secondary = g.goalSecondary
  if (g.goalTarget !== undefined) fields.goal_target = g.goalTarget
  if (g.cardioLikes !== undefined) fields.cardio_likes = g.cardioLikes
  if (g.cardioAvoid !== undefined) fields.cardio_avoid = g.cardioAvoid
  return fields
}

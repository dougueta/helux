/**
 * O banco de exercícios de força mora em `@helux/exercises` (028).
 * Este módulo mantém as exportações que os consumidores de `@helux/ai` já usam.
 */
import { STRENGTH_EXERCISES, findStrengthExercise, type StrengthExercise } from '@helux/exercises'

export type ExerciseBankEntry = StrengthExercise
export type { Joint, StressLevel, JointStress } from '@helux/exercises'
export { MUSCLE_GROUP_LABEL, STRESS_OVERRIDES } from '@helux/exercises'

export const EXERCISE_BANK: ExerciseBankEntry[] = STRENGTH_EXERCISES

/** Exercício do banco pelo id ou pelo nome. */
export const findBankExercise: (idOrName: string) => ExerciseBankEntry | undefined = findStrengthExercise

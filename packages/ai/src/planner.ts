import Anthropic from '@anthropic-ai/sdk'
import type { PlanInput, NextWorkoutPlan, PlannedExercise, GeneticProfile } from '@helux/types'
import { buildSystemPrompt, buildUserPrompt } from './prompts'
import { EXERCISE_BANK, MUSCLE_GROUP_LABEL } from './exercise-bank'
import { buildVariants } from './variants'

export async function generateWorkoutPlan(input: PlanInput): Promise<NextWorkoutPlan> {
  const client = new Anthropic()

  const systemPrompt = buildSystemPrompt(input.geneticProfile, input.constraints)
  const userPrompt = buildUserPrompt(
    input.workoutHistory,
    input.recoveryData,
    input.userGoals,
    input.userLevel,
    input.availableDaysPerWeek,
    input.bodyCheckins,
  )

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
    stream: false,
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta da IA não contém bloco de texto')
  }

  const plan = { ...parseJsonResponse(textBlock.text), generatedAt: new Date().toISOString() }
  plan.exercises = plan.exercises.map((exercise) => enrichExercise(exercise, input.geneticProfile))

  return plan
}

function attachCues(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exercise.name)
  if (!bankEntry) return exercise
  return { ...exercise, cues: bankEntry.cues }
}

function attachMuscleAndTempo(exercise: PlannedExercise): PlannedExercise {
  const bankEntry = EXERCISE_BANK.find((entry) => entry.name === exercise.name)
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
  const rec = variants.find((v) => v.rec)
  return { ...exercise, variants, match: rec?.match }
}

function enrichExercise(exercise: PlannedExercise, geneticProfile: GeneticProfile): PlannedExercise {
  return attachVariants(attachMuscleAndTempo(attachCues(exercise)), geneticProfile)
}

function parseJsonResponse(text: string): NextWorkoutPlan {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
  const jsonStr = jsonMatch ? jsonMatch[1] : text.trim()

  try {
    return JSON.parse(jsonStr) as NextWorkoutPlan
  } catch {
    throw new Error(`Falha ao parsear resposta da IA como JSON: ${text.slice(0, 300)}`)
  }
}

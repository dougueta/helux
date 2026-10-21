import { SOURCE_KEYS } from '@helux/types'
import { EXERCISE_BANK } from '../exercise-bank'

// JSON schema do mesociclo para structured outputs (022 R7): todo objeto com
// additionalProperties: false e todos os campos obrigatórios (opcional = null).

const common = {
  sets: { type: 'integer' },
  reps: { type: 'string' },
  weight: { type: 'string' },
  notes: { type: ['string', 'null'] },
}

const mainExercise = {
  type: 'object',
  properties: {
    phase: { type: 'string', enum: ['principal'] },
    name: { type: 'string', enum: EXERCISE_BANK.map(e => e.name) },
    ...common,
    supersetGroup: { type: ['string', 'null'] },
  },
  required: ['phase', 'name', 'sets', 'reps', 'weight', 'notes', 'supersetGroup'],
  additionalProperties: false,
}

const extraExercise = {
  type: 'object',
  properties: {
    phase: { type: 'string', enum: ['aquecimento', 'volta-calma'] },
    name: { type: 'string' },
    ...common,
  },
  required: ['phase', 'name', 'sets', 'reps', 'weight', 'notes'],
  additionalProperties: false,
}

export const MESOCYCLE_SCHEMA = {
  type: 'object',
  properties: {
    daysPerWeek: { type: 'integer' },
    splitType: { type: 'string' },
    sessions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          letter: { type: 'string' },
          focus: { type: 'string' },
          exercises: { type: 'array', items: { anyOf: [mainExercise, extraExercise] } },
        },
        required: ['letter', 'focus', 'exercises'],
        additionalProperties: false,
      },
    },
    rationale: { type: 'string' },
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string', enum: ['divisao', 'volume', 'exercicio', 'descanso', 'intensidade', 'outro'] },
          choice: { type: 'string' },
          sources: { type: 'array', items: { type: 'string', enum: [...SOURCE_KEYS] } },
          reason: { type: 'string' },
        },
        required: ['topic', 'choice', 'sources', 'reason'],
        additionalProperties: false,
      },
    },
  },
  required: ['daysPerWeek', 'splitType', 'sessions', 'rationale', 'decisions'],
  additionalProperties: false,
} as const

/** Saída crua do modelo (antes do enriquecimento). */
export interface RawMesocycleOutput {
  daysPerWeek: number
  splitType: string
  sessions: {
    letter: string
    focus: string
    exercises: {
      phase: 'principal' | 'aquecimento' | 'volta-calma'
      name: string
      sets: number
      reps: string
      weight: string
      notes: string | null
      supersetGroup?: string | null
    }[]
  }[]
  rationale: string
  decisions: { topic: string; choice: string; sources: string[]; reason: string }[]
}

import { CARDIO_BANK, REGIONS, SESSION_KINDS, SOURCE_KEYS, type PlannedExercise, type Region } from '@helux/types'
import { EXERCISE_BANK } from '../exercise-bank'

// JSON schema do mesociclo para structured outputs (022 R7; 024 R7: semana-modelo
// com força, cardio e mobilidade). Todo objeto com additionalProperties: false e
// todos os campos obrigatórios (opcional = null). Structured outputs não aceitam
// minimum/maximum: faixas ficam no prompt e no validador.

/** Nomes de exercícios e ids de cardio que o pedido aceita (024 R17); sem isso, o banco inteiro. */
export interface AllowedChoices {
  exercises: string[]
  cardio: string[]
}

const ALL_CHOICES: AllowedChoices = { exercises: EXERCISE_BANK.map(e => e.name), cardio: CARDIO_BANK.map(c => c.id) }

const mainExercise = (names: string[]) => ({
  type: 'object',
  properties: {
    phase: { type: 'string', enum: ['principal'] },
    name: { type: 'string', enum: names },
    sets: { type: 'integer' },
    reps: { type: 'string' },
    weight: { type: 'string' },
    rirTarget: { type: ['integer', 'null'], description: 'Repetições na reserva alvo por série.' },
    notes: { type: ['string', 'null'], description: 'Instrução de execução para o usuário.' },
    supersetGroup: { type: ['string', 'null'] },
  },
  required: ['phase', 'name', 'sets', 'reps', 'weight', 'rirTarget', 'notes', 'supersetGroup'],
  additionalProperties: false,
})

const freeItem = {
  type: 'object',
  properties: {
    phase: { type: 'string', enum: ['aquecimento', 'volta-calma', 'mobilidade'] },
    name: { type: 'string' },
    sets: { type: 'integer' },
    reps: { type: 'string' },
    weight: { type: 'string' },
    // enum com tipo ['string', 'null'] é recusado pela API: o null vai num anyOf separado.
    region: { anyOf: [{ type: 'string', enum: [...REGIONS] }, { type: 'null' }] },
    notes: { type: ['string', 'null'] },
  },
  required: ['phase', 'name', 'sets', 'reps', 'weight', 'region', 'notes'],
  additionalProperties: false,
}

const cardioItem = (ids: string[]) => ({
  type: 'object',
  properties: {
    phase: { type: 'string', enum: ['cardio'] },
    modality: { type: 'string', enum: ids },
    minutes: { type: 'integer' },
    zone: { type: 'string', enum: ['leve', 'moderada', 'intervalado-leve'] },
    notes: { type: ['string', 'null'] },
  },
  required: ['phase', 'modality', 'minutes', 'zone', 'notes'],
  additionalProperties: false,
})

/**
 * Item de exercício: força (banco), livre (aquecimento/volta à calma/mobilidade) ou
 * cardio (catálogo). Com `allowed`, só o que as restrições permitem: um exercício
 * proibido não tem como sair da IA (024 R17). Sem cardio permitido, sem item de cardio.
 */
export function buildExerciseItemSchema(allowed: AllowedChoices = ALL_CHOICES) {
  return { anyOf: [mainExercise(allowed.exercises), freeItem, ...(allowed.cardio.length > 0 ? [cardioItem(allowed.cardio)] : [])] }
}

export const EXERCISE_ITEM_SCHEMA = buildExerciseItemSchema()

/** Schema do mesociclo, por pedido (024 R17). */
export function buildMesocycleSchema(allowed: AllowedChoices = ALL_CHOICES) {
  return {
    type: 'object',
    properties: {
      splitType: { type: 'string' },
      weekTemplate: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            letter: { type: 'string' },
            kind: { type: 'string', enum: [...SESSION_KINDS] },
            focus: { type: 'string' },
            exercises: { type: 'array', items: buildExerciseItemSchema(allowed) },
          },
          required: ['letter', 'kind', 'focus', 'exercises'],
          additionalProperties: false,
        },
      },
      rationale: { type: 'string' },
      decisions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string', enum: ['divisao', 'volume', 'exercicio', 'descanso', 'intensidade', 'condicao', 'cardio', 'mobilidade', 'ciclo', 'outro'] },
            choice: { type: 'string' },
            sources: { type: 'array', items: { type: 'string', enum: [...SOURCE_KEYS] } },
            reason: { type: 'string' },
          },
          required: ['topic', 'choice', 'sources', 'reason'],
          additionalProperties: false,
        },
      },
    },
    required: ['splitType', 'weekTemplate', 'rationale', 'decisions'],
    additionalProperties: false,
  } as const
}

export const MESOCYCLE_SCHEMA = buildMesocycleSchema()

export type RawExercise =
  | { phase: 'principal'; name: string; sets: number; reps: string; weight: string; rirTarget?: number | null; notes: string | null; supersetGroup?: string | null }
  | { phase: 'aquecimento' | 'volta-calma' | 'mobilidade'; name: string; sets: number; reps: string; weight: string; region?: Region | null; notes: string | null }
  | { phase: 'cardio'; modality: string; minutes: number; zone: string; notes: string | null }

/** Saída crua do modelo (antes do enriquecimento). */
export interface RawMesocycleOutput {
  splitType: string
  weekTemplate: { letter: string; kind: (typeof SESSION_KINDS)[number]; focus: string; exercises: RawExercise[] }[]
  rationale: string
  decisions: { topic: string; choice: string; sources: string[]; reason: string }[]
}

/** Item cru → exercício do plano (sem cues/variantes; o enriquecimento vem depois). */
export function rawToPlanned(e: RawExercise): PlannedExercise {
  if (e.phase === 'cardio') {
    const entry = CARDIO_BANK.find(c => c.id === e.modality)
    const out: PlannedExercise = { name: entry?.name ?? e.modality, sets: 1, reps: `${e.minutes} min`, weight: '—', phase: 'principal', cardio: { modality: e.modality, minutes: e.minutes, zone: e.zone } }
    if (e.notes) out.notes = e.notes
    return out
  }
  if (e.phase === 'principal') {
    const out: PlannedExercise = { name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, phase: 'principal' }
    if (e.rirTarget !== undefined && e.rirTarget !== null) out.rirTarget = e.rirTarget
    if (e.notes) out.notes = e.notes
    if (e.supersetGroup) out.supersetGroup = e.supersetGroup
    return out
  }
  const out: PlannedExercise = { name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, phase: e.phase === 'mobilidade' ? 'principal' : e.phase }
  if (e.phase === 'mobilidade' && e.region) out.region = e.region
  if (e.notes) out.notes = e.notes
  return out
}

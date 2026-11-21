import { CARDIO_BANK, SESSION_KINDS, SOURCE_KEYS, type PlannedExercise, type Region } from '@helux/types'
import { PREPARATION_ITEMS, type PreparationPhase } from '@helux/exercises'
import { EXERCISE_BANK } from '../exercise-bank'

// JSON schema do mesociclo para structured outputs (022 R7; 024 R7: semana-modelo
// com força, cardio e mobilidade). Todo objeto com additionalProperties: false e
// todos os campos obrigatórios (opcional = null). Structured outputs não aceitam
// minimum/maximum: faixas ficam no prompt e no validador.

/** Nomes de exercícios, ids de cardio e nomes de preparação que o pedido aceita (024 R17; 028); sem isso, o catálogo inteiro. */
export interface AllowedChoices {
  exercises: string[]
  cardio: string[]
  /** 028 (FR-027): itens de aquecimento, volta à calma e mobilidade, pelo nome do catálogo */
  preparation: string[]
}

const ALL_CHOICES: AllowedChoices = {
  exercises: EXERCISE_BANK.map(e => e.name),
  cardio: CARDIO_BANK.map(c => c.id),
  preparation: PREPARATION_ITEMS.map(p => p.name),
}

const PREP_BY_NAME = new Map(PREPARATION_ITEMS.map(p => [p.name, p]))
const PREP_PHASES: PreparationPhase[] = ['aquecimento', 'volta-calma', 'mobilidade']

/** Nome da série de aproximação no plano: diferente do exercício, para não entrar na progressão de carga dele. */
export const APPROACH_PREFIX = 'Série de aproximação: '

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

/** 028 (FR-027): aquecimento, volta à calma e mobilidade só com itens do catálogo daquela fase; a região vem do catálogo. */
const preparationItem = (phase: PreparationPhase, names: string[]) => ({
  type: 'object',
  properties: {
    phase: { type: 'string', enum: [phase] },
    name: { type: 'string', enum: names },
    sets: { type: 'integer' },
    reps: { type: 'string', description: 'Dose: "5 min", "10 repetições", "8 por lado" ou "30 s".' },
    weight: { type: 'string' },
    notes: { type: ['string', 'null'] },
  },
  required: ['phase', 'name', 'sets', 'reps', 'weight', 'notes'],
  additionalProperties: false,
})

/** 028 (FR-030): séries de aproximação apontam para o exercício de força e usam a demonstração dele. */
const approachItem = (names: string[]) => ({
  type: 'object',
  properties: {
    phase: { type: 'string', enum: ['aproximacao'] },
    exercise: { type: 'string', enum: names, description: 'Exercício de força do dia que recebe as séries leves.' },
    sets: { type: 'integer' },
    reps: { type: 'string' },
    weight: { type: 'string' },
    notes: { type: ['string', 'null'] },
  },
  required: ['phase', 'exercise', 'sets', 'reps', 'weight', 'notes'],
  additionalProperties: false,
})

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
 * Item de exercício: força (banco), preparação por fase (catálogo, 028), série de aproximação
 * ou cardio (catálogo). Com `allowed`, só o que as restrições permitem: um exercício proibido
 * não tem como sair da IA (024 R17). Fase sem item permitido e cardio vazio ficam de fora.
 */
export function buildExerciseItemSchema(allowed: AllowedChoices = ALL_CHOICES) {
  const allowedPrep = new Set(allowed.preparation)
  const prep = PREP_PHASES.flatMap(phase => {
    const names = PREPARATION_ITEMS.filter(p => allowedPrep.has(p.name) && p.phases.includes(phase)).map(p => p.name)
    return names.length > 0 ? [preparationItem(phase, names)] : []
  })
  return {
    anyOf: [
      mainExercise(allowed.exercises),
      ...prep,
      ...(allowed.exercises.length > 0 ? [approachItem(allowed.exercises)] : []),
      ...(allowed.cardio.length > 0 ? [cardioItem(allowed.cardio)] : []),
    ],
  }
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
  /** `region` só em respostas antigas, de nome livre; no catálogo, a região vem do item */
  | { phase: 'aquecimento' | 'volta-calma' | 'mobilidade'; name: string; sets: number; reps: string; weight: string; region?: Region | null; notes: string | null }
  | { phase: 'aproximacao'; exercise: string; sets: number; reps: string; weight: string; notes: string | null }
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
  if (e.phase === 'aproximacao') {
    const entry = EXERCISE_BANK.find(x => x.name === e.exercise)
    const out: PlannedExercise = { name: `${APPROACH_PREFIX}${e.exercise}`, sets: e.sets, reps: e.reps, weight: e.weight, phase: 'aquecimento' }
    if (entry) out.approachOf = entry.id
    if (e.notes) out.notes = e.notes
    return out
  }
  const item = PREP_BY_NAME.get(e.name)
  const out: PlannedExercise = { name: e.name, sets: e.sets, reps: e.reps, weight: e.weight, phase: e.phase === 'mobilidade' ? 'principal' : e.phase }
  const region = item ? item.regions[0] : e.region
  if (e.phase === 'mobilidade' && region) out.region = region
  if (item) out.catalogId = item.id
  if (e.notes) out.notes = e.notes
  return out
}

import { describe, it, expect } from 'vitest'
import { CARDIO_BANK, SOURCE_KEYS } from '@helux/types'
import { EXERCISE_BANK } from '../../exercise-bank'
import { PREPARATION_ITEMS } from '@helux/exercises'
import { MESOCYCLE_SCHEMA, buildExerciseItemSchema, rawToPlanned } from '../../agents/mesocycle-schema'

const prepNames = (phase: string) => PREPARATION_ITEMS.filter(p => (p.phases as string[]).includes(phase)).map(p => p.name)

type Obj = { type?: string | string[]; properties?: Record<string, Obj>; required?: string[]; additionalProperties?: boolean; items?: Obj; anyOf?: Obj[]; enum?: unknown[] }

/** Todo objeto do schema precisa de additionalProperties: false e todos os campos em required (structured outputs). */
function strictEverywhere(node: Obj, path = '$'): string[] {
  const problems: string[] = []
  if (node.type === 'object') {
    if (node.additionalProperties !== false) problems.push(`${path}: additionalProperties`)
    const keys = Object.keys(node.properties ?? {})
    if ([...keys].sort().join() !== [...(node.required ?? [])].sort().join()) problems.push(`${path}: required`)
    for (const k of keys) problems.push(...strictEverywhere(node.properties![k], `${path}.${k}`))
  }
  if (node.items) problems.push(...strictEverywhere(node.items, `${path}[]`))
  for (const [i, alt] of (node.anyOf ?? []).entries()) problems.push(...strictEverywhere(alt, `${path}|${i}`))
  return problems
}

/** Structured outputs não aceitam minimum/maximum (aprendido no eval da 024). */
function noNumericBounds(node: unknown, path = '$'): string[] {
  if (!node || typeof node !== 'object') return []
  const o = node as Record<string, unknown>
  const own = ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum'].filter(k => k in o).map(k => `${path}.${k}`)
  return [...own, ...Object.entries(o).flatMap(([k, v]) => noNumericBounds(v, `${path}.${k}`))]
}

describe('MESOCYCLE_SCHEMA (024 T073: semana-modelo)', () => {
  const schema = MESOCYCLE_SCHEMA as unknown as Obj

  it('objetos estritos em todos os níveis e sem limites numéricos', () => {
    expect(strictEverywhere(schema)).toEqual([])
    expect(noNumericBounds(schema)).toEqual([])
  })

  it('enum nunca convive com tipo múltiplo (a API recusa; aprendido no eval da 024)', () => {
    const bad: string[] = []
    const walk = (node: unknown, path: string) => {
      if (!node || typeof node !== 'object') return
      const o = node as Record<string, unknown>
      if (Array.isArray(o.enum) && Array.isArray(o.type)) bad.push(path)
      for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`)
    }
    walk(schema, '$')
    expect(bad).toEqual([])
  })

  it('topo: splitType, weekTemplate, rationale, decisions', () => {
    expect(Object.keys(schema.properties!).sort()).toEqual(['decisions', 'rationale', 'splitType', 'weekTemplate'])
  })

  it('cada dia da semana-modelo tem tipo força, cardio ou mobilidade', () => {
    const day = schema.properties!.weekTemplate.items!
    expect(day.properties!.kind.enum).toEqual(['forca', 'cardio', 'mobilidade'])
  })

  it('itens: força com nome do banco e RIR; preparação por fase do catálogo; aproximação; cardio do catálogo (028 FR-027, FR-030)', () => {
    const item = schema.properties!.weekTemplate.items!.properties!.exercises.items!
    const byPhase = Object.fromEntries(item.anyOf!.map(alt => [alt.properties!.phase.enum![0] as string, alt]))
    expect(Object.keys(byPhase).sort()).toEqual(['aproximacao', 'aquecimento', 'cardio', 'mobilidade', 'principal', 'volta-calma'])
    const main = byPhase.principal
    expect(main.properties!.name.enum).toEqual(EXERCISE_BANK.map(e => e.name))
    expect(main.properties!.rirTarget.type).toEqual(['integer', 'null'])
    for (const phase of ['aquecimento', 'volta-calma', 'mobilidade']) {
      const prep = byPhase[phase]
      // nome só do catálogo, filtrado pela fase; a região vem do catálogo, não da IA
      expect(prep.properties!.name.enum, phase).toEqual(prepNames(phase))
      expect(prep.properties!.region, phase).toBeUndefined()
    }
    const approach = byPhase.aproximacao
    expect(Object.keys(approach.properties!).sort()).toEqual(['exercise', 'notes', 'phase', 'reps', 'sets', 'weight'])
    expect(approach.properties!.exercise.enum).toEqual(EXERCISE_BANK.map(e => e.name))
    expect(byPhase.cardio.properties!.modality.enum).toEqual(CARDIO_BANK.map(c => c.id))
  })

  it('preparação e aproximação respeitam o que o pedido permite; fase sem item permitido fica de fora', () => {
    const item = buildExerciseItemSchema({ exercises: ['Leg Press 45°'], cardio: [], preparation: ['Gato-camelo', 'Bike leve'] }) as unknown as Obj
    const byPhase = Object.fromEntries(item.anyOf!.map(alt => [alt.properties!.phase.enum![0] as string, alt]))
    expect(Object.keys(byPhase).sort()).toEqual(['aproximacao', 'aquecimento', 'mobilidade', 'principal'])
    expect(byPhase.aquecimento.properties!.name.enum).toEqual(['Bike leve', 'Gato-camelo'])
    expect(byPhase.mobilidade.properties!.name.enum).toEqual(['Gato-camelo'])
    expect(byPhase.aproximacao.properties!.exercise.enum).toEqual(['Leg Press 45°'])
  })

  it('decisões com os tópicos da 024 e fontes fechadas', () => {
    const decision = schema.properties!.decisions.items!
    expect(decision.properties!.topic.enum).toEqual(['divisao', 'volume', 'exercicio', 'descanso', 'intensidade', 'condicao', 'cardio', 'mobilidade', 'ciclo', 'outro'])
    expect(decision.properties!.sources.items!.enum).toEqual([...SOURCE_KEYS])
  })
})

describe('rawToPlanned', () => {
  it('força → principal com RIR e biset', () => {
    expect(rawToPlanned({ phase: 'principal', name: 'Supino Reto (Barra)', sets: 4, reps: '8-10', weight: '60kg', rirTarget: 2, notes: 'Desça em 3 s', supersetGroup: 'b1' })).toEqual({
      name: 'Supino Reto (Barra)', sets: 4, reps: '8-10', weight: '60kg', phase: 'principal', rirTarget: 2, notes: 'Desça em 3 s', supersetGroup: 'b1',
    })
  })

  it('mobilidade do catálogo → principal com catalogId e a região do catálogo', () => {
    expect(rawToPlanned({ phase: 'mobilidade', name: 'Quadril 90/90', sets: 1, reps: '8 por lado', weight: '—', notes: null })).toEqual({
      name: 'Quadril 90/90', sets: 1, reps: '8 por lado', weight: '—', phase: 'principal', region: 'quadril', catalogId: 'quadril-90-90',
    })
  })

  it('aquecimento e volta à calma do catálogo mantêm a fase e ganham catalogId', () => {
    expect(rawToPlanned({ phase: 'aquecimento', name: 'Bike leve', sets: 1, reps: '5 min', weight: '—', notes: null })).toEqual({
      name: 'Bike leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento', catalogId: 'bike-leve',
    })
    expect(rawToPlanned({ phase: 'volta-calma', name: 'Postura da criança', sets: 1, reps: '40 s', weight: '—', notes: 'Respire fundo' })).toEqual({
      name: 'Postura da criança', sets: 1, reps: '40 s', weight: '—', phase: 'volta-calma', catalogId: 'postura-crianca', notes: 'Respire fundo',
    })
  })

  it('nome livre fora do catálogo (resposta antiga) segue como antes, sem catalogId', () => {
    expect(rawToPlanned({ phase: 'mobilidade', name: 'Mobilidade de quadril', sets: 1, reps: '10 min', weight: '—', region: 'quadril', notes: null })).toEqual({
      name: 'Mobilidade de quadril', sets: 1, reps: '10 min', weight: '—', phase: 'principal', region: 'quadril',
    })
  })

  it('aproximação → aquecimento com approachOf do exercício de força e nome próprio (FR-030)', () => {
    const leg = EXERCISE_BANK.find(e => e.name === 'Leg Press 45°')!
    expect(rawToPlanned({ phase: 'aproximacao', exercise: 'Leg Press 45°', sets: 2, reps: '10, 6', weight: '40kg, 60kg', notes: null })).toEqual({
      name: 'Série de aproximação: Leg Press 45°', sets: 2, reps: '10, 6', weight: '40kg, 60kg', phase: 'aquecimento', approachOf: leg.id,
    })
  })

  it('cardio → nome do catálogo, minutos e zona', () => {
    expect(rawToPlanned({ phase: 'cardio', modality: 'eliptico', minutes: 25, zone: 'moderada', notes: null })).toEqual({
      name: 'Elíptico', sets: 1, reps: '25 min', weight: '—', phase: 'principal', cardio: { modality: 'eliptico', minutes: 25, zone: 'moderada' },
    })
  })
})

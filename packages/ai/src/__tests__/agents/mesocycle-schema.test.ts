import { describe, it, expect } from 'vitest'
import { CARDIO_BANK, SOURCE_KEYS } from '@helux/types'
import { EXERCISE_BANK } from '../../exercise-bank'
import { MESOCYCLE_SCHEMA, rawToPlanned } from '../../agents/mesocycle-schema'

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

  it('itens: força com nome do banco e RIR; livres com região; cardio do catálogo', () => {
    const item = schema.properties!.weekTemplate.items!.properties!.exercises.items!
    const [main, free, cardio] = item.anyOf!
    expect(main.properties!.phase.enum).toEqual(['principal'])
    expect(main.properties!.name.enum).toEqual(EXERCISE_BANK.map(e => e.name))
    expect(main.properties!.rirTarget.type).toEqual(['integer', 'null'])
    expect(free.properties!.phase.enum).toEqual(['aquecimento', 'volta-calma', 'mobilidade'])
    expect(free.properties!.name.enum).toBeUndefined()
    expect(free.properties!.region.anyOf).toEqual([{ type: 'string', enum: expect.arrayContaining(['joelho', 'quadril']) }, { type: 'null' }])
    expect(cardio.properties!.phase.enum).toEqual(['cardio'])
    expect(cardio.properties!.modality.enum).toEqual(CARDIO_BANK.map(c => c.id))
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

  it('mobilidade → principal com região; aquecimento mantém a fase', () => {
    expect(rawToPlanned({ phase: 'mobilidade', name: 'Mobilidade de quadril', sets: 1, reps: '10 min', weight: '—', region: 'quadril', notes: null })).toEqual({ name: 'Mobilidade de quadril', sets: 1, reps: '10 min', weight: '—', phase: 'principal', region: 'quadril' })
    expect(rawToPlanned({ phase: 'aquecimento', name: 'Bike leve', sets: 1, reps: '5 min', weight: '—', region: null, notes: null })).toEqual({ name: 'Bike leve', sets: 1, reps: '5 min', weight: '—', phase: 'aquecimento' })
  })

  it('cardio → nome do catálogo, minutos e zona', () => {
    expect(rawToPlanned({ phase: 'cardio', modality: 'eliptico', minutes: 25, zone: 'moderada', notes: null })).toEqual({
      name: 'Elíptico', sets: 1, reps: '25 min', weight: '—', phase: 'principal', cardio: { modality: 'eliptico', minutes: 25, zone: 'moderada' },
    })
  })
})

import { describe, it, expect } from 'vitest'
import { SOURCE_KEYS } from '@helux/types'
import { EXERCISE_BANK } from '../../exercise-bank'
import { MESOCYCLE_SCHEMA } from '../../agents/mesocycle-schema'

type Obj = { type?: string; properties?: Record<string, Obj>; required?: string[]; additionalProperties?: boolean; items?: Obj; anyOf?: Obj[]; enum?: unknown[] }

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

describe('MESOCYCLE_SCHEMA (022 T012)', () => {
  const schema = MESOCYCLE_SCHEMA as unknown as Obj

  it('objetos estritos em todos os níveis', () => {
    expect(strictEverywhere(schema)).toEqual([])
  })

  it('campos do topo: daysPerWeek, splitType, sessions, rationale, decisions', () => {
    expect(Object.keys(schema.properties!).sort()).toEqual(['daysPerWeek', 'decisions', 'rationale', 'sessions', 'splitType'])
  })

  it('exercício principal com nome restrito ao banco; aquecimento e volta à calma livres', () => {
    const exercise = schema.properties!.sessions.items!.properties!.exercises.items!
    const [main, extra] = exercise.anyOf!
    expect(main.properties!.phase.enum).toEqual(['principal'])
    expect(main.properties!.name.enum).toEqual(EXERCISE_BANK.map(e => e.name))
    expect(extra.properties!.phase.enum).toEqual(['aquecimento', 'volta-calma'])
    expect(extra.properties!.name.enum).toBeUndefined()
  })

  it('decisões com tópico e fontes fechados', () => {
    const decision = schema.properties!.decisions.items!
    expect(decision.properties!.topic.enum).toEqual(['divisao', 'volume', 'exercicio', 'descanso', 'intensidade', 'outro'])
    expect(decision.properties!.sources.items!.enum).toEqual([...SOURCE_KEYS])
  })
})

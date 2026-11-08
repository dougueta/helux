import { describe, expect, it } from 'vitest'
import type { PlannedExercise, Variant } from '@helux/types'
import { createResolver, resolvePlannedItem, STRENGTH_EXERCISES } from '../index'
import type { PreparationItem } from '../types'

const base = { sets: 3, reps: '10', weight: '20 kg' }

function variant(id: string, name: string, extra: Partial<Variant> = {}): Variant {
  return { id, name, equip: 'Halteres', level: 'Intermediário', match: 80, motion: 'pullover', implement: 'dumbbell', why: '', ...extra }
}

const pullover = STRENGTH_EXERCISES.find((e) => e.id === 'pullover-halteres')!

describe('resolvePlannedItem — ordem de data-model.md', () => {
  it('1. approachOf vence tudo e marca série de aproximação', () => {
    const ex: PlannedExercise = { ...base, name: 'Supino Reto (Barra)', phase: 'aquecimento', approachOf: 'pullover-halteres' }
    const r = resolvePlannedItem(ex)
    expect(r.id).toBe('pullover-halteres')
    expect(r.isApproach).toBe(true)
  })

  it('2. variante ativa vence catalogId e nome', () => {
    const ex: PlannedExercise = {
      ...base,
      name: 'Supino Reto (Barra)',
      variants: [variant('supino-reto-barra', 'Supino Reto (Barra)', { rec: true }), variant('pullover-halteres', 'Pullover (Halteres)')],
    }
    expect(resolvePlannedItem(ex, 'pullover-halteres').id).toBe('pullover-halteres')
    expect(resolvePlannedItem(ex).id).toBe('supino-reto-barra')
  })

  it('3. catalogId vence o nome', () => {
    const ex: PlannedExercise = { ...base, name: 'Supino Reto (Barra)', catalogId: 'mesa-flexora' }
    expect(resolvePlannedItem(ex).id).toBe('mesa-flexora')
  })

  it('4. cardio.modality resolve para a modalidade', () => {
    const ex: PlannedExercise = { ...base, name: 'Qualquer coisa', cardio: { modality: 'bike', minutes: 20, zone: 'Z2' } }
    const r = resolvePlannedItem(ex)
    expect(r.id).toBe('bike')
    expect(r.kind).toBe('cardio')
  })

  it('5. nome exato em força', () => {
    expect(resolvePlannedItem({ ...base, name: 'Mesa Flexora' }).id).toBe('mesa-flexora')
  })

  it('6. nome normalizado ou knownNames da preparação', () => {
    const prep: PreparationItem = {
      id: 'gato-camelo',
      name: 'Gato-camelo',
      kind: 'preparacao',
      phases: ['aquecimento'],
      regions: ['lombar'],
      mode: 'reps',
      needs: [],
      knownNames: ['Mobilidade de coluna gato e vaca'],
    } as PreparationItem
    const resolve = createResolver({ preparation: [prep], pending: new Set() })
    expect(resolve({ ...base, name: '  GATO camelo ' }).id).toBe('gato-camelo')
    expect(resolve({ ...base, name: 'Mobilidade de coluna gato e vaca' }).id).toBe('gato-camelo')
  })

  it('7. sem correspondência: id null e indisponível, sem outra animação', () => {
    const r = resolvePlannedItem({ ...base, name: 'Exercício inventado', variants: [variant('x', 'Exercício inventado', { rec: true, motion: 'press-flat' })] })
    expect(r.id).toBeNull()
    expect(r.name).toBe('Exercício inventado')
    expect(r.demoState).toBe('indisponivel')
    expect(r.guidance).toBeNull()
  })
})

describe('resolvePlannedItem — demoState e conteúdo', () => {
  it('aprovado: nova, com orientação, músculos, cadência e equipamento do catálogo', () => {
    const r = resolvePlannedItem({ ...base, name: 'Pullover (Halteres)', muscles: { primary: ['peito'], secondary: [] } })
    expect(r.demoState).toBe('nova')
    expect(r.guidance).toEqual(pullover.guidance)
    expect(r.muscles).toEqual(pullover.muscles)
    expect(r.tempo).toBe(pullover.tempo)
    expect(r.gearLabel).toBe('Halteres')
    expect(r.isApproach).toBe(false)
  })

  it('pendente com animação salva no plano: legada, preservando o conteúdo atual', () => {
    const ex: PlannedExercise = {
      ...base,
      name: 'Supino Reto (Barra)',
      muscles: { primary: ['peito'], secondary: ['triceps'] },
      tempo: '3 · 1 · 1',
      variants: [variant('supino-reto-barra', 'Supino Reto (Barra)', { rec: true, motion: 'press-flat' })],
    }
    const r = resolvePlannedItem(ex)
    expect(r.id).toBe('supino-reto-barra')
    expect(r.demoState).toBe('legada')
    expect(r.guidance).toBeNull()
    expect(r.muscles).toEqual(ex.muscles)
    expect(r.tempo).toBe('3 · 1 · 1')
    expect(r.gearLabel).toBeNull()
  })

  it('pendente sem animação salva: indisponível', () => {
    const r = resolvePlannedItem({ ...base, name: 'Supino Reto (Barra)' })
    expect(r.id).toBe('supino-reto-barra')
    expect(r.demoState).toBe('indisponivel')
  })

  it('cardio pendente nunca cai na animação salva', () => {
    const r = resolvePlannedItem({ ...base, name: 'Bike', cardio: { modality: 'bike', minutes: 20, zone: 'Z2' } })
    expect(r.demoState).toBe('indisponivel')
  })

  it('aprovação vem da lista de pendências injetada', () => {
    const resolve = createResolver({ pending: new Set(['pullover-halteres']) })
    const ex: PlannedExercise = { ...base, name: 'Pullover (Halteres)', variants: [variant('pullover-halteres', 'Pullover (Halteres)', { rec: true })] }
    expect(resolve(ex).demoState).toBe('legada')
  })
})

describe('resolvePlannedItem — variante ativa (FR-011, FR-035)', () => {
  const planned: PlannedExercise = {
    ...base,
    name: 'Supino Reto (Barra)',
    muscles: { primary: ['peito'], secondary: [] },
    tempo: '3 · 1 · 1',
    variants: [
      variant('supino-reto-barra', 'Supino Reto (Barra)', { rec: true, motion: 'press-flat' }),
      variant('supino-reto-halteres', 'Supino Reto (Halteres)', { motion: 'press-flat' }),
    ],
  }

  it('variante pendente usa músculos e cadência da própria variante, não os do planejado', () => {
    const own = STRENGTH_EXERCISES.find((e) => e.id === 'supino-reto-halteres')!
    const r = resolvePlannedItem({ ...planned, muscles: { primary: ['quadriceps'], secondary: [] }, tempo: '9 · 9 · 9' }, 'supino-reto-halteres')
    expect(r.demoState).toBe('legada')
    expect(r.muscles).toEqual(own.muscles)
    expect(r.tempo).toBe(own.tempo)
  })

  it('variante ativa fora da lista continua valendo, sem herdar a animação de outra', () => {
    const r = resolvePlannedItem(planned, 'mesa-flexora')
    expect(r.id).toBe('mesa-flexora')
    expect(r.demoState).toBe('nova')
    const pendingOff = resolvePlannedItem(planned, 'agachamento-livre-barra')
    expect(pendingOff.id).toBe('agachamento-livre-barra')
    expect(pendingOff.demoState).toBe('indisponivel')
  })

  it('id de variante desconhecido cai no planejado', () => {
    expect(resolvePlannedItem(planned, 'gone').id).toBe('supino-reto-barra')
  })
})

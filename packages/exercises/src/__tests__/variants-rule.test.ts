import { describe, it, expect } from 'vitest'
import { STRENGTH_EXERCISES, findStrengthExercise } from '../strength'
import { isCoherentVariant } from '../variants-rule'
import type { StrengthExercise } from '../types'

const ex = (id: string): StrengthExercise => {
  const e = findStrengthExercise(id)
  if (!e) throw new Error(`${id}: não existe no banco`)
  return e
}

// T070 (FR-012, R9): mesmo padrão e ao menos um músculo principal em comum, ou o par afim
// gluteo ↔ posterior, só em dobrar-quadril.
describe('isCoherentVariant (R9)', () => {
  it('aceita item do mesmo padrão com músculo principal em comum', () => {
    expect(isCoherentVariant(ex('rosca-direta-barra'), ex('rosca-direta-halteres'))).toBe(true)
    expect(isCoherentVariant(ex('rosca-direta-barra'), ex('rosca-martelo-halteres'))).toBe(true)
  })

  it('recusa isolamento de outra função muscular na Rosca Direta', () => {
    const base = ex('rosca-direta-barra')
    for (const id of ['cadeira-extensora', 'crucifixo-halteres', 'mergulho-banco-corporal']) {
      expect(isCoherentVariant(base, ex(id)), id).toBe(false)
    }
  })

  it('recusa padrão diferente mesmo com músculo em comum', () => {
    const base = ex('rosca-direta-barra')
    const otherPattern = STRENGTH_EXERCISES.find((e) => e.pattern !== base.pattern && e.muscles.primary.includes('biceps'))
    if (otherPattern) expect(isCoherentVariant(base, otherPattern)).toBe(false)
    const pull = STRENGTH_EXERCISES.find((e) => e.pattern === 'puxar-vertical')!
    expect(isCoherentVariant(base, pull)).toBe(false)
  })

  it('aceita gluteo ↔ posterior só em dobrar-quadril', () => {
    const hinge = STRENGTH_EXERCISES.filter((e) => e.pattern === 'dobrar-quadril')
    const glute = hinge.find((e) => e.muscles.primary.includes('gluteo') && !e.muscles.primary.includes('posterior'))
    const ham = hinge.find((e) => e.muscles.primary.includes('posterior') && !e.muscles.primary.includes('gluteo'))
    expect(glute, 'dobrar-quadril sem item só de glúteo').toBeDefined()
    expect(ham, 'dobrar-quadril sem item só de posterior').toBeDefined()
    expect(isCoherentVariant(glute!, ham!)).toBe(true)
    expect(isCoherentVariant(ham!, glute!)).toBe(true)

    const iso = STRENGTH_EXERCISES.filter((e) => e.pattern === 'isolamento')
    const isoGlute = iso.find((e) => e.muscles.primary.includes('gluteo') && !e.muscles.primary.includes('posterior'))
    const isoHam = iso.find((e) => e.muscles.primary.includes('posterior') && !e.muscles.primary.includes('gluteo'))
    if (isoGlute && isoHam) expect(isCoherentVariant(isoGlute, isoHam)).toBe(false)
  })

  it('não oferece o próprio item como variante', () => {
    const e = ex('rosca-direta-barra')
    expect(isCoherentVariant(e, e)).toBe(false)
  })
})

// Invariante 7 de contracts/catalog.md (SC-003): nenhum isolamento recebe variante de outra função muscular.
describe('invariante 7 — coerência das variantes em todo o banco (SC-003)', () => {
  it('toda variante aceita de um isolamento divide um músculo principal com ele', () => {
    const offenders: string[] = []
    for (const base of STRENGTH_EXERCISES.filter((e) => e.pattern === 'isolamento')) {
      for (const c of STRENGTH_EXERCISES) {
        if (!isCoherentVariant(base, c)) continue
        if (!c.muscles.primary.some((m) => base.muscles.primary.includes(m))) offenders.push(`${base.id} → ${c.id}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('toda variante aceita tem o mesmo padrão e é simétrica', () => {
    for (const a of STRENGTH_EXERCISES) {
      for (const b of STRENGTH_EXERCISES) {
        if (!isCoherentVariant(a, b)) continue
        expect(b.pattern, `${a.id} → ${b.id}`).toBe(a.pattern)
        expect(isCoherentVariant(b, a), `${b.id} → ${a.id}`).toBe(true)
      }
    }
  })
})

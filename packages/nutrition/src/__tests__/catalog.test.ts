import { describe, it, expect } from 'vitest'
import type { FoodGroup, FoodTag } from '@helux/types'
import { FOOD_CATALOG, foodById } from '../catalog'

const GROUPS: FoodGroup[] = ['proteina', 'carboidrato', 'gordura', 'fruta-vegetal', 'bebida']
const TAGS: FoodTag[] = [
  'contem-lactose', 'zero-lactose', 'vegetal', 'rico-b6', 'fonte-calcio-nao-lactea',
  'fonte-vitamina-d', 'cafeina', 'anti-inflamatorio', 'rapida-digestao',
]
const LACTOSE_WORDS = /leite|iogurte|queijo|requeij|manteiga|whey concentrado|creme de leite/i

describe('FOOD_CATALOG (spec 018, R7)', () => {
  it('tem ids únicos e ~60–80 itens', () => {
    const ids = FOOD_CATALOG.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(FOOD_CATALOG.length).toBeGreaterThanOrEqual(55)
    expect(FOOD_CATALOG.length).toBeLessThanOrEqual(90)
  })

  it('kcal coerente com 4·P + 4·C + 9·G (até 10% ou 10 kcal de diferença — fibras)', () => {
    for (const f of FOOD_CATALOG) {
      const { kcal, proteinG, carbsG, fatG } = f.macros
      const calc = 4 * proteinG + 4 * carbsG + 9 * fatG
      expect(Math.abs(kcal - calc), f.id).toBeLessThanOrEqual(Math.max(kcal * 0.1, 10))
    }
  })

  it('porção e medida caseira preenchidas, macros não negativos', () => {
    for (const f of FOOD_CATALOG) {
      expect(f.portion.grams, f.id).toBeGreaterThan(0)
      expect(f.portion.household.length, f.id).toBeGreaterThan(0)
      expect(Object.values(f.macros).every((v) => v >= 0), f.id).toBe(true)
    }
  })

  it('todo laticínio com lactose está marcado com contem-lactose (e nenhum item tem as duas tags)', () => {
    for (const f of FOOD_CATALOG) {
      if (LACTOSE_WORDS.test(f.name) && !/zero lactose/i.test(f.name)) expect(f.tags, f.name).toContain('contem-lactose')
      expect(f.tags.includes('contem-lactose') && f.tags.includes('zero-lactose'), f.id).toBe(false)
    }
  })

  it('cada grupo tem pelo menos 6 itens sem lactose', () => {
    for (const g of GROUPS) {
      const free = FOOD_CATALOG.filter((f) => f.group === g && !f.tags.includes('contem-lactose'))
      expect(free.length, g).toBeGreaterThanOrEqual(6)
    }
  })

  it('cobre as tags que o motor prioriza pela genética', () => {
    for (const tag of ['rico-b6', 'fonte-vitamina-d', 'fonte-calcio-nao-lactea', 'rapida-digestao', 'anti-inflamatorio'] as FoodTag[]) {
      expect(FOOD_CATALOG.some((f) => f.tags.includes(tag)), tag).toBe(true)
    }
  })

  it('só usa tags conhecidas', () => {
    for (const f of FOOD_CATALOG) for (const t of f.tags) expect(TAGS, f.id).toContain(t)
  })

  it('foodById encontra pelo id', () => {
    expect(foodById(FOOD_CATALOG[0].id)).toBe(FOOD_CATALOG[0])
    expect(foodById('nao-existe')).toBeUndefined()
  })
})

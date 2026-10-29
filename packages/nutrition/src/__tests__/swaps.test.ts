import { describe, it, expect } from 'vitest'
import { buildDayPlan } from '../day'
import { foodById } from '../catalog'
import { nutritionFlags } from '../genetics-rules'
import { swapOptions } from '../swaps'

const BASE = { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }
const LACTOSE = { ...nutritionFlags([]), intoleranciaLactose: true }
const NONE = nutritionFlags([])
const plan = (flags = LACTOSE) =>
  buildDayPlan({ date: '2026-10-14', dayType: 'treino', base: BASE, weightKg: 80, flags, geneticsActive: true, tiredness: null, swaps: [] })

describe('swapOptions (FR-010)', () => {
  const p = plan()
  const lunch = p.meals.find((m) => m.slot === 'almoco')!
  const protein = lunch.items[0]

  it('até 5 alternativas do mesmo grupo, sem o próprio item nem os que já estão na refeição', () => {
    const options = swapOptions(p, lunch.id, protein.foodId, LACTOSE)
    expect(options.length).toBeGreaterThan(0)
    expect(options.length).toBeLessThanOrEqual(5)
    const group = foodById(protein.foodId)!.group
    const inMeal = new Set(lunch.items.map((i) => i.foodId))
    for (const o of options) {
      expect(o.food.group).toBe(group)
      expect(inMeal.has(o.food.id)).toBe(false)
    }
  })

  it('respeita a intolerância à lactose', () => {
    for (const meal of p.meals) for (const item of meal.items) {
      for (const o of swapOptions(p, meal.id, item.foodId, LACTOSE)) expect(o.food.tags).not.toContain('contem-lactose')
    }
  })

  it('sem intolerância, laticínios com lactose podem aparecer', () => {
    const free = plan(NONE)
    const all = free.meals.flatMap((m) => m.items.flatMap((i) => swapOptions(free, m.id, i.foodId, NONE)))
    expect(all.some((o) => o.food.tags.includes('contem-lactose'))).toBe(true)
  })

  it('porção reescalada para entregar o mesmo macro principal, e ordenadas pela menor diferença de macros', () => {
    const options = swapOptions(p, lunch.id, protein.foodId, LACTOSE)
    for (const o of options) {
      expect(o.portions * 2).toBe(Math.round(o.portions * 2))
      expect(Math.abs(o.macros.proteinG - protein.macros.proteinG)).toBeLessThanOrEqual(o.food.macros.proteinG / 2 + 0.5)
    }
    const diff = (m: { kcal: number; proteinG: number; carbsG: number; fatG: number }) =>
      Math.abs(m.kcal - protein.macros.kcal) / 10 + Math.abs(m.proteinG - protein.macros.proteinG) + Math.abs(m.carbsG - protein.macros.carbsG) + Math.abs(m.fatG - protein.macros.fatG)
    const diffs = options.map((o) => diff(o.macros))
    expect(diffs).toEqual([...diffs].sort((a, b) => a - b))
  })

  it('refeição ou alimento fora do plano → lista vazia', () => {
    expect(swapOptions(p, 'nao-existe', protein.foodId, LACTOSE)).toEqual([])
    expect(swapOptions(p, lunch.id, 'nao-existe', LACTOSE)).toEqual([])
  })

  it('a troca aplicada pelo plano usa a mesma porção da opção', () => {
    const [first] = swapOptions(p, lunch.id, protein.foodId, LACTOSE)
    const swapped = buildDayPlan({
      date: '2026-10-14', dayType: 'treino', base: BASE, weightKg: 80, flags: LACTOSE, geneticsActive: true, tiredness: null,
      swaps: [{ mealId: lunch.id, fromFoodId: protein.foodId, toFoodId: first.food.id }],
    })
    const item = swapped.meals.find((m) => m.slot === 'almoco')!.items.find((i) => i.foodId === first.food.id)!
    expect(item).toBeDefined()
    expect(Math.abs(item.portions - first.portions)).toBeLessThanOrEqual(1)
  })
})

describe('troca escolhida pelo usuário (revisão do PR #20, 026 T034)', () => {
  it('o ajuste de gordura não desfaz a troca, em nenhum dia nem refeição', () => {
    const undone: string[] = []
    for (let day = 1; day <= 28; day++) {
      const date = `2026-10-${String(day).padStart(2, '0')}`
      for (const dayType of ['treino', 'descanso'] as const) {
        for (const flags of [LACTOSE, NONE]) {
          const input = { date, dayType, base: BASE, weightKg: 80, flags, geneticsActive: true, tiredness: null }
          const p = buildDayPlan({ ...input, swaps: [] })
          for (const meal of p.meals) {
            const from = meal.items[0]
            const to = swapOptions(p, meal.id, from.foodId, flags)[0]
            if (!to) continue
            const swapped = buildDayPlan({ ...input, swaps: [{ mealId: meal.id, fromFoodId: from.foodId, toFoodId: to.food.id }] })
            const items = swapped.meals.find(m => m.id === meal.id)!.items.map(i => i.foodId)
            if (!items.includes(to.food.id)) undone.push(`${meal.id} ${dayType} ${from.foodId}→${to.food.id}`)
          }
        }
      }
    }
    expect(undone).toEqual([])
  })
})

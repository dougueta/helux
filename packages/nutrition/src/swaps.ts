import type { DayPlan, DietTargets, FoodItem } from '@helux/types'
import { FOOD_CATALOG, foodById } from './catalog'
import { groupMacro, scaledItem, swapPortions } from './day'
import type { NutritionFlags } from './genetics-rules'

// Spec 018 (FR-010) — troca rápida: alternativas do catálogo para um item do plano.

const MAX_OPTIONS = 5

export interface SwapOption {
  food: FoodItem
  portions: number
  macros: DietTargets
}

const distance = (a: DietTargets, b: DietTargets) =>
  Math.abs(a.kcal - b.kcal) / 10 + Math.abs(a.proteinG - b.proteinG) + Math.abs(a.carbsG - b.carbsG) + Math.abs(a.fatG - b.fatG)

/**
 * Até 5 alimentos do mesmo grupo, com as mesmas restrições genéticas, fora da
 * refeição, com a porção reescalada para entregar o mesmo macro principal e
 * ordenados pela menor diferença de macros.
 */
export function swapOptions(plan: DayPlan, mealId: string, foodId: string, flags: NutritionFlags): SwapOption[] {
  const meal = plan.meals.find(m => m.id === mealId)
  const item = meal?.items.find(i => i.foodId === foodId)
  const from = foodById(foodId)
  if (!meal || !item || !from) return []

  const inMeal = new Set(meal.items.map(i => i.foodId))
  const grams = item.macros[groupMacro(from)]
  return FOOD_CATALOG.filter(f => f.group === from.group && !inMeal.has(f.id) && !(flags.intoleranciaLactose && f.tags.includes('contem-lactose')))
    .map(food => {
      const portions = swapPortions(food, grams)
      return { food, portions, macros: scaledItem(food, portions).macros }
    })
    .sort((a, b) => distance(a.macros, item.macros) - distance(b.macros, item.macros))
    .slice(0, MAX_OPTIONS)
}

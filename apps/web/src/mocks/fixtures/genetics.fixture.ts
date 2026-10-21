import type { GeneticProfileView } from '@helux/types'
import { parseGeneraJson, parseGeneraNutrition, parseGeneraTraits } from '@helux/genetics'
import { classifyMarkers, nutritionFlags } from '@helux/nutrition'
import type { MockNutrition } from '../types'
import genera from './genera.fixture.json'

/** Perfil genético da tela DNA, montado como em `GET /genetic-profile` (cópia de `data/genetics/genera.json`). */
export function geneticsFixture(): GeneticProfileView {
  return { ...parseGeneraJson(genera), traits: parseGeneraTraits(genera) }
}

/** Marcadores e flags da nutrição, como em `loadNutritionGenetics` da API. */
export function nutritionGeneticsFixture(): MockNutrition['genetics'] {
  const markers = classifyMarkers(parseGeneraNutrition(genera))
  return { active: true, markers, flags: nutritionFlags(markers) }
}

export const NO_NUTRITION_GENETICS: MockNutrition['genetics'] = { active: false, markers: [], flags: nutritionFlags([]) }

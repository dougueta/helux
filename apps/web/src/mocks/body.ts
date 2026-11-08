import { daysBetween, trendAt } from '@helux/nutrition'
import type { MockDataset } from './types'
import { today } from './fixtures/clock'

/** Spec 029: peso atual = tendência de hoje, ou a última pesagem (até 35 dias) — mesma regra da API. */
export function currentWeight(d: MockDataset): number | null {
  const weights = d.bodyWeights ?? []
  const trend = trendAt(weights, today())
  if (trend != null) return trend
  const last = [...weights].sort((a, b) => b.date.localeCompare(a.date))[0]
  return last && daysBetween(last.date, today()) <= 35 ? last.weight_kg : null
}

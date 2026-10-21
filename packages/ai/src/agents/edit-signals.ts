import type { SessionEdit } from '@helux/types'

export interface PreferenceSignal {
  exercise: string
  kind: 'evitar-tendencia' | 'preferencia'
  count: number
}

const WINDOW_DAYS = 60
const MIN_COUNT = 2

/**
 * Sinais de preferência a partir das edições manuais (FR-009b, R7): exercício
 * trocado ≥ 2× nos últimos 60 dias tende a ser evitado; substituto escolhido
 * ≥ 2× vira preferência. Ordem: evitar antes de preferir, depois por nome.
 */
export function preferenceSignalsFromEdits(edits: SessionEdit[], now: Date): PreferenceSignal[] {
  const since = now.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000
  const removed = new Map<string, number>()
  const chosen = new Map<string, number>()
  for (const e of edits) {
    if (e.kind !== 'troca-exercicio' || Date.parse(e.createdAt) < since) continue
    if (e.before.exercise) removed.set(e.before.exercise, (removed.get(e.before.exercise) ?? 0) + 1)
    if (e.after.exercise) chosen.set(e.after.exercise, (chosen.get(e.after.exercise) ?? 0) + 1)
  }
  const pick = (m: Map<string, number>, kind: PreferenceSignal['kind']) =>
    [...m.entries()]
      .filter(([, count]) => count >= MIN_COUNT)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([exercise, count]) => ({ exercise, kind, count }))
  return [...pick(removed, 'evitar-tendencia'), ...pick(chosen, 'preferencia')]
}

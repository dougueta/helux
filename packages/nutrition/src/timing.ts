import type { DayPlan, Meal } from '@helux/types'

// Spec 018 (FR-004, R8) — o horário do treino é o início/fim real: antes de
// começar, pré e pós ficam relativos; depois de terminar, o pós-treino ganha
// hora no relógio.

const POST_WINDOW_MS = 60 * 60 * 1000

/** HH:MM no fuso do aparelho. */
export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function anchorMealTimes(plan: DayPlan, { startedAt, finishedAt, now }: { startedAt?: string; finishedAt?: string; now: string }): DayPlan {
  if (plan.dayType !== 'treino' || (!startedAt && !finishedAt)) return plan

  const anchor = (meal: Meal): Meal => {
    if (meal.slot === 'pre-treino') {
      return { ...meal, timing: { kind: 'relativo', label: finishedAt ? 'Antes do treino (já feito)' : 'Antes do treino (o treino já começou)' } }
    }
    if (meal.slot !== 'pos-treino') return meal
    if (!finishedAt) return { ...meal, timing: { kind: 'relativo', label: 'Até 60 min após terminar o treino' } }
    const end = Date.parse(finishedAt) + POST_WINDOW_MS
    const from = clock(finishedAt)
    const to = clock(new Date(end).toISOString())
    const t = Date.parse(now)
    return { ...meal, timing: { kind: 'relogio', label: `${from}–${to}`, from, to, highlight: t >= Date.parse(finishedAt) && t <= end } }
  }

  return { ...plan, meals: plan.meals.map(anchor) }
}

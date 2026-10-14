import { describe, it, expect } from 'vitest'
import { nutritionFlags } from '../genetics-rules'
import { dayTargets } from '../day'

const BASE = { kcal: 2180, proteinG: 176, carbsG: 225, fatG: 64 }
const NO_FLAGS = nutritionFlags([])
const LOW_CARB = { ...NO_FLAGS, lowCarbEficaz: true }
const at = (dayType: 'treino' | 'descanso', over: Partial<Parameters<typeof dayTargets>[1]> = {}) =>
  dayTargets(BASE, { dayType, weightKg: 80, flags: NO_FLAGS, tiredness: null, ...over })

describe('dayTargets (R6)', () => {
  it('treino: carboidrato × 1,15, proteína e gordura da fase, kcal pelos macros', () => {
    // C 225 × 1,15 = 258,75 → 259; kcal 4·176 + 4·259 + 9·64 = 2316 → 2320
    expect(at('treino').targets).toEqual({ kcal: 2320, proteinG: 176, carbsG: 259, fatG: 64 })
  })

  it('descanso: carboidrato × 0,80; com FTO low carb eficaz × 0,75', () => {
    expect(at('descanso').targets).toEqual({ kcal: 2000, proteinG: 176, carbsG: 180, fatG: 64 })
    // C 168,75 → 169; kcal 704 + 676 + 576 = 1956 → 1960
    expect(at('descanso', { flags: LOW_CARB }).targets).toEqual({ kcal: 1960, proteinG: 176, carbsG: 169, fatG: 64 })
  })

  it('água: 35 ml/kg + 500 ml no treino', () => {
    expect(at('treino').waterMl).toBe(3300)
    expect(at('descanso').waterMl).toBe(2800)
  })

  it('piso de 2 g/kg de carboidrato no treino', () => {
    const low = dayTargets({ ...BASE, carbsG: 100 }, { dayType: 'treino', weightKg: 80, flags: NO_FLAGS, tiredness: null })
    expect(low.targets.carbsG).toBe(160)
  })

  it('cansado: +500 ml e card de recuperação', () => {
    const d = at('treino', { tiredness: 'cansado' })
    expect(d.waterMl).toBe(3800)
    expect(d.recovery).toMatchObject({ level: 'cansado', extraWaterMl: 500 })
    expect(d.recovery!.notes.join(' ')).toMatch(/hidrata/i)
    expect(d.recovery!.notes.join(' ')).toMatch(/magnésio/i)
  })

  it('exausto: +750 ml e o descanso não corta o carboidrato', () => {
    const d = at('descanso', { tiredness: 'exausto', flags: LOW_CARB })
    expect(d.waterMl).toBe(3550)
    expect(d.targets.carbsG).toBe(225)
    expect(d.recovery).toMatchObject({ level: 'exausto', extraWaterMl: 750 })
    expect(at('treino', { tiredness: 'exausto' }).targets.carbsG).toBe(259)
  })

  it('ótimo, normal ou sem sinal: sem ajuste', () => {
    for (const tiredness of ['otimo', 'normal', null] as const) {
      const d = at('treino', { tiredness })
      expect(d.recovery).toBeNull()
      expect(d.waterMl).toBe(3300)
    }
  })
})

// ---- buildDayPlan (T021) ----
import { buildDayPlan } from '../day'
import { foodById } from '../catalog'

const DOUG_FLAGS = {
  intoleranciaLactose: true, vitaminaDBaixa: true, b6Baixa: true, densidadeOsseaBaixa: true,
  lowCarbEficaz: true, cafeinaTolerada: true, perfilPotencia: true,
}
const plan = (over: Partial<Parameters<typeof buildDayPlan>[0]> = {}) =>
  buildDayPlan({ date: '2026-10-14', dayType: 'treino', base: BASE, weightKg: 80, flags: DOUG_FLAGS, geneticsActive: true, tiredness: null, swaps: [], ...over })

const dates = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10))
const within = (actual: number, target: number, tol: number) => Math.abs(actual - target) <= target * tol

describe('buildDayPlan (R7)', () => {
  it('treino: café, almoço, pré-treino, pós-treino e jantar; descanso: café, almoço, lanche, jantar e ceia', () => {
    expect(plan().meals.map((m) => m.slot)).toEqual(['cafe', 'almoco', 'pre-treino', 'pos-treino', 'jantar'])
    expect(plan({ dayType: 'descanso' }).meals.map((m) => m.slot)).toEqual(['cafe', 'almoco', 'lanche', 'jantar', 'ceia'])
  })

  it('metas, água e tipo do dia vêm de dayTargets', () => {
    const p = plan({ tiredness: 'cansado' })
    expect(p.targets).toEqual({ kcal: 2320, proteinG: 176, carbsG: 259, fatG: 64 })
    expect(p.waterMl).toBe(3800)
    expect(p.recovery?.level).toBe('cansado')
    expect(p).toMatchObject({ date: '2026-10-14', dayType: 'treino' })
  })

  it('nunca inclui item com lactose quando há intolerância (60 dias, treino e descanso)', () => {
    for (const date of dates) {
      for (const dayType of ['treino', 'descanso'] as const) {
        for (const meal of plan({ date, dayType }).meals) {
          for (const item of meal.items) expect(foodById(item.foodId)!.tags, `${date} ${meal.slot} ${item.foodId}`).not.toContain('contem-lactose')
        }
      }
    }
  })

  it('totais do dia: kcal ±5% e cada macro ±10% das metas (60 dias, treino e descanso, com e sem genética)', () => {
    for (const date of dates) {
      for (const dayType of ['treino', 'descanso'] as const) {
        for (const flags of [DOUG_FLAGS, NO_FLAGS]) {
          const p = plan({ date, dayType, flags })
          const sum = p.meals.reduce((a, m) => ({ kcal: a.kcal + m.totals.kcal, p: a.p + m.totals.proteinG, c: a.c + m.totals.carbsG, f: a.f + m.totals.fatG }), { kcal: 0, p: 0, c: 0, f: 0 })
          const label = `${date} ${dayType}`
          expect(within(sum.kcal, p.targets.kcal, 0.05), `${label} kcal ${sum.kcal}/${p.targets.kcal}`).toBe(true)
          expect(within(sum.p, p.targets.proteinG, 0.1), `${label} P ${sum.p}/${p.targets.proteinG}`).toBe(true)
          expect(within(sum.c, p.targets.carbsG, 0.1), `${label} C ${sum.c}/${p.targets.carbsG}`).toBe(true)
          expect(within(sum.f, p.targets.fatG, 0.1), `${label} G ${sum.f}/${p.targets.fatG}`).toBe(true)
        }
      }
    }
  })

  it('porções em múltiplos de ½, entre ½ e 3 (carboidrato até 4); item zerado sai da refeição', () => {
    for (const date of dates.slice(0, 15)) {
      for (const m of plan({ date }).meals) for (const i of m.items) {
        expect(i.portions * 2, `${m.slot} ${i.foodId}`).toBe(Math.round(i.portions * 2))
        expect(i.portions).toBeGreaterThanOrEqual(0.5)
        expect(i.portions).toBeLessThanOrEqual(4)
      }
    }
  })

  it('fecha a tolerância também em ganho de massa (80 kg) e em metas pequenas (45 kg)', () => {
    const cases = [
      [{ kcal: 2990, proteinG: 144, carbsG: 417, fatG: 83 }, 80],
      [{ kcal: 1200, proteinG: 99, carbsG: 120, fatG: 36 }, 45],
    ] as const
    for (const [base, weightKg] of cases) {
      for (const date of dates.slice(0, 20)) {
        for (const dayType of ['treino', 'descanso'] as const) {
          const p = plan({ date, dayType, base, weightKg })
          const sum = p.meals.reduce((a, m) => ({ kcal: a.kcal + m.totals.kcal, f: a.f + m.totals.fatG, c: a.c + m.totals.carbsG }), { kcal: 0, f: 0, c: 0 })
          expect(within(sum.kcal, p.targets.kcal, 0.05), `${base.kcal} ${date} ${dayType} kcal`).toBe(true)
          expect(within(sum.c, p.targets.carbsG, 0.1), `${base.kcal} ${date} ${dayType} C`).toBe(true)
          expect(within(sum.f, p.targets.fatG, 0.1), `${base.kcal} ${date} ${dayType} G`).toBe(true)
        }
      }
    }
  })

  it('mesma data e entradas → mesmo plano; datas diferentes variam', () => {
    expect(plan()).toEqual(plan())
    const signatures = new Set(dates.slice(0, 7).map((date) => plan({ date }).meals.flatMap((m) => m.items.map((i) => i.foodId)).join(',')))
    expect(signatures.size).toBeGreaterThan(1)
  })

  it('com as flags do usuário, prioriza B6, vitamina D e cálcio não lácteo ao longo da semana', () => {
    const tags = new Set(dates.slice(0, 7).flatMap((date) => plan({ date }).meals.flatMap((m) => m.items.flatMap((i) => foodById(i.foodId)!.tags))))
    expect(tags).toContain('rico-b6')
    expect(tags).toContain('fonte-vitamina-d')
    expect(tags).toContain('fonte-calcio-nao-lactea')
  })

  it('badges e justificativa genética citam o marcador', () => {
    const p = plan()
    expect(p.genetics).toMatchObject({ active: true })
    expect(p.genetics.badges).toContain('Sem lactose')
    expect(p.meals.every((m) => m.geneticTags.includes('Sem lactose'))).toBe(true)
    expect(p.meals.flatMap((m) => m.rationale).join(' ')).toMatch(/MCM6/)
    const pre = p.meals.find((m) => m.slot === 'pre-treino')!
    expect(pre.timing).toEqual({ kind: 'relativo', label: '60–90 min antes de treinar' })
    expect(pre.rationale.join(' ')).toMatch(/FTO/)
  })

  it('sem genética: sem filtros genéticos nem badges', () => {
    const p = plan({ flags: NO_FLAGS, geneticsActive: false })
    expect(p.genetics).toEqual({ active: false, badges: [] })
    expect(p.meals.every((m) => m.geneticTags.length === 0)).toBe(true)
  })

  it('aplica trocas: o item vira o alimento escolhido, com porção reescalada', () => {
    const base = plan()
    const meal = base.meals[1]
    const item = meal.items[0]
    const p = plan({ swaps: [{ mealId: meal.id, fromFoodId: item.foodId, toFoodId: 'tilapia' === item.foodId ? 'frango-peito' : 'tilapia' }] })
    const swapped = p.meals[1].items[0]
    expect(swapped.foodId).not.toBe(item.foodId)
    expect(Math.abs(swapped.macros.proteinG - item.macros.proteinG)).toBeLessThanOrEqual(15)
  })
})

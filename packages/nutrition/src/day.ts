import type {
  DayPlan,
  DayType,
  DietTargets,
  FoodItem,
  FoodTag,
  Meal,
  MealItem,
  MealSlot,
  MealSwap,
  RecoveryAdjustment,
  TirednessLevel,
} from '@helux/types'
import type { NutritionFlags } from './genetics-rules'
import { foodById } from './catalog'

// Spec 018 (R6, R7) — o dia derivado da fase: periodização do carboidrato,
// hidratação, ajuste por cansaço (Spec 011) e refeições montadas do catálogo.

const TRAINING_CARBS = 1.15
const REST_CARBS = 0.8
const REST_CARBS_LOW_CARB = 0.75
const TRAINING_CARBS_MIN_PER_KG = 2
const WATER_ML_PER_KG = 35
const TRAINING_EXTRA_WATER_ML = 500

const RECOVERY: Record<'cansado' | 'exausto', { extraWaterMl: number; notes: string[] }> = {
  cansado: {
    extraWaterMl: 500,
    notes: [
      'Reforce a hidratação ao longo do dia (água e, no treino, eletrólitos).',
      'Priorize magnésio e vitamina B6: folhas verdes, castanhas, banana e grão-de-bico.',
      'Inclua fontes anti-inflamatórias: peixes gordos, azeite e frutas vermelhas.',
    ],
  },
  exausto: {
    extraWaterMl: 750,
    notes: [
      'Hoje não é dia de déficit: o carboidrato fica no valor da fase para ajudar a recuperação.',
      'Reforce a hidratação com eletrólitos (água de coco ajuda).',
      'Priorize magnésio e vitamina B6: folhas verdes, castanhas, banana e grão-de-bico.',
      'Inclua fontes anti-inflamatórias: peixes gordos, azeite e frutas vermelhas.',
    ],
  },
}

const roundTo10 = (n: number) => Math.round(n / 10) * 10

export interface DayTargets {
  targets: DietTargets
  waterMl: number
  recovery: RecoveryAdjustment | null
}

/** Metas do dia a partir das metas-base da fase (FR-002, FR-003, FR-011). */
export function dayTargets(
  base: DietTargets,
  { dayType, weightKg, flags, tiredness }: { dayType: DayType; weightKg: number; flags: NutritionFlags; tiredness: TirednessLevel | null },
): DayTargets {
  const exhausted = tiredness === 'exausto'
  let carbsG: number
  if (dayType === 'treino') {
    carbsG = Math.max(Math.round(base.carbsG * TRAINING_CARBS), Math.round(TRAINING_CARBS_MIN_PER_KG * weightKg))
  } else {
    carbsG = exhausted ? base.carbsG : Math.round(base.carbsG * (flags.lowCarbEficaz ? REST_CARBS_LOW_CARB : REST_CARBS))
  }
  const targets: DietTargets = {
    kcal: roundTo10(4 * base.proteinG + 4 * carbsG + 9 * base.fatG),
    proteinG: base.proteinG,
    carbsG,
    fatG: base.fatG,
  }

  const level = tiredness === 'cansado' || tiredness === 'exausto' ? tiredness : null
  const recovery: RecoveryAdjustment | null = level ? { level, ...RECOVERY[level] } : null
  const waterMl =
    Math.round(WATER_ML_PER_KG * weightKg) + (dayType === 'treino' ? TRAINING_EXTRA_WATER_ML : 0) + (recovery?.extraWaterMl ?? 0)

  return { targets, waterMl, recovery }
}

// ---- montagem das refeições (R7, FR-002a, FR-005) ----

export type Role = 'protein' | 'carb' | 'fat' | 'fixed'

interface Position {
  role: Role
  /** Ids do catálogo elegíveis para a posição. */
  pool: string[]
  /** Pode sair da refeição (0 porção) quando as metas já estão cobertas. */
  optional?: boolean
}

const POOLS = {
  breakfastProtein: ['ovo', 'iogurte-zero', 'whey-isolado', 'peito-peru', 'tofu', 'iogurte-integral', 'queijo-minas'],
  breakfastCarb: ['pao-integral', 'pao-frances', 'aveia', 'tapioca', 'cuscuz'],
  fruit: ['banana', 'mamao', 'maca', 'laranja', 'morango'],
  mainProtein: ['frango-peito', 'patinho', 'salmao', 'tilapia', 'lombo-suino', 'sardinha', 'atum', 'tofu'],
  mainCarb: ['arroz-branco', 'arroz-integral', 'batata-doce', 'batata', 'mandioca', 'macarrao'],
  legume: ['feijao', 'lentilha', 'grao-de-bico'],
  vegetable: ['brocolis', 'couve', 'folhas', 'tomate', 'cenoura', 'abobora', 'espinafre'],
  cookingFat: ['azeite', 'abacate'],
  quickCarb: ['banana', 'tapioca', 'pao-frances', 'batata-doce'],
  quickProtein: ['whey-isolado', 'proteina-ervilha', 'iogurte-zero', 'whey-concentrado'],
  postCarb: ['arroz-branco', 'tapioca', 'banana', 'pao-frances'],
  snackProtein: ['iogurte-zero', 'ovo', 'whey-isolado', 'peito-peru', 'bebida-soja', 'iogurte-integral'],
  nuts: ['castanha-para', 'amendoas', 'pistache', 'pasta-amendoim', 'amendoim', 'chia', 'tahine'],
  eveningProtein: ['iogurte-zero', 'ovo', 'bebida-soja', 'tofu', 'iogurte-integral'],
  eveningFat: ['castanha-para', 'amendoas', 'chia', 'tahine', 'gergelim'],
}

interface SlotSpec {
  slot: MealSlot
  title: string
  timing: string
  /** Fração das metas do dia em proteína, carboidrato e gordura. */
  share: { p: number; c: number; f: number }
  positions: Position[]
}

const mainMeal = (share: SlotSpec['share']): Pick<SlotSpec, 'share' | 'positions'> => ({
  share,
  positions: [
    { role: 'protein', pool: POOLS.mainProtein },
    { role: 'carb', pool: POOLS.mainCarb },
    { role: 'fixed', pool: POOLS.legume },
    { role: 'fixed', pool: POOLS.vegetable },
    { role: 'fat', pool: POOLS.cookingFat },
  ],
})

const breakfast = (share: SlotSpec['share']): Pick<SlotSpec, 'share' | 'positions'> => ({
  share,
  positions: [
    { role: 'protein', pool: POOLS.breakfastProtein },
    { role: 'carb', pool: POOLS.breakfastCarb },
    { role: 'fixed', pool: POOLS.fruit, optional: true },
    { role: 'fat', pool: POOLS.nuts },
  ],
})

const DAY_SLOTS: Record<DayType, SlotSpec[]> = {
  treino: [
    { slot: 'cafe', title: 'Café da manhã', timing: 'Ao acordar', ...breakfast({ p: 0.2, c: 0.2, f: 0.25 }) },
    { slot: 'almoco', title: 'Almoço', timing: 'Meio do dia', ...mainMeal({ p: 0.3, c: 0.25, f: 0.35 }) },
    {
      slot: 'pre-treino',
      title: 'Pré-treino',
      timing: '60–90 min antes de treinar',
      share: { p: 0.1, c: 0.2, f: 0.05 },
      positions: [
        { role: 'carb', pool: POOLS.quickCarb },
        { role: 'protein', pool: POOLS.quickProtein },
      ],
    },
    {
      slot: 'pos-treino',
      title: 'Pós-treino',
      timing: 'Logo após o treino',
      share: { p: 0.2, c: 0.2, f: 0.05 },
      positions: [
        { role: 'protein', pool: POOLS.quickProtein },
        { role: 'carb', pool: POOLS.postCarb },
      ],
    },
    { slot: 'jantar', title: 'Jantar', timing: 'Noite', ...mainMeal({ p: 0.2, c: 0.15, f: 0.3 }) },
  ],
  descanso: [
    { slot: 'cafe', title: 'Café da manhã', timing: 'Ao acordar', ...breakfast({ p: 0.2, c: 0.25, f: 0.2 }) },
    { slot: 'almoco', title: 'Almoço', timing: 'Meio do dia', ...mainMeal({ p: 0.3, c: 0.3, f: 0.3 }) },
    {
      slot: 'lanche',
      title: 'Lanche da tarde',
      timing: 'Tarde',
      share: { p: 0.15, c: 0.15, f: 0.15 },
      positions: [
        { role: 'protein', pool: POOLS.snackProtein },
        { role: 'carb', pool: POOLS.fruit, optional: true },
        { role: 'fat', pool: POOLS.nuts },
      ],
    },
    { slot: 'jantar', title: 'Jantar', timing: 'Noite', ...mainMeal({ p: 0.25, c: 0.2, f: 0.25 }) },
    {
      slot: 'ceia',
      title: 'Ceia',
      timing: 'Antes de dormir',
      share: { p: 0.1, c: 0.1, f: 0.1 },
      positions: [
        { role: 'protein', pool: POOLS.eveningProtein },
        { role: 'carb', pool: POOLS.fruit, optional: true },
        { role: 'fat', pool: POOLS.eveningFat },
      ],
    },
  ],
}

/** Posições da refeição (usado pela troca rápida para achar o grupo do item). */
export function mealPositions(dayType: DayType, slot: MealSlot): Position[] {
  return DAY_SLOTS[dayType].find(s => s.slot === slot)?.positions ?? []
}

const ROLE_MACRO: Record<Exclude<Role, 'fixed'>, 'proteinG' | 'carbsG' | 'fatG'> = { protein: 'proteinG', carb: 'carbsG', fat: 'fatG' }

const MIN_PORTIONS = 0.5
const MAX_PORTIONS = 3
/** Carboidrato pode ir a 4 porções (dietas de ganho de massa). */
const MAX_CARB_PORTIONS = 4
/** Itens fixos (leguminosa, vegetal, fruta) variam pouco no ajuste fino. */
const MAX_FIXED_PORTIONS = 1.5
const KCAL_TOL = 0.05
const MACRO_TOL = 0.1

const halfRound = (n: number, max = MAX_PORTIONS) => Math.min(max, Math.max(MIN_PORTIONS, Math.round(n * 2) / 2))

const maxPortions = (role: Role) => (role === 'carb' ? MAX_CARB_PORTIONS : role === 'fixed' ? MAX_FIXED_PORTIONS : MAX_PORTIONS)
const r1 = (n: number) => Math.round(n * 10) / 10

/** Hash determinístico (djb2) para a rotação de alimentos por data. */
function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h
}

function preferredTags(flags: NutritionFlags): FoodTag[] {
  const tags: FoodTag[] = []
  if (flags.b6Baixa) tags.push('rico-b6')
  if (flags.vitaminaDBaixa) tags.push('fonte-vitamina-d')
  if (flags.densidadeOsseaBaixa) tags.push('fonte-calcio-nao-lactea')
  return tags
}

/** Alimentos permitidos para o perfil: com intolerância, nada com lactose (FR-005). */
export function allowedFoods(pool: string[], flags: NutritionFlags): FoodItem[] {
  return pool
    .map(id => foodById(id))
    .filter((f): f is FoodItem => !!f && !(flags.intoleranciaLactose && f.tags.includes('contem-lactose')))
}

function pickFood(pool: FoodItem[], key: string, flags: NutritionFlags, used: Set<string>): FoodItem {
  const fresh = pool.filter(f => !used.has(f.id))
  const candidates = fresh.length > 0 ? fresh : pool
  const h = hash(key)
  const wanted = preferredTags(flags)
  const preferred = candidates.filter(f => f.tags.some(t => wanted.includes(t)))
  // Preferência genética como desempate: 2 em cada 3 rotações caem nos itens preferidos.
  const list = preferred.length > 0 && h % 3 !== 0 ? preferred : candidates
  return list[h % list.length]
}

export function scaledItem(food: FoodItem, portions: number): MealItem {
  const m = food.macros
  return {
    foodId: food.id,
    name: food.name,
    portions,
    household: food.portion.household,
    macros: { kcal: r1(m.kcal * portions), proteinG: r1(m.proteinG * portions), carbsG: r1(m.carbsG * portions), fatG: r1(m.fatG * portions) },
  }
}

const sumMacros = (items: { macros: DietTargets }[]): DietTargets =>
  items.reduce(
    (a, i) => ({ kcal: a.kcal + i.macros.kcal, proteinG: a.proteinG + i.macros.proteinG, carbsG: a.carbsG + i.macros.carbsG, fatG: a.fatG + i.macros.fatG }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )

/** Porções para que o alimento entregue `grams` do macro do seu papel. */
export function portionsFor(food: FoodItem, role: Exclude<Role, 'fixed'>, grams: number): number {
  const per = food.macros[ROLE_MACRO[role]]
  return per > 0 ? halfRound(grams / per, maxPortions(role)) : MIN_PORTIONS
}

/** Macro que define a porção de um item (fixos usam o macro dominante do alimento). */
export function roleMacro(role: Role, food: FoodItem): keyof DietTargets {
  if (role !== 'fixed') return ROLE_MACRO[role]
  const { proteinG, carbsG, fatG } = food.macros
  return proteinG >= carbsG && proteinG * 4 >= fatG * 9 ? 'proteinG' : carbsG * 4 >= fatG * 9 ? 'carbsG' : 'fatG'
}

const roundTargets = (t: DietTargets): DietTargets => ({
  kcal: Math.round(t.kcal),
  proteinG: Math.round(t.proteinG),
  carbsG: Math.round(t.carbsG),
  fatG: Math.round(t.fatG),
})

interface Draft {
  role: Role
  food: FoodItem
  portions: number
  /** Alimentos permitidos na posição (para trocar por um mais magro, se preciso). */
  pool: FoodItem[]
  /** Menor porção possível: 0 para itens opcionais e de gordura. */
  min: number
}

/** Ajuste fino global: mexe ±½ porção onde mais aproxima o total do dia das metas. Devolve se fechou na tolerância. */
function balance(drafts: Draft[][], targets: DietTargets): boolean {
  // Avalia os mesmos totais que o usuário vê: soma dos totais arredondados de cada refeição.
  const totals = () =>
    sumMacros(drafts.map(meal => ({ macros: roundTargets(sumMacros(meal.filter(d => d.portions > 0).map(d => scaledItem(d.food, d.portions)))) })))
  const score = () => {
    const t = totals()
    const rel = (a: number, b: number, tol: number) => ((a - b) / b / tol) ** 2
    return rel(t.kcal, targets.kcal, KCAL_TOL) + rel(t.proteinG, targets.proteinG, MACRO_TOL) + rel(t.carbsG, targets.carbsG, MACRO_TOL) + rel(t.fatG, targets.fatG, MACRO_TOL)
  }
  const inside = () => {
    const t = totals()
    const ok = (a: number, b: number, tol: number) => Math.abs(a - b) <= b * tol * 0.8
    return ok(t.kcal, targets.kcal, KCAL_TOL) && ok(t.proteinG, targets.proteinG, MACRO_TOL) && ok(t.carbsG, targets.carbsG, MACRO_TOL) && ok(t.fatG, targets.fatG, MACRO_TOL)
  }
  const movable = drafts.flat()
  for (let iter = 0; iter < 60 && !inside(); iter++) {
    const current = score()
    let best: { d: Draft; step: number; s: number } | null = null
    for (const d of movable) {
      for (const step of [0.5, -0.5]) {
        const next = d.portions + step
        if (next < d.min || next > maxPortions(d.role)) continue
        d.portions = next
        const s = score()
        d.portions -= step
        if (s < current && (!best || s < best.s)) best = { d, step, s }
      }
    }
    if (!best) break
    best.d.portions += best.step
  }
  return inside()
}

const fatPerProtein = (f: FoodItem) => f.macros.fatG / Math.max(f.macros.proteinG, 0.1)

/**
 * Se o dia não fecha, troca a proteína mais gordurosa pela mais magra da mesma
 * posição (até 3 vezes) e ajusta de novo — determinístico.
 */
function balanceWithLeanerProtein(drafts: Draft[][], targets: DietTargets): void {
  if (balance(drafts, targets)) return
  for (let attempt = 0; attempt < 3; attempt++) {
    const used = new Set(drafts.flat().map(d => d.food.id))
    const fattiest = drafts
      .flat()
      .filter(d => d.role === 'protein')
      .sort((a, b) => fatPerProtein(b.food) - fatPerProtein(a.food))
      .find(d => d.pool.some(f => !used.has(f.id) && fatPerProtein(f) < fatPerProtein(d.food)))
    if (!fattiest) return
    const leaner = fattiest.pool.filter(f => !used.has(f.id)).sort((a, b) => fatPerProtein(a) - fatPerProtein(b))[0]
    const grams = scaledItem(fattiest.food, fattiest.portions).macros.proteinG
    fattiest.food = leaner
    fattiest.portions = portionsFor(leaner, 'protein', grams)
    if (balance(drafts, targets)) return
  }
}

const TAG = {
  lactose: 'Sem lactose',
  b6: 'Rico em B6',
  vitD: 'Fonte de vitamina D',
  calcium: 'Cálcio não lácteo',
  periCarb: 'Carboidrato no peri-treino',
}

function mealGenetics(slot: MealSlot, items: MealItem[], flags: NutritionFlags, active: boolean): { geneticTags: string[]; rationale: string[] } {
  const geneticTags: string[] = []
  const rationale: string[] = []
  if (slot === 'pre-treino') rationale.push('Digestão rápida: carboidrato e pouca gordura para chegar ao treino com energia.')
  if (slot === 'pos-treino') rationale.push('Proteína de absorção rápida e carboidrato para repor o glicogênio e iniciar a recuperação.')
  if (!active) return { geneticTags, rationale }
  const tags = new Set(items.flatMap(i => foodById(i.foodId)?.tags ?? []))
  if (flags.intoleranciaLactose) {
    geneticTags.push(TAG.lactose)
    rationale.push('Sem lactose: o marcador MCM6 indica predisposição à intolerância.')
  }
  if (flags.b6Baixa && tags.has('rico-b6')) {
    geneticTags.push(TAG.b6)
    rationale.push('Fontes de vitamina B6: o marcador ALPL indica tendência a níveis reduzidos.')
  }
  if (flags.vitaminaDBaixa && tags.has('fonte-vitamina-d')) {
    geneticTags.push(TAG.vitD)
    rationale.push('Fonte de vitamina D: o marcador GC indica tendência a níveis reduzidos.')
  }
  if (flags.densidadeOsseaBaixa && tags.has('fonte-calcio-nao-lactea')) {
    geneticTags.push(TAG.calcium)
    rationale.push('Cálcio não lácteo: o marcador WNT16 indica menor densidade óssea.')
  }
  if (flags.lowCarbEficaz && (slot === 'pre-treino' || slot === 'pos-treino')) {
    geneticTags.push(TAG.periCarb)
    rationale.push('Carboidrato concentrado em volta do treino: pelo FTO, menos carboidrato no resto do dia é mais eficaz.')
  }
  return { geneticTags, rationale }
}

function dayBadges(flags: NutritionFlags, dayType: DayType, active: boolean): string[] {
  if (!active) return []
  const badges: string[] = []
  if (flags.intoleranciaLactose) badges.push(TAG.lactose)
  if (flags.lowCarbEficaz && dayType === 'treino') badges.push(TAG.periCarb)
  if (flags.vitaminaDBaixa) badges.push('Suporte a vitamina D')
  if (flags.b6Baixa) badges.push('Suporte a B6')
  if (flags.densidadeOsseaBaixa) badges.push(TAG.calcium)
  return badges
}

const NO_GENETIC_FLAGS: NutritionFlags = {
  intoleranciaLactose: false,
  vitaminaDBaixa: false,
  b6Baixa: false,
  densidadeOsseaBaixa: false,
  lowCarbEficaz: false,
  cafeinaTolerada: false,
  perfilPotencia: false,
}

export interface BuildDayPlanInput {
  date: string
  dayType: DayType
  base: DietTargets
  weightKg: number
  flags: NutritionFlags
  geneticsActive: boolean
  tiredness: TirednessLevel | null
  swaps: MealSwap[]
}

/** Plano do dia: metas derivadas da fase e refeições montadas do catálogo (FR-002, FR-002a, FR-005). */
export function buildDayPlan({ date, dayType, base, weightKg, flags: rawFlags, geneticsActive, tiredness, swaps }: BuildDayPlanInput): DayPlan {
  const flags = geneticsActive ? rawFlags : NO_GENETIC_FLAGS
  const { targets, waterMl, recovery } = dayTargets(base, { dayType, weightKg, flags, tiredness })
  const specs = DAY_SLOTS[dayType]
  const used = new Set<string>()

  const drafts: Draft[][] = specs.map(spec => {
    const meal: Draft[] = spec.positions.map((pos, i) => {
      const pool = allowedFoods(pos.pool, flags)
      const food = pickFood(pool, `${date}:${spec.slot}:${i}`, flags, used)
      used.add(food.id)
      return { role: pos.role, food, portions: 1, pool, min: pos.optional || pos.role === 'fat' ? 0 : MIN_PORTIONS }
    })
    const goal = { proteinG: targets.proteinG * spec.share.p, carbsG: targets.carbsG * spec.share.c, fatG: targets.fatG * spec.share.f }
    let have = sumMacros(meal.filter(d => d.role === 'fixed').map(d => scaledItem(d.food, 1)))
    for (const role of ['protein', 'carb', 'fat'] as const) {
      for (const d of meal.filter(x => x.role === role)) {
        const macro = ROLE_MACRO[role]
        const missing = goal[macro] - have[macro]
        const per = d.food.macros[macro]
        d.portions = d.min === 0 && missing < per * 0.25 ? 0 : portionsFor(d.food, role, Math.max(0, missing))
        have = sumMacros([{ macros: have }, scaledItem(d.food, d.portions)])
      }
    }
    return meal
  })

  // Trocas do usuário antes do ajuste fino, para o total continuar perto da meta (FR-010).
  for (const swap of swaps) {
    const mealIndex = specs.findIndex(s => `${date}:${s.slot}` === swap.mealId)
    const draft = drafts[mealIndex]?.find(d => d.food.id === swap.fromFoodId)
    const to = foodById(swap.toFoodId)
    if (!draft || !to || (flags.intoleranciaLactose && to.tags.includes('contem-lactose'))) continue
    const macro = roleMacro(draft.role, draft.food)
    const grams = scaledItem(draft.food, draft.portions).macros[macro]
    const per = to.macros[macro]
    draft.food = to
    draft.portions = per > 0 ? halfRound(grams / per, maxPortions(draft.role)) : 1
  }

  balanceWithLeanerProtein(drafts, targets)

  const meals: Meal[] = specs.map((spec, i) => {
    const items = drafts[i].filter(d => d.portions > 0).map(d => scaledItem(d.food, d.portions))
    const t = sumMacros(items)
    return {
      id: `${date}:${spec.slot}`,
      slot: spec.slot,
      title: spec.title,
      timing: { kind: 'relativo', label: spec.timing },
      items,
      totals: roundTargets(t),
      ...mealGenetics(spec.slot, items, flags, geneticsActive),
    }
  })

  return { date, dayType, targets, waterMl, meals, recovery, genetics: { active: geneticsActive, badges: dayBadges(flags, dayType, geneticsActive) } }
}

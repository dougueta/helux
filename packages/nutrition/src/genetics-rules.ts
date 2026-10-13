import type { GeneraNutritionEntry, NutriMarker, NutriMarkerCategory, NutriMarkerStatus } from '@helux/types'

// Spec 018 (R10) — regras explícitas por gene + traço: categoria da US4,
// status pelo resultado do teste, conduta prática e as flags usadas pelo
// motor do dia. Marcador sem regra → neutro, sem conduta.

export interface NutritionFlags {
  intoleranciaLactose: boolean
  vitaminaDBaixa: boolean
  b6Baixa: boolean
  densidadeOsseaBaixa: boolean
  lowCarbEficaz: boolean
  cafeinaTolerada: boolean
  perfilPotencia: boolean
}

type FlagName = keyof NutritionFlags

interface MarkerRule {
  gene: string
  /** Trecho do traço (sem acento, minúsculo) que identifica a regra. */
  label: RegExp
  category: NutriMarkerCategory
  /** Status quando o resultado indica a predisposição descrita pela regra. */
  when: { test: RegExp; status: NutriMarkerStatus; flag?: FlagName }
  conduct?: { recommend: string[]; avoid: string[] }
}

const NO_PREDISPOSITION = /^(sem|nao ha) predisposicao/

export const NUTRI_MARKER_RULES: MarkerRule[] = [
  {
    gene: 'MCM6',
    label: /lactose/,
    category: 'metabolismo-sensibilidades',
    when: { test: /^predisposicao para desenvolver intolerancia/, status: 'atencao', flag: 'intoleranciaLactose' },
    conduct: {
      recommend: ['Leite e iogurte zero lactose', 'Bebidas vegetais enriquecidas com cálcio', 'Whey isolado zero lactose ou proteína vegetal'],
      avoid: ['Leite comum', 'Iogurte e requeijão comuns', 'Whey concentrado'],
    },
  },
  {
    gene: 'GC',
    label: /vitamina d/,
    category: 'micronutrientes-vitaminas',
    when: { test: /^predisposicao para niveis reduzidos/, status: 'atencao', flag: 'vitaminaDBaixa' },
    conduct: {
      recommend: ['Peixes gordos (salmão, sardinha)', 'Ovos', 'Exposição solar orientada', 'Dosar vitamina D com o médico'],
      avoid: ['Suplementar em dose alta sem exame'],
    },
  },
  {
    gene: 'ALPL',
    label: /vitamina b6/,
    category: 'micronutrientes-vitaminas',
    when: { test: /^predisposicao para niveis reduzidos/, status: 'atencao', flag: 'b6Baixa' },
    conduct: {
      recommend: ['Banana', 'Batata e batata-doce', 'Frango e peixes', 'Grão-de-bico', 'Pistache'],
      avoid: ['Dieta muito restrita em variedade'],
    },
  },
  {
    gene: 'WNT16',
    label: /densidade ossea/,
    category: 'micronutrientes-vitaminas',
    when: { test: /^predisposicao para menor densidade/, status: 'atencao', flag: 'densidadeOsseaBaixa' },
    conduct: {
      recommend: ['Cálcio não lácteo: tofu, gergelim/tahine, couve, sardinha', 'Vitamina D adequada', 'Treino de força regular'],
      avoid: ['Excesso de cafeína e de sódio'],
    },
  },
  {
    gene: 'FTO',
    label: /low carb/,
    category: 'perfil-muscular-dieta',
    when: { test: /low carb mais eficaz/, status: 'favoravel', flag: 'lowCarbEficaz' },
  },
  {
    gene: 'FTO',
    label: /saciedade/,
    category: 'metabolismo-sensibilidades',
    when: { test: /^predisposicao para maior sensacao de saciedade/, status: 'favoravel' },
  },
  {
    gene: 'FTO',
    label: /obesidade/,
    category: 'metabolismo-sensibilidades',
    when: { test: /^maior predisposicao/, status: 'atencao' },
    conduct: {
      recommend: ['Proteína em todas as refeições', 'Fibras e vegetais à vontade', 'Porções medidas nos carboidratos fora do peri-treino'],
      avoid: ['Ultraprocessados e bebidas açucaradas', 'Beliscar sem fome'],
    },
  },
  {
    gene: 'ADORA2A',
    label: /cafeina/,
    category: 'metabolismo-sensibilidades',
    when: { test: /^sem predisposicao para aumento da ansiedade/, status: 'favoravel', flag: 'cafeinaTolerada' },
  },
  {
    gene: 'ACTN3',
    label: /performance|potencia|fibra/,
    category: 'perfil-muscular-dieta',
    when: { test: /potencia|forca|explos/, status: 'favoravel', flag: 'perfilPotencia' },
  },
]

function norm(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Categoria de um marcador sem regra própria, pelo tema do traço. */
function categoryByTopic(label: string): NutriMarkerCategory {
  const l = norm(label)
  if (/vitamina|folato|ferro|calcio|ossea/.test(l)) return 'micronutrientes-vitaminas'
  if (/dieta|performance|muscul|fibra/.test(l)) return 'perfil-muscular-dieta'
  return 'metabolismo-sensibilidades'
}

function ruleFor(entry: GeneraNutritionEntry): MarkerRule | undefined {
  const label = norm(entry.label)
  return NUTRI_MARKER_RULES.find(r => r.gene === entry.gene && r.label.test(label))
}

function toMarker(entry: GeneraNutritionEntry, category: NutriMarkerCategory, status: NutriMarkerStatus, conduct?: MarkerRule['conduct']): NutriMarker {
  return {
    gene: entry.gene,
    ...(entry.genotype ? { genotype: entry.genotype } : {}),
    label: entry.label,
    result: entry.result,
    category,
    status,
    ...(conduct ? { conduct } : {}),
  }
}

/** Marcadores de nutrição com categoria, status e conduta (US4). */
export function classifyMarkers(entries: GeneraNutritionEntry[]): NutriMarker[] {
  return entries.map(entry => {
    const rule = ruleFor(entry)
    if (!rule) return toMarker(entry, categoryByTopic(entry.label), 'neutro')
    const result = norm(entry.result)
    const matches = rule.when.test.test(result) && !(rule.when.status === 'atencao' && NO_PREDISPOSITION.test(result))
    if (!matches) return toMarker(entry, rule.category, 'neutro')
    return toMarker(entry, rule.category, rule.when.status, rule.when.status === 'atencao' ? rule.conduct : undefined)
  })
}

const NO_FLAGS: NutritionFlags = {
  intoleranciaLactose: false,
  vitaminaDBaixa: false,
  b6Baixa: false,
  densidadeOsseaBaixa: false,
  lowCarbEficaz: false,
  cafeinaTolerada: false,
  perfilPotencia: false,
}

/** Flags que o motor do dia usa (filtros e preferências de alimentos). */
export function nutritionFlags(markers: NutriMarker[]): NutritionFlags {
  const flags = { ...NO_FLAGS }
  for (const marker of markers) {
    if (marker.status === 'neutro') continue
    const rule = NUTRI_MARKER_RULES.find(r => r.gene === marker.gene && r.label.test(norm(marker.label)))
    if (rule?.when.flag && rule.when.status === marker.status) flags[rule.when.flag] = true
  }
  return flags
}

import type { ConditionRules, HardConstraints, HealthCondition, Joint, Region, StressLevel } from '@helux/types'

// Spec 024 (R1, R2): catálogo de condições de saúde com regras de treino fixas.
// As regras são conservadoras e verificadas pelo validador em todo plano; a
// condição "outra" não tem regra fixa (as regras vêm das orientações aceitas).

export interface CatalogCondition {
  key: string
  label: string
  /** Regiões em que a condição pode ser registrada (a primeira é a padrão). */
  regions: Region[]
  /** Regras com a condição controlada; `ativa` aperta o limite articular em 1. */
  base: (region: Region) => Omit<ConditionRules, 'medicalNoteOnFlare'>
  medicalNoteOnFlare?: boolean
}

const JOINTS: readonly Joint[] = ['joelho', 'ombro', 'lombar']
const isJoint = (r: Region): r is Joint => (JOINTS as readonly string[]).includes(r)
/** Regiões que recebem impacto da corrida e de saltos. */
const IMPACT_REGIONS: readonly Region[] = ['joelho', 'quadril', 'tornozelo']

const rules = (over: Partial<Omit<ConditionRules, 'medicalNoteOnFlare'>> = {}): Omit<ConditionRules, 'medicalNoteOnFlare'> => ({
  maxJointStress: {},
  blockedPatterns: [],
  blockedExercises: [],
  maxCardioImpact: null,
  minRir: null,
  cues: [],
  ...over,
})

const jointLimit = (region: Region, level: StressLevel) => (isJoint(region) ? { [region]: level } : {})

export const CONDITION_CATALOG: CatalogCondition[] = [
  {
    key: 'lca-reconstrucao',
    label: 'Reconstrução de LCA',
    regions: ['joelho'],
    base: region =>
      rules({
        maxJointStress: jointLimit(region, 1),
        maxCardioImpact: 1,
        cues: ['Joelho alinhado com a ponta do pé, sem cair para dentro', 'Agachamentos até o paralelo, sem forçar a profundidade', 'Sem saltos nem mudanças bruscas de direção'],
      }),
  },
  {
    key: 'artrose',
    label: 'Artrose',
    regions: ['joelho', 'quadril', 'ombro', 'lombar', 'tornozelo'],
    base: region =>
      rules({
        maxJointStress: jointLimit(region, 1),
        maxCardioImpact: IMPACT_REGIONS.includes(region) ? 0 : null,
        cues: ['Amplitude confortável, sem dor durante o movimento', 'Aquecer bem a articulação antes da carga'],
      }),
  },
  {
    key: 'lesao-ligamentar',
    label: 'Lesão ligamentar',
    regions: ['joelho', 'tornozelo', 'ombro', 'cotovelo', 'punho'],
    base: region =>
      rules({
        maxJointStress: jointLimit(region, 1),
        maxCardioImpact: IMPACT_REGIONS.includes(region) ? 1 : null,
        cues: ['Movimento controlado, sem rotação com carga na articulação'],
      }),
  },
  {
    key: 'lesao-menisco',
    label: 'Lesão de menisco',
    regions: ['joelho'],
    base: region =>
      rules({
        maxJointStress: jointLimit(region, 1),
        maxCardioImpact: 1,
        cues: ['Evite flexão profunda do joelho com carga', 'Sem girar o tronco com o pé fixo no chão'],
      }),
  },
  {
    key: 'gota',
    label: 'Gota',
    regions: ['sistemica', 'joelho', 'tornozelo'],
    base: () => rules({ maxCardioImpact: 1, cues: ['Beba água ao longo do treino', 'Evite treinos muito longos em jejum ou desidratado'] }),
    medicalNoteOnFlare: true,
  },
  {
    key: 'lombalgia',
    label: 'Lombalgia',
    regions: ['lombar'],
    base: region => rules({ maxJointStress: jointLimit(region, 1), cues: ['Coluna neutra, abdômen firme', 'Prefira apoio no peito em remadas'] }),
  },
  {
    key: 'hipertensao',
    label: 'Hipertensão',
    regions: ['sistemica'],
    base: () => rules({ minRir: 2, cues: ['Não prenda a respiração na força', 'Pare se tiver tontura ou dor de cabeça forte'] }),
  },
  {
    key: 'tendinopatia-ombro',
    label: 'Tendinopatia no ombro',
    regions: ['ombro'],
    base: region => rules({ maxJointStress: jointLimit(region, 1), cues: ['Evite carga acima da cabeça com dor', 'Aquecer o manguito rotador'] }),
  },
]

const BY_KEY = new Map(CONDITION_CATALOG.map(c => [c.key, c]))

export function findCatalogCondition(key: string | null): CatalogCondition | undefined {
  return key ? BY_KEY.get(key) : undefined
}

const EMPTY: ConditionRules = { maxJointStress: {}, blockedPatterns: [], blockedExercises: [], maxCardioImpact: null, minRir: null, cues: [], medicalNoteOnFlare: false }

const today = (now: Date) => now.toISOString().slice(0, 10)

/** Regras de uma condição registrada, considerando estado e crise ativa. */
export function rulesFor(condition: HealthCondition, now: Date = new Date()): ConditionRules {
  const entry = findCatalogCondition(condition.catalogKey)
  if (!entry || condition.status === 'resolvida') return { ...EMPTY, maxJointStress: {} }
  const base = entry.base(condition.region)
  const maxJointStress: ConditionRules['maxJointStress'] = {}
  for (const [joint, level] of Object.entries(base.maxJointStress) as [Joint, StressLevel][]) {
    maxJointStress[joint] = (condition.status === 'ativa' ? Math.max(0, level - 1) : level) as StressLevel
  }
  let maxCardioImpact = base.maxCardioImpact
  const flare = condition.flare && condition.flare.until >= today(now) ? condition.flare : null
  if (flare) {
    if (isJoint(flare.region)) maxJointStress[flare.region] = 0
    maxCardioImpact = 0
  }
  return { ...base, maxJointStress, maxCardioImpact, medicalNoteOnFlare: !!entry.medicalNoteOnFlare }
}

const minOf = <T extends number>(a: T | null, b: T | null): T | null => (a === null ? b : b === null ? a : (Math.min(a, b) as T))

/** Junta várias regras ficando com a mais restritiva de cada campo. */
export function mergeRules(list: ConditionRules[]): ConditionRules {
  const out: ConditionRules = { ...EMPTY, maxJointStress: {} }
  for (const r of list) {
    for (const [joint, level] of Object.entries(r.maxJointStress) as [Joint, StressLevel][]) {
      out.maxJointStress[joint] = minOf(out.maxJointStress[joint] ?? null, level) as StressLevel
    }
    out.blockedPatterns = [...new Set([...out.blockedPatterns, ...r.blockedPatterns])]
    out.blockedExercises = [...new Set([...out.blockedExercises, ...r.blockedExercises])]
    out.maxCardioImpact = minOf(out.maxCardioImpact, r.maxCardioImpact)
    out.minRir = r.minRir === null ? out.minRir : Math.max(out.minRir ?? 0, r.minRir)
    out.cues = [...new Set([...out.cues, ...r.cues])]
    out.medicalNoteOnFlare ||= r.medicalNoteOnFlare
  }
  return out
}

/** Campos de `HardConstraints` vindos das condições de saúde (somados às restrições da 022). */
export function constraintsFromConditions(
  conditions: HealthCondition[],
  now: Date = new Date(),
): Pick<HardConstraints, 'maxJointStress' | 'maxCardioImpact' | 'minRir' | 'blockedPatterns' | 'blockedExercises'> {
  const merged = mergeRules(conditions.map(c => rulesFor(c, now)))
  return {
    maxJointStress: merged.maxJointStress,
    maxCardioImpact: merged.maxCardioImpact,
    minRir: merged.minRir,
    blockedPatterns: merged.blockedPatterns,
    blockedExercises: merged.blockedExercises,
  }
}

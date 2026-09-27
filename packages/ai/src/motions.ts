import { GENERIC_MOTION, MOTION_CATALOG, type MotionKey } from '@helux/types'
import type { ExerciseBankEntry } from './exercise-bank'

/**
 * Escolha da animação de execução por exercício (spec 013, FR-003).
 *
 * Regras ordenadas — a primeira que casar vence. Cada regra olha o padrão de
 * movimento e, quando o padrão é amplo (isolamento, core, agachar), o grupo
 * muscular e palavras do nome. Exercícios novos entram automaticamente pelas
 * regras de padrão; `GENERIC_MOTION` fica só como último recurso.
 */
interface MotionRule {
  pattern?: string
  muscleGroup?: string
  name?: RegExp
  motion: MotionKey
}

const RULES: MotionRule[] = [
  // ---- agachar ----
  { pattern: 'agachar', name: /leg press/, motion: 'leg-press' },
  { pattern: 'agachar', name: /afundo|bulgaro|step-up|pistol|passada|avanco/, motion: 'lunge' },
  { pattern: 'agachar', motion: 'squat' },
  // ---- dobrar quadril ----
  { pattern: 'dobrar-quadril', name: /elevacao pelvica|ponte|hip thrust/, motion: 'hip-thrust' },
  { pattern: 'dobrar-quadril', motion: 'hinge' },
  // ---- empurrar ----
  { pattern: 'empurrar-horizontal', name: /inclinad/, motion: 'press-incline' },
  { pattern: 'empurrar-horizontal', name: /flexao/, motion: 'push-up' },
  { pattern: 'empurrar-horizontal', motion: 'press-flat' },
  { pattern: 'empurrar-vertical', motion: 'press-overhead' },
  // ---- puxar ----
  { pattern: 'puxar-horizontal', name: /remada alta/, motion: 'upright-row' },
  { pattern: 'puxar-horizontal', motion: 'row' },
  { pattern: 'puxar-vertical', motion: 'pull-vertical' },
  // ---- core ----
  { pattern: 'core', name: /roda abdominal|rollout|ab wheel/, motion: 'rollout' },
  { pattern: 'core', name: /pallof|rotacao de tronco|russian twist|giro/, motion: 'cable-rotation' },
  { pattern: 'core', name: /prancha|hollow/, motion: 'plank' },
  { pattern: 'core', name: /infra|elevacao de pernas|dead bug/, motion: 'leg-raise' },
  { pattern: 'core', motion: 'crunch' },
  // ---- isolamento (por grupo muscular + nome) ----
  { pattern: 'isolamento', muscleGroup: 'biceps', motion: 'curl' },
  { pattern: 'isolamento', muscleGroup: 'triceps', name: /testa/, motion: 'ext-lying' },
  { pattern: 'isolamento', muscleGroup: 'triceps', name: /frances|acima da cabeca/, motion: 'ext-overhead' },
  { pattern: 'isolamento', muscleGroup: 'triceps', name: /mergulho|paralelas/, motion: 'dip' },
  { pattern: 'isolamento', muscleGroup: 'triceps', motion: 'pushdown' },
  { pattern: 'isolamento', muscleGroup: 'peito', motion: 'fly' },
  { pattern: 'isolamento', muscleGroup: 'ombro', name: /frontal/, motion: 'raise-front' },
  { pattern: 'isolamento', muscleGroup: 'ombro', motion: 'raise-lateral' },
  { pattern: 'isolamento', muscleGroup: 'costas', motion: 'shrug' },
  { pattern: 'isolamento', muscleGroup: 'panturrilha', motion: 'calf-raise' },
  { pattern: 'isolamento', muscleGroup: 'posterior', motion: 'leg-curl' },
  { pattern: 'isolamento', name: /abdutora|adutora/, motion: 'hip-abduction' },
  { pattern: 'isolamento', muscleGroup: 'quadriceps', motion: 'leg-ext' },
]

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export type MotionSubject = Pick<ExerciseBankEntry, 'name' | 'pattern' | 'muscleGroup'>

/** Animação específica pela primeira regra que casar; `undefined` quando nenhuma regra cobre o exercício. */
export function matchMotionRule(entry: MotionSubject): MotionKey | undefined {
  const name = normalize(entry.name)
  const rule = RULES.find(
    (r) =>
      (r.pattern === undefined || r.pattern === entry.pattern) &&
      (r.muscleGroup === undefined || r.muscleGroup === entry.muscleGroup) &&
      (r.name === undefined || r.name.test(name)),
  )
  return rule?.motion
}

export function resolveMotion(entry: MotionSubject): MotionKey {
  return matchMotionRule(entry) ?? GENERIC_MOTION
}

/** A animação representa o movimento do exercício? (padrão; nos isolamentos, também o grupo muscular) */
export function motionCovers(motion: MotionKey, entry: MotionSubject): boolean {
  const info = MOTION_CATALOG[motion]
  if (!info.patterns.includes(entry.pattern)) return false
  if (entry.pattern === 'isolamento') return info.muscleGroups?.includes(entry.muscleGroup) ?? false
  return true
}

export interface MotionCoverage {
  total: number
  /** exercícios cuja animação não representa o seu movimento */
  generic: number
  genericPct: number
  /** exercícios que mostram o supino reto */
  pressFlat: number
  pressFlatPct: number
  maxShare: { motion: MotionKey; count: number }
  maxSharePct: number
}

/** Medição de cobertura das animações sobre um conjunto de exercícios (spec 013, FR-005). */
export function measureMotionCoverage<T extends MotionSubject>(
  entries: readonly T[],
  resolve: (entry: T) => MotionKey,
): MotionCoverage {
  const counts = new Map<MotionKey, number>()
  let generic = 0
  for (const entry of entries) {
    const motion = resolve(entry)
    counts.set(motion, (counts.get(motion) ?? 0) + 1)
    if (!motionCovers(motion, entry)) generic += 1
  }
  const total = entries.length
  const pct = (n: number) => (total === 0 ? 0 : (n / total) * 100)
  let maxShare: { motion: MotionKey; count: number } = { motion: GENERIC_MOTION, count: 0 }
  for (const [motion, count] of counts) if (count > maxShare.count) maxShare = { motion, count }
  const pressFlat = counts.get('press-flat') ?? 0
  return {
    total,
    generic,
    genericPct: pct(generic),
    pressFlat,
    pressFlatPct: pct(pressFlat),
    maxShare,
    maxSharePct: pct(maxShare.count),
  }
}

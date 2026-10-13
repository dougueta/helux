/**
 * Catálogo das animações de execução (spec 013).
 *
 * Cada chave declara os padrões de movimento — e, nos isolamentos, os grupos
 * musculares — que a animação representa. É a fonte única usada por
 * `@helux/ai` (escolha da animação por exercício e medição da cobertura) e por
 * `apps/web` (o `ExerciseDemo` precisa ter um preset para cada chave).
 */
export interface MotionCatalogEntry {
  patterns: readonly string[]
  muscleGroups?: readonly string[]
}

const catalog = {
  'press-flat': { patterns: ['empurrar-horizontal'] },
  'press-incline': { patterns: ['empurrar-horizontal'] },
  'push-up': { patterns: ['empurrar-horizontal'] },
  'press-overhead': { patterns: ['empurrar-vertical'] },
  squat: { patterns: ['agachar'] },
  lunge: { patterns: ['agachar'] },
  'leg-press': { patterns: ['agachar'] },
  hinge: { patterns: ['dobrar-quadril'] },
  'hip-thrust': { patterns: ['dobrar-quadril'] },
  row: { patterns: ['puxar-horizontal'] },
  'upright-row': { patterns: ['puxar-horizontal'] },
  'pull-vertical': { patterns: ['puxar-vertical'] },
  plank: { patterns: ['core'] },
  crunch: { patterns: ['core'] },
  'leg-raise': { patterns: ['core'] },
  rollout: { patterns: ['core'] },
  'cable-rotation': { patterns: ['core'] },
  curl: { patterns: ['isolamento'], muscleGroups: ['biceps'] },
  pushdown: { patterns: ['isolamento'], muscleGroups: ['triceps'] },
  'ext-lying': { patterns: ['isolamento'], muscleGroups: ['triceps'] },
  'ext-overhead': { patterns: ['isolamento'], muscleGroups: ['triceps'] },
  dip: { patterns: ['isolamento'], muscleGroups: ['triceps'] },
  fly: { patterns: ['isolamento'], muscleGroups: ['peito'] },
  'raise-lateral': { patterns: ['isolamento'], muscleGroups: ['ombro'] },
  'raise-front': { patterns: ['isolamento'], muscleGroups: ['ombro'] },
  shrug: { patterns: ['isolamento'], muscleGroups: ['costas'] },
  'leg-ext': { patterns: ['isolamento'], muscleGroups: ['quadriceps'] },
  'hip-abduction': { patterns: ['isolamento'], muscleGroups: ['quadriceps', 'gluteo'] },
  'leg-curl': { patterns: ['isolamento'], muscleGroups: ['posterior'] },
  'calf-raise': { patterns: ['isolamento'], muscleGroups: ['panturrilha'] },
} as const satisfies Record<string, MotionCatalogEntry>

export type MotionKey = keyof typeof catalog

export const MOTION_CATALOG: Record<MotionKey, MotionCatalogEntry> = catalog

/** Animação de último recurso (chave desconhecida ou exercício sem regra). */
export const GENERIC_MOTION: MotionKey = 'press-flat'

export function isMotionKey(key: string): key is MotionKey {
  return Object.prototype.hasOwnProperty.call(MOTION_CATALOG, key)
}

/**
 * Chaves das animações antigas (spec 013). Desde o encerramento da 028 (T097), nenhuma tela
 * desenha por elas: a demonstração vem do catálogo `@helux/exercises`. As chaves continuam só
 * como tipo do campo `motion` dos bancos de cardio e das Rotinas e dos dados já salvos.
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

export function isMotionKey(key: string): key is MotionKey {
  return Object.prototype.hasOwnProperty.call(MOTION_CATALOG, key)
}

/** Família "core": pranchas, abdominais e rotações. */
import { BODY, mirrorX, round, twoBone } from '../engine/geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import type { DemoFamily } from './index'

/**
 * Sentado no colchonete, de frente: joelhos dobrados e o halter seguro com as duas mãos em `hands`.
 * Os dois braços chegam ao mesmo ponto, então o halter aparece uma vez só.
 */
function seatedTwist(hands: Point): Pose {
  const hip: Point = [110, 222]
  const sh: Point = [110, hip[1] - BODY.torso]
  const head: Point = [110, sh[1] - BODY.neck]
  const el = twoBone(sh, BODY.upperArm, hands, BODY.forearm, 'below')
  const el2 = twoBone(sh, BODY.upperArm, hands, BODY.forearm, 'above')
  const kn: Point = [94, 198]
  const an: Point = [92, 230]
  const toe: Point = [84, 234]
  return {
    head, sh, hip,
    el: round(el), ha: round(hands), el2: round(el2), ha2: round(hands),
    kn, an, toe, kn2: mirrorX(kn), an2: mirrorX(an), toe2: mirrorX(toe),
  }
}

/** Russian twist: o halter vai de um lado do quadril ao outro, com o tronco inclinado e estável. */
const SEATED_TWIST: MovementBase = {
  key: 'rotacao-sentado',
  view: 'front',
  loop: 'reps',
  durationMs: 2400,
  root: 'seat',
  fixed: ['hip', 'sh', 'head', 'kn', 'an', 'toe', 'kn2', 'an2', 'toe2'],
  keyframes: [
    { at: 0, pose: seatedTwist([76, 200]) },
    { at: 1, pose: seatedTwist(mirrorX([76, 200])) },
  ],
}

export const CORE: DemoFamily = {
  bases: [SEATED_TWIST],
  demos: {
    'russian-twist-halteres': { base: 'rotacao-sentado', gear: 'halteres', scene: 'colchonete', implementAt: 'ha' },
  },
}

/** Família "puxar na vertical": puxadas, barras fixas e pullovers. */
import { BODY, polar, round } from '../engine/geometry'
import { FLAT_BENCH } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import type { DemoFamily } from './index'

/** Deitado de costas no banco reto, cabeça à esquerda, pés no chão. */
function lyingSupine(upperArmDeg: number, forearmDeg: number): Pose {
  const y = FLAT_BENCH.top - 6
  const sh: Point = [62, y]
  const hip: Point = [sh[0] + BODY.torso, y]
  const head = polar(sh, BODY.neck, 180)
  const kn = polar(hip, BODY.thigh, 28)
  const an = polar(kn, BODY.shin, 90) // pé no chão, abaixo do joelho
  const toe = polar(an, BODY.foot, 0)
  const el = polar(sh, BODY.upperArm, upperArmDeg)
  const ha = polar(el, BODY.forearm, forearmDeg)
  return { head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip: round(hip), kn: round(kn), an: round(an), toe: round(toe) }
}

/** Pullover: o halter sai de cima do peito e desce em arco atrás da cabeça, cotovelos levemente dobrados. */
const PULLOVER: MovementBase = {
  key: 'pullover-deitado',
  view: 'side',
  loop: 'reps',
  durationMs: 3000,
  root: 'hip',
  fixed: ['hip', 'sh', 'head', 'kn', 'an', 'toe'],
  keyframes: [
    { at: 0, pose: lyingSupine(-80, -88) },
    { at: 1, pose: lyingSupine(185, 177) },
  ],
}

export const PUXAR_VERTICAL: DemoFamily = {
  bases: [PULLOVER],
  demos: {
    'pullover-halteres': { base: 'pullover-deitado', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha' },
  },
}

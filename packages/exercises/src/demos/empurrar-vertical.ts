/** Família "empurrar na vertical": desenvolvimentos e flexões com o corpo invertido. */
import { BODY, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import type { DemoFamily } from './index'

const HAND: Point = [70, FLOOR_Y - 4]
const ANKLE: Point = [174, FLOOR_Y - 10]

/**
 * Flexão pike de perfil: mãos e pés no chão, pernas estendidas e quadril alto.
 * `legDeg` é o ângulo da perna (tornozelo → quadril), `torsoDeg` o do tronco (quadril → ombro)
 * e `headDeg` o do pescoço (ombro → cabeça), que olha para o chão.
 */
function pike(legDeg: number, torsoDeg: number, headDeg: number): Pose {
  const hip = polar(ANKLE, BODY.shin + BODY.thigh, legDeg)
  const kn = polar(ANKLE, BODY.shin, legDeg)
  const sh = polar(hip, BODY.torso, torsoDeg)
  const head = polar(sh, BODY.neck, headDeg)
  const el = twoBone(sh, BODY.upperArm, HAND, BODY.forearm, 'right')
  const toe = polar(ANKLE, BODY.foot, 40)
  return { head: round(head), sh: round(sh), el: round(el), ha: HAND, hip: round(hip), kn: round(kn), an: ANKLE, toe: round(toe) }
}

/** No alto, os braços ficam estendidos; na descida, os cotovelos dobram e a cabeça vai ao chão entre as mãos. */
const PIKE: MovementBase = {
  key: 'flexao-pike',
  view: 'side',
  loop: 'reps',
  durationMs: 2600,
  root: 'hand',
  fixed: ['ha', 'an', 'toe'],
  keyframes: [
    { at: 0, pose: pike(-125, 163.5, 110) },
    { at: 1, pose: pike(-130, 140, 125) },
  ],
}

export const EMPURRAR_VERTICAL: DemoFamily = {
  bases: [PIKE],
  demos: {
    'flexao-pike-corporal': { base: 'flexao-pike', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
  },
}

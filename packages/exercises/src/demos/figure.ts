/** Peças comuns às famílias de perfil: figura montada do pé para cima, braços e equilíbrio sobre o meio do pé. */
import { BODY, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y } from '../engine/scene-geometry'
import type { Point, Pose } from '../engine/types'

/** Tornozelo a 6 do solo; com o pé a 25,4°, a ponta do pé toca o solo. */
export const ANKLE_Y = FLOOR_Y - 6
export const FOOT_DEG = 25.4

export type Arms = (sh: Point, torsoDeg: number) => { el: Point; ha: Point }

export interface SideLegs {
  /** tornozelo de apoio */
  an: Point
  /** canela, do tornozelo ao joelho */
  shinDeg: number
  /** coxa, do joelho ao quadril */
  thighDeg: number
  /** tronco, do quadril ao ombro */
  torsoDeg: number
}

/** Figura de perfil, de frente para a direita, construída do pé para cima. */
export function sidePose({ an, shinDeg, thighDeg, torsoDeg }: SideLegs, arms: Arms, footDeg = FOOT_DEG): Pose {
  const toe = polar(an, BODY.foot, footDeg)
  const kn = polar(an, BODY.shin, shinDeg)
  const hip = polar(kn, BODY.thigh, thighDeg)
  const sh = polar(hip, BODY.torso, torsoDeg)
  const head = polar(sh, BODY.neck, torsoDeg + 8)
  const { el, ha } = arms(sh, torsoDeg)
  return { head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip: round(hip), kn: round(kn), an: round(an), toe: round(toe) }
}

/** Mãos num ponto: cotovelo pela solução escolhida. */
export const handsAt =
  (place: (sh: Point, torsoDeg: number) => Point, side: 'above' | 'below' | 'left' | 'right'): Arms =>
  (sh, torsoDeg) => {
    const ha = place(sh, torsoDeg)
    return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, side), ha }
  }

/** Braços estendidos na direção `deg`. */
export const straightArms =
  (deg: (torsoDeg: number) => number): Arms =>
  (sh, torsoDeg) => {
    const el = polar(sh, BODY.upperArm, deg(torsoDeg))
    return { el, ha: polar(el, BODY.forearm, deg(torsoDeg)) }
  }

/** Braços soltos ao lado do corpo (halteres pendurados). */
export const hangingArms: Arms = (sh) => {
  const el = polar(sh, BODY.upperArm, 92)
  return { el, ha: polar(el, BODY.forearm, 90) }
}

/** Barra apoiada no alto das costas, logo atrás do ombro. */
export const backRack = handsAt((sh, t) => polar(sh, 7, t - 90), 'below')
/** Barra apoiada na frente dos ombros, cotovelos altos. */
export const frontRack = handsAt((sh, t) => polar(sh, 9, t + 90), 'right')
/** Halter seguro junto ao peito. */
export const goblet = handsAt((sh, t) => polar(sh, 20, t + 125), 'below')

export const MIDFOOT = (an: Point) => an[0] + 6

/** Tronco que deixa `pick(pose)` sobre o meio do pé (equilíbrio), por bisseção entre -95° e -30°. */
export function balanced(legs: Omit<SideLegs, 'torsoDeg'>, arms: Arms, pick: (p: Pose) => Point, target = MIDFOOT(legs.an)): Pose {
  let lo = -95
  let hi = -30
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const x = pick(sidePose({ ...legs, torsoDeg: mid }, arms))[0]
    // inclinar mais (ângulo maior) leva o ponto para a frente
    if (x > target) hi = mid
    else lo = mid
  }
  return sidePose({ ...legs, torsoDeg: (lo + hi) / 2 }, arms)
}

/** Perna de trás (kn2, an2, toe2) com o calcanhar alto e a ponta do pé apoiada. */
export function rearLeg(hip: Point, an2: Point, toeDeg = 40) {
  const kn2 = twoBone(hip, BODY.thigh, an2, BODY.shin, 'below')
  return { kn2: round(kn2), an2: round(an2), toe2: round(polar(an2, BODY.foot, toeDeg)) }
}

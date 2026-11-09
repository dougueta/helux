/** Família "puxar na horizontal": remadas, face pull e remada alta (lote 6). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { DIP_BARS, FLAT_BENCH, FLOOR_Y, SEAT, WALL_X } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, sidePose, type Arms, type SideLegs } from './figure'
import type { DemoFamily } from './index'

const ARM = BODY.upperArm + BODY.forearm

const pull = (key: string, root: MovementBase['root'], fixed: MovementBase['fixed'], start: Pose, end: Pose, durationMs = 2600): MovementBase => ({
  key,
  view: 'side',
  loop: 'reps',
  durationMs,
  root,
  fixed,
  keyframes: [
    { at: 0, pose: start },
    { at: 1, pose: end },
  ],
})

/** Braços retos pendurados na vertical. */
const hang =
  (upper: number = BODY.upperArm, fore: number = BODY.forearm): Arms =>
  (sh) => {
    const el = polar(sh, upper, 90)
    return { el, ha: polar(el, fore, 90) }
  }

/** Mão puxada até perto do umbigo, logo abaixo do tronco, com o cotovelo para cima e para trás. */
const toWaist =
  (fromHip: number, upper: number = BODY.upperArm, fore: number = BODY.forearm): Arms =>
  (sh, torsoDeg) => {
    const hip = polar(sh, BODY.torso, torsoDeg + 180)
    const ha = polar(polar(hip, fromHip, torsoDeg), 9, torsoDeg + 90)
    return { el: twoBone(sh, upper, ha, fore, 'above'), ha }
  }

const HINGED_FIXED: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head']

/** Remada curvada: tronco inclinado uns 45 graus, joelhos levemente dobrados; a carga sobe dos braços estendidos até a cintura. */
const BENT: Omit<SideLegs, 'torsoDeg'> = { an: [104, ANKLE_Y], shinDeg: -80, thighDeg: -125 }
const BENT_TORSO = -34
const BENT_ROW = pull('remada-curvada', 'foot', HINGED_FIXED, sidePose({ ...BENT, torsoDeg: BENT_TORSO }, hang()), sidePose({ ...BENT, torsoDeg: BENT_TORSO }, toWaist(26)))

/**
 * Pendlay: tronco quase paralelo ao chão e a barra parte do chão em cada repetição. Como no terra,
 * os braços desta base são um pouco mais longos, para a barra alcançar o chão sem o quadril cair.
 */
const LONG_UPPER = 34
const LONG_FORE = 32
const PENDLAY_LEGS: Omit<SideLegs, 'torsoDeg'> = { an: [104, ANKLE_Y], shinDeg: -74, thighDeg: -128 }
const PENDLAY_TORSO = -4
const PENDLAY = pull(
  'remada-pendlay',
  'foot',
  HINGED_FIXED,
  sidePose({ ...PENDLAY_LEGS, torsoDeg: PENDLAY_TORSO }, hang(LONG_UPPER, LONG_FORE)),
  sidePose({ ...PENDLAY_LEGS, torsoDeg: PENDLAY_TORSO }, toWaist(40, LONG_UPPER, LONG_FORE)),
  2200,
)

/**
 * Remada unilateral apoiada no banco: um joelho e uma mão no banco, tronco quase paralelo ao chão;
 * a outra mão puxa o halter até a cintura. A perna que fica no chão não aparece de perfil.
 */
const UNI_HIP: Point = [86, FLAT_BENCH.top - 6 - BODY.thigh]
const UNI_TORSO = -13
const UNI_SH = polar(UNI_HIP, BODY.torso, UNI_TORSO)
function oneArmRow(arms: Arms): Pose {
  const kn: Point = [UNI_HIP[0], FLAT_BENCH.top - 6]
  const an = polar(kn, BODY.shin, 180)
  // mão de apoio um pouco à frente do ombro, para não ficar no mesmo ponto do halter
  const ha2: Point = [UNI_SH[0] + 10, FLAT_BENCH.top - 6]
  const el2 = twoBone(UNI_SH, BODY.upperArm, ha2, BODY.forearm, 'right')
  const { el, ha } = arms(UNI_SH, UNI_TORSO)
  return {
    head: round(polar(UNI_SH, BODY.neck, UNI_TORSO + 10)), sh: round(UNI_SH), el: round(el), ha: round(ha), hip: UNI_HIP, kn, an: round(an),
    toe: round(polar(an, BODY.foot, 150)), el2: round(el2), ha2: round(ha2),
  }
}
const ONE_ARM = pull('remada-unilateral', 'hip', ['hip', 'sh', 'head', 'kn', 'an', 'toe', 'el2', 'ha2'], oneArmRow(hang()), oneArmRow(toWaist(22)))

/** Remada sentada: tronco ereto, pernas à frente; as mãos vêm da frente até o abdômen, cotovelos para trás. */
const ROW_HIP: Point = [SEAT.x0 + 18, SEAT.top - 6]
const ROW_SH: Point = [ROW_HIP[0] + 2, ROW_HIP[1] - BODY.torso]
const ROW_TO: Point = [ROW_SH[0] + ARM - 2, ROW_SH[1] + 14]
function seatedRow(ha: Point): Pose {
  const el = twoBone(ROW_SH, BODY.upperArm, ha, BODY.forearm, 'below')
  const kn = polar(ROW_HIP, BODY.thigh, -14)
  const an = polar(kn, BODY.shin, 18)
  return {
    head: [ROW_SH[0] + 2, ROW_SH[1] - BODY.neck], sh: ROW_SH, el: round(el), ha: round(ha), hip: ROW_HIP, kn: round(kn), an: round(an),
    toe: round(polar(an, BODY.foot, -70)),
  }
}
const SEATED_ROW = pull('remada-sentada', 'seat', ['hip', 'sh', 'head', 'kn', 'an', 'toe'], seatedRow(polar(ROW_SH, ARM - 1, heading(ROW_SH, ROW_TO))), seatedRow([ROW_SH[0] + 14, ROW_SH[1] + 38]))
/** Polia baixa à frente, na linha das mãos estendidas. */
const ROW_ANCHOR: Point = [WALL_X - 6, ROW_TO[1] + 4]

/**
 * Remada invertida numa barra baixa: corpo reto por baixo dela, calcanhares no chão; o corpo gira em
 * volta dos calcanhares até o peito chegar perto da barra.
 */
const INV_HANDS: Point = [DIP_BARS.x0 + 4, DIP_BARS.y + 2]
const INV_HEEL: Point = [212, ANKLE_Y]
const BODY_LEN = BODY.shin + BODY.thigh + BODY.torso
function inverted(shY: number): Pose {
  const dx = Math.sqrt(BODY_LEN * BODY_LEN - (INV_HEEL[1] - shY) ** 2)
  const sh: Point = [INV_HEEL[0] - dx, shY]
  const deg = heading(INV_HEEL, sh)
  const kn = polar(INV_HEEL, BODY.shin, deg)
  const hip = polar(INV_HEEL, BODY.shin + BODY.thigh, deg)
  const el = twoBone(sh, BODY.upperArm, INV_HANDS, BODY.forearm, 'below')
  return {
    head: round(polar(sh, BODY.neck, deg - 6)), sh: round(sh), el: round(el), ha: INV_HANDS, hip: round(hip), kn: round(kn), an: INV_HEEL,
    toe: round(polar(INV_HEEL, BODY.foot, -70)),
  }
}
/** Ombro mais baixo em que o braço alcança a barra estendido. */
function hangingShoulderY(): number {
  let y = INV_HANDS[1] + 10
  for (; y < FLOOR_Y - 20; y += 0.25) {
    const s = inverted(y + 0.25).sh
    if (Math.hypot(s[0] - INV_HANDS[0], s[1] - INV_HANDS[1]) > ARM - 1) break
  }
  return y
}
const INVERTED = pull('remada-invertida', 'hand', ['ha', 'an', 'toe'], inverted(hangingShoulderY()), inverted(INV_HANDS[1] + 12))

/** Em pé, parado; só os braços se movem. */
const STANDING: SideLegs = { an: [96, ANKLE_Y], shinDeg: -88, thighDeg: -92, torsoDeg: -90 }
const STANDING_FIXED: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head']

/** Face pull: de frente para a polia alta, a corda vem até o rosto com os cotovelos altos. */
const FACE_ANCHOR: Point = [WALL_X - 4, 64]
const facePull = (end: boolean): Pose =>
  sidePose(STANDING, (sh) => {
    const ha = end ? ([sh[0] + 12, sh[1] - 22] as Point) : polar(sh, ARM - 1, heading(sh, FACE_ANCHOR))
    return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'above'), ha }
  })
const FACE_PULL = pull('face-pull', 'foot', STANDING_FIXED, facePull(false), facePull(true))

/** Remada alta: a barra sobe rente ao corpo, das coxas até o peito, com os cotovelos acima das mãos. */
const uprightRow = (end: boolean): Pose =>
  sidePose(STANDING, (sh) => {
    const ha: Point = end ? [sh[0] + 9, sh[1] + 10] : [sh[0] + 4, sh[1] + ARM - 1]
    return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, end ? 'above' : 'right'), ha }
  })
const UPRIGHT = pull('remada-alta', 'foot', STANDING_FIXED, uprightRow(false), uprightRow(true))

/** Barra T e cavalinho: uma ponta da barra fica presa no chão, atrás, e a outra sobe até o tronco. */
const T_BAR_PIVOT: Point = [16, FLOOR_Y - 2]

export const PUXAR_HORIZONTAL: DemoFamily = {
  bases: [BENT_ROW, PENDLAY, ONE_ARM, SEATED_ROW, INVERTED, FACE_PULL, UPRIGHT],
  demos: {
    'remada-curvada-barra': { base: 'remada-curvada', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'remada-curvada-halteres': { base: 'remada-curvada', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    // Barra T e cavalinho: a mesma barra presa atrás; muda a pegada, que não aparece de perfil.
    'remada-t-barra': {
      base: 'remada-curvada', gear: 'barra', scene: 'solo', implementAt: 'ha', anchor: T_BAR_PIVOT,
      caption: 'As duas mãos na ponta da barra, logo abaixo das anilhas',
    },
    'remada-cavalinho-barra': {
      base: 'remada-curvada', gear: 'barra', scene: 'solo', implementAt: 'ha', anchor: T_BAR_PIVOT,
      caption: 'Barra entre as pernas, pegada no triângulo ou nas alças',
    },
    'remada-pendlay-barra': { base: 'remada-pendlay', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'remada-unilateral-halteres': { base: 'remada-unilateral', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha' },
    'remada-baixa-cabo': { base: 'remada-sentada', gear: 'cabo', scene: 'assento', implementAt: 'ha', anchor: ROW_ANCHOR },
    'remada-maquina': { base: 'remada-sentada', gear: 'maquina', scene: 'maquina', implementAt: 'ha' },
    'remada-invertida-corporal': { base: 'remada-invertida', gear: 'barra-fixa', scene: 'paralelas', implementAt: 'ha' },
    'face-pull-cabo': { base: 'face-pull', gear: 'corda', scene: 'parede', implementAt: 'ha', anchor: FACE_ANCHOR },
    'remada-alta-barra': { base: 'remada-alta', gear: 'barra', scene: 'solo', implementAt: 'ha' },
  },
}


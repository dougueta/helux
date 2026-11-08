/** Família "empurrar na horizontal": supinos e flexões (lote 3). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { DECLINE_BENCH, FLAT_BENCH, FLOOR_Y, INCLINE_BENCH, LOW_BENCH, SEAT, STEP } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, FOOT_DEG } from './figure'
import type { DemoFamily } from './index'

const ARM = BODY.upperArm + BODY.forearm

const pressBase = (key: string, fixed: MovementBase['fixed'], root: MovementBase['root'], top: Pose, bottom: Pose, durationMs = 2600): MovementBase => ({
  key,
  view: 'side',
  loop: 'reps',
  durationMs,
  root,
  fixed,
  keyframes: [
    { at: 0, pose: top },
    { at: 1, pose: bottom },
  ],
})

/**
 * Deitado no banco: o tronco vai do quadril ao ombro na direção do encosto, as pernas apoiam no chão
 * (ou no rolo), e as mãos sobem e descem na vertical sobre o peito. No fundo, a barra encosta no peito
 * (um pouco à frente do ombro, na direção do quadril) e o cotovelo fica abaixo do banco.
 */
function benchPress(hip: Point, sh: Point, legs: { kn: Point; an: Point; toe: Point }, bottom: boolean): Pose {
  const toHip = heading(sh, hip)
  const head = polar(sh, BODY.neck, toHip + 180)
  const chest = polar(sh, 9, toHip)
  const ha: Point = bottom ? [chest[0], chest[1] - 10] : [chest[0], sh[1] - Math.sqrt(ARM * ARM - (chest[0] - sh[0]) ** 2) + 0.5]
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below')
  return { head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip: round(hip), kn: round(legs.kn), an: round(legs.an), toe: round(legs.toe) }
}

/** Pés no chão a partir do quadril, com o joelho para cima. */
function feetOnFloor(hip: Point, anX: number) {
  const an: Point = [anX, ANKLE_Y]
  return { kn: twoBone(hip, BODY.thigh, an, BODY.shin, 'above'), an, toe: polar(an, BODY.foot, FOOT_DEG) }
}

const LYING = ['hip', 'sh', 'head', 'kn', 'an', 'toe'] as MovementBase['fixed']

/** Supino reto: deitado no banco reto, cabeça à esquerda, pés no chão. */
const FLAT_SH: Point = [62, FLAT_BENCH.top - 6]
const FLAT_HIP: Point = [FLAT_SH[0] + BODY.torso, FLAT_SH[1]]
const FLAT_LEGS = feetOnFloor(FLAT_HIP, 150)
const FLAT = pressBase('supino-reto', LYING, 'hip', benchPress(FLAT_HIP, FLAT_SH, FLAT_LEGS, false), benchPress(FLAT_HIP, FLAT_SH, FLAT_LEGS, true))

/** Supino inclinado: costas no encosto inclinado, sentado no assento, a barra desce na parte de cima do peito. */
const [INC_LOW, INC_HIGH] = INCLINE_BENCH.back
const INC_HIP: Point = [INC_LOW[0] + 2, INC_LOW[1] - 7]
const INC_SH = polar(INC_HIP, BODY.torso, heading(INC_LOW, INC_HIGH))
const INC_LEGS = feetOnFloor(INC_HIP, 150)
const INCLINE = pressBase('supino-inclinado', LYING, 'hip', benchPress(INC_HIP, INC_SH, INC_LEGS, false), benchPress(INC_HIP, INC_SH, INC_LEGS, true))

/** Supino declinado: cabeça mais baixa que o quadril, pernas presas no rolo; a barra desce na parte de baixo do peito. */
const [DEC_LOW, DEC_HIGH] = DECLINE_BENCH.back
const DEC_HIP: Point = [DEC_HIGH[0] - 6, DEC_HIGH[1] - 7]
const DEC_SH = polar(DEC_HIP, BODY.torso, heading(DEC_HIGH, DEC_LOW))
const DEC_KN = polar(DEC_HIP, BODY.thigh, -38)
/** Tornozelo logo abaixo do rolo, que prende as pernas. */
const DEC_AN = polar(DEC_KN, BODY.shin, heading(DEC_KN, [DECLINE_BENCH.hook[0] - 4, DECLINE_BENCH.hook[1] - 7]))
const DEC_LEGS = { kn: DEC_KN, an: DEC_AN, toe: polar(DEC_AN, BODY.foot, -20) }
const DECLINE = pressBase('supino-declinado', LYING, 'hip', benchPress(DEC_HIP, DEC_SH, DEC_LEGS, false), benchPress(DEC_HIP, DEC_SH, DEC_LEGS, true))

/** Supino na máquina: sentado com as costas no encosto; as mãos empurram as pegadas para a frente. */
const MACH_HIP: Point = [SEAT.backX + 8, SEAT.top - 6]
const MACH_SH: Point = [MACH_HIP[0], MACH_HIP[1] - BODY.torso]
function chestPress(reach: number): Pose {
  const ha: Point = [MACH_SH[0] + reach, MACH_SH[1] + 6]
  const el = twoBone(MACH_SH, BODY.upperArm, ha, BODY.forearm, 'below')
  const kn = polar(MACH_HIP, BODY.thigh, 22)
  const an = polar(kn, BODY.shin, 88)
  return {
    head: [MACH_SH[0] + 2, MACH_SH[1] - BODY.neck], sh: MACH_SH, el: round(el), ha, hip: MACH_HIP, kn: round(kn), an: round(an),
    toe: round(polar(an, BODY.foot, FOOT_DEG)),
  }
}
const MACHINE = pressBase('supino-sentado', ['hip', 'sh', 'head', 'kn', 'an', 'toe'], 'seat', chestPress(ARM - 2), chestPress(16))

/**
 * Flexão: corpo reto das mãos aos pés, girando em volta do tornozelo; as mãos ficam paradas.
 * `body` é o ângulo do tornozelo para o ombro. `handX` define onde as mãos apoiam.
 */
const BODY_LEN = BODY.shin + BODY.thigh + BODY.torso
function plank(an: Point, toe: Point, ha: Point, shY: number, elbow: 'right' | 'below' = 'right', headTilt = -8): Pose {
  const sin = (an[1] - shY) / BODY_LEN
  const deg = 180 + (Math.asin(sin) * 180) / Math.PI
  const kn = polar(an, BODY.shin, deg)
  const hip = polar(an, BODY.shin + BODY.thigh, deg)
  const sh = polar(an, BODY_LEN, deg)
  const head = polar(sh, BODY.neck, deg + headTilt)
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, elbow)
  return { head: round(head), sh: round(sh), el: round(el), ha, hip: round(hip), kn: round(kn), an, toe }
}
/** Altura do ombro com o braço reto sobre a mão. */
const armsStraight = (ha: Point, an: Point) => {
  // ombro no círculo do corpo (raio BODY_LEN a partir do tornozelo) e a um braço da mão
  let lo = ha[1] - ARM
  let hi = ha[1]
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2
    const sh = polar(an, BODY_LEN, 180 + (Math.asin((an[1] - mid) / BODY_LEN) * 180) / Math.PI)
    if (Math.hypot(sh[0] - ha[0], sh[1] - ha[1]) > ARM - 1) lo = mid
    else hi = mid
  }
  return hi
}
const pushUp = (key: string, an: Point, toe: Point, ha: Point, bottomShY: number, elbow: 'right' | 'below' = 'right', headTilt = -8) =>
  pressBase(key, ['ha', 'an', 'toe'], 'hand', plank(an, toe, ha, armsStraight(ha, an), elbow, headTilt), plank(an, toe, ha, bottomShY, elbow, headTilt), 2400)

/** Flexão no chão. */
const FLOOR_AN: Point = [196, FLOOR_Y - 9]
const FLOOR_TOE = polar(FLOOR_AN, BODY.foot, 40)
const PUSH_UP = pushUp('flexao', FLOOR_AN, round(FLOOR_TOE), [64, FLOOR_Y - 3], FLOOR_Y - 16)

/** Flexão fechada (diamante): mãos juntas sob o peito, cotovelos rentes ao corpo. */
const CLOSE_PUSH_UP = pushUp('flexao-fechada', FLOOR_AN, round(FLOOR_TOE), [78, FLOOR_Y - 3], FLOOR_Y - 18, 'right')

/** Flexão declinada: pés no degrau, mãos no chão. */
const STEP_AN: Point = [STEP.x1 - 8, STEP.top - 8]
const STEP_TOE = round(polar(STEP_AN, BODY.foot, 40))
// O corpo inteiro mal cabe entre o degrau e a borda: a cabeça olha um pouco mais à frente para caber no quadro.
const DECLINE_PUSH_UP = pushUp('flexao-declinada', STEP_AN, STEP_TOE, [52, FLOOR_Y - 3], FLOOR_Y - 18, 'right', 28)

/** Flexão com mãos elevadas: mãos na borda do banco baixo, pés no chão. */
const INC_PU_AN: Point = [178, FLOOR_Y - 9]
const INC_PU_TOE = round(polar(INC_PU_AN, BODY.foot, 40))
const INCLINE_PUSH_UP = pushUp('flexao-inclinada', INC_PU_AN, INC_PU_TOE, [LOW_BENCH.x1 - 6, LOW_BENCH.top - 3], LOW_BENCH.top - 16)

export const EMPURRAR_HORIZONTAL: DemoFamily = {
  bases: [FLAT, INCLINE, DECLINE, MACHINE, PUSH_UP, CLOSE_PUSH_UP, DECLINE_PUSH_UP, INCLINE_PUSH_UP],
  demos: {
    'supino-reto-barra': { base: 'supino-reto', gear: 'barra', scene: 'banco-reto', implementAt: 'ha' },
    'supino-reto-halteres': {
      base: 'supino-reto',
      gear: 'halteres',
      scene: 'banco-reto',
      implementAt: 'ha',
      caption: 'Palmas para a frente, cotovelos a uns 45 graus do tronco',
    },
    'supino-pegada-neutra-halteres': {
      base: 'supino-reto',
      gear: 'halteres',
      scene: 'banco-reto',
      implementAt: 'ha',
      caption: 'Palmas voltadas uma para a outra, cotovelos junto ao tronco',
    },
    'supino-inclinado-barra': { base: 'supino-inclinado', gear: 'barra', scene: 'banco-inclinado', implementAt: 'ha' },
    'supino-inclinado-halteres': { base: 'supino-inclinado', gear: 'halteres', scene: 'banco-inclinado', implementAt: 'ha' },
    'supino-declinado-barra': { base: 'supino-declinado', gear: 'barra', scene: 'banco-declinado', implementAt: 'ha' },
    'supino-maquina': { base: 'supino-sentado', gear: 'maquina', scene: 'maquina', implementAt: 'ha' },
    'flexao-braco-corporal': { base: 'flexao', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
    'flexao-diamante-corporal': { base: 'flexao-fechada', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
    'flexao-declinada-corporal': { base: 'flexao-declinada', gear: 'peso-corporal', scene: 'degrau', implementAt: 'ha' },
    'flexao-maos-elevadas-corporal': { base: 'flexao-inclinada', gear: 'peso-corporal', scene: 'banco-baixo', implementAt: 'ha' },
  },
}

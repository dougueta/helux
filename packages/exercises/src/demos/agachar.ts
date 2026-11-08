/** Família "agachar": agachamentos, afundos, leg press e step-up (lote 1). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y, LOW_BENCH, RECLINED_SEAT, STEP } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import type { DemoFamily } from './index'
import {
  ANKLE_Y, FOOT_DEG, MIDFOOT, backRack, balanced, frontRack, goblet, handsAt, hangingArms, rearLeg, sidePose, straightArms,
  type Arms, type SideLegs,
} from './figure'

const FOOT: Point = [98, ANKLE_Y]
const STAND = { an: FOOT, shinDeg: -86, thighDeg: -94 }
const DEEP = { an: FOOT, shinDeg: -52, thighDeg: 186 }

const squatBase = (key: string, top: Pose, bottom: Pose, durationMs = 2800): MovementBase => ({
  key,
  view: 'side',
  loop: 'reps',
  durationMs,
  root: 'foot',
  fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: top },
    { at: 1, pose: bottom },
  ],
})

const atHands = (p: Pose) => p.ha
const atShoulder = (p: Pose) => p.sh

/** Agachamento com barra nas costas: quadril para trás, barra sobre o meio do pé. */
const BACK_SQUAT = squatBase('agachamento-costas', balanced(STAND, backRack, atHands), balanced(DEEP, backRack, atHands))

/** Agachamento frontal: tronco mais vertical, joelhos mais à frente, cotovelos altos. */
const FRONT_DEEP = { an: FOOT, shinDeg: -46, thighDeg: 184 }
const FRONT_SQUAT = squatBase('agachamento-frontal', balanced(STAND, frontRack, atHands), balanced(FRONT_DEEP, frontRack, atHands))

/** Goblet: o halter junto ao peito puxa o tronco para cima. */
const GOBLET = squatBase('agachamento-goblet', balanced(STAND, goblet, atHands), balanced(FRONT_DEEP, goblet, atHands))

/** Overhead: braços estendidos acima da cabeça, barra sobre o meio do pé. */
function overhead(legs: Omit<SideLegs, 'torsoDeg'>): Pose {
  const target = MIDFOOT(legs.an)
  // tronco sobre o meio do pé e braços retos até a vertical da barra
  return balanced(legs, (sh) => {
    const reach = BODY.upperArm + BODY.forearm
    const dx = target - sh[0]
    const deg = (Math.atan2(-Math.sqrt(Math.max(0, reach * reach - dx * dx)), dx) * 180) / Math.PI
    const el = polar(sh, BODY.upperArm, deg)
    return { el, ha: polar(el, BODY.forearm, deg) }
  }, atShoulder, target - 4)
}
const OVERHEAD = squatBase('agachamento-overhead', overhead(STAND), overhead(FRONT_DEEP), 3000)

/** Peso corporal: braços à frente para equilibrar. */
const armsForward = straightArms(() => 0)
const BODYWEIGHT = squatBase('agachamento-corporal', balanced(STAND, armsForward, atShoulder, MIDFOOT(FOOT) - 6), balanced(DEEP, armsForward, atShoulder, MIDFOOT(FOOT) - 4), 2400)

/** Box: senta na caixa atrás, com a canela quase vertical, e sobe sem perder a tensão. */
const BOX_FOOT: Point = [100, ANKLE_Y]
const BOX_BOTTOM = { an: BOX_FOOT, shinDeg: -78, thighDeg: 197 }
const BOX = squatBase(
  'agachamento-caixa',
  balanced({ ...STAND, an: BOX_FOOT }, backRack, atHands),
  balanced(BOX_BOTTOM, backRack, atHands),
)

/** Smith: a barra corre num trilho vertical, então fica na mesma linha em cima e embaixo; pés um pouco à frente. */
const SMITH_FOOT: Point = [104, ANKLE_Y]
const SMITH_BAR_X = 98
const SMITH = squatBase(
  'agachamento-smith',
  balanced({ an: SMITH_FOOT, shinDeg: -88, thighDeg: -96 }, backRack, atHands, SMITH_BAR_X),
  balanced({ an: SMITH_FOOT, shinDeg: -56, thighDeg: 190 }, backRack, atHands, SMITH_BAR_X),
)

/** Hack: costas apoiadas na almofada inclinada, pés à frente; o carrinho desce na direção dos pés. */
function hack(down: number): Pose {
  const an: Point = [132, ANKLE_Y]
  const hipTop: Point = [112, 156]
  const hip = polar(hipTop, down, 72)
  const kn = twoBone(an, BODY.shin, hip, BODY.thigh, 'right')
  const torsoDeg = -108
  const sh = polar(hip, BODY.torso, torsoDeg)
  const head = polar(sh, BODY.neck, torsoDeg + 6)
  const ha = polar(sh, 10, torsoDeg + 120)
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below')
  const toe = polar(an, BODY.foot, FOOT_DEG)
  return { head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip: round(hip), kn: round(kn), an, toe: round(toe) }
}
const HACK = squatBase('agachamento-hack', hack(0), hack(38))

/** Leg press 45°: costas no encosto, os pés empurram a plataforma na diagonal. */
function legPress(reach: number): Pose {
  const back = heading(RECLINED_SEAT.to, RECLINED_SEAT.from)
  const hip: Point = [88, 194]
  const sh = polar(hip, BODY.torso, back)
  const head = polar(sh, BODY.neck, back)
  const ha: Point = [80, 197]
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below')
  const push = -40
  const an = polar(hip, reach, push)
  const kn = twoBone(hip, BODY.thigh, an, BODY.shin, 'above')
  const toe = polar(an, BODY.foot, push - 90)
  return { head: round(head), sh: round(sh), el: round(el), ha, hip, kn: round(kn), an: round(an), toe: round(toe) }
}
const LEG_PRESS: MovementBase = {
  key: 'leg-press',
  view: 'side',
  loop: 'reps',
  durationMs: 2800,
  root: 'seat',
  fixed: ['hip', 'sh', 'head', 'el', 'ha'],
  keyframes: [
    { at: 0, pose: legPress(80) },
    { at: 1, pose: legPress(44) },
  ],
}

/**
 * Sumô de frente (o outro lado é espelhado): pés afastados e virados para fora, halter pendurado
 * no meio. Os joelhos abrem para os lados, então a coxa fica no plano da vista e mantém o tamanho.
 */
function sumo(hipY: number): Pose {
  const an: Point = [70, ANKLE_Y]
  const toe: Point = [62, ANKLE_Y + 4]
  const hip: Point = [100, hipY]
  const kn = twoBone(an, BODY.shin, hip, BODY.thigh, 'left')
  const sh: Point = [92, hipY - 58]
  const head: Point = [110, hipY - 80]
  const ha: Point = [108, hipY - 8]
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'left')
  return { head, sh, el: round(el), ha, hip, kn: round(kn), an, toe }
}
const SUMO: MovementBase = {
  key: 'agachamento-sumo',
  view: 'front',
  mirror: true,
  loop: 'reps',
  durationMs: 2800,
  root: 'foot',
  fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: sumo(158) },
    { at: 1, pose: sumo(196) },
  ],
}


/** Pernas montadas a partir do quadril: joelho da frente à frente, joelho de trás para baixo. */
function splitAtHip(hip: Point, an: Point, an2: Point, torsoDeg: number, arms: Arms, toe2Deg = 40): Pose {
  const kn = twoBone(an, BODY.shin, hip, BODY.thigh, 'right')
  const sh = polar(hip, BODY.torso, torsoDeg)
  const head = polar(sh, BODY.neck, torsoDeg + 6)
  const { el, ha } = arms(sh, torsoDeg)
  return {
    head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip, kn: round(kn), an, toe: round(polar(an, BODY.foot, FOOT_DEG)),
    ...rearLeg(hip, an2, toe2Deg),
  }
}

/** Afundo parado: pés afastados, frente e trás; o quadril desce reto até o joelho de trás quase tocar o chão. */
const SPLIT_FRONT: Point = [138, ANKLE_Y]
const SPLIT_REAR: Point = [70, FLOOR_Y - 10]
const SPLIT: MovementBase = {
  key: 'afundo-parado',
  view: 'side',
  loop: 'reps',
  durationMs: 2600,
  root: 'foot',
  fixed: ['an', 'toe', 'an2', 'toe2'],
  keyframes: [
    { at: 0, pose: splitAtHip([106, 162], SPLIT_FRONT, SPLIT_REAR, -90, hangingArms) },
    { at: 1, pose: splitAtHip([104, 194], SPLIT_FRONT, SPLIT_REAR, -88, hangingArms) },
  ],
}

/** Búlgaro: o peito do pé de trás apoiado no banco baixo; a perna da frente faz o trabalho. */
const BULG_FRONT: Point = [140, ANKLE_Y]
const BULG_REAR: Point = [LOW_BENCH.x1 - 6, LOW_BENCH.top - 7]
function bulgarian(front: Omit<SideLegs, 'torsoDeg' | 'an'>, torsoDeg: number): Pose {
  const p = sidePose({ an: BULG_FRONT, ...front, torsoDeg }, hangingArms)
  return { ...p, ...rearLeg(p.hip, BULG_REAR, 160) }
}
const BULGARIAN: MovementBase = {
  key: 'agachamento-bulgaro',
  view: 'side',
  loop: 'reps',
  durationMs: 2800,
  root: 'foot',
  fixed: ['an', 'toe', 'an2', 'toe2'],
  keyframes: [
    { at: 0, pose: bulgarian({ shinDeg: -96, thighDeg: -108 }, -84) },
    { at: 1, pose: bulgarian({ shinDeg: -68, thighDeg: 192 }, -72) },
  ],
}

/** Afundo reverso: o pé da frente fica parado; o de trás dá um passo para trás e o quadril desce. */
const REV_FRONT: Point = [130, ANKLE_Y]
function reverseStand(): Pose {
  const p = sidePose({ an: REV_FRONT, shinDeg: -90, thighDeg: -90, torsoDeg: -90 }, hangingArms)
  return { ...p, kn2: p.kn, an2: [REV_FRONT[0] - 4, ANKLE_Y], toe2: round(polar([REV_FRONT[0] - 4, ANKLE_Y], BODY.foot, FOOT_DEG)) }
}
function reverseStep(): Pose {
  const p = sidePose({ an: REV_FRONT, shinDeg: -94, thighDeg: -110, torsoDeg: -92 }, hangingArms)
  const an2: Point = [98, 214]
  const kn2 = twoBone(p.hip, BODY.thigh, an2, BODY.shin, 'below')
  return { ...p, kn2: round(kn2), an2, toe2: round(polar(an2, BODY.foot, 70)) }
}
function reverseBottom(): Pose {
  const p = sidePose({ an: REV_FRONT, shinDeg: -78, thighDeg: 182, torsoDeg: -88 }, hangingArms)
  return { ...p, ...rearLeg(p.hip, [64, FLOOR_Y - 10]) }
}
const REVERSE_LUNGE: MovementBase = {
  key: 'afundo-reverso',
  view: 'side',
  loop: 'reps',
  durationMs: 2600,
  root: 'foot',
  fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: reverseStand() },
    { at: 0.45, pose: reverseStep() },
    { at: 1, pose: reverseBottom() },
  ],
}

/** Step-up: o pé da frente fica no degrau; o corpo sobe e o pé de trás vem do chão até o degrau. */
const STEP_FOOT: Point = [146, STEP.top - 6]
function stepStart(): Pose {
  const p = sidePose({ an: STEP_FOOT, shinDeg: -62, thighDeg: 192, torsoDeg: -72 }, hangingArms)
  const an2: Point = [112, ANKLE_Y]
  const kn2 = twoBone(p.hip, BODY.thigh, an2, BODY.shin, 'right')
  return { ...p, kn2: round(kn2), an2, toe2: round(polar(an2, BODY.foot, FOOT_DEG)) }
}
function stepMid(): Pose {
  const p = sidePose({ an: STEP_FOOT, shinDeg: -80, thighDeg: -100, torsoDeg: -84 }, hangingArms)
  const kn2 = polar(p.hip, BODY.thigh, 20)
  const an2 = polar(kn2, BODY.shin, 105)
  return { ...p, kn2: round(kn2), an2: round(an2), toe2: round(polar(an2, BODY.foot, 10)) }
}
function stepTop(): Pose {
  const p = sidePose({ an: STEP_FOOT, shinDeg: -89, thighDeg: -91, torsoDeg: -90 }, hangingArms)
  const an2: Point = [STEP_FOOT[0] - 6, STEP_FOOT[1]]
  const kn2 = twoBone(p.hip, BODY.thigh, an2, BODY.shin, 'right')
  return { ...p, kn2: round(kn2), an2, toe2: round(polar(an2, BODY.foot, FOOT_DEG)) }
}
const STEP_UP: MovementBase = {
  key: 'step-up',
  view: 'side',
  loop: 'reps',
  durationMs: 3000,
  root: 'foot',
  fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: stepStart() },
    { at: 0.5, pose: stepMid() },
    { at: 1, pose: stepTop() },
  ],
}

/** Pistol assistido: agacha numa perna só, com a outra estendida à frente e os braços à frente para equilibrar. */
const PISTOL_FOOT: Point = [112, ANKLE_Y]
function pistol(legs: Omit<SideLegs, 'an'>, freeDeg: number): Pose {
  const p = sidePose({ an: PISTOL_FOOT, ...legs }, armsForward)
  const kn2 = polar(p.hip, BODY.thigh, freeDeg)
  const an2 = polar(kn2, BODY.shin, freeDeg)
  return { ...p, kn2: round(kn2), an2: round(an2), toe2: round(polar(an2, BODY.foot, freeDeg - 80)) }
}
const PISTOL: MovementBase = {
  key: 'agachamento-unilateral',
  view: 'side',
  loop: 'reps',
  durationMs: 3200,
  root: 'foot',
  fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: pistol({ shinDeg: -86, thighDeg: -94, torsoDeg: -84 }, 70) },
    { at: 1, pose: pistol({ shinDeg: -46, thighDeg: 196, torsoDeg: -50 }, -4) },
  ],
}

export const AGACHAR: DemoFamily = {
  bases: [BACK_SQUAT, FRONT_SQUAT, GOBLET, OVERHEAD, BODYWEIGHT, BOX, SMITH, HACK, LEG_PRESS, SUMO, SPLIT, BULGARIAN, REVERSE_LUNGE, STEP_UP, PISTOL],
  demos: {
    'agachamento-livre-barra': { base: 'agachamento-costas', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'agachamento-frontal-barra': { base: 'agachamento-frontal', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'agachamento-goblet-halteres': { base: 'agachamento-goblet', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'agachamento-overhead-barra': { base: 'agachamento-overhead', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'agachamento-livre-corporal': { base: 'agachamento-corporal', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
    'agachamento-box-barra': { base: 'agachamento-caixa', gear: 'barra', scene: 'banco-baixo', implementAt: 'ha' },
    'agachamento-smith-maquina': { base: 'agachamento-smith', gear: 'smith', scene: 'solo', implementAt: 'ha' },
    'agachamento-hack-maquina': { base: 'agachamento-hack', gear: 'maquina', scene: 'solo', implementAt: 'sh' },
    'leg-press-45': { base: 'leg-press', gear: 'maquina', scene: 'assento-reclinado', implementAt: 'an' },
    'agachamento-sumo-halteres': { base: 'agachamento-sumo', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'afundo-halteres': { base: 'afundo-parado', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'agachamento-bulgaro-halteres': { base: 'agachamento-bulgaro', gear: 'halteres', scene: 'banco-baixo', implementAt: 'ha' },
    'afundo-reverso-corporal': { base: 'afundo-reverso', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
    'step-up-halteres': { base: 'step-up', gear: 'halteres', scene: 'degrau', implementAt: 'ha' },
    'pistol-squat-assistido': { base: 'agachamento-unilateral', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
  },
}

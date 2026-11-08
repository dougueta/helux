/** Família "dobrar o quadril": terras, stiffs, elevações pélvicas, swing e hiperextensão (lote 2). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y, LOW_BENCH, ROMAN_CHAIR } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, FOOT_DEG, backRack, balanced, sidePose, straightArms } from './figure'
import type { DemoFamily } from './index'

/**
 * Braços das variações de terra. A figura tem braços curtos para o tamanho da coxa e do tronco; com eles,
 * a barra no chão obrigaria o quadril a ficar abaixo do joelho (um agachamento). Nesta família os braços
 * são um pouco mais longos, e continuam iguais entre os keyframes de cada base.
 */
const UPPER_ARM = 34
const FOREARM = 32
const ARM = UPPER_ARM + FOREARM
/** Braço padrão da figura, nas bases em que ele não segura a barra do chão. */
const BODY_ARM = BODY.upperArm + BODY.forearm

const reps = (key: string, fixed: MovementBase['fixed'], poses: Pose[], durationMs = 2800, root: MovementBase['root'] = 'foot'): MovementBase => ({
  key,
  view: 'side',
  loop: 'reps',
  durationMs,
  root,
  fixed,
  keyframes: poses.map((pose, i) => ({ at: i / (poses.length - 1), pose })),
})

/**
 * Dobradiça de perfil com os braços retos segurando a barra. Sem `barX`, os braços caem quase na vertical
 * (em pé, barra na frente das coxas); com `barX`, inclinam para trás até a barra passar rente à canela.
 */
function hinge(an: Point, shinDeg: number, thighDeg: number, torsoDeg: number, barX?: number): Pose {
  const kn = polar(an, BODY.shin, shinDeg)
  const hip = polar(kn, BODY.thigh, thighDeg)
  const sh = polar(hip, BODY.torso, torsoDeg)
  const armDeg = barX === undefined ? 95 : 180 - (Math.acos((sh[0] - barX) / ARM) * 180) / Math.PI
  const el = polar(sh, UPPER_ARM, armDeg)
  const ha = polar(el, FOREARM, armDeg)
  const head = polar(sh, BODY.neck, torsoDeg + 10)
  return {
    head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip: round(hip), kn: round(kn), an, toe: round(polar(an, BODY.foot, FOOT_DEG)),
  }
}

const FOOT: Point = [98, ANKLE_Y]
const LOCKOUT = hinge(FOOT, -88, -92, -90)

/** Terra: a barra sai do chão rente à canela, com o quadril acima do joelho, e sobe até o corpo ereto. */
const DEADLIFT = reps('terra', ['an', 'toe'], [hinge(FOOT, -70, -165, -32, 112), LOCKOUT], 3000)

/** Romeno: joelhos levemente dobrados e quase parados; o quadril vai para trás até a barra chegar ao joelho. */
const RDL = reps('terra-romeno', ['an', 'toe'], [LOCKOUT, hinge(FOOT, -80, -118, -22, 113)], 3000)

/** Stiff: joelhos quase estendidos, tronco perto da horizontal, barra até o meio da canela. */
const STIFF = reps('stiff', ['an', 'toe'], [LOCKOUT, hinge(FOOT, -86, -116, -4, 110)], 3000)

/** Good morning: barra nas costas; o tronco inclina até perto da horizontal, joelhos levemente dobrados. */
const GOOD_MORNING = reps('good-morning', ['an', 'toe'], [
  balanced({ an: FOOT, shinDeg: -86, thighDeg: -94 }, backRack, (p) => p.ha),
  sidePose({ an: FOOT, shinDeg: -82, thighDeg: -122, torsoDeg: -14 }, backRack),
], 3000)

/** Braço longo solto na vertical, com o halter. */
const longHanging = (sh: Point) => {
  const el = polar(sh, UPPER_ARM, 91)
  return { el, ha: polar(el, FOREARM, 90) }
}

/** Terra unilateral: numa perna só, o tronco desce enquanto a outra perna sobe atrás, em linha com ele. */
function singleLeg(thighDeg: number, torsoDeg: number): Pose {
  const p = sidePose({ an: [116, ANKLE_Y], shinDeg: -84, thighDeg, torsoDeg }, longHanging)
  const back = torsoDeg + 180
  const kn2 = polar(p.hip, BODY.thigh, back)
  const an2 = polar(kn2, BODY.shin, back)
  return { ...p, kn2: round(kn2), an2: round(an2), toe2: round(polar(an2, BODY.foot, back + 80)) }
}
const SINGLE_LEG = reps('terra-unilateral', ['an', 'toe'], [singleLeg(-92, -90), singleLeg(-104, -12)], 3200)

/** Sumô de frente (espelhado): pés afastados e para fora, mãos por dentro dos joelhos, tronco mais vertical. */
const SUMO_TORSO = 44
function sumoDeadlift(barY: number): Pose {
  const an: Point = [70, ANKLE_Y]
  const ha: Point = [94, barY]
  const sh: Point = [92, barY - ARM]
  const el: Point = [93, sh[1] + UPPER_ARM]
  const hip: Point = [100, sh[1] + SUMO_TORSO]
  const kn = twoBone(an, BODY.shin, hip, BODY.thigh, 'left')
  return { head: [110, sh[1] - 22], sh, el, ha, hip, kn: round(kn), an, toe: [62, ANKLE_Y + 4] }
}
const SUMO: MovementBase = {
  key: 'terra-sumo',
  view: 'front',
  mirror: true,
  loop: 'reps',
  durationMs: 3000,
  root: 'foot',
  fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: sumoDeadlift(FLOOR_Y - 22) },
    { at: 1, pose: sumoDeadlift(180) },
  ],
}

/** Kettlebell swing: o quadril vai para trás com o peso entre as pernas e estende rápido, levando o peso até o peito. */
const SWING = reps('swing', ['an', 'toe'], [
  sidePose({ an: FOOT, shinDeg: -74, thighDeg: -140, torsoDeg: -28 }, straightArms(() => 104)),
  sidePose({ an: FOOT, shinDeg: -88, thighDeg: -92, torsoDeg: -92 }, straightArms(() => -6)),
], 1600)

/** Pull-through: de costas para a polia baixa, a corda passa entre as pernas; o quadril vai para trás e volta. */
const PULL_THROUGH = reps('pull-through', ['an', 'toe'], [
  sidePose({ an: [112, ANKLE_Y], shinDeg: -88, thighDeg: -92, torsoDeg: -90 }, straightArms(() => 96)),
  sidePose({ an: [112, ANKLE_Y], shinDeg: -78, thighDeg: -128, torsoDeg: -34 }, straightArms(() => 112)),
], 2800)

/**
 * Elevação pélvica com as costas no banco baixo: o ombro fica apoiado na borda e o quadril gira em volta dele,
 * do chão até alinhar com as coxas.
 */
const THRUST_SH: Point = [LOW_BENCH.x1 - 4, LOW_BENCH.top - 4]
const THRUST_FOOT: Point = [164, ANKLE_Y]
function thrust(torsoUp: number): Pose {
  const hip = polar(THRUST_SH, BODY.torso, torsoUp)
  const kn = twoBone(hip, BODY.thigh, THRUST_FOOT, BODY.shin, 'above')
  const toHip = heading(THRUST_SH, hip)
  const head = polar(THRUST_SH, BODY.neck, toHip + 180 - 25)
  const ha = polar(THRUST_SH, BODY_ARM - 4, toHip - 6)
  const el = twoBone(THRUST_SH, BODY.upperArm, ha, BODY.forearm, 'above')
  return { head: round(head), sh: THRUST_SH, el: round(el), ha: round(ha), hip: round(hip), kn: round(kn), an: THRUST_FOOT, toe: round(polar(THRUST_FOOT, BODY.foot, FOOT_DEG)) }
}
const HIP_THRUST = reps('elevacao-pelvica-banco', ['an', 'toe', 'sh'], [thrust(36), thrust(-6)], 2600)

/** Ponte no solo: ombros e braços no chão; o quadril sobe até alinhar ombro, quadril e joelho. */
const BRIDGE_SH: Point = [58, FLOOR_Y - 8]
const BRIDGE_FOOT: Point = [150, ANKLE_Y]
function bridge(up: number, freeLeg = false): Pose {
  const hip = polar(BRIDGE_SH, BODY.torso, -up)
  const kn = twoBone(hip, BODY.thigh, BRIDGE_FOOT, BODY.shin, 'above')
  const ha: Point = [BRIDGE_SH[0] + BODY_ARM - 2, FLOOR_Y - 6]
  const el = polar(BRIDGE_SH, BODY.upperArm, heading(BRIDGE_SH, ha))
  const pose: Pose = {
    head: round(polar(BRIDGE_SH, BODY.neck, 180)), sh: BRIDGE_SH, el: round(el), ha, hip: round(hip), kn: round(kn), an: BRIDGE_FOOT,
    toe: round(polar(BRIDGE_FOOT, BODY.foot, FOOT_DEG)),
  }
  if (!freeLeg) return pose
  // perna livre estendida, na linha da coxa de apoio
  const line = heading(hip, kn)
  const kn2 = polar(hip, BODY.thigh, line)
  const an2 = polar(kn2, BODY.shin, line)
  return { ...pose, kn2: round(kn2), an2: round(an2), toe2: round(polar(an2, BODY.foot, line - 80)) }
}
const BRIDGE = reps('ponte', ['an', 'toe', 'sh', 'el', 'ha'], [bridge(4), bridge(28)], 2400)
const SINGLE_BRIDGE = reps('ponte-unilateral', ['an', 'toe', 'sh', 'el', 'ha'], [bridge(4, true), bridge(26, true)], 2600)

/** Hiperextensão no banco romano: quadril no apoio, pernas presas; o tronco desce e volta à linha das pernas. */
const ROMAN_HIP: Point = [ROMAN_CHAIR.x1 - 4, ROMAN_CHAIR.top - 6]
function hyper(torsoDeg: number): Pose {
  const kn = polar(ROMAN_HIP, BODY.thigh, 180)
  const an = polar(kn, BODY.shin, 180)
  const sh = polar(ROMAN_HIP, BODY.torso, torsoDeg)
  // braços cruzados no peito
  const ha = polar(sh, 14, torsoDeg + 160)
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below')
  return {
    head: round(polar(sh, BODY.neck, torsoDeg - 6)), sh: round(sh), el: round(el), ha: round(ha), hip: ROMAN_HIP, kn: round(kn), an: round(an),
    toe: round(polar(an, BODY.foot, -100)),
  }
}
const HYPER = reps('hiperextensao', ['hip', 'kn', 'an', 'toe'], [hyper(0), hyper(78)], 2800, 'hip')

export const DOBRAR_QUADRIL: DemoFamily = {
  bases: [DEADLIFT, RDL, STIFF, GOOD_MORNING, SINGLE_LEG, SUMO, SWING, PULL_THROUGH, HIP_THRUST, BRIDGE, SINGLE_BRIDGE, HYPER],
  demos: {
    'levantamento-terra-barra': { base: 'terra', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'levantamento-terra-romeno-barra': { base: 'terra-romeno', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'levantamento-terra-romeno-halteres': { base: 'terra-romeno', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'stiff-barra': { base: 'stiff', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'stiff-halteres': { base: 'stiff', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'good-morning-barra': { base: 'good-morning', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'terra-halteres-unilateral': { base: 'terra-unilateral', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'levantamento-terra-sumo-barra': { base: 'terra-sumo', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'kettlebell-swing': { base: 'swing', gear: 'kettlebell', scene: 'solo', implementAt: 'ha' },
    'pull-through-cabo': { base: 'pull-through', gear: 'cabo', scene: 'solo', implementAt: 'ha', anchor: [14, FLOOR_Y - 14] },
    'elevacao-pelvica-barra': { base: 'elevacao-pelvica-banco', gear: 'barra', scene: 'banco-baixo', implementAt: 'hip' },
    'elevacao-pelvica-maquina': { base: 'elevacao-pelvica-banco', gear: 'maquina', scene: 'banco-baixo', implementAt: 'hip' },
    'elevacao-pelvica-corporal': { base: 'ponte', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'hip' },
    'elevacao-pelvica-unilateral': { base: 'ponte-unilateral', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'hip' },
    'hiperextensao-lombar-banco': { base: 'hiperextensao', gear: 'banco', scene: 'banco-romano', implementAt: 'ha' },
  },
}

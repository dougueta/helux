/** Família "core": pranchas, anti-rotação, rollouts, abdominais e rotações. */
import { BODY, heading, mirrorX, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y, MAT, PULL_UP_BAR, WALL_X } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, sidePose, type SideLegs } from './figure'
import type { DemoFamily } from './index'

/** Linha das articulações apoiadas no colchonete (metade da espessura do traço acima do tampo). */
const MAT_Y = MAT.top - 4
const LEG = BODY.thigh + BODY.shin
const BODY_LINE = BODY.shin + BODY.thigh + BODY.torso

const base = (key: string, loop: MovementBase['loop'], root: MovementBase['root'], fixed: MovementBase['fixed'], start: Pose, end: Pose, durationMs = 2600, view: MovementBase['view'] = 'side'): MovementBase => ({
  key,
  view,
  loop,
  durationMs,
  root,
  fixed,
  keyframes: [
    { at: 0, pose: start },
    { at: 1, pose: end },
  ],
})

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose

/** Corpo reto do tornozelo `an` ao ombro `sh`: joelho e quadril sobre a reta. */
function straightLine(an: Point, sh: Point) {
  const deg = heading(an, sh)
  return { kn: polar(an, BODY.shin, deg), hip: polar(an, LEG, deg), deg }
}

/** Ponta do pé apoiada no colchonete, a partir do tornozelo (o pé aponta para baixo e para trás). */
const toeDown = (an: Point): Point => {
  const dy = MAT_Y - an[1]
  return [an[0] - Math.sqrt(Math.max(0, BODY.foot ** 2 - dy * dy)), MAT_Y]
}

/* ---------------------------------------------------------------- prancha nos antebraços */

/** Antebraços no colchonete, cotovelo sob o ombro; o corpo sobe dos joelhos até ficar reto. */
const PL_EL: Point = [172, MAT_Y]
const PL_HA: Point = [PL_EL[0] + BODY.forearm, MAT_Y]
const PL_SH: Point = [PL_EL[0], MAT_Y - BODY.upperArm]
const PL_AN_Y = MAT_Y - 13.6
const PL_AN: Point = [PL_SH[0] - Math.sqrt(BODY_LINE ** 2 - (PL_SH[1] - PL_AN_Y) ** 2), PL_AN_Y]
const PL_TOE = toeDown(PL_AN)

function forearmPlank(): Pose {
  const { kn, hip, deg } = straightLine(PL_AN, PL_SH)
  return r({ head: polar(PL_SH, BODY.neck, deg + 6), sh: PL_SH, el: PL_EL, ha: PL_HA, hip, kn, an: PL_AN, toe: PL_TOE })
}
/** Apoio nos joelhos: canela deitada, pé estendido até a mesma ponta do pé. */
function kneelingPlank(): Pose {
  const an: Point = [PL_TOE[0] + BODY.foot, MAT_Y]
  const kn: Point = [an[0] + BODY.shin, MAT_Y]
  const hip = twoBone(kn, BODY.thigh, PL_SH, BODY.torso, 'above')
  return r({ head: polar(PL_SH, BODY.neck, heading(hip, PL_SH) + 6), sh: PL_SH, el: PL_EL, ha: PL_HA, hip, kn, an, toe: PL_TOE })
}
const PLANK = base('prancha', 'hold', 'hand', ['ha', 'el', 'sh', 'toe'], kneelingPlank(), forearmPlank(), 4000)

/* ---------------------------------------------------------------- prancha lateral */

/**
 * Prancha lateral vista de frente: cotovelo sob o ombro, antebraço apontando para quem olha (encurtado),
 * pés empilhados. O quadril sai do colchonete até o corpo ficar reto; o braço de cima aponta para o teto.
 */
const SP_FOREARM = 12
const SP_EL: Point = [170, MAT_Y]
const SP_HA: Point = [SP_EL[0] + SP_FOREARM, MAT_Y]
const SP_SH_UP: Point = [SP_EL[0], MAT_Y - BODY.upperArm]
const SP_AN: Point = [SP_SH_UP[0] - Math.sqrt(BODY_LINE ** 2 - BODY.upperArm ** 2) + 0.05, MAT_Y]
const SP_TOE = polar(SP_AN, BODY.foot, -80)

function sidePlank(lifted: boolean): Pose {
  let sh: Point, hip: Point, kn: Point
  if (lifted) {
    sh = SP_SH_UP
    ;({ kn, hip } = straightLine(SP_AN, sh))
  } else {
    hip = [SP_AN[0] + LEG, MAT_Y]
    kn = [SP_AN[0] + BODY.shin, MAT_Y]
    sh = twoBone(hip, BODY.torso, SP_EL, BODY.upperArm, 'above')
  }
  const up = heading(hip, sh)
  const el2 = polar(sh, BODY.upperArm, -90)
  return r({ head: polar(sh, BODY.neck, up), sh, el: SP_EL, ha: SP_HA, hip, kn, an: SP_AN, toe: SP_TOE, el2, ha2: polar(el2, BODY.forearm, -90) })
}
const SIDE_PLANK = base('prancha-lateral', 'hold', 'hand', ['ha', 'el', 'an', 'toe'], sidePlank(false), sidePlank(true), 4000)

/* ---------------------------------------------------------------- prancha alta */

/** Prancha alta: mãos sob os ombros, braços estendidos, corpo reto até a ponta dos pés. */
const HP_HA: Point = [170, MAT_Y]
const HP_EL: Point = [HP_HA[0], MAT_Y - BODY.forearm]
const HP_SH: Point = [HP_HA[0], HP_EL[1] - BODY.upperArm]
const HP_AN_Y = MAT_Y - 13.6
const HP_AN: Point = [HP_SH[0] - Math.sqrt(BODY_LINE ** 2 - (HP_SH[1] - HP_AN_Y) ** 2), HP_AN_Y]

function highPlank(el2: Point, ha2: Point): Pose {
  const { kn, hip, deg } = straightLine(HP_AN, HP_SH)
  return r({ head: polar(HP_SH, BODY.neck, deg + 6), sh: HP_SH, el: HP_EL, ha: HP_HA, hip, kn, an: HP_AN, toe: toeDown(HP_AN), el2, ha2 })
}
const HIGH_FIXED: MovementBase['fixed'] = ['ha', 'el', 'sh', 'head', 'hip', 'kn', 'an', 'toe']

/** Prancha com rotação: o braço livre sai do colchonete e aponta para o teto; depois troca o lado. */
const PLANK_ROTATION = base(
  'prancha-rotacao',
  'alternate',
  'hand',
  HIGH_FIXED,
  highPlank([HP_EL[0] - 0.5, HP_EL[1]], [HP_HA[0] - 0.5, HP_HA[1]]),
  highPlank(polar(HP_SH, BODY.upperArm, -90), polar(HP_SH, BODY.upperArm + BODY.forearm, -90)),
  3000,
)

/** Toque no ombro: a mão livre sai do colchonete e toca o ombro oposto; depois troca o lado. */
const TOUCH: Point = [HP_SH[0] - 7, HP_SH[1] + 3]
const SHOULDER_TAP = base(
  'prancha-toque-ombro',
  'alternate',
  'hand',
  HIGH_FIXED,
  highPlank([HP_EL[0] - 0.5, HP_EL[1]], [HP_HA[0] - 0.5, HP_HA[1]]),
  highPlank(twoBone(HP_SH, BODY.upperArm, TOUCH, BODY.forearm, 'below'), TOUCH),
  2000,
)

/* ---------------------------------------------------------------- deitado de costas */

/** Deitado de costas, cabeça à direita: quadril e ombro no colchonete. */
const SUP_HIP: Point = [92, MAT_Y]
const SUP_SH: Point = [SUP_HIP[0] + BODY.torso, MAT_Y]
/** Cabeça deitada, um pouco erguida para o círculo não atravessar o colchonete. */
const lyingHead = (sh: Point) => polar(sh, BODY.neck, -32)
const SUP_HEAD = lyingHead(SUP_SH)

/** Perna de mesa: coxa vertical, canela paralela ao chão, pé para cima. */
function tabletopLeg(hip: Point) {
  const kn = polar(hip, BODY.thigh, -90)
  const an = polar(kn, BODY.shin, 180)
  return { kn, an, toe: polar(an, BODY.foot, -100) }
}
const armUp = (sh: Point) => ({ el: polar(sh, BODY.upperArm, -90), ha: polar(sh, BODY.upperArm + BODY.forearm, -90) })

/** Dead bug: braço e perna opostos se estendem rente ao chão; o outro par segura a posição. */
function deadBug(extended: boolean): Pose {
  const hold = tabletopLeg(SUP_HIP)
  const up = armUp(SUP_SH)
  const arm = extended ? { el: polar(SUP_SH, BODY.upperArm, -38), ha: polar(SUP_SH, BODY.upperArm + BODY.forearm, -38) } : up
  const leg = extended
    ? (() => {
        const kn = polar(SUP_HIP, BODY.thigh, 206)
        const an = polar(kn, BODY.shin, 206)
        return { kn, an, toe: polar(an, BODY.foot, 296) }
      })()
    : hold
  return r({
    head: SUP_HEAD, sh: SUP_SH, hip: SUP_HIP, ...arm, ...leg,
    el2: up.el, ha2: up.ha, kn2: hold.kn, an2: hold.an, toe2: hold.toe,
  })
}
const DEAD_BUG = base('dead-bug', 'alternate', 'hip', ['hip', 'sh', 'head', 'el2', 'ha2', 'kn2', 'an2', 'toe2'], deadBug(false), deadBug(true), 3000)

/** Hollow: de joelhos dobrados e braços ao lado, ombros e pernas estendidas sobem do chão e ficam. */
const HOLLOW_HIP: Point = [98, MAT_Y]
function hollow(up: boolean): Pose {
  const hip = HOLLOW_HIP
  if (!up) {
    const an: Point = [hip[0] - 58, MAT_Y]
    const kn = twoBone(hip, BODY.thigh, an, BODY.shin, 'above')
    const sh: Point = [hip[0] + BODY.torso, MAT_Y]
    return r({ head: lyingHead(sh), sh, el: [sh[0] - BODY.upperArm, MAT_Y], ha: [sh[0] - BODY.upperArm - BODY.forearm, MAT_Y], hip, kn, an, toe: polar(an, BODY.foot, -80) })
  }
  const legDeg = 200
  const kn = polar(hip, BODY.thigh, legDeg)
  const an = polar(kn, BODY.shin, legDeg)
  const sh = polar(hip, BODY.torso, -18)
  const el = polar(sh, BODY.upperArm, -32)
  return r({ head: polar(sh, BODY.neck, -24), sh, el, ha: polar(el, BODY.forearm, -32), hip, kn, an, toe: polar(an, BODY.foot, legDeg + 80) })
}
const HOLLOW = base('hollow', 'hold', 'hip', ['hip'], hollow(false), hollow(true), 4000)

/* ---------------------------------------------------------------- pallof */

/** Em pé, parado; só os braços se movem. */
const STANDING: SideLegs = { an: [92, ANKLE_Y], shinDeg: -88, thighDeg: -92, torsoDeg: -90 }
const PALLOF = base(
  'pallof',
  'reps',
  'foot',
  ['an', 'toe', 'kn', 'hip', 'sh', 'head'],
  sidePose(STANDING, (sh) => {
    const ha: Point = [sh[0] + 12, sh[1] + 20]
    return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below'), ha }
  }),
  sidePose(STANDING, (sh) => {
    const ha: Point = [sh[0] + 54, sh[1] + 20]
    return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below'), ha }
  }),
  2800,
)
/** A polia fica ao lado do corpo, na altura do peito; de perfil, o cabo vem de trás. */
const PALLOF_ANCHOR: Point = [16, PALLOF.keyframes[0].pose.ha[1]]

/* ---------------------------------------------------------------- rollout */

/** Rollout ajoelhado: joelhos fixos, a roda (ou a barra) rola à frente até o corpo quase se alinhar. */
const RO_KN: Point = [66, MAT_Y]
const RO_AN = polar(RO_KN, BODY.shin, 196)
const RO_TOE = toeDown(RO_AN)
const RO_HAND_Y = MAT.top - 11
function rollout(thighDeg: number, handX: number): Pose {
  const hip = polar(RO_KN, BODY.thigh, thighDeg)
  const ha: Point = [handX, RO_HAND_Y]
  const sh = twoBone(hip, BODY.torso, ha, BODY.upperArm + BODY.forearm - 1, 'above')
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'above')
  return r({ head: polar(sh, BODY.neck, heading(hip, sh) - 4), sh, el, ha, hip, kn: RO_KN, an: RO_AN, toe: RO_TOE })
}
const ROLLOUT = base('rollout', 'reps', 'foot', ['an', 'toe', 'kn'], rollout(-72, 126), rollout(-26, 196), 3200)

/* ---------------------------------------------------------------- abdominais deitado */

/** Mãos atrás da cabeça: cotovelos apontando para cima, a partir do tronco no ângulo `t`. */
function handsBehindHead(sh: Point, t: number) {
  const ha = polar(sh, 18, t - 8)
  return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'above'), ha }
}

/** Abdominal supra: joelhos dobrados e pés no chão; o tronco enrola e tira os ombros do colchonete. */
const CR_HIP: Point = [100, MAT_Y]
const CR_AN: Point = [CR_HIP[0] - 58, MAT_Y]
const CR_KN = twoBone(CR_HIP, BODY.thigh, CR_AN, BODY.shin, 'above')
function crunch(t: number): Pose {
  const sh = polar(CR_HIP, BODY.torso, t)
  return r({ head: polar(sh, BODY.neck, t - 32), sh, ...handsBehindHead(sh, t), hip: CR_HIP, kn: CR_KN, an: CR_AN, toe: [CR_AN[0] - BODY.foot, MAT_Y] })
}
const CRUNCH = base('abdominal-supra', 'reps', 'hip', ['hip', 'kn', 'an', 'toe'], crunch(0), crunch(-30), 2400)

/** Abdominal infra: deitado, braços ao lado do corpo; as pernas estendidas sobem até apontar para o teto. */
const LR_HIP: Point = [104, MAT_Y]
const LR_SH: Point = [LR_HIP[0] + BODY.torso, MAT_Y]
function legRaise(deg: number): Pose {
  const kn = polar(LR_HIP, BODY.thigh, deg)
  const an = polar(kn, BODY.shin, deg)
  return r({
    head: lyingHead(LR_SH), sh: LR_SH, el: [LR_SH[0] - BODY.upperArm, MAT_Y], ha: [LR_SH[0] - BODY.upperArm - BODY.forearm, MAT_Y],
    hip: LR_HIP, kn, an, toe: polar(an, BODY.foot, deg + 90),
  })
}
const LEG_RAISE = base('abdominal-infra', 'reps', 'hip', ['hip', 'sh', 'head', 'el', 'ha'], legRaise(192), legRaise(266), 2600)

/** Bicicleta: ombros fora do chão; um joelho vem ao peito enquanto a outra perna estende, e troca. */
const BI_HIP: Point = [100, MAT_Y]
const BI_T = -26
const BI_SH = polar(BI_HIP, BODY.torso, BI_T)
function bikeLeg(thighDeg: number, shinDeg: number) {
  const kn = polar(BI_HIP, BODY.thigh, thighDeg)
  const an = polar(kn, BODY.shin, shinDeg)
  return { kn, an, toe: polar(an, BODY.foot, shinDeg + 90) }
}
function bicycle(tucked: boolean): Pose {
  const mid = bikeLeg(-90, 180)
  const main = tucked ? bikeLeg(-50, 178) : mid
  const other = tucked ? bikeLeg(200, 200) : mid
  return r({
    head: polar(BI_SH, BODY.neck, BI_T - 32), sh: BI_SH, ...handsBehindHead(BI_SH, BI_T), hip: BI_HIP, ...main,
    kn2: other.kn, an2: other.an, toe2: other.toe,
  })
}
const BICYCLE = base('abdominal-bicicleta', 'alternate', 'hip', ['hip', 'sh', 'head', 'el', 'ha'], bicycle(false), bicycle(true), 2400)

/* ---------------------------------------------------------------- elevação de pernas na barra */

/** Pendurado na barra fixa, braços estendidos; as pernas estendidas sobem até a altura do quadril. */
const HG_HA: Point = [110, PULL_UP_BAR.y + 2]
const HG_SH: Point = [HG_HA[0] - 4, HG_HA[1] + BODY.upperArm + BODY.forearm - 1]
const HG_EL = twoBone(HG_SH, BODY.upperArm, HG_HA, BODY.forearm, 'right')
const HG_HIP = polar(HG_SH, BODY.torso, 92)
function hangingLegs(deg: number): Pose {
  const kn = polar(HG_HIP, BODY.thigh, deg)
  const an = polar(kn, BODY.shin, deg)
  return r({ head: polar(HG_SH, BODY.neck, -84), sh: HG_SH, el: HG_EL, ha: HG_HA, hip: HG_HIP, kn, an, toe: polar(an, BODY.foot, deg - 62) })
}
const HANGING_LEG_RAISE = base('elevacao-pernas-barra', 'reps', 'hand', ['ha', 'el', 'sh', 'head', 'hip'], hangingLegs(86), hangingLegs(2), 2800)

/* ---------------------------------------------------------------- polia */

/** Abdominal na polia: ajoelhado de frente para a polia alta, corda junto à cabeça; o tronco enrola para baixo. */
const CC_KN: Point = [82, FLOOR_Y - 4]
const CC_AN: Point = [CC_KN[0] - BODY.shin, FLOOR_Y - 4]
const CC_HIP: Point = [CC_KN[0], CC_KN[1] - BODY.thigh]
function cableCrunch(t: number): Pose {
  const sh = polar(CC_HIP, BODY.torso, t)
  const ha = polar(sh, 18, t + 34)
  return r({
    head: polar(sh, BODY.neck, t + 8), sh, el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below'), ha,
    hip: CC_HIP, kn: CC_KN, an: CC_AN, toe: [CC_AN[0] - BODY.foot, FLOOR_Y - 4],
  })
}
const CABLE_CRUNCH = base('abdominal-polia', 'reps', 'hip', ['hip', 'kn', 'an', 'toe'], cableCrunch(-80), cableCrunch(4), 2600)
const CABLE_CRUNCH_ANCHOR: Point = [WALL_X - 4, 30]

/**
 * Rotação de tronco no cabo, vista de frente: polia à direita na altura do peito, braços quase estendidos
 * e as mãos juntas. As mãos saem do lado da polia e cruzam para o outro lado, com o quadril parado.
 */
const RT_HIP: Point = [110, 150]
const RT_SH: Point = [110, RT_HIP[1] - BODY.torso]
const RT_KN: Point = [100, 192]
const RT_AN: Point = [98, 234]
const RT_TOE: Point = [88, 236]
function torsoRotation(hands: Point): Pose {
  return r({
    head: [110, RT_SH[1] - BODY.neck], sh: RT_SH, hip: RT_HIP,
    el: twoBone(RT_SH, BODY.upperArm, hands, BODY.forearm, 'below'), ha: hands,
    el2: twoBone(RT_SH, BODY.upperArm, hands, BODY.forearm, 'above'), ha2: hands,
    kn: RT_KN, an: RT_AN, toe: RT_TOE, kn2: mirrorX(RT_KN), an2: mirrorX(RT_AN), toe2: mirrorX(RT_TOE),
  })
}
const RT_HANDS: Point = [160, RT_SH[1] + 24]
const TORSO_ROTATION: MovementBase = {
  key: 'rotacao-tronco-cabo',
  view: 'front',
  loop: 'reps',
  durationMs: 2600,
  root: 'hip',
  fixed: ['hip', 'sh', 'head', 'kn', 'an', 'toe', 'kn2', 'an2', 'toe2'],
  keyframes: [
    { at: 0, pose: torsoRotation(RT_HANDS) },
    { at: 1, pose: torsoRotation(mirrorX(RT_HANDS)) },
  ],
}
const RT_ANCHOR: Point = [WALL_X - 4, RT_HANDS[1]]

/* ---------------------------------------------------------------- rotação sentado (piloto) */

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
  bases: [
    SEATED_TWIST, PLANK, SIDE_PLANK, PLANK_ROTATION, SHOULDER_TAP, DEAD_BUG, HOLLOW, PALLOF, ROLLOUT,
    CRUNCH, LEG_RAISE, BICYCLE, HANGING_LEG_RAISE, CABLE_CRUNCH, TORSO_ROTATION,
  ],
  demos: {
    'russian-twist-halteres': { base: 'rotacao-sentado', gear: 'halteres', scene: 'colchonete', implementAt: 'ha' },
    'prancha-abdominal-corporal': { base: 'prancha', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'ha' },
    'prancha-lateral-corporal': { base: 'prancha-lateral', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'hip' },
    'prancha-rotacao': { base: 'prancha-rotacao', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'ha2' },
    'prancha-toque-ombro-corporal': { base: 'prancha-toque-ombro', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'ha2' },
    'dead-bug-corporal': { base: 'dead-bug', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'ha' },
    'hollow-hold-corporal': { base: 'hollow', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'an' },
    'pallof-press-cabo': {
      base: 'pallof', gear: 'cabo', scene: 'solo', implementAt: 'ha', anchor: PALLOF_ANCHOR,
      caption: 'De lado para a polia: o cabo puxa para o lado e o tronco não gira',
    },
    'roda-abdominal': { base: 'rollout', gear: 'roda', scene: 'colchonete', implementAt: 'ha' },
    'rollout-barra': { base: 'rollout', gear: 'barra', scene: 'colchonete', implementAt: 'ha' },
    'abdominal-supra-corporal': { base: 'abdominal-supra', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'sh' },
    'abdominal-infra-corporal': { base: 'abdominal-infra', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'an' },
    'abdominal-bicicleta-corporal': { base: 'abdominal-bicicleta', gear: 'peso-corporal', scene: 'colchonete', implementAt: 'kn' },
    'elevacao-pernas-barra': { base: 'elevacao-pernas-barra', gear: 'barra-fixa', scene: 'barra-fixa', implementAt: 'an' },
    'abdominal-polia-cabo': { base: 'abdominal-polia', gear: 'cabo', scene: 'parede', implementAt: 'ha', anchor: CABLE_CRUNCH_ANCHOR },
    'rotacao-tronco-cabo': { base: 'rotacao-tronco-cabo', gear: 'cabo', scene: 'parede', implementAt: 'ha', anchor: RT_ANCHOR },
  },
}

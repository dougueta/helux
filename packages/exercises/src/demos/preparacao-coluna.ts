/** Família "preparação: mobilidade de coluna e joelho e relaxamento" (028 US6, lote P3). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { MAT, WALL_X } from '../engine/scene-geometry'
import type { Keyframe, MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, MIDFOOT, balanced, sidePose } from './figure'
import type { DemoFamily } from './index'

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose

const base = (
  key: string,
  loop: MovementBase['loop'],
  root: MovementBase['root'],
  fixed: MovementBase['fixed'],
  keyframes: Keyframe[],
  durationMs: number,
  view: MovementBase['view'] = 'side',
): MovementBase => ({ key, view, loop, durationMs, root, fixed, keyframes })

const spread = (poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: Math.round((i / (poses.length - 1)) * 1e6) / 1e6, pose }))

/** Linha das articulações apoiadas no colchonete. */
const MAT_Y = MAT.top - 4
const ARM = BODY.upperArm + BODY.forearm

/* ---------------------------------------------------------------- quatro apoios */

/** Quatro apoios, de frente para a direita: joelho sob o quadril, mão sob o ombro, canela e pé deitados para trás. */
const QP_KN: Point = [70, MAT_Y]
const QP_AN: Point = [QP_KN[0] - BODY.shin, MAT_Y]
const QP_TOE: Point = [QP_AN[0] - BODY.foot, MAT_Y]
const QP_HIP: Point = [QP_KN[0], MAT_Y - BODY.thigh]
const QP_SH: Point = [QP_HIP[0] + Math.sqrt(BODY.torso ** 2 - (ARM - BODY.thigh) ** 2), MAT_Y - ARM]
const QP_HA: Point = [QP_SH[0], MAT_Y]
const QP_EL: Point = [QP_SH[0], QP_SH[1] + BODY.upperArm]
const QP_TORSO = heading(QP_HIP, QP_SH)

function quadruped(headDeg = QP_TORSO + 8): Pose {
  return r({ head: polar(QP_SH, BODY.neck, headDeg), sh: QP_SH, el: QP_EL, ha: QP_HA, hip: QP_HIP, kn: QP_KN, an: QP_AN, toe: QP_TOE })
}

/**
 * Rotação torácica em quatro apoios: a mão livre fica atrás da cabeça e o cotovelo vai de baixo, junto ao braço
 * de apoio, até apontar para o teto. De perfil, o braço livre aparece encurtado, com o mesmo comprimento o tempo todo.
 */
const TR_UPPER = 28
const TR_FORE = 22
function thoracicReach(elbowDeg: number): Pose {
  const p = quadruped()
  const el2 = polar(QP_SH, TR_UPPER, elbowDeg)
  // a mão fica na nuca: aponta do cotovelo para a cabeça
  const ha2 = polar(el2, TR_FORE, heading(el2, p.head))
  return r({ ...p, el2, ha2 })
}
const THORACIC_QUAD = base(
  'rotacao-toracica-quatro-apoios',
  'reps',
  'hand',
  ['ha', 'el', 'sh', 'head', 'hip', 'kn', 'an', 'toe'],
  spread([thoracicReach(125), thoracicReach(50), thoracicReach(-20), thoracicReach(-100)]),
  3600,
)

/** Gato-camelo: o traço do tronco é reto, então a cabeça mostra a curva: desce no gato (costas arredondadas) e sobe no camelo. */
const CAT_COW = base(
  'gato-camelo',
  'reps',
  'hand',
  ['ha', 'el', 'sh', 'hip', 'kn', 'an', 'toe'],
  spread([quadruped(QP_TORSO + 70), quadruped(QP_TORSO - 30)]),
  3600,
)

/** Balanço para trás: mãos e joelhos parados; o quadril vai em direção aos calcanhares e os braços estendem à frente. */
function rockBack(thighDeg: number): Pose {
  const hip = polar(QP_KN, BODY.thigh, thighDeg)
  const sh = twoBone(hip, BODY.torso, QP_HA, ARM, 'above')
  const el = polar(sh, BODY.upperArm, heading(sh, QP_HA))
  return r({ head: polar(sh, BODY.neck, heading(hip, sh) + 8), sh, el, ha: QP_HA, hip, kn: QP_KN, an: QP_AN, toe: QP_TOE })
}
const ROCK_BACK = base('balanco-quatro-apoios', 'reps', 'hand', ['ha', 'kn', 'an', 'toe'], spread([rockBack(-90), rockBack(-122), rockBack(-150)]), 3200)

/* ---------------------------------------------------------------- deitado de costas, cabeça à direita */

const SUP_HIP: Point = [92, MAT_Y]
const SUP_SH: Point = [SUP_HIP[0] + BODY.torso, MAT_Y]
/** Cabeça deitada, um pouco erguida para o círculo não atravessar o colchonete. */
const SUP_HEAD = polar(SUP_SH, BODY.neck, -32)
/** Pé no colchonete com o joelho dobrado, apontando para a esquerda. */
const BENT_AN: Point = [SUP_HIP[0] - 54, MAT_Y - 2]
const bentLeg = (hip: Point) => {
  const kn = twoBone(hip, BODY.thigh, BENT_AN, BODY.shin, 'above')
  return { kn, an: BENT_AN, toe: polar(BENT_AN, BODY.foot, 180 - 12) }
}
/** Braços ao lado do corpo, no colchonete. */
const armsDown = (sh: Point) => ({ el: [sh[0] - BODY.upperArm, MAT_Y] as Point, ha: [sh[0] - ARM, MAT_Y] as Point })

/**
 * Báscula pélvica: o ombro fica parado e o quadril gira; a lombar encosta no colchonete e o quadril
 * sobe só um pouco, bem menos que numa ponte.
 */
function pelvicTilt(lift: number): Pose {
  const hip = polar(SUP_SH, BODY.torso, 180 - lift)
  return r({ head: SUP_HEAD, sh: SUP_SH, ...armsDown(SUP_SH), hip, ...bentLeg(hip) })
}
const PELVIC_TILT = base('bascula-pelvica', 'reps', 'foot', ['an', 'toe', 'sh', 'head', 'el', 'ha'], spread([pelvicTilt(0), pelvicTilt(9)]), 3000)

/** Deslizamento de calcanhar: o calcanhar desliza no colchonete até perto do glúteo; a outra perna fica estendida. */
const straightLeg = (hip: Point) => {
  const kn: Point = [hip[0] - BODY.thigh, MAT_Y]
  const an: Point = [kn[0] - BODY.shin, MAT_Y]
  return { kn, an, toe: polar(an, BODY.foot, -78) }
}
function heelSlide(heelX: number): Pose {
  const rest = straightLeg(SUP_HIP)
  const an: Point = [heelX, MAT_Y]
  const kn = twoBone(SUP_HIP, BODY.thigh, an, BODY.shin, 'above')
  return r({
    head: SUP_HEAD, sh: SUP_SH, ...armsDown(SUP_SH), hip: SUP_HIP, kn, an, toe: polar(an, BODY.foot, -78),
    kn2: rest.kn, an2: rest.an, toe2: rest.toe,
  })
}
const HEEL_SLIDE = base(
  'deslizamento-calcanhar',
  'reps',
  'hip',
  ['hip', 'sh', 'head', 'el', 'ha', 'kn2', 'an2', 'toe2'],
  spread([heelSlide(SUP_HIP[0] - BODY.thigh - BODY.shin + 0.5), heelSlide(SUP_HIP[0] - 34)]),
  3200,
)

/**
 * Extensão de joelho com toalha: a toalha enrolada fica sob o joelho; a coxa contrai, o joelho desce contra a
 * toalha e o calcanhar sobe. A outra perna fica dobrada.
 */
const TOWEL_THIGH_UP = 201
const TOWEL_KN = polar(SUP_HIP, BODY.thigh, TOWEL_THIGH_UP)
const TOWEL_AT: Point = round([TOWEL_KN[0], MAT.top - 7])
function towelPress(thighDeg: number, shinDeg: number): Pose {
  const kn = polar(SUP_HIP, BODY.thigh, thighDeg)
  const an = polar(kn, BODY.shin, shinDeg)
  const bent = bentLeg(SUP_HIP)
  return r({
    head: SUP_HEAD, sh: SUP_SH, ...armsDown(SUP_SH), hip: SUP_HIP, kn, an, toe: polar(an, BODY.foot, -80),
    kn2: bent.kn, an2: bent.an, toe2: bent.toe,
  })
}
const TOWEL_REST_SHIN = 180 - (Math.asin((MAT_Y - TOWEL_KN[1]) / BODY.shin) * 180) / Math.PI
const KNEE_TOWEL = base(
  'extensao-joelho-toalha',
  'reps',
  'hip',
  ['hip', 'sh', 'head', 'el', 'ha', 'kn2', 'an2', 'toe2'],
  spread([towelPress(TOWEL_THIGH_UP, TOWEL_REST_SHIN), towelPress(193, 193)]),
  3200,
)

/**
 * Respiração diafragmática: uma mão no peito, a outra na barriga. Ao inspirar, a mão da barriga sobe
 * e a do peito quase não se mexe.
 */
const BELLY = polar(SUP_HIP, 22, 0)
const CHEST = polar(SUP_HIP, 50, 0)
function breath(rise: number): Pose {
  const ha: Point = [BELLY[0], MAT_Y - 12 - rise]
  const ha2: Point = [CHEST[0], MAT_Y - 12]
  const bent = bentLeg(SUP_HIP)
  return r({
    head: SUP_HEAD, sh: SUP_SH, el: twoBone(SUP_SH, BODY.upperArm, ha, BODY.forearm, 'above'), ha,
    el2: twoBone(SUP_SH, BODY.upperArm, ha2, BODY.forearm, 'above'), ha2,
    hip: SUP_HIP, ...bent,
  })
}
const BREATHING = base('respiracao-diafragmatica', 'reps', 'hip', ['hip', 'sh', 'head', 'kn', 'an', 'toe', 'el2', 'ha2'], spread([breath(0), breath(13)]), 6000)

/* ---------------------------------------------------------------- rolo sob as costas */

/** O rolo fica parado sob o meio das costas; o quadril fica no chão e a cabeça desce para trás por cima dele. */
const ROLLER_R = 12
const ROLLER_AT: Point = [SUP_HIP[0] + 44, MAT.top - ROLLER_R]
function rollerExtension(torsoDeg: number, headTilt: number): Pose {
  const sh = polar(SUP_HIP, BODY.torso, torsoDeg)
  const head = polar(sh, BODY.neck, torsoDeg + headTilt)
  // mãos na nuca, cotovelos apontando para a frente
  const ha = polar(head, 10, torsoDeg + 90)
  const bent = bentLeg(SUP_HIP)
  return r({ head, sh, el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'above'), ha, hip: SUP_HIP, ...bent })
}
const ROLLER = base('mobilidade-toracica-rolo', 'reps', 'hip', ['hip', 'kn', 'an', 'toe'], spread([rollerExtension(-46, -30), rollerExtension(-33, 45)]), 3600)

/* ---------------------------------------------------------------- deitado de lado, visto a partir da cabeça */

/**
 * Rotação torácica deitado de lado, vista a partir da cabeça: o tronco aparece encurtado; joelhos e braços apontam
 * para a frente (direita). O braço de cima abre por cima, para trás, até perto do colchonete do outro lado.
 */
const OB_SH: Point = [104, MAT_Y - 26]
const OB_HIP: Point = [110, MAT_Y - 20]
function openBook(armDeg: number): Pose {
  const el = polar(OB_SH, BODY.upperArm, armDeg)
  const kn = polar(OB_HIP, BODY.thigh, 14)
  const kn2 = polar(OB_HIP, BODY.thigh, 22)
  const an = polar(kn, 10, 100)
  const an2 = polar(kn2, 10, 100)
  const el2 = polar(OB_SH, BODY.upperArm, 30)
  return r({
    head: polar(OB_SH, BODY.neck, 200), sh: OB_SH, el, ha: polar(el, BODY.forearm, armDeg),
    el2, ha2: polar(el2, BODY.forearm, 30),
    hip: OB_HIP, kn, an, toe: polar(an, 6, 10), kn2, an2, toe2: polar(an2, 6, 10),
  })
}
const OPEN_BOOK = base(
  'rotacao-toracica-lado',
  'reps',
  'hip',
  ['hip', 'sh', 'head', 'kn', 'an', 'toe', 'kn2', 'an2', 'toe2', 'el2', 'ha2'],
  spread([openBook(22), openBook(-40), openBook(-100), openBook(-160), openBook(-196)]),
  4400,
  'front',
)

/* ---------------------------------------------------------------- em pé, elástico atrás do joelho */

/** Extensão terminal de joelho: elástico preso à frente, passado atrás do joelho; o joelho sai de levemente dobrado e estende. */
const TKE_AN: Point = [96, ANKLE_Y]
const TKE_ANCHOR: Point = [WALL_X - 4, 176]
const hangArms = (sh: Point) => {
  const el = polar(sh, BODY.upperArm, 96)
  return { el, ha: polar(el, BODY.forearm, 92) }
}
const TKE = base(
  'extensao-terminal-joelho',
  'reps',
  'foot',
  ['an', 'toe'],
  spread([
    balanced({ an: TKE_AN, shinDeg: -66, thighDeg: -114 }, hangArms, (p) => p.sh, MIDFOOT(TKE_AN)),
    balanced({ an: TKE_AN, shinDeg: -88, thighDeg: -92 }, hangArms, (p) => p.sh, MIDFOOT(TKE_AN)),
  ]),
  2600,
)

export const PREPARACAO_COLUNA: DemoFamily = {
  bases: [THORACIC_QUAD, CAT_COW, ROCK_BACK, PELVIC_TILT, HEEL_SLIDE, KNEE_TOWEL, BREATHING, ROLLER, OPEN_BOOK, TKE],
  demos: {
    'rotacao-toracica-quatro-apoios': {
      base: 'rotacao-toracica-quatro-apoios', gear: 'nenhum', scene: 'colchonete', implementAt: 'sh',
      caption: 'De perfil: a mão livre fica na nuca e o cotovelo vai de baixo, junto ao braço de apoio, até o teto',
    },
    'rotacao-toracica-deitado-lado': {
      base: 'rotacao-toracica-lado', gear: 'nenhum', scene: 'colchonete', implementAt: 'sh',
      caption: 'Visto a partir da cabeça: deitado de lado, joelhos à frente; o braço de cima abre para trás',
    },
    'mobilidade-toracica-rolo': { base: 'mobilidade-toracica-rolo', gear: 'rolo', scene: 'colchonete', implementAt: 'sh', anchor: ROLLER_AT },
    'gato-camelo': {
      base: 'gato-camelo', gear: 'nenhum', scene: 'colchonete', implementAt: 'sh',
      caption: 'O traço do tronco é reto: a cabeça desce quando as costas arredondam e sobe quando afundam',
    },
    'bascula-pelvica': {
      base: 'bascula-pelvica', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip',
      caption: 'O quadril gira e sobe só um pouco, e a lombar encosta no colchonete',
    },
    'balanco-quatro-apoios': { base: 'balanco-quatro-apoios', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip' },
    'deslizamento-calcanhar': { base: 'deslizamento-calcanhar', gear: 'nenhum', scene: 'colchonete', implementAt: 'an' },
    'extensao-joelho-toalha': { base: 'extensao-joelho-toalha', gear: 'toalha', scene: 'colchonete', implementAt: 'kn', anchor: TOWEL_AT },
    'extensao-terminal-joelho-elastico': {
      base: 'extensao-terminal-joelho', gear: 'elastico', scene: 'parede', implementAt: 'kn', anchor: TKE_ANCHOR,
    },
    'respiracao-diafragmatica': {
      base: 'respiracao-diafragmatica', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip',
      caption: 'Uma mão no peito e outra na barriga: ao inspirar, só a da barriga sobe',
    },
  },
}

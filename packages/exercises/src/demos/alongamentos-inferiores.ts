/**
 * Família "alongamentos de membros inferiores" (028 US6, lote P5). Todos são posições mantidas (`hold`).
 * Pensados para quem nunca treinou: o movimento acontece no plano do desenho e a perna alongada é a principal (em destaque).
 */
import { BODY, polar, round, twoBone } from '../engine/geometry'
import { MAT, WALL_X } from '../engine/scene-geometry'
import type { Keyframe, MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, FOOT_DEG } from './figure'
import type { DemoFamily } from './index'

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose

const base = (key: string, root: MovementBase['root'], fixed: MovementBase['fixed'], keyframes: Keyframe[], durationMs: number): MovementBase => ({
  key, view: 'side', loop: 'hold', durationMs, root, fixed, keyframes,
})

const spread = (poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: Math.round((i / (poses.length - 1)) * 1e6) / 1e6, pose }))

/** Linha das articulações apoiadas no colchonete; tornozelo do pé apoiado no colchonete. */
const MAT_Y = MAT.top - 4
const MAT_ANKLE_Y = MAT.top - 6

/* ---------------------------------------------------------------- semiajoelhado, de frente para a direita */

/**
 * Flexor de quadril semiajoelhado: o joelho de trás fica no colchonete e o pé da frente apoiado; o quadril vai à
 * frente com o tronco ereto e as mãos na cintura. A perna de trás, que alonga, é a principal.
 */
const HK_KN: Point = [80, MAT_Y]
const HK_AN: Point = [HK_KN[0] - BODY.shin, MAT_Y]
const HK_TOE: Point = [HK_AN[0] - BODY.foot, MAT_Y]
const HK_AN2: Point = [134, MAT_ANKLE_Y]
function hipFlexor(thighDeg: number): Pose {
  const hip = polar(HK_KN, BODY.thigh, thighDeg)
  const sh = polar(hip, BODY.torso, -89)
  const ha: Point = [hip[0] + 6, hip[1] - 6]
  return r({
    head: polar(sh, BODY.neck, -81), sh, el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'left'), ha, hip,
    kn: HK_KN, an: HK_AN, toe: HK_TOE,
    kn2: twoBone(HK_AN2, BODY.shin, hip, BODY.thigh, 'above'), an2: HK_AN2, toe2: polar(HK_AN2, BODY.foot, FOOT_DEG),
  })
}
const HIP_FLEXOR = base('alongamento-flexor-quadril', 'foot', ['an', 'toe', 'kn', 'an2', 'toe2'], spread([hipFlexor(-90), hipFlexor(-58)]), 3600)

/* ---------------------------------------------------------------- deitado, cabeça à direita */

const SUP_HIP: Point = [92, MAT_Y]
const SUP_SH: Point = [SUP_HIP[0] + BODY.torso, MAT_Y]
const SUP_HEAD = polar(SUP_SH, BODY.neck, -32)
const BENT_AN: Point = [SUP_HIP[0] - 54, MAT_Y - 2]
const BENT_TOE = polar(BENT_AN, BODY.foot, 180 - 12)
const BENT_KN = twoBone(SUP_HIP, BODY.thigh, BENT_AN, BODY.shin, 'above')
/** Perna estendida no colchonete, com a ponta do pé para cima. */
const FLAT_KN: Point = [SUP_HIP[0] - BODY.thigh, MAT_Y]
const FLAT_AN: Point = [FLAT_KN[0] - BODY.shin, MAT_Y]
const FLAT_TOE = polar(FLAT_AN, BODY.foot, -78)
const flatOther = { kn2: FLAT_KN, an2: FLAT_AN, toe2: FLAT_TOE }
const armsOnMat = { el: [SUP_SH[0] - BODY.upperArm, MAT_Y] as Point, ha: [SUP_SH[0] - BODY.upperArm - BODY.forearm, MAT_Y] as Point }
const LYING_FIXED: MovementBase['fixed'] = ['hip', 'sh', 'head']

/**
 * Quadríceps deitado de lado, visto de cima: a coxa fica na linha do corpo, o joelho dobra e a mão de cima puxa
 * o pé em direção ao glúteo. A outra perna fica estendida.
 */
/** Visto de cima, a perna de cima fica um pouco afastada da de baixo, para o joelho dobrado aparecer. */
const QL_KN = polar(SUP_HIP, BODY.thigh, 196)
function quadLying(shinDeg: number, holding: boolean): Pose {
  const an = polar(QL_KN, BODY.shin, shinDeg)
  // estendida, a ponta do pé aponta para cima, como a outra perna
  const toe = shinDeg === 196 ? polar(an, BODY.foot, -78) : polar(an, BODY.foot, shinDeg + 15)
  const arm = holding ? (() => {
    const ha = toe
    return { el: twoBone(SUP_SH, BODY.upperArm, ha, BODY.forearm, 'above'), ha }
  })() : armsOnMat
  return r({ head: SUP_HEAD, sh: SUP_SH, ...arm, hip: SUP_HIP, kn: QL_KN, an, toe, ...flatOther })
}
const QUAD_LYING = base(
  'alongamento-quadriceps-deitado',
  'hip',
  [...LYING_FIXED, 'kn', 'kn2', 'an2', 'toe2'],
  spread([quadLying(196, false), quadLying(-90, false), quadLying(-20, true)]),
  3600,
)

/** Posterior de coxa com faixa: a faixa passa pela sola do pé; a perna sobe estendida e as mãos seguram a faixa. */
function strapStretch(raised: boolean): Pose {
  const leg = raised
    ? (() => {
        const kn = polar(SUP_HIP, BODY.thigh, -80)
        const an = polar(kn, BODY.shin, -80)
        return { kn, an, toe: polar(an, BODY.foot, 10) }
      })()
    : { kn: BENT_KN, an: BENT_AN, toe: BENT_TOE }
  const foot: Point = [(leg.an[0] + leg.toe[0]) / 2, (leg.an[1] + leg.toe[1]) / 2]
  const ha = polar(SUP_SH, 50, Math.atan2(foot[1] - SUP_SH[1], foot[0] - SUP_SH[0]) * (180 / Math.PI))
  return r({ head: SUP_HEAD, sh: SUP_SH, el: twoBone(SUP_SH, BODY.upperArm, ha, BODY.forearm, 'right'), ha, hip: SUP_HIP, ...leg, ...flatOther })
}
const STRAP = base('alongamento-posterior-coxa-faixa', 'hip', [...LYING_FIXED, 'kn2', 'an2', 'toe2'], spread([strapStretch(false), strapStretch(true)]), 3600)

/**
 * Glúteo em figura 4: o tornozelo de uma perna fica sobre o joelho da outra, e as mãos puxam essa outra coxa para o
 * peito. A perna cruzada aponta para quem vê, então aparece mais curta; o comprimento dela não muda no movimento.
 */
const CROSS_LEG = 34
const CROSS_FOOT = 10
function figureFour(pulled: boolean): Pose {
  const leg = pulled
    ? (() => {
        const kn = polar(SUP_HIP, BODY.thigh, -60)
        const an = polar(kn, BODY.shin, 180)
        return { kn, an, toe: polar(an, BODY.foot, -100) }
      })()
    : { kn: BENT_KN, an: BENT_AN, toe: BENT_TOE }
  const an2: Point = [leg.kn[0] + 2, leg.kn[1] - 6]
  // o joelho cruzado cai para fora: no desenho, fica abaixo da linha quadril-tornozelo e forma o "4"
  const kn2 = twoBone(SUP_HIP, CROSS_LEG, an2, CROSS_LEG, 'below')
  const arm = pulled
    ? (() => {
        const ha = polar(SUP_HIP, 26, -60)
        return { el: twoBone(SUP_SH, BODY.upperArm, ha, BODY.forearm, 'above'), ha }
      })()
    : armsOnMat
  return r({ head: SUP_HEAD, sh: SUP_SH, ...arm, hip: SUP_HIP, ...leg, kn2, an2, toe2: polar(an2, CROSS_FOOT, -30) })
}
const FIGURE_FOUR = base('alongamento-gluteo-figura-4', 'hip', LYING_FIXED, spread([figureFour(false), figureFour(true)]), 3600)

/* ---------------------------------------------------------------- em pé, de frente para a direita */

/**
 * Quadríceps em pé: uma mão na parede para o equilíbrio; o joelho dobra, o pé vai para trás e sobe, e a outra mão
 * segura o pé junto ao glúteo. A perna de apoio fica parada.
 */
const QS_HIP: Point = [150, ANKLE_Y - BODY.shin - BODY.thigh]
const QS_SH = polar(QS_HIP, BODY.torso, -90)
const QS_AN2: Point = [QS_HIP[0], ANKLE_Y]
const QS_KN2: Point = [QS_HIP[0], QS_HIP[1] + BODY.thigh]
const QS_HA2: Point = [WALL_X - 5, 96]
const QS_EL2 = twoBone(QS_SH, BODY.upperArm, QS_HA2, BODY.forearm, 'below')
function quadStanding(thighDeg: number, shinDeg: number, arm: { el: Point; ha: Point } | 'foot'): Pose {
  const kn = polar(QS_HIP, BODY.thigh, thighDeg)
  const an = polar(kn, BODY.shin, shinDeg)
  const toe = polar(an, BODY.foot, shinDeg === 90 ? FOOT_DEG : shinDeg - 10)
  const hand = arm === 'foot'
    ? (() => {
        const ha: Point = [(an[0] + toe[0]) / 2, (an[1] + toe[1]) / 2]
        return { el: twoBone(QS_SH, BODY.upperArm, ha, BODY.forearm, 'left'), ha }
      })()
    : arm
  return r({
    head: polar(QS_SH, BODY.neck, -82), sh: QS_SH, ...hand, el2: QS_EL2, ha2: QS_HA2, hip: QS_HIP,
    kn, an, toe, kn2: QS_KN2, an2: QS_AN2, toe2: polar(QS_AN2, BODY.foot, FOOT_DEG),
  })
}
const armDown = (deg: number, fore: number) => {
  const el = polar(QS_SH, BODY.upperArm, deg)
  return { el, ha: polar(el, BODY.forearm, fore) }
}
const QUAD_STANDING = base(
  'alongamento-quadriceps-em-pe',
  'hip',
  ['hip', 'sh', 'head', 'kn2', 'an2', 'toe2', 'el2', 'ha2'],
  spread([quadStanding(92, 90, armDown(96, 92)), quadStanding(100, 180, armDown(118, 124)), quadStanding(102, -98, 'foot')]),
  4000,
)

/**
 * Posterior de coxa em pé: o calcanhar da frente fica no chão com a ponta do pé para cima e a perna estendida;
 * o tronco inclina à frente com as costas retas, o quadril vai para trás e o joelho de trás dobra.
 */
const HS_AN: Point = [130, ANKLE_Y]
const HS_TOE = polar(HS_AN, BODY.foot, -50)
const HS_AN2: Point = [88, ANKLE_Y]
function hamstringStanding(hip: Point, torsoDeg: number): Pose {
  const sh = polar(hip, BODY.torso, torsoDeg)
  const ha = polar(hip, 10, torsoDeg)
  return r({
    head: polar(sh, BODY.neck, torsoDeg + 8), sh, el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'left'), ha, hip,
    kn: twoBone(HS_AN, BODY.shin, hip, BODY.thigh, 'right'), an: HS_AN, toe: HS_TOE,
    kn2: twoBone(HS_AN2, BODY.shin, hip, BODY.thigh, 'right'), an2: HS_AN2, toe2: polar(HS_AN2, BODY.foot, FOOT_DEG),
  })
}
const HAMSTRING_STANDING = base(
  'alongamento-posterior-coxa-em-pe',
  'foot',
  ['an', 'toe', 'an2', 'toe2'],
  spread([hamstringStanding([102, 155], -88), hamstringStanding([92, 160], -40)]),
  3600,
)

/**
 * Panturrilha na parede: mãos na parede, a perna de trás estendida com o calcanhar no chão; o corpo inclina em direção
 * à parede, o joelho da frente dobra e os cotovelos dobram. A perna de trás, que alonga, é a principal.
 */
const CW_AN: Point = [90, ANKLE_Y]
const CW_AN2: Point = [140, ANKLE_Y]
const CW_HA: Point = [WALL_X - 5, 100]
function calfWall(hip: Point, torsoDeg: number): Pose {
  const sh = polar(hip, BODY.torso, torsoDeg)
  return r({
    head: polar(sh, BODY.neck, torsoDeg + 8), sh, el: twoBone(sh, BODY.upperArm, CW_HA, BODY.forearm, 'below'), ha: CW_HA, hip,
    kn: twoBone(CW_AN, BODY.shin, hip, BODY.thigh, 'right'), an: CW_AN, toe: polar(CW_AN, BODY.foot, FOOT_DEG),
    kn2: twoBone(CW_AN2, BODY.shin, hip, BODY.thigh, 'right'), an2: CW_AN2, toe2: polar(CW_AN2, BODY.foot, FOOT_DEG),
  })
}
const CALF_WALL = base('alongamento-panturrilha-parede', 'foot', ['an', 'toe', 'an2', 'toe2', 'ha'], spread([calfWall([115, 154], -60), calfWall([123, 158], -50)]), 3600)

export const ALONGAMENTOS_INFERIORES: DemoFamily = {
  bases: [HIP_FLEXOR, QUAD_LYING, QUAD_STANDING, STRAP, HAMSTRING_STANDING, FIGURE_FOUR, CALF_WALL],
  demos: {
    'alongamento-flexor-quadril': {
      base: 'alongamento-flexor-quadril', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip',
      caption: 'O joelho de trás fica no colchonete; o quadril vai à frente e estica a frente da coxa de trás',
    },
    'alongamento-quadriceps-deitado': {
      base: 'alongamento-quadriceps-deitado', gear: 'nenhum', scene: 'colchonete', implementAt: 'an',
      caption: 'Visto de cima: deitado de lado, a mão de cima puxa o pé em direção ao glúteo',
    },
    'alongamento-quadriceps-em-pe': {
      base: 'alongamento-quadriceps-em-pe', gear: 'nenhum', scene: 'parede', implementAt: 'an',
      caption: 'Uma mão na parede para o equilíbrio; a outra segura o pé junto ao glúteo',
    },
    'alongamento-posterior-coxa-faixa': { base: 'alongamento-posterior-coxa-faixa', gear: 'faixa', scene: 'colchonete', implementAt: 'ha' },
    'alongamento-posterior-coxa-em-pe': {
      base: 'alongamento-posterior-coxa-em-pe', gear: 'nenhum', scene: 'solo', implementAt: 'sh',
      caption: 'Calcanhar da frente no chão e ponta do pé para cima; o tronco inclina com as costas retas',
    },
    'alongamento-gluteo-figura-4': {
      base: 'alongamento-gluteo-figura-4', gear: 'nenhum', scene: 'colchonete', implementAt: 'kn',
      caption: 'O tornozelo cruzado fica sobre o joelho da outra perna; as mãos puxam essa coxa para o peito',
    },
    'alongamento-panturrilha-parede': {
      base: 'alongamento-panturrilha-parede', gear: 'nenhum', scene: 'parede', implementAt: 'hip',
      caption: 'O calcanhar de trás fica no chão enquanto o corpo inclina em direção à parede',
    },
  },
}

/** Família "alongamentos de tronco e membros superiores" (028 US6, lote P4). Todos são posições mantidas (`hold`). */
import { BODY, heading, mirrorX, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y, LOW_BENCH, MAT, WALL_X } from '../engine/scene-geometry'
import type { Keyframe, MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, FOOT_DEG, sidePose } from './figure'
import type { DemoFamily } from './index'

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose
/** Espelha a pose inteira: figura montada de frente para a direita passa a olhar para a esquerda. */
const flip = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(mirrorX(v as Point))])) as unknown as Pose

const base = (
  key: string,
  root: MovementBase['root'],
  fixed: MovementBase['fixed'],
  keyframes: Keyframe[],
  durationMs: number,
  view: MovementBase['view'] = 'side',
): MovementBase => ({ key, view, ...(view === 'front' ? { mirror: true } : {}), loop: 'hold', durationMs, root, fixed, keyframes })

const spread = (poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: Math.round((i / (poses.length - 1)) * 1e6) / 1e6, pose }))

/** Linha das articulações apoiadas no colchonete e no chão. */
const MAT_Y = MAT.top - 4
const FLOOR_JOINT_Y = FLOOR_Y - 4
const ARM = BODY.upperArm + BODY.forearm

/* ---------------------------------------------------------------- de costas para a parede */

/**
 * Peitoral e bíceps na parede são montados de frente para a direita, com a parede atrás (à esquerda), e depois
 * espelhados: no desenho a figura olha para a esquerda, de costas para a parede da cena.
 */
const BACK_WALL_X = 220 - WALL_X
const BW_AN: Point = [46, ANKLE_Y]
const BW_TOE = polar(BW_AN, BODY.foot, FOOT_DEG)

/** Figura de costas para a parede: tronco no ângulo `torsoDeg`, ombro em `sh`; pernas do tornozelo parado até o quadril. */
function backToWall(sh: Point, torsoDeg: number, arm: { el: Point; ha: Point }): Pose {
  const hip = polar(sh, BODY.torso, torsoDeg + 180)
  const kn = twoBone(BW_AN, BODY.shin, hip, BODY.thigh, 'right')
  return flip(r({ head: polar(sh, BODY.neck, torsoDeg + 8), sh, ...arm, hip, kn, an: BW_AN, toe: BW_TOE }))
}

/**
 * Peitoral na parede, pensado para quem nunca treinou: de costas para a parede, a mão fica parada nela na altura do
 * ombro e a pessoa dá um passo à frente. O braço estica para trás e o peito abre. A perna que dá o passo é a
 * principal (em destaque); a de trás fica parada perto da parede.
 */
const PEC_HA: Point = [BACK_WALL_X + 4, 92]
const PEC_BACK_AN: Point = [50, ANKLE_Y]
function pecStep(hip: Point, frontAn: Point, torsoDeg: number): Pose {
  const sh = polar(hip, BODY.torso, torsoDeg)
  return flip(r({
    head: polar(sh, BODY.neck, torsoDeg + 8), sh, el: twoBone(sh, BODY.upperArm, PEC_HA, BODY.forearm, 'below'), ha: PEC_HA, hip,
    kn: twoBone(frontAn, BODY.shin, hip, BODY.thigh, 'right'), an: frontAn, toe: polar(frontAn, BODY.foot, FOOT_DEG),
    kn2: twoBone(PEC_BACK_AN, BODY.shin, hip, BODY.thigh, 'right'), an2: PEC_BACK_AN, toe2: polar(PEC_BACK_AN, BODY.foot, FOOT_DEG),
  }))
}
const PEC_WALL = base(
  'alongamento-peitoral-parede',
  'hand',
  ['ha', 'an2', 'toe2'],
  spread([pecStep([50, 150.5], [52, ANKLE_Y], -90), pecStep([75, 154], [97, ANKLE_Y], -88)]),
  3600,
)

/** Bíceps na parede: a mão fica na parede atrás, um pouco abaixo do ombro; o tronco inclina à frente e o cotovelo estende. */
const BIC_HA: Point = [BACK_WALL_X + 4, 112]
function bicepsStretch(sh: Point, torsoDeg: number): Pose {
  return backToWall(sh, torsoDeg, { el: twoBone(sh, BODY.upperArm, BIC_HA, BODY.forearm, 'below'), ha: BIC_HA })
}
const BICEPS_WALL = base(
  'alongamento-biceps-parede',
  'foot',
  ['an', 'toe', 'ha'],
  spread([bicepsStretch([46, 88], -90), bicepsStretch(polar(BIC_HA, ARM - 0.5, -20), -75)]),
  3600,
)

/* ---------------------------------------------------------------- de frente para a parede */

/** Dorsal no apoio: mãos paradas no apoio na altura do quadril; o quadril vai para trás até o tronco ficar na horizontal. */
const LAT_AN: Point = [88, ANKLE_Y]
const LAT_HA: Point = [WALL_X - 5, 152]
function latSupport(shinDeg: number, thighDeg: number): Pose {
  const kn = polar(LAT_AN, BODY.shin, shinDeg)
  const hip = polar(kn, BODY.thigh, thighDeg)
  const sh = twoBone(hip, BODY.torso, LAT_HA, ARM, 'above')
  const el = polar(sh, BODY.upperArm, heading(sh, LAT_HA))
  return r({ head: polar(sh, BODY.neck, heading(hip, sh) + 8), sh, el, ha: LAT_HA, hip, kn, an: LAT_AN, toe: polar(LAT_AN, BODY.foot, FOOT_DEG) })
}
const LAT_WALL = base('alongamento-dorsal-apoio', 'foot', ['an', 'toe', 'ha'], spread([latSupport(-76, -88), latSupport(-80, -110)]), 3600)

/* ---------------------------------------------------------------- ajoelhado diante do banco baixo */

/**
 * Dorsal no banco: ajoelhado, de frente para o banco (à esquerda), cotovelos apoiados na borda e mãos para cima;
 * o quadril vai para trás em direção aos calcanhares, o peito desce e a cabeça pende entre os braços, à frente do banco.
 */
const LB_KN: Point = [140, FLOOR_JOINT_Y]
const LB_AN: Point = [LB_KN[0] + BODY.shin, FLOOR_JOINT_Y]
const LB_TOE: Point = [LB_AN[0] + BODY.foot, FLOOR_JOINT_Y]
const LB_EL: Point = [LOW_BENCH.x1 - 4, LOW_BENCH.top - 4]
const LB_HA: Point = [LB_EL[0], LB_EL[1] - BODY.forearm]
function latBench(thighDeg: number, headDrop: number): Pose {
  const hip = polar(LB_KN, BODY.thigh, thighDeg)
  const sh = twoBone(hip, BODY.torso, LB_EL, BODY.upperArm, 'above')
  // olhando para a esquerda: subtrair do ângulo do tronco leva a cabeça para o rosto (para baixo)
  return r({ head: polar(sh, BODY.neck, heading(hip, sh) - headDrop), sh, el: LB_EL, ha: LB_HA, hip, kn: LB_KN, an: LB_AN, toe: LB_TOE })
}
const LAT_BENCH = base('alongamento-dorsal-banco', 'hand', ['ha', 'el', 'kn', 'an', 'toe'], spread([latBench(-100, 8), latBench(-65, 70)]), 3600)

/* ---------------------------------------------------------------- em pé, de perfil */

const STAND_AN: Point = [100, ANKLE_Y]
const stand = (arms: { el: Point; ha: Point; el2?: Point; ha2?: Point }) => {
  const p = sidePose({ an: STAND_AN, shinDeg: -88, thighDeg: -92, torsoDeg: -89 }, () => arms)
  return r({ ...p, ...arms })
}
const STAND_SH = sidePose({ an: STAND_AN, shinDeg: -88, thighDeg: -92, torsoDeg: -89 }, () => ({ el: [0, 0], ha: [0, 0] })).sh
const STILL_BODY: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head']

/**
 * Tríceps acima da cabeça: o braço sobe pela frente, o cotovelo passa a apontar para o teto e a mão desce atrás
 * da cabeça; a outra mão vem segurar o cotovelo. A cabeça fica um pouco à frente, deixando o braço passar atrás dela.
 */
const TRI_HEAD = polar(STAND_SH, BODY.neck, -40)
const hanging = (deg: number) => {
  const el = polar(STAND_SH, BODY.upperArm, deg)
  return { el, ha: polar(el, BODY.forearm, deg - 2) }
}
function tricepsStretch(elbowDeg: number, forearmDeg: number, holdElbow: boolean): Pose {
  const el = polar(STAND_SH, BODY.upperArm, elbowDeg)
  const ha = polar(el, BODY.forearm, forearmDeg)
  const other = holdElbow
    ? (() => {
        const ha2 = polar(el, 4, elbowDeg + 90)
        return { el2: twoBone(STAND_SH, BODY.upperArm, ha2, BODY.forearm, 'right'), ha2 }
      })()
    : (({ el: el2, ha: ha2 }) => ({ el2, ha2 }))(hanging(94))
  return { ...stand({ el, ha, ...other }), head: round(TRI_HEAD) }
}
const TRICEPS = base(
  'alongamento-triceps',
  'foot',
  STILL_BODY,
  spread([tricepsStretch(92, 90, false), tricepsStretch(-65, -75, false), tricepsStretch(-85, -150, true), tricepsStretch(-100, 100, true)]),
  4000,
)

/** Antebraço: o braço sobe estendido à frente até a altura do ombro; a outra mão vem segurar os dedos. */
function forearmStretch(armDeg: number, other: Point | null): Pose {
  const el = polar(STAND_SH, BODY.upperArm, armDeg)
  const ha = polar(el, BODY.forearm, armDeg)
  const ha2 = other ?? polar(polar(STAND_SH, BODY.upperArm, 94), BODY.forearm, 92)
  return stand({ el, ha, el2: twoBone(STAND_SH, BODY.upperArm, ha2, BODY.forearm, 'below'), ha2 })
}
const FOREARM_HA = polar(polar(STAND_SH, BODY.upperArm, 0), BODY.forearm, 0)
const FOREARM = base(
  'alongamento-antebraco',
  'foot',
  STILL_BODY,
  spread([forearmStretch(92, null), forearmStretch(0, [FOREARM_HA[0] - 6, FOREARM_HA[1] + 4])]),
  3200,
)

/* ---------------------------------------------------------------- de frente (o outro lado é espelhado) */

/**
 * Posterior de ombro, de frente: um braço cruza o peito e a mão do outro lado o puxa
 * pelo braço, acima do cotovelo. Em `el2`/`ha2` fica o braço do lado espelhado, guardado já espelhado.
 */
const F_HIP: Point = [100, 152]
const F_SH: Point = [92, 92]
const F_HEAD: Point = [110, 68]
const F_AN: Point = [96, ANKLE_Y]
const F_LEGS = { kn: twoBone(F_HIP, BODY.thigh, F_AN, BODY.shin, 'left'), an: F_AN, toe: [F_AN[0] - 10, F_AN[1] + 2] as Point }
const armsDown = () => {
  const el = polar(F_SH, BODY.upperArm, 98)
  return { el, ha: polar(el, BODY.forearm, 94) }
}
function crossBody(): Pose {
  // na altura do peito, abaixo da linha dos ombros, para o braço não se confundir com ela
  const el = polar(F_SH, BODY.upperArm, 25)
  const ha = polar(el, BODY.forearm, -5)
  // a outra mão, do lado espelhado, segura o braço que cruza logo antes do cotovelo
  const otherSh = mirrorX(F_SH)
  const grip = polar(F_SH, BODY.upperArm - 6, 25)
  const otherEl = twoBone(otherSh, BODY.upperArm, grip, BODY.forearm, 'below')
  return r({ head: F_HEAD, sh: F_SH, el, ha, el2: mirrorX(otherEl), ha2: mirrorX(grip), hip: F_HIP, ...F_LEGS })
}
const rest = () => {
  const a = armsDown()
  return r({ head: F_HEAD, sh: F_SH, ...a, el2: a.el, ha2: a.ha, hip: F_HIP, ...F_LEGS })
}
const CROSS_BODY = base('alongamento-posterior-ombro', 'hip', ['hip', 'sh', 'head', 'kn', 'an', 'toe'], spread([rest(), crossBody()]), 3600, 'front')

/* ---------------------------------------------------------------- no colchonete */

/** Postura da criança: sentado sobre os calcanhares, o tronco desce à frente até os braços estendidos tocarem o colchonete. */
const CH_KN: Point = [120, MAT_Y]
const CH_AN: Point = [CH_KN[0] - BODY.shin, MAT_Y]
const CH_TOE: Point = [CH_AN[0] - BODY.foot, MAT_Y]
const CH_HIP = polar(CH_KN, BODY.thigh, 200)
function childPose(torsoDeg: number, armDeg: number): Pose {
  const sh = polar(CH_HIP, BODY.torso, torsoDeg)
  const el = polar(sh, BODY.upperArm, armDeg)
  return r({ head: polar(sh, BODY.neck, torsoDeg + 16), sh, el, ha: polar(el, BODY.forearm, armDeg), hip: CH_HIP, kn: CH_KN, an: CH_AN, toe: CH_TOE })
}
const CHILD = base('postura-crianca', 'foot', ['an', 'toe', 'kn', 'hip'], spread([childPose(-90, -80), childPose(-45, -40), childPose(-6, 18)]), 4000)

/** Joelhos ao peito: deitado de costas, as mãos puxam os dois joelhos em direção ao peito. Cabeça à direita. */
const SUP_HIP: Point = [92, MAT_Y]
const SUP_SH: Point = [SUP_HIP[0] + BODY.torso, MAT_Y]
const SUP_HEAD = polar(SUP_SH, BODY.neck, -32)
const BENT_AN: Point = [SUP_HIP[0] - 54, MAT_Y - 2]
function kneesToChest(pulled: boolean): Pose {
  if (!pulled) {
    const kn = twoBone(SUP_HIP, BODY.thigh, BENT_AN, BODY.shin, 'above')
    return r({
      head: SUP_HEAD, sh: SUP_SH, el: [SUP_SH[0] - BODY.upperArm, MAT_Y], ha: [SUP_SH[0] - ARM, MAT_Y],
      hip: SUP_HIP, kn, an: BENT_AN, toe: polar(BENT_AN, BODY.foot, 180 - 12),
    })
  }
  const kn = polar(SUP_HIP, BODY.thigh, -50)
  const an = polar(kn, BODY.shin, 190)
  const ha = polar(kn, 5, -60)
  return r({
    head: SUP_HEAD, sh: SUP_SH, el: twoBone(SUP_SH, BODY.upperArm, ha, BODY.forearm, 'below'), ha,
    hip: SUP_HIP, kn, an, toe: polar(an, BODY.foot, -100),
  })
}
const KNEES_CHEST = base('joelhos-ao-peito', 'hip', ['hip', 'sh', 'head'], spread([kneesToChest(false), kneesToChest(true)]), 3600)

export const ALONGAMENTOS_SUPERIORES: DemoFamily = {
  bases: [PEC_WALL, BICEPS_WALL, LAT_WALL, LAT_BENCH, TRICEPS, FOREARM, CROSS_BODY, CHILD, KNEES_CHEST],
  demos: {
    'alongamento-peitoral-parede': {
      base: 'alongamento-peitoral-parede', gear: 'nenhum', scene: 'parede', implementAt: 'sh',
      caption: 'A mão fica parada na parede; o passo à frente estica o braço para trás e abre o peito',
    },
    'alongamento-dorsal-banco': { base: 'alongamento-dorsal-banco', gear: 'nenhum', scene: 'banco-baixo', implementAt: 'el' },
    'alongamento-dorsal-apoio': { base: 'alongamento-dorsal-apoio', gear: 'nenhum', scene: 'parede', implementAt: 'ha' },
    'alongamento-posterior-ombro': {
      base: 'alongamento-posterior-ombro', gear: 'nenhum', scene: 'solo', implementAt: 'el',
      caption: 'De frente: um braço cruza o peito e a outra mão o puxa, acima do cotovelo',
    },
    'alongamento-biceps-parede': {
      base: 'alongamento-biceps-parede', gear: 'nenhum', scene: 'parede', implementAt: 'ha',
      caption: 'De costas para a parede: a mão fica apoiada atrás e o cotovelo estende quando o tronco avança',
    },
    'alongamento-triceps': {
      base: 'alongamento-triceps', gear: 'nenhum', scene: 'solo', implementAt: 'el',
      caption: 'O cotovelo aponta para o teto e a mão desce atrás da cabeça; a outra mão segura o cotovelo',
    },
    'alongamento-antebraco': {
      base: 'alongamento-antebraco', gear: 'nenhum', scene: 'solo', implementAt: 'ha',
      caption: 'O desenho não mostra o punho: com o braço estendido, a outra mão puxa os dedos para trás',
    },
    'postura-crianca': { base: 'postura-crianca', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip' },
    'joelhos-ao-peito': { base: 'joelhos-ao-peito', gear: 'nenhum', scene: 'colchonete', implementAt: 'kn' },
  },
}

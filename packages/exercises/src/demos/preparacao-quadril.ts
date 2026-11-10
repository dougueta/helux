/** Família "preparação: ativação inferior e mobilidade de quadril e tornozelo" (028 US6, lote P2). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { MAT } from '../engine/scene-geometry'
import type { Keyframe, MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, MIDFOOT, balanced, handsAt, sidePose, straightArms } from './figure'
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
const around = (poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: Math.round((i / poses.length) * 1e6) / 1e6, pose }))

/** Linha das articulações apoiadas no colchonete. */
const MAT_Y = MAT.top - 4
const atShoulder = (p: Pose) => p.sh

/* ---------------------------------------------------------------- agachamentos sem carga */

const FOOT: Point = [98, ANKLE_Y]
const STAND = { an: FOOT, shinDeg: -86, thighDeg: -94 }
const armsForward = straightArms(() => 0)

/** Agachamento no banco sem carga: senta no banco atrás e sobe, braços à frente para equilibrar. */
const BOX_FOOT: Point = [100, ANKLE_Y]
const BOX_SIT = base(
  'agachamento-banco-livre',
  'reps',
  'foot',
  ['an', 'toe'],
  spread([
    balanced({ ...STAND, an: BOX_FOOT }, armsForward, atShoulder, MIDFOOT(BOX_FOOT) - 6),
    balanced({ an: BOX_FOOT, shinDeg: -78, thighDeg: 197 }, armsForward, atShoulder, MIDFOOT(BOX_FOOT) - 2),
  ]),
  2600,
)

/** Agachamento profundo com pausa: desce até o fundo e fica, mãos juntas à frente do peito, cotovelos por dentro dos joelhos. */
const prayer = handsAt((sh, t) => polar(sh, 24, t + 118), 'below')
const DEEP_HOLD = base(
  'agachamento-profundo-pausa',
  'hold',
  'foot',
  ['an', 'toe'],
  spread([
    balanced(STAND, prayer, atShoulder, MIDFOOT(FOOT) - 4),
    balanced({ an: FOOT, shinDeg: -42, thighDeg: 180 }, prayer, atShoulder, MIDFOOT(FOOT) - 2),
  ]),
  3200,
)

/* ---------------------------------------------------------------- dobradiça de quadril com bastão */

/** Bastão encostado na cabeça, nas costas e no quadril: uma mão atrás da nuca, a outra na lombar. */
function hinge(thighDeg: number, shinDeg: number, torsoDeg: number): Pose {
  const p = sidePose({ an: FOOT, shinDeg, thighDeg, torsoDeg }, (sh, t) => {
    const ha = polar(polar(sh, 10, t), 9, t - 90)
    return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'right'), ha }
  })
  const ha2 = polar(polar(p.hip, 12, torsoDeg), 9, torsoDeg - 90)
  return r({ ...p, el2: twoBone(p.sh, BODY.upperArm, ha2, BODY.forearm, 'left'), ha2 })
}
/** O quadril vai para trás com os joelhos levemente dobrados; o tronco desce reto, sem perder o contato com o bastão. */
const HIP_HINGE = base('dobradica-bastao', 'reps', 'foot', ['an', 'toe'], spread([hinge(-94, -86, -88), hinge(-120, -80, -18)]), 2800)

/* ---------------------------------------------------------------- sentado e em quatro apoios, no colchonete */

/**
 * Quadril 90/90, de perfil: sentado no chão, a coxa da frente aponta para a frente e a canela cruza à frente
 * do corpo (aparece curta); a coxa de trás vai para o lado (curta) e a canela para trás. O tronco inclina
 * sobre a perna da frente, com as mãos apoiadas nela.
 */
const NN_HIP: Point = [86, MAT_Y - 4]
const NN_HANDS: Point = [114, 222]
function ninetyNinety(torsoDeg: number): Pose {
  const sh = polar(NN_HIP, BODY.torso, torsoDeg)
  return r({
    head: polar(sh, BODY.neck, torsoDeg + 8), sh, el: twoBone(sh, BODY.upperArm, NN_HANDS, BODY.forearm, 'above'), ha: NN_HANDS,
    hip: NN_HIP, kn: [128, MAT_Y - 2], an: [122, MAT_Y], toe: [112, MAT_Y + 1],
    kn2: [78, MAT_Y - 1], an2: [36, MAT_Y], toe2: [24, MAT_Y + 1],
  })
}
const NINETY_NINETY = base(
  'quadril-90-90',
  'reps',
  'seat',
  ['hip', 'kn', 'an', 'toe', 'kn2', 'an2', 'toe2', 'ha'],
  spread([ninetyNinety(-76), ninetyNinety(-48)]),
  3200,
)

/**
 * Abertura de quadril (sapo), de perfil: apoiado nos antebraços com os joelhos bem afastados (a coxa aponta
 * para quem vê e aparece curta) e as canelas para trás; o quadril vai para trás e volta.
 */
const FROG_EL: Point = [150, MAT_Y]
const FROG_HA: Point = [FROG_EL[0] + BODY.forearm, MAT_Y]
const FROG_KN: Point = [96, MAT_Y]
const FROG_AN: Point = [FROG_KN[0] - BODY.shin, MAT_Y]
function frog(thighDeg: number): Pose {
  const hip = polar(FROG_KN, 22, thighDeg)
  const sh = twoBone(hip, BODY.torso, FROG_EL, BODY.upperArm, 'above')
  return r({
    head: polar(sh, BODY.neck, heading(hip, sh) + 10), sh, el: FROG_EL, ha: FROG_HA,
    hip, kn: FROG_KN, an: FROG_AN, toe: [FROG_AN[0] - BODY.foot, MAT_Y],
  })
}
const FROG = base('abertura-sapo', 'reps', 'hand', ['ha', 'el', 'kn', 'an', 'toe'], spread([frog(-62), frog(-128)]), 3200)

/* ---------------------------------------------------------------- agachamento cossaco, de frente */

const CK_AN: Point = [64, ANKLE_Y]
const CK_AN2: Point = [156, ANKLE_Y]
/** De frente, sem espelhar: o quadril desce sobre um pé, com a outra perna quase estendida; mãos juntas à frente do peito. */
function cossack(hip: Point, torsoDeg: number): Pose {
  const sh = polar(hip, BODY.torso, torsoDeg)
  const ha = polar(sh, 24, torsoDeg + 180)
  return r({
    head: polar(sh, BODY.neck, torsoDeg), sh, el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'left'), ha,
    el2: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'right'), ha2: ha,
    hip, kn: twoBone(hip, BODY.thigh, CK_AN, BODY.shin, 'left'), an: CK_AN, toe: [CK_AN[0] - 10, CK_AN[1] + 2],
    kn2: twoBone(hip, BODY.thigh, CK_AN2, BODY.shin, 'right'), an2: CK_AN2, toe2: [CK_AN2[0] + 10, CK_AN2[1] + 2],
  })
}
const COSSACK: MovementBase = {
  key: 'agachamento-cossaco',
  view: 'front',
  loop: 'cycle',
  durationMs: 4800,
  root: 'foot',
  fixed: ['an', 'toe', 'an2', 'toe2'],
  keyframes: around([
    cossack([110, 166], -90), cossack([95, 184], -84), cossack([82, 198], -78), cossack([95, 184], -84),
    cossack([110, 166], -90), cossack([125, 184], -96), cossack([138, 198], -102), cossack([125, 184], -96),
  ]),
}

/* ---------------------------------------------------------------- tornozelo e hálux */

/**
 * Tornozelo com joelho à parede: semiajoelhado de frente para a parede, pé da frente perto dela; o joelho
 * da frente avança por cima dos dedos até encostar na parede, sem o calcanhar sair do chão.
 */
const AW_AN: Point = [178, ANKLE_Y]
const AW_TOE = polar(AW_AN, BODY.foot, 25.4)
const AW_KN2: Point = [126, ANKLE_Y - 2]
function ankleWall(shinDeg: number): Pose {
  const kn = polar(AW_AN, BODY.shin, shinDeg)
  const hip = twoBone(AW_KN2, BODY.thigh, kn, BODY.thigh, 'above')
  const sh = polar(hip, BODY.torso, -84)
  const el = polar(sh, BODY.upperArm, 76)
  const an2 = polar(AW_KN2, BODY.shin, 180)
  return r({
    head: polar(sh, BODY.neck, -80), sh, el, ha: polar(el, BODY.forearm, 40),
    hip, kn, an: AW_AN, toe: AW_TOE, kn2: AW_KN2, an2, toe2: polar(an2, BODY.foot, 160),
  })
}
const ANKLE_WALL = base('joelho-parede', 'reps', 'foot', ['an', 'toe', 'kn2', 'an2', 'toe2'], spread([ankleWall(-80), ankleWall(-58)]), 2600)

/**
 * Dorsiflexão do hálux: ajoelhado com os dedos dos pés dobrados no chão (o pé fica em pé, apoiado nos dedos);
 * o quadril desce em direção aos calcanhares e fica.
 */
const HX_TOE: Point = [76, ANKLE_Y + 2]
const HX_AN = polar(HX_TOE, BODY.foot, -78)
const HX_KN = polar(HX_AN, BODY.shin, (Math.asin((MAT_Y - HX_AN[1]) / BODY.shin) * 180) / Math.PI)
function halluxKneel(thighDeg: number): Pose {
  const hip = polar(HX_KN, BODY.thigh, thighDeg)
  const sh = polar(hip, BODY.torso, -86)
  const el = polar(sh, BODY.upperArm, 96)
  return r({
    head: polar(sh, BODY.neck, -84), sh, el, ha: polar(el, BODY.forearm, 94),
    hip, kn: HX_KN, an: HX_AN, toe: HX_TOE,
  })
}
const HALLUX = base('dorsiflexao-halux', 'hold', 'foot', ['an', 'toe', 'kn'], spread([halluxKneel(-88), halluxKneel(-156)]), 3200)

export const PREPARACAO_QUADRIL: DemoFamily = {
  bases: [BOX_SIT, DEEP_HOLD, HIP_HINGE, NINETY_NINETY, FROG, COSSACK, ANKLE_WALL, HALLUX],
  demos: {
    'ponte-gluteo': { base: 'ponte', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip' },
    'flexao-inclinada-leve': { base: 'flexao-inclinada', gear: 'nenhum', scene: 'banco-baixo', implementAt: 'sh' },
    'afundo-sem-carga': { base: 'afundo-parado', gear: 'nenhum', scene: 'solo', implementAt: 'hip' },
    'agachamento-banco-sem-carga': { base: 'agachamento-banco-livre', gear: 'nenhum', scene: 'banco-baixo', implementAt: 'hip' },
    'dobradica-quadril-bastao': { base: 'dobradica-bastao', gear: 'bastao', scene: 'solo', implementAt: 'sh' },
    'quadril-90-90': {
      base: 'quadril-90-90', gear: 'nenhum', scene: 'colchonete', implementAt: 'sh',
      caption: 'De perfil: a perna da frente dobrada à frente do corpo, a de trás dobrada para o lado',
    },
    'abertura-quadril-sapo': {
      base: 'abertura-sapo', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip',
      caption: 'De perfil, com os joelhos bem afastados; o quadril vai para trás',
    },
    'agachamento-profundo-pausa': { base: 'agachamento-profundo-pausa', gear: 'nenhum', scene: 'solo', implementAt: 'hip' },
    'agachamento-cossaco': { base: 'agachamento-cossaco', gear: 'nenhum', scene: 'solo', implementAt: 'hip' },
    'tornozelo-joelho-parede': { base: 'joelho-parede', gear: 'nenhum', scene: 'parede', implementAt: 'kn' },
    'dorsiflexao-halux': {
      base: 'dorsiflexao-halux', gear: 'nenhum', scene: 'colchonete', implementAt: 'hip',
      caption: 'Ajoelhado com os dedos dos pés dobrados; o quadril desce em direção aos calcanhares',
    },
  },
}

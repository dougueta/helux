/** Família "preparação: aquecimento geral e ativação de membros superiores" (028 US6, lote P1). */
import { BODY, heading, polar, round, twoBone } from '../engine/geometry'
import { BIKE, PULL_UP_BAR, ROWER } from '../engine/scene-geometry'
import type { Keyframe, MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, sidePose, type SideLegs } from './figure'
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
): MovementBase => ({ key, view, ...(view === 'front' ? { mirror: true } : {}), loop, durationMs, root, fixed, keyframes })

/** Keyframes igualmente espaçados de 0 a 1. */
const spread = (poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: Math.round((i / (poses.length - 1)) * 1e6) / 1e6, pose }))
/** Keyframes de um ciclo: o último trecho volta ao primeiro, então não repete a pose inicial. */
const around = (poses: Pose[]): Keyframe[] => poses.map((pose, i) => ({ at: Math.round((i / poses.length) * 1e6) / 1e6, pose }))

/** Braço com o cotovelo no ângulo `upperDeg` e o antebraço em `foreDeg`. */
const arm = (sh: Point, upperDeg: number, foreDeg: number, upper: number = BODY.upperArm) => {
  const el = polar(sh, upper, upperDeg)
  return { el, ha: polar(el, BODY.forearm, foreDeg) }
}

/* ---------------------------------------------------------------- em pé, de perfil */

const STANDING: SideLegs = { an: [96, ANKLE_Y], shinDeg: -88, thighDeg: -92, torsoDeg: -90 }
const stand = (arms: (sh: Point) => { el: Point; ha: Point }, extra: Partial<Pose> = {}): Pose => r({ ...sidePose(STANDING, (sh) => arms(sh)), ...extra })
const STAND_SH = sidePose(STANDING, (sh) => arm(sh, 90, 90)).sh
const STAND_HIP = sidePose(STANDING, (sh) => arm(sh, 90, 90)).hip
const STAND_FIXED: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head']

/** Perna oposta com a coxa no ângulo `thighDeg` e a canela em `shinDeg`. */
const otherLeg = (thighDeg: number, shinDeg: number, footDeg = shinDeg - 65) => {
  const kn2 = polar(STAND_HIP, BODY.thigh, thighDeg)
  const an2 = polar(kn2, BODY.shin, shinDeg)
  return { kn2, an2, toe2: polar(an2, BODY.foot, footDeg) }
}

/** Marcha no lugar: a perna de trás sobe até a coxa ficar na horizontal, com o braço oposto à frente. */
const MARCH = base(
  'marcha-no-lugar',
  'alternate',
  'foot',
  STAND_FIXED,
  spread([
    stand((sh) => arm(sh, 88, 86), { ...otherLeg(92, 88, 25), ...prefix2(arm(STAND_SH, 92, 94)) }),
    stand((sh) => arm(sh, 50, -10), { ...otherLeg(-4, 88, 25), ...prefix2(arm(STAND_SH, 120, 100)) }),
  ]),
  1600,
)

function prefix2(a: { el: Point; ha: Point }) {
  return { el2: a.el, ha2: a.ha }
}

/** Balanço de perna: a perna livre, estendida, balança de trás para a frente; o tronco fica parado. */
const LEG_SWING = base(
  'balanco-perna',
  'reps',
  'foot',
  STAND_FIXED,
  spread([stand((sh) => arm(sh, 70, 30), otherLeg(118, 118)), stand((sh) => arm(sh, 70, 30), otherLeg(42, 42))]),
  1800,
)

/** Círculos de braço: os braços estendidos dão a volta completa, para a frente, para cima e para trás. */
const straight = (deg: number) => (sh: Point) => arm(sh, deg, deg)
const ARM_CIRCLES = base('circulos-braco', 'cycle', 'foot', STAND_FIXED, around([90, 0, -90, -180].map((d) => stand(straight(d)))), 2400)

/** Passagem de ombro: braços estendidos levam o elástico da frente das coxas, por cima da cabeça, até atrás do quadril. */
const PASS_THROUGH = base('passagem-ombro', 'reps', 'foot', STAND_FIXED, spread([80, -30, -130, 120].map((d) => stand(straight(d)))), 3600)

/**
 * Rotação externa a 90/90, de perfil: o cotovelo fica na altura do ombro e afastado do corpo (o braço
 * aponta para quem vê e aparece curto); o antebraço gira da horizontal até apontar para cima.
 */
const ER_UPPER = 8
const EXTERNAL_ROTATION = base(
  'rotacao-externa-90',
  'reps',
  'foot',
  [...STAND_FIXED, 'el'],
  spread([stand((sh) => arm(sh, 10, 12, ER_UPPER)), stand((sh) => arm(sh, 10, -92, ER_UPPER))]),
  2400,
)
const ER_ANCHOR: Point = [204, STAND_SH[1] + 14]

/** Puxada para o rosto: braços estendidos à frente puxam o elástico até as mãos ao lado das orelhas, cotovelos altos e para trás. */
const FACE_ANCHOR: Point = [204, STAND_SH[1] - 22]
const FACE_PULL = base(
  'puxada-rosto',
  'reps',
  'foot',
  STAND_FIXED,
  spread([
    stand((sh) => straight(heading(sh, FACE_ANCHOR))(sh)),
    stand((sh) => arm(sh, 190, -36)),
  ]),
  2400,
)

/* ---------------------------------------------------------------- de frente (o outro lado é espelhado) */

const F_HIP: Point = [100, 152]
const F_SH: Point = [92, 92]
const F_HEAD: Point = [110, 68]
const frontLegs = (an: Point) => {
  const kn = twoBone(F_HIP, BODY.thigh, an, BODY.shin, 'left')
  return { kn, an, toe: [an[0] - 10, an[1] + 2] as Point }
}
const front = (a: { el: Point; ha: Point }, an: Point = [96, ANKLE_Y]): Pose => r({ head: F_HEAD, sh: F_SH, ...a, hip: F_HIP, ...frontLegs(an) })
const FRONT_FIXED: MovementBase['fixed'] = ['hip', 'sh', 'head']

/** Polichinelo leve: as pernas abrem e os braços sobem pelos lados até acima da cabeça; os joelhos ficam soltos. */
const JUMPING_JACK = base(
  'polichinelo',
  'reps',
  'hip',
  FRONT_FIXED,
  spread([front(arm(F_SH, 98, 94), [96, ANKLE_Y]), front(arm(F_SH, -112, -100), [82, ANKLE_Y])]),
  1400,
  'front',
)

/** Deslizamento na parede, de frente: os braços saem em W e sobem em Y, sempre encostados na parede atrás. */
const STILL_FEET: MovementBase['fixed'] = ['hip', 'sh', 'head', 'kn', 'an', 'toe']
const WALL_SLIDE = base('deslizamento-parede', 'reps', 'hip', STILL_FEET, spread([front(arm(F_SH, 162, -94)), front(arm(F_SH, -126, -112))]), 3000, 'front')

/* ---------------------------------------------------------------- bicicleta */

const BIKE_HIP: Point = [BIKE.seat[0], BIKE.seat[1] - 6]
const BIKE_SH = polar(BIKE_HIP, BODY.torso, -52)
const BIKE_HANDS: Point = [BIKE.bar[0] - 2, BIKE.bar[1] - 2]
const pedal = (deg: number) => polar(BIKE.crank, BIKE.crankR, deg)
const bikeLeg = (deg: number) => {
  const an = pedal(deg)
  const kn = twoBone(BIKE_HIP, BODY.thigh, an, BODY.shin, 'above')
  return { kn, an, toe: polar(an, BODY.foot, 12) }
}
function biking(deg: number): Pose {
  const a = bikeLeg(deg)
  const b = bikeLeg(deg + 180)
  return r({
    head: polar(BIKE_SH, BODY.neck, -50), sh: BIKE_SH, el: twoBone(BIKE_SH, BODY.upperArm, BIKE_HANDS, BODY.forearm, 'below'), ha: BIKE_HANDS,
    hip: BIKE_HIP, ...a, kn2: b.kn, an2: b.an, toe2: b.toe,
  })
}
/** Bicicleta: os pés dão a volta no pedal, um do lado oposto ao outro; tronco e mãos parados. */
const BIKE_RIDE = base('bicicleta', 'cycle', 'seat', ['hip', 'sh', 'head', 'el', 'ha'], around([-90, -45, 0, 45, 90, 135, 180, 225].map(biking)), 1600)

/* ---------------------------------------------------------------- remo */

const ROW_AN: Point = ROWER.foot
const ROW_TOE = polar(ROW_AN, BODY.foot, -62)
const ROW_HIP_Y = ROWER.railY - 8
function rowing(hipX: number, torsoDeg: number, hands: 'reach' | 'pull'): Pose {
  const hip: Point = [hipX, ROW_HIP_Y]
  const kn = twoBone(hip, BODY.thigh, ROW_AN, BODY.shin, 'above')
  const sh = polar(hip, BODY.torso, torsoDeg)
  const ha: Point = hands === 'reach' ? polar(sh, 48, 36) : polar(sh, 26, 62)
  const el = twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'below')
  return r({ head: polar(sh, BODY.neck, torsoDeg + 6), sh, el, ha, hip, kn, an: ROW_AN, toe: ROW_TOE })
}
/** Remo: as pernas empurram, o tronco vai um pouco para trás e os braços puxam até o abdome; depois volta na ordem inversa. */
const ROW = base(
  'remo',
  'cycle',
  'foot',
  ['an', 'toe'],
  [
    { at: 0, pose: rowing(ROW_AN[0] - 46, -58, 'reach') },
    { at: 0.3, pose: rowing(ROW_AN[0] - 82, -64, 'reach') },
    { at: 0.5, pose: rowing(ROW_AN[0] - 82, -104, 'pull') },
  ],
  2600,
)

/* ---------------------------------------------------------------- barra fixa */

const HANG_HANDS: Point = [110, PULL_UP_BAR.y + 2]
const ARM = BODY.upperArm + BODY.forearm
/** Pendurado com os braços estendidos; `lean` inclina o corpo para trás da barra, como quando os ombros descem e se afastam das orelhas. */
function hang(lean: number): Pose {
  const sh = polar(HANG_HANDS, ARM, 90 + lean)
  const el = polar(HANG_HANDS, BODY.forearm, 90 + lean)
  const hip = polar(sh, BODY.torso, 92 - lean * 1.6)
  const kn = polar(hip, BODY.thigh, 82)
  const an = polar(kn, BODY.shin, 124)
  return r({ head: polar(sh, BODY.neck, -88 - lean), sh, el, ha: HANG_HANDS, hip, kn, an, toe: polar(an, BODY.foot, 80) })
}
/** Suspensão ativa: parte pendurado e solto e fica com os ombros ativos, peito levemente à frente. */
const ACTIVE_HANG = base('suspensao-ativa', 'hold', 'hand', ['ha'], spread([hang(0), hang(6)]), 3000)

export const PREPARACAO_ATIVACAO: DemoFamily = {
  bases: [MARCH, LEG_SWING, ARM_CIRCLES, PASS_THROUGH, EXTERNAL_ROTATION, FACE_PULL, JUMPING_JACK, WALL_SLIDE, BIKE_RIDE, ROW, ACTIVE_HANG],
  demos: {
    'bike-leve': { base: 'bicicleta', gear: 'bicicleta', scene: 'bicicleta', implementAt: 'an' },
    'remo-leve': { base: 'remo', gear: 'remo', scene: 'remo', implementAt: 'ha', anchor: ROWER.flywheel },
    'marcha-no-lugar': { base: 'marcha-no-lugar', gear: 'nenhum', scene: 'solo', implementAt: 'kn2' },
    'polichinelo-leve': { base: 'polichinelo', gear: 'nenhum', scene: 'solo', implementAt: 'ha' },
    'balanco-perna': { base: 'balanco-perna', gear: 'nenhum', scene: 'solo', implementAt: 'an2' },
    'circulos-braco': { base: 'circulos-braco', gear: 'nenhum', scene: 'solo', implementAt: 'ha' },
    'deslizamento-parede': {
      base: 'deslizamento-parede', gear: 'nenhum', scene: 'solo', implementAt: 'ha',
      caption: 'De frente; costas, cotovelos e mãos encostados na parede atrás',
    },
    'rotacao-externa-elastico': {
      base: 'rotacao-externa-90', gear: 'elastico', scene: 'solo', implementAt: 'ha', anchor: ER_ANCHOR,
      caption: 'Cotovelo na altura do ombro e afastado do corpo; o antebraço gira para cima',
    },
    'rotacao-passagem-ombro-elastico': {
      base: 'passagem-ombro', gear: 'elastico', scene: 'solo', implementAt: 'ha',
      caption: 'Elástico seguro com as mãos bem afastadas, braços estendidos',
    },
    'puxada-elastico-rosto': { base: 'puxada-rosto', gear: 'elastico', scene: 'solo', implementAt: 'ha', anchor: FACE_ANCHOR },
    'suspensao-ativa-barra': {
      base: 'suspensao-ativa', gear: 'barra-fixa', scene: 'barra-fixa', implementAt: 'ha',
      caption: 'Braços estendidos; os ombros descem, longe das orelhas',
    },
  },
}

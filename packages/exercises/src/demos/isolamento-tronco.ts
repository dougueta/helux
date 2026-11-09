/** Família "isolamento de tronco": elevações de ombro, encolhimentos e crucifixos (lote 9). */
import { BODY, polar, reverseBase, round, twoBone } from '../engine/geometry'
import { SEAT } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, sidePose, type SideLegs } from './figure'
import type { DemoFamily } from './index'

const base = (key: string, view: MovementBase['view'], root: MovementBase['root'], fixed: MovementBase['fixed'], start: Pose, end: Pose, durationMs = 2600): MovementBase => ({
  key,
  view,
  ...(view === 'front' ? { mirror: true } : {}),
  loop: 'reps',
  durationMs,
  root,
  fixed,
  keyframes: [
    { at: 0, pose: start },
    { at: 1, pose: end },
  ],
})

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose

/**
 * Vista de frente (o outro lado é espelhado). Os comprimentos aparentes do tronco e das pernas dependem
 * da postura, mas ficam constantes ao longo de cada movimento.
 */
const FRONT_AN: Point = [96, 234]
const FRONT_TOE: Point = [86, 236]
const UPPER = BODY.upperArm
const FORE = BODY.forearm

/** Braço com o cotovelo no ângulo `upperDeg` e o antebraço em `foreDeg`. */
const arm = (sh: Point, upperDeg: number, foreDeg: number) => {
  const el = polar(sh, UPPER, upperDeg)
  return { el, ha: polar(el, FORE, foreDeg) }
}

/* ---------------------------------------------------------------- em pé, de frente */

const ST_HIP: Point = [100, 150]
const ST_KN: Point = [98, 192]
const ST_SH: Point = [92, 90]
const ST_HEAD: Point = [110, 66]
const standingFront = (a: { el: Point; ha: Point }): Pose => r({ head: ST_HEAD, sh: ST_SH, ...a, hip: ST_HIP, kn: ST_KN, an: FRONT_AN, toe: FRONT_TOE })
const FRONT_FIXED: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head']

/** Elevação lateral: braços quase estendidos sobem pelos lados até a altura dos ombros. */
const LATERAL_RAISE = base('elevacao-lateral', 'front', 'foot', FRONT_FIXED, standingFront(arm(ST_SH, 96, 92)), standingFront(arm(ST_SH, 184, 178)))

/** Crossover: as mãos vêm do alto e de fora, em arco, até se encontrarem à frente do quadril. */
const CROSS_HANDS: Point = [106, 142]
const CROSSOVER = base(
  'crossover',
  'front',
  'foot',
  FRONT_FIXED,
  standingFront(arm(ST_SH, -158, -166)),
  standingFront({ el: twoBone(ST_SH, UPPER, CROSS_HANDS, FORE, 'left'), ha: CROSS_HANDS }),
)
/** Polias altas, uma de cada lado. */
const CROSS_ANCHOR: Point = [14, 26]
/** Polia baixa do lado oposto: o cabo cruza à frente do corpo. */
const LATERAL_CABLE_ANCHOR: Point = [126, 232]

/**
 * Encolhimento: só os ombros deveriam subir, mas a figura tem o tronco rígido. A demonstração sobe o corpo
 * inteiro um pouco, dos joelhos soltos até estendidos, com os braços estendidos o tempo todo.
 */
function shrug(hipY: number): Pose {
  const hip: Point = [ST_HIP[0], hipY]
  const sh: Point = [ST_SH[0], hipY - (ST_HIP[1] - ST_SH[1])]
  return r({
    head: [ST_HEAD[0], sh[1] - (ST_SH[1] - ST_HEAD[1])], sh, ...arm(sh, 94, 91),
    hip, kn: twoBone(hip, BODY.thigh, FRONT_AN, BODY.shin, 'left'), an: FRONT_AN, toe: FRONT_TOE,
  })
}
const SHRUG = base('encolhimento', 'front', 'foot', ['an', 'toe'], shrug(153), shrug(150.4), 2200)

/** Elevação posterior: tronco inclinado à frente (visto de frente, fica curto); os braços sobem pelos lados. */
const BO_SH: Point = [90, 130]
const BO_HIP: Point = [100, 138]
const bentOver = (a: { el: Point; ha: Point }): Pose => r({ head: [110, 122], sh: BO_SH, ...a, hip: BO_HIP, kn: [92, 186], an: FRONT_AN, toe: FRONT_TOE })
const REAR_RAISE = base('elevacao-posterior', 'front', 'foot', FRONT_FIXED, bentOver(arm(BO_SH, 94, 92)), bentOver(arm(BO_SH, 182, 176)))

/* ---------------------------------------------------------------- elevação frontal, de perfil */

const STANDING: SideLegs = { an: [92, ANKLE_Y], shinDeg: -88, thighDeg: -92, torsoDeg: -90 }
const sideArm = (upperDeg: number, foreDeg: number) => (sh: Point) => arm(sh, upperDeg, foreDeg)
/** Elevação frontal: braços quase estendidos sobem à frente até a altura dos ombros. */
const FRONT_RAISE = base('elevacao-frontal', 'side', 'foot', FRONT_FIXED, sidePose(STANDING, sideArm(88, 86)), sidePose(STANDING, sideArm(-4, -8)))

/* ---------------------------------------------------------------- sentado na máquina, de frente */

/** Peck deck: cotovelos na altura dos ombros e antebraços para cima; os braços fecham à frente do peito. */
const PD_HIP: Point = [102, SEAT.top - 2]
const PD_SH: Point = [94, 104]
const PD_KN = polar(PD_HIP, 30, 95)
const PD_AN = polar(PD_KN, 26, 92)
function peckDeck(upperDeg: number): Pose {
  return r({ head: [110, 82], sh: PD_SH, ...arm(PD_SH, upperDeg, -90), hip: PD_HIP, kn: PD_KN, an: PD_AN, toe: polar(PD_AN, 9, 152) })
}
const PECK_DECK = base('peck-deck', 'front', 'seat', ['hip', 'sh', 'head', 'kn', 'an', 'toe'], peckDeck(180), peckDeck(54))
/** Crucifixo invertido: o mesmo caminho no sentido oposto, de frente para o encosto (braços abrem). */
const REVERSE_FLY = reverseBase(PECK_DECK, 'crucifixo-invertido')

/* ---------------------------------------------------------------- crucifixo deitado, visto dos pés */

/**
 * Crucifixo visto a partir dos pés: deitado no banco, o tronco fica curto e os pés no chão dos dois lados
 * do banco; os braços abrem pelos lados em arco e voltam a se encontrar acima do peito.
 */
function fly(sh: Point, head: Point, open: boolean): Pose {
  const top: Point = [104, sh[1] - 54]
  const a = open ? arm(sh, 190, 172) : { el: twoBone(sh, UPPER, top, FORE, 'left'), ha: top }
  return r({ head, sh, ...a, hip: [98, 176], kn: [92, 206], an: [90, ANKLE_Y], toe: [80, 236] })
}
const FLY_SH: Point = [86, 168]
const FLY = base('crucifixo', 'front', 'hip', ['hip', 'sh', 'head', 'kn', 'an', 'toe'], fly(FLY_SH, [110, 163], false), fly(FLY_SH, [110, 163], true))
/** Inclinado: o tronco aparece mais longo e os ombros mais altos. */
const INC_SH: Point = [86, 150]
const INCLINE_FLY = base('crucifixo-inclinado', 'front', 'hip', ['hip', 'sh', 'head', 'kn', 'an', 'toe'], fly(INC_SH, [110, 138], false), fly(INC_SH, [110, 138], true))

export const ISOLAMENTO_TRONCO: DemoFamily = {
  bases: [LATERAL_RAISE, CROSSOVER, SHRUG, REAR_RAISE, FRONT_RAISE, PECK_DECK, REVERSE_FLY, FLY, INCLINE_FLY],
  demos: {
    'elevacao-lateral-halteres': { base: 'elevacao-lateral', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'elevacao-lateral-cabo': {
      base: 'elevacao-lateral', gear: 'cabo', scene: 'solo', implementAt: 'ha', anchor: LATERAL_CABLE_ANCHOR,
      caption: 'Um braço de cada vez; o cabo vem da polia baixa do lado oposto',
    },
    'elevacao-frontal-halteres': { base: 'elevacao-frontal', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'elevacao-posterior-halteres': { base: 'elevacao-posterior', gear: 'halteres', scene: 'solo', implementAt: 'ha', caption: 'Tronco inclinado à frente, visto de frente' },
    'crucifixo-invertido-maquina': { base: 'crucifixo-invertido', gear: 'maquina', scene: 'assento', implementAt: 'ha', caption: 'Sentado de frente para o encosto, os braços abrem para trás' },
    'peck-deck-maquina': { base: 'peck-deck', gear: 'maquina', scene: 'assento', implementAt: 'ha', caption: 'Costas no encosto, os braços fecham à frente do peito' },
    'encolhimento-ombros-halteres': { base: 'encolhimento', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'encolhimento-barra': { base: 'encolhimento', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    'crucifixo-halteres': { base: 'crucifixo', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha', caption: 'Visto a partir dos pés, deitado no banco reto' },
    'crucifixo-inclinado-halteres': { base: 'crucifixo-inclinado', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha', caption: 'Visto a partir dos pés, no banco inclinado a uns 30 graus' },
    'crossover-cabo': { base: 'crossover', gear: 'cabo', scene: 'solo', implementAt: 'ha', anchor: CROSS_ANCHOR },
  },
}

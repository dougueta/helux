/** Família "isolamento de pernas": cadeiras, mesas e panturrilhas. */
import { BODY, heading, polar, reverseBase, round, twoBone } from '../engine/geometry'
import { FLAT_BENCH, RECLINED_SEAT, SEAT, STEP } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import type { DemoFamily } from './index'

/**
 * Sentado na máquina, de frente (o outro lado é espelhado). Na vista frontal a coxa aparece encurtada,
 * por isso usa comprimentos próprios, constantes ao longo do movimento.
 */
const FRONT_THIGH = 30
const FRONT_SHIN = 32
const FRONT_FOOT = 9

function seatedFront(thighDeg: number, shinDeg: number): Pose {
  const hip: Point = [102, SEAT.top - 2]
  const sh: Point = [94, 104]
  const head: Point = [110, 82]
  const el: Point = [84, 134]
  const ha: Point = [82, 162]
  const kn = polar(hip, FRONT_THIGH, thighDeg)
  const an = polar(kn, FRONT_SHIN, shinDeg)
  const toe = polar(an, FRONT_FOOT, shinDeg + 60)
  return { head, sh, el, ha, hip, kn: round(kn), an: round(an), toe: round(toe) }
}

/** Adução: as pernas saem abertas e fecham até as almofadas quase se tocarem. */
const ADDUCTION: MovementBase = {
  key: 'aducao-sentado',
  view: 'front',
  mirror: true,
  loop: 'reps',
  durationMs: 2600,
  root: 'seat',
  fixed: ['hip', 'sh', 'head', 'el', 'ha'],
  keyframes: [
    { at: 0, pose: seatedFront(160, 100) },
    { at: 1, pose: seatedFront(95, 92) },
  ],
}

/** Abdução: o mesmo caminho, no sentido oposto (pernas fechadas abrem). */
const ABDUCTION = reverseBase(ADDUCTION, 'abducao-sentado')

/** Deitado de bruços no banco, cabeça à esquerda, mãos nas pegadas à frente. */
function lyingProne(shinDeg: number): Pose {
  const y = FLAT_BENCH.top - 6
  const sh: Point = [56, y]
  const hip: Point = [sh[0] + BODY.torso, y]
  const head = polar(sh, BODY.neck, 180)
  const el = polar(sh, BODY.upperArm, 150)
  const ha = polar(el, BODY.forearm, 200)
  const kn = polar(hip, BODY.thigh, 2)
  const an = polar(kn, BODY.shin, shinDeg)
  const toe = polar(an, BODY.foot, shinDeg + 90)
  return { head: round(head), sh, el: round(el), ha: round(ha), hip, kn: round(kn), an: round(an), toe: round(toe) }
}

/** Flexão de joelho deitado: só a perna abaixo do joelho se move, levando o rolo em direção ao glúteo. */
const PRONE_KNEE_FLEXION: MovementBase = {
  key: 'flexao-joelho-deitado',
  view: 'side',
  loop: 'reps',
  durationMs: 2600,
  root: 'hip',
  fixed: ['hip', 'sh', 'head', 'el', 'ha', 'kn'],
  keyframes: [
    { at: 0, pose: lyingProne(0) },
    { at: 1, pose: lyingProne(-100) },
  ],
}

const base = (key: string, root: MovementBase['root'], fixed: MovementBase['fixed'], start: Pose, end: Pose, durationMs = 2400): MovementBase => ({
  key,
  view: 'side',
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

/* ---------------------------------------------------------------- cadeiras, de perfil */

/** Sentado na máquina, costas no encosto, coxa apoiada no assento; só a perna abaixo do joelho se move. */
const CH_HIP: Point = [SEAT.backX + 8, SEAT.top - 6]
const CH_SH: Point = [CH_HIP[0] + 2, CH_HIP[1] - BODY.torso]
const CH_KN: Point = [CH_HIP[0] + BODY.thigh, CH_HIP[1]]
const CH_HANDS: Point = [CH_HIP[0] + 16, CH_HIP[1] - 4]
function machineChair(shinDeg: number): Pose {
  const an = polar(CH_KN, BODY.shin, shinDeg)
  return r({
    head: [CH_SH[0] + 2, CH_SH[1] - BODY.neck], sh: CH_SH, el: twoBone(CH_SH, BODY.upperArm, CH_HANDS, BODY.forearm, 'left'), ha: CH_HANDS,
    hip: CH_HIP, kn: CH_KN, an, toe: polar(an, BODY.foot, shinDeg - 90),
  })
}
const CHAIR_FIXED: MovementBase['fixed'] = ['hip', 'sh', 'head', 'el', 'ha', 'kn']
/** Cadeira extensora: a perna sobe da vertical até quase estender o joelho. */
const KNEE_EXTENSION = base('extensao-joelho-sentado', 'seat', CHAIR_FIXED, machineChair(94), machineChair(-4))
/** Cadeira flexora: a perna parte estendida à frente e desce dobrando o joelho por baixo do assento. */
const SEATED_KNEE_FLEXION = base('flexao-joelho-sentado', 'seat', CHAIR_FIXED, machineChair(-2), machineChair(112))

/* ---------------------------------------------------------------- panturrilhas */

/** Pé com a ponta apoiada em `toe`: o tornozelo fica atrás, com o pé no ângulo `footDeg`. */
const ankleFrom = (toe: Point, footDeg: number) => polar(toe, BODY.foot, footDeg + 180)

/**
 * Em pé, com a ponta dos pés na beira do degrau e o calcanhar para fora: o calcanhar desce abaixo do degrau
 * e sobe o máximo; as pernas ficam estendidas e o corpo inteiro sobe junto.
 */
const CALF_TOE: Point = [STEP.x0 + 10, STEP.top - 3]
function standingCalf(footDeg: number, arms: (sh: Point) => { el: Point; ha: Point }): Pose {
  const an = ankleFrom(CALF_TOE, footDeg)
  const kn = polar(an, BODY.shin, -90)
  const hip = polar(kn, BODY.thigh, -90)
  const sh = polar(hip, BODY.torso, -90)
  return r({ head: polar(sh, BODY.neck, -84), sh, ...arms(sh), hip, kn, an, toe: CALF_TOE })
}
const hanging = (sh: Point) => {
  const el = polar(sh, BODY.upperArm, 92)
  return { el, ha: polar(el, BODY.forearm, 90) }
}
/** Mãos segurando as almofadas da máquina sobre os ombros. */
const onPads = (sh: Point) => {
  const ha: Point = [sh[0] + 6, sh[1] - 4]
  return { el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'right'), ha }
}
const CALF_DOWN = -22
const CALF_UP = 52
const STANDING_CALF = base('panturrilha-em-pe', 'toe', ['toe'], standingCalf(CALF_DOWN, hanging), standingCalf(CALF_UP, hanging), 2000)
const MACHINE_CALF = base('panturrilha-maquina', 'toe', ['toe'], standingCalf(CALF_DOWN, onPads), standingCalf(CALF_UP, onPads), 2000)

/** Panturrilha sentado: joelhos sob o apoio, ponta dos pés na plataforma; o calcanhar sobe e leva os joelhos junto. */
const SC_HIP: Point = [SEAT.backX + 8, SEAT.top - 6]
const SC_SH = polar(SC_HIP, BODY.torso, -64)
const SC_TOE: Point = [128, 223]
function seatedCalf(footDeg: number): Pose {
  const an = ankleFrom(SC_TOE, footDeg)
  const kn = twoBone(SC_HIP, BODY.thigh, an, BODY.shin, 'above')
  const ha: Point = [kn[0] - 6, kn[1] - 14]
  return r({
    head: polar(SC_SH, BODY.neck, -58), sh: SC_SH, el: twoBone(SC_SH, BODY.upperArm, ha, BODY.forearm, 'below'), ha,
    hip: SC_HIP, kn, an, toe: SC_TOE,
  })
}
const SEATED_CALF = base('panturrilha-sentado', 'seat', ['hip', 'sh', 'head', 'toe'], seatedCalf(-22), seatedCalf(46), 2000)

/** Panturrilha no leg press: joelhos quase estendidos e parados; só o tornozelo empurra a plataforma. */
const LP_BACK = heading(RECLINED_SEAT.to, RECLINED_SEAT.from)
const LP_HIP: Point = [88, 194]
const LP_SH = polar(LP_HIP, BODY.torso, LP_BACK)
const LP_HA: Point = [80, 197]
const LP_PUSH = -40
const LP_AN = polar(LP_HIP, BODY.thigh + BODY.shin - 2, LP_PUSH)
const LP_KN = twoBone(LP_HIP, BODY.thigh, LP_AN, BODY.shin, 'above')
const legPressCalf = (footDeg: number): Pose =>
  r({
    head: polar(LP_SH, BODY.neck, LP_BACK), sh: LP_SH, el: twoBone(LP_SH, BODY.upperArm, LP_HA, BODY.forearm, 'below'), ha: LP_HA,
    hip: LP_HIP, kn: LP_KN, an: LP_AN, toe: polar(LP_AN, BODY.foot, footDeg),
  })
const LEG_PRESS_CALF = base('panturrilha-leg-press', 'seat', ['hip', 'sh', 'head', 'el', 'ha', 'kn', 'an'], legPressCalf(LP_PUSH - 110), legPressCalf(LP_PUSH - 50), 2000)

export const ISOLAMENTO_PERNAS: DemoFamily = {
  bases: [ADDUCTION, ABDUCTION, PRONE_KNEE_FLEXION, KNEE_EXTENSION, SEATED_KNEE_FLEXION, STANDING_CALF, MACHINE_CALF, SEATED_CALF, LEG_PRESS_CALF],
  demos: {
    'cadeira-adutora': { base: 'aducao-sentado', gear: 'maquina', scene: 'assento', implementAt: 'kn' },
    'mesa-flexora': { base: 'flexao-joelho-deitado', gear: 'maquina', scene: 'banco-reto', implementAt: 'an' },
    'cadeira-abdutora': { base: 'abducao-sentado', gear: 'maquina', scene: 'assento', implementAt: 'kn' },
    'cadeira-extensora': { base: 'extensao-joelho-sentado', gear: 'maquina', scene: 'maquina', implementAt: 'an' },
    'cadeira-flexora': { base: 'flexao-joelho-sentado', gear: 'maquina', scene: 'maquina', implementAt: 'an' },
    'elevacao-panturrilha-pe-maquina': { base: 'panturrilha-maquina', gear: 'maquina', scene: 'degrau', implementAt: 'sh' },
    'elevacao-panturrilha-corporal': { base: 'panturrilha-em-pe', gear: 'peso-corporal', scene: 'degrau', implementAt: 'an' },
    'elevacao-panturrilha-halteres': { base: 'panturrilha-em-pe', gear: 'halteres', scene: 'degrau', implementAt: 'ha' },
    'elevacao-panturrilha-sentado-maquina': { base: 'panturrilha-sentado', gear: 'maquina', scene: 'maquina', implementAt: 'kn' },
    'panturrilha-leg-press': { base: 'panturrilha-leg-press', gear: 'maquina', scene: 'assento-reclinado', implementAt: 'toe' },
  },
}

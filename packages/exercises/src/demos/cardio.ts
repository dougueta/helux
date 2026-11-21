/**
 * Família "cardio" (028 US6, lote C1): as 11 modalidades de `CARDIO_BANK`, todas em ciclo contínuo.
 * Caminhada, corrida e circuito ficam no lugar, com o quadril parado; o chão não anda, os pés sim.
 */
import { BODY, polar, round, twoBone } from '../engine/geometry'
import { ELLIPTICAL, POOL, ROWER, STEPPER, TREADMILL } from '../engine/scene-geometry'
import type { Keyframe, MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, FOOT_DEG, sidePose } from './figure'
import type { DemoFamily } from './index'
import { BIKE_RIDE, ROW } from './preparacao-ativacao'

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose

const cycle = (key: string, root: MovementBase['root'], fixed: MovementBase['fixed'], keyframes: Keyframe[], durationMs: number): MovementBase => ({
  key, view: 'side', loop: 'cycle', durationMs, root, fixed, keyframes,
})

/** Keyframes de um ciclo, igualmente espaçados em [from, to): o último trecho segue para o próximo. */
const around = (poses: Pose[], from = 0, to = 1): Keyframe[] =>
  poses.map((pose, i) => ({ at: Math.round((from + (i / poses.length) * (to - from)) * 1e6) / 1e6, pose }))

const range = (n: number) => Array.from({ length: n }, (_, i) => i)
const cos = (deg: number) => Math.cos((deg * Math.PI) / 180)
const sin = (deg: number) => Math.sin((deg * Math.PI) / 180)

/** Braço pelo ângulo do braço e do antebraço. */
const arm = (sh: Point, upperDeg: number, foreDeg: number) => {
  const el = polar(sh, BODY.upperArm, upperDeg)
  return { el, ha: polar(el, BODY.forearm, foreDeg) }
}

/** Perna com o tornozelo em `an`: joelho à frente, pé no ângulo `footDeg`. */
const leg = (hip: Point, an: Point, footDeg: number) => ({ kn: twoBone(hip, BODY.thigh, an, BODY.shin, 'right'), an, toe: polar(an, BODY.foot, footDeg) })
const second = (l: { kn: Point; an: Point; toe: Point }) => ({ kn2: l.kn, an2: l.an, toe2: l.toe })
const secondArm = (a: { el: Point; ha: Point }) => ({ el2: a.el, ha2: a.ha })

/* ---------------------------------------------------------------- passada no lugar */

/** Tornozelo em relação ao quadril (dx) e altura acima do apoio (lift), com o ângulo do pé, em 8 fases. */
interface Stride {
  dx: number[]
  lift: number[]
  foot: number[]
}

/** Caminhada: o pé fica no chão em 5 de 8 fases, do calcanhar à frente até a ponta atrás. */
const WALK: Stride = {
  dx: [24, 12, 0, -12, -24, -22, -2, 18],
  lift: [0, 0, 0, 0, 2, 10, 14, 6],
  foot: [-6, FOOT_DEG, FOOT_DEG, FOOT_DEG, 48, 56, 22, 2],
}

/** Trote: pouco tempo no chão, calcanhar alto atrás e joelho à frente antes de pousar perto do corpo. */
const RUN: Stride = {
  dx: [14, 2, -14, -30, -34, -18, 6, 18],
  lift: [0, 0, 0, 14, 40, 52, 40, 14],
  foot: [12, FOOT_DEG, 42, 62, 70, 50, 22, 8],
}

const GAIT_HIP: Point = [100, ANKLE_Y - 78]

interface GaitStyle {
  stride: Stride
  torsoDeg: number
  /** amplitude do balanço do braço */
  swing: number
  /** dobra do cotovelo: o antebraço fica `bend` graus à frente do braço */
  bend: number
}
const WALKING: GaitStyle = { stride: WALK, torsoDeg: -88, swing: 22, bend: 18 }
const RUNNING: GaitStyle = { stride: RUN, torsoDeg: -82, swing: 36, bend: 88 }

/**
 * Passada na fase `k` (0 a 7). A perna principal está na fase `k` e a outra na fase oposta;
 * cada braço balança com a perna do outro lado. `ground(x)` dá a altura do tornozelo apoiado.
 */
function gait(style: GaitStyle, k: number, ground: (x: number) => number, hip: Point = GAIT_HIP, torsoDeg = style.torsoDeg): Pose {
  const { stride } = style
  const at = (i: number) => {
    const x = hip[0] + stride.dx[i]
    return leg(hip, [x, ground(x) - stride.lift[i]], stride.foot[i])
  }
  const main = at(k % 8)
  const other = at((k + 4) % 8)
  const sh = polar(hip, BODY.torso, torsoDeg)
  // a perna principal à frente (fase 0) leva o braço principal para trás
  const a = cos((k / 8) * 360)
  const upper = (s: number) => 90 + s * style.swing * a
  return r({
    head: polar(sh, BODY.neck, torsoDeg + 8), sh,
    ...arm(sh, upper(1), upper(1) - style.bend),
    ...secondArm(arm(sh, upper(-1), upper(-1) - style.bend)),
    hip, ...main, ...second(other),
  })
}

const FLAT = () => ANKLE_Y
const GAIT_FIXED: MovementBase['fixed'] = ['hip', 'sh', 'head']

/** Caminhada no lugar: passada natural, braços soltos acompanhando a perna do outro lado. */
const WALK_BASE = cycle('caminhada', 'hip', GAIT_FIXED, around(range(8).map((k) => gait(WALKING, k, FLAT))), 1100)

/** Corrida no lugar: passada curta, pouso perto do corpo, cotovelos a 90 graus. */
const RUN_BASE = cycle('corrida', 'hip', GAIT_FIXED, around(range(8).map((k) => gait(RUNNING, k, FLAT))), 720)

/** Corrida alternada com caminhada: um ciclo caminhando e dois trotando, sem parar. */
const WALK_SHARE = 0.44
const WALK_RUN = cycle(
  'corrida-caminhada',
  'hip',
  ['hip'],
  [
    ...around(range(8).map((k) => gait(WALKING, k, FLAT)), 0, WALK_SHARE),
    ...around(range(16).map((k) => gait(RUNNING, k % 8, FLAT)), WALK_SHARE, 1),
  ],
  2500,
)

/** Esteira inclinada: a lona sobe para a frente; o tornozelo apoiado acompanha a rampa. */
const [DECK_BACK, DECK_FRONT] = TREADMILL.deck
const deckY = (x: number) => DECK_BACK[1] + ((x - DECK_BACK[0]) * (DECK_FRONT[1] - DECK_BACK[1])) / (DECK_FRONT[0] - DECK_BACK[0])
/** Tornozelo a 6 da lona, como no solo. */
const DECK_ANKLE = (x: number) => deckY(x) - 6
const INCLINE_HIP: Point = [100, DECK_ANKLE(100) - 78]
/** Corpo levemente inclinado à frente a partir dos tornozelos, mãos longe do painel. */
const INCLINE_WALK = cycle(
  'caminhada-inclinada',
  'hip',
  GAIT_FIXED,
  around(range(8).map((k) => gait(WALKING, k, DECK_ANKLE, INCLINE_HIP, -84))),
  1200,
)

/* ---------------------------------------------------------------- elíptico */

/** Quadril na altura em que a perna fica quase esticada (82,5 de 84) no ponto da elipse mais distante dele. */
const ELL_HIP: Point = (() => {
  const x = 94
  const track = range(36).map((i): Point => [ELLIPTICAL.track[0] + ELLIPTICAL.rx * cos(i * 10), ELLIPTICAL.track[1] + ELLIPTICAL.ry * sin(i * 10)])
  const reach = (y: number) => Math.max(...track.map((p) => Math.hypot(p[0] - x, p[1] - y)))
  let lo = ELLIPTICAL.track[1] - 84
  let hi = ELLIPTICAL.track[1] - 60
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (reach(mid) > 82.5) lo = mid
    else hi = mid
  }
  return [x, hi]
})()
const ELL_SH = polar(ELL_HIP, BODY.torso, -87)
const GRIP_R = 121
/** Pé no ângulo `deg` da elipse: à frente em 0°, embaixo em 90° (o pé vai para trás apoiado, como na caminhada). */
const pedalAt = (deg: number): Point => [ELLIPTICAL.track[0] + ELLIPTICAL.rx * cos(deg), ELLIPTICAL.track[1] + ELLIPTICAL.ry * sin(deg)]
/** Mão na alavanca: vai para trás quando o pé do mesmo lado vai à frente. */
const gripAt = (deg: number): Point => polar(ELLIPTICAL.pivot, GRIP_R, -90 - 6 * cos(deg))
function elliptical(deg: number): Pose {
  const foot = (d: number) => leg(ELL_HIP, pedalAt(d), 6)
  const hand = (d: number) => {
    const ha = gripAt(d)
    return { el: twoBone(ELL_SH, BODY.upperArm, ha, BODY.forearm, 'below'), ha }
  }
  return r({
    head: polar(ELL_SH, BODY.neck, -82), sh: ELL_SH, ...hand(deg), ...secondArm(hand(deg + 180)),
    hip: ELL_HIP, ...foot(deg), ...second(foot(deg + 180)),
  })
}
/** Elíptico: pés sempre apoiados nos pedais, que dão a volta na elipse; os braços empurram e puxam as alavancas. */
const ELLIPTICAL_BASE = cycle('eliptico', 'hip', GAIT_FIXED, around(range(8).map((k) => elliptical(k * 45))), 1500)

/* ---------------------------------------------------------------- escada / stepper */

const STEP_HIP: Point = [100, 142]
const STEP_SH = polar(STEP_HIP, BODY.torso, -84)
const STEP_HAND: Point = [128, STEPPER.rail.y]
/** Pedal no ângulo `deg` em torno do eixo de trás; o pé fica inteiro sobre ele. */
const pedal = (deg: number) => {
  const an = polar(STEPPER.pivot, STEPPER.pedal, deg)
  return leg(STEP_HIP, [an[0], an[1] - 6], deg + FOOT_DEG)
}
function stepping(k: number): Pose {
  const a = cos((k / 8) * 360)
  return r({
    head: polar(STEP_SH, BODY.neck, -76), sh: STEP_SH, el: twoBone(STEP_SH, BODY.upperArm, STEP_HAND, BODY.forearm, 'below'), ha: STEP_HAND,
    hip: STEP_HIP, ...pedal(-1 - 7 * a), ...second(pedal(-1 + 7 * a)),
  })
}
/** Escada: um pedal desce com o peso do corpo enquanto o outro sobe; a mão só encosta no corrimão. */
const STEPPER_BASE = cycle('escada', 'hip', ['hip', 'sh', 'head', 'el', 'ha'], around(range(8).map(stepping)), 1500)

/* ---------------------------------------------------------------- natação */

/**
 * Deitado na água, o corpo inteiro (pés até a mão estendida à frente) não cabe na largura da cena:
 * só nesta base a figura é desenhada a 90% do tamanho, com as mesmas proporções.
 */
const SWIM_SCALE = 0.9
const S = (bone: keyof typeof BODY) => BODY[bone] * SWIM_SCALE
const SWIM_HIP: Point = [94, POOL.surface + 10]
const SWIM_SH = polar(SWIM_HIP, S('torso'), -3)
/** Crawl de lado: um braço passa por cima da água enquanto o outro puxa por baixo; pernada curta e contínua. */
function swimming(k: number): Pose {
  const deg = k * 30
  const stroke = (d: number) => {
    const el = polar(SWIM_SH, S('upperArm'), d)
    return { el, ha: polar(el, S('forearm'), d + 14) }
  }
  const kick = (s: number) => {
    const thigh = 178 + 7 * s * sin(deg * 2)
    const kn = polar(SWIM_HIP, S('thigh'), thigh)
    const shin = thigh + 4 + 8 * s * sin(deg * 2 - 60)
    const an = polar(kn, S('shin'), shin)
    return { kn, an, toe: polar(an, S('foot'), shin) }
  }
  return r({
    head: polar(SWIM_SH, S('neck'), 2), sh: SWIM_SH, ...stroke(deg), ...secondArm(stroke(deg + 180)),
    hip: SWIM_HIP, ...kick(1), ...second(kick(-1)),
  })
}
const SWIM_BASE = cycle('natacao', 'hip', GAIT_FIXED, around(range(12).map(swimming)), 2000)

/* ---------------------------------------------------------------- circuito */

const STAND = { an: [100, ANKLE_Y] as Point, shinDeg: -88, thighDeg: -92, torsoDeg: -88 }
const STAND_POSE = sidePose(STAND, (sh) => arm(sh, 92, 90))
const C_HIP = STAND_POSE.hip
const C_SH = STAND_POSE.sh
const standLeg = { kn: STAND_POSE.kn, an: STAND_POSE.an, toe: STAND_POSE.toe }
/** Joelho para cima: coxa quase na horizontal, canela pendurada. */
const kneeUp = () => leg(C_HIP, polar(polar(C_HIP, BODY.thigh, -8), BODY.shin, 86), 30)
/** Calcanhar para trás, perto do glúteo; coxa parada na vertical. */
const heelUp = () => {
  const kn = polar(C_HIP, BODY.thigh, 96)
  const an = polar(kn, BODY.shin, -128)
  return { kn, an, toe: polar(an, BODY.foot, -40) }
}
const relaxed = arm(C_SH, 92, 84)
const marchArm = (forward: boolean) => (forward ? arm(C_SH, 52, -24) : arm(C_SH, 118, 96))
const guard = arm(C_SH, 112, -64)
const punch = arm(C_SH, 2, 0)

function circuitPose(legs: { main: ReturnType<typeof leg>; other: ReturnType<typeof leg> }, arms: { main: { el: Point; ha: Point }; other: { el: Point; ha: Point } }): Pose {
  return r({ ...STAND_POSE, ...arms.main, ...secondArm(arms.other), ...legs.main, ...second(legs.other) })
}
const both = (l: ReturnType<typeof leg>, o: ReturnType<typeof leg>) => ({ main: l, other: o })
const arms2 = (m: { el: Point; ha: Point }, o: { el: Point; ha: Point }) => ({ main: m, other: o })

/**
 * Circuito: marcha no lugar → socos alternados → calcanhar no glúteo, sem pausa e sem saltos.
 * Começa em cada movimento com o lado principal, para a evidência mostrar os três (fases 0, 1/3 e 2/3).
 */
const CIRCUIT = cycle(
  'circuito',
  'hip',
  ['hip', 'sh', 'head'],
  around([
    circuitPose(both(kneeUp(), standLeg), arms2(marchArm(false), marchArm(true))),
    circuitPose(both(standLeg, standLeg), arms2(relaxed, relaxed)),
    circuitPose(both(standLeg, kneeUp()), arms2(marchArm(true), marchArm(false))),
    circuitPose(both(standLeg, standLeg), arms2(guard, guard)),
    circuitPose(both(standLeg, standLeg), arms2(punch, guard)),
    circuitPose(both(standLeg, standLeg), arms2(guard, guard)),
    circuitPose(both(standLeg, standLeg), arms2(guard, punch)),
    circuitPose(both(standLeg, standLeg), arms2(guard, guard)),
    circuitPose(both(heelUp(), standLeg), arms2(marchArm(false), marchArm(true))),
    circuitPose(both(standLeg, standLeg), arms2(relaxed, relaxed)),
    circuitPose(both(standLeg, heelUp()), arms2(marchArm(true), marchArm(false))),
    circuitPose(both(standLeg, standLeg), arms2(relaxed, relaxed)),
  ]),
  7200,
)

/* ---------------------------------------------------------------- bike e remo: bases da preparação, no ritmo do cardio */

const BIKE_CARDIO: MovementBase = { ...BIKE_RIDE, key: 'bicicleta-cardio', durationMs: 1100 }
const ROW_CARDIO: MovementBase = { ...ROW, key: 'remo-cardio', durationMs: 2200 }

export const CARDIO: DemoFamily = {
  bases: [WALK_BASE, RUN_BASE, WALK_RUN, INCLINE_WALK, ELLIPTICAL_BASE, STEPPER_BASE, SWIM_BASE, CIRCUIT, BIKE_CARDIO, ROW_CARDIO],
  demos: {
    bike: {
      base: 'bicicleta-cardio', gear: 'bicicleta', scene: 'bicicleta', implementAt: 'an',
      caption: 'Pedalada contínua no mesmo ritmo, com carga leve a moderada',
    },
    'bike-intervalado': {
      base: 'bicicleta-cardio', gear: 'bicicleta', scene: 'bicicleta', implementAt: 'an',
      caption: 'Mesmo movimento; nos blocos fortes, só a cadência ou a carga sobe um pouco',
    },
    eliptico: { base: 'eliptico', gear: 'eliptico', scene: 'eliptico', implementAt: 'ha', anchor: ELLIPTICAL.pivot },
    remo: { base: 'remo-cardio', gear: 'remo', scene: 'remo', implementAt: 'ha', anchor: ROWER.flywheel },
    natacao: { base: 'natacao', gear: 'nenhum', scene: 'piscina', implementAt: 'ha', caption: 'Nado crawl visto de lado' },
    caminhada: { base: 'caminhada', gear: 'nenhum', scene: 'solo', implementAt: 'an' },
    'caminhada-inclinada': {
      base: 'caminhada-inclinada', gear: 'esteira', scene: 'esteira', implementAt: 'an',
      caption: 'Esteira com inclinação leve; as mãos não seguram o painel',
    },
    escada: { base: 'escada', gear: 'escada', scene: 'escada', implementAt: 'an', anchor: STEPPER.pivot },
    'corrida-caminhada': {
      base: 'corrida-caminhada', gear: 'nenhum', scene: 'solo', implementAt: 'an',
      caption: 'Alterna caminhada e trote leve; no treino, cada bloco dura minutos',
    },
    corrida: { base: 'corrida', gear: 'nenhum', scene: 'solo', implementAt: 'an' },
    'circuito-corporal': {
      base: 'circuito', gear: 'nenhum', scene: 'solo', implementAt: 'ha',
      caption: 'Sequência sem pausa: marcha no lugar → socos alternados → calcanhar no glúteo',
    },
  },
}


/** Família "isolamento de pernas": cadeiras, mesas e panturrilhas. */
import { BODY, polar, reverseBase, round } from '../engine/geometry'
import { FLAT_BENCH, SEAT } from '../engine/scene-geometry'
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

export const ISOLAMENTO_PERNAS: DemoFamily = {
  bases: [ADDUCTION, ABDUCTION, PRONE_KNEE_FLEXION],
  demos: {
    'cadeira-adutora': { base: 'aducao-sentado', gear: 'maquina', scene: 'assento', implementAt: 'kn' },
    'mesa-flexora': { base: 'flexao-joelho-deitado', gear: 'maquina', scene: 'banco-reto', implementAt: 'an' },
  },
}

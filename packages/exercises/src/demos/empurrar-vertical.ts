/** Família "empurrar na vertical": desenvolvimentos e flexões com o corpo invertido. */
import { BODY, dist, heading, polar, round, twoBone } from '../engine/geometry'
import { FLOOR_Y, SEAT, WALL_X } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, sidePose, type Arms } from './figure'
import type { DemoFamily } from './index'

const HAND: Point = [70, FLOOR_Y - 4]
const ANKLE: Point = [174, FLOOR_Y - 10]

/**
 * Flexão pike de perfil: mãos e pés no chão, pernas estendidas e quadril alto.
 * `legDeg` é o ângulo da perna (tornozelo → quadril), `torsoDeg` o do tronco (quadril → ombro)
 * e `headDeg` o do pescoço (ombro → cabeça), que olha para o chão.
 */
function pike(legDeg: number, torsoDeg: number, headDeg: number): Pose {
  const hip = polar(ANKLE, BODY.shin + BODY.thigh, legDeg)
  const kn = polar(ANKLE, BODY.shin, legDeg)
  const sh = polar(hip, BODY.torso, torsoDeg)
  const head = polar(sh, BODY.neck, headDeg)
  const el = twoBone(sh, BODY.upperArm, HAND, BODY.forearm, 'right')
  const toe = polar(ANKLE, BODY.foot, 40)
  return { head: round(head), sh: round(sh), el: round(el), ha: HAND, hip: round(hip), kn: round(kn), an: ANKLE, toe: round(toe) }
}

/** No alto, os braços ficam estendidos; na descida, os cotovelos dobram e a cabeça vai ao chão entre as mãos. */
const PIKE: MovementBase = {
  key: 'flexao-pike',
  view: 'side',
  loop: 'reps',
  durationMs: 2600,
  root: 'hand',
  fixed: ['ha', 'an', 'toe'],
  keyframes: [
    { at: 0, pose: pike(-125, 163.5, 110) },
    { at: 1, pose: pike(-130, 140, 125) },
  ],
}

const ARM = BODY.upperArm + BODY.forearm

const press = (key: string, root: MovementBase['root'], fixed: MovementBase['fixed'], poses: Pose[], durationMs = 2600): MovementBase => ({
  key,
  view: 'side',
  loop: 'reps',
  durationMs,
  root,
  fixed,
  keyframes: poses.map((pose, i) => ({ at: i / (poses.length - 1), pose })),
})

/** Mão em `ha`, cotovelo à frente e para baixo. */
const handAt = (sh: Point, ha: Point) => ({ el: twoBone(sh, BODY.upperArm, ha, BODY.forearm, 'right'), ha })
/** Braço estendido acima da cabeça, com a mão em `x`. */
const overhead = (sh: Point, x: number): Point => [x, sh[1] - Math.sqrt(ARM * ARM - (x - sh[0]) ** 2) + 0.5]

/** Em pé, parado; só os braços se movem. */
const STANDING = { an: [100, ANKLE_Y] as Point, shinDeg: -88, thighDeg: -92, torsoDeg: -90 }
const STANDING_FIXED: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head']
const standing = (arms: Arms) => sidePose(STANDING, arms)

/** Desenvolvimento em pé: a barra (ou o halter) sai da frente dos ombros e sobe em linha reta até o braço estender. */
const BAR_X = (sh: Point) => sh[0] + 6
const MILITARY = press('desenvolvimento-em-pe', 'foot', STANDING_FIXED, [
  standing((sh) => handAt(sh, [BAR_X(sh), sh[1] - 6])),
  standing((sh) => handAt(sh, overhead(sh, BAR_X(sh)))),
])

/** Sentado no banco com encosto vertical: as mãos sobem na mesma linha (vale para halteres, máquina e Smith). */
const SEAT_HIP: Point = [SEAT.backX + 8, SEAT.top - 6]
const SEAT_SH: Point = [SEAT_HIP[0], SEAT_HIP[1] - BODY.torso]
function seated(ha: Point): Pose {
  const { el } = handAt(SEAT_SH, ha)
  const kn = polar(SEAT_HIP, BODY.thigh, 22)
  const an = polar(kn, BODY.shin, 88)
  return {
    head: [SEAT_SH[0] + 2, SEAT_SH[1] - BODY.neck], sh: SEAT_SH, el: round(el), ha: round(ha), hip: SEAT_HIP, kn: round(kn), an: round(an),
    toe: round(polar(an, BODY.foot, 25.4)),
  }
}
const SEATED_X = SEAT_SH[0] + 6
const SEATED_FIXED: MovementBase['fixed'] = ['hip', 'sh', 'head', 'kn', 'an', 'toe']
const SEATED = press('desenvolvimento-sentado', 'seat', SEATED_FIXED, [seated([SEATED_X, SEAT_SH[1] - 6]), seated(overhead(SEAT_SH, SEATED_X))])

/** Arnold: os halteres começam na frente do rosto, cotovelos à frente, e giram enquanto sobem. */
const ARNOLD = press('desenvolvimento-arnold', 'seat', SEATED_FIXED, [seated([SEAT_SH[0] + 16, SEAT_SH[1] - 20]), seated(overhead(SEAT_SH, SEATED_X))], 3000)

/** Landmine: a ponta da barra sobe para cima e para a frente, num arco em volta do apoio no chão. */
const LANDMINE_PIVOT: Point = [WALL_X, FLOOR_Y - 2]
function landmineTop(sh: Point, start: Point): Point {
  // ponto do arco (raio fixo em volta do apoio) a um braço quase estendido do ombro
  const r = dist(LANDMINE_PIVOT, start)
  let best = start
  // subir e ir para a frente é girar em direção à vertical do apoio (-90°)
  for (let deg = heading(LANDMINE_PIVOT, start); deg < -60; deg += 0.2) {
    const p = polar(LANDMINE_PIVOT, r, deg)
    if (dist(sh, p) >= ARM - 2) break
    best = p
  }
  return best
}
const LANDMINE_START = (sh: Point): Point => [sh[0] + 8, sh[1] - 2]
const LANDMINE = press('desenvolvimento-landmine', 'foot', STANDING_FIXED, [
  standing((sh) => handAt(sh, LANDMINE_START(sh))),
  standing((sh) => handAt(sh, landmineTop(sh, LANDMINE_START(sh)))),
])

/**
 * Parada de mãos na parede: mãos no chão, corpo invertido e calcanhares encostados na parede.
 * O corpo desliza na parede enquanto os cotovelos dobram e a cabeça desce até perto do chão.
 */
const HS_HAND: Point = [WALL_X - 30, FLOOR_Y - 3]
const HS_LEN = BODY.torso + BODY.thigh + BODY.shin
function handstand(shY: number): Pose {
  const heelX = WALL_X - 6
  const sh: Point = [HS_HAND[0] + 4, shY]
  const deg = heading(sh, [heelX, sh[1] - Math.sqrt(HS_LEN * HS_LEN - (heelX - sh[0]) ** 2)])
  const hip = polar(sh, BODY.torso, deg)
  const kn = polar(hip, BODY.thigh, deg)
  const an = polar(kn, BODY.shin, deg)
  const head = polar(sh, BODY.neck, deg + 180 - 8)
  const el = twoBone(sh, BODY.upperArm, HS_HAND, BODY.forearm, 'left')
  return { head: round(head), sh, el: round(el), ha: HS_HAND, hip: round(hip), kn: round(kn), an: round(an), toe: round(polar(an, BODY.foot, -96)) }
}
const HANDSTAND = press('parada-de-maos', 'hand', ['ha'], [handstand(HS_HAND[1] - ARM + 1), handstand(HS_HAND[1] - 30)], 3000)

export const EMPURRAR_VERTICAL: DemoFamily = {
  bases: [PIKE, MILITARY, SEATED, ARNOLD, LANDMINE, HANDSTAND],
  demos: {
    'flexao-pike-corporal': { base: 'flexao-pike', gear: 'peso-corporal', scene: 'solo', implementAt: 'ha' },
    'desenvolvimento-militar-barra': { base: 'desenvolvimento-em-pe', gear: 'barra', scene: 'solo', implementAt: 'ha' },
    // De perfil só se vê o braço que trabalha; a mão livre na cintura fica na orientação.
    'desenvolvimento-unilateral-halteres': { base: 'desenvolvimento-em-pe', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'desenvolvimento-halteres': { base: 'desenvolvimento-sentado', gear: 'halteres', scene: 'assento', implementAt: 'ha' },
    'desenvolvimento-maquina': { base: 'desenvolvimento-sentado', gear: 'maquina', scene: 'maquina', implementAt: 'ha' },
    'desenvolvimento-smith-maquina': { base: 'desenvolvimento-sentado', gear: 'smith', scene: 'assento', implementAt: 'ha' },
    'desenvolvimento-arnold': { base: 'desenvolvimento-arnold', gear: 'halteres', scene: 'assento', implementAt: 'ha' },
    'desenvolvimento-landmine-barra': { base: 'desenvolvimento-landmine', gear: 'barra', scene: 'solo', implementAt: 'ha', anchor: LANDMINE_PIVOT },
    'handstand-pushup-assistido': { base: 'parada-de-maos', gear: 'peso-corporal', scene: 'parede', implementAt: 'ha' },
  },
}

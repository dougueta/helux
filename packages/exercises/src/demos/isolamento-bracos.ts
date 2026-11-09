/** Família "isolamento de braços": roscas para bíceps e extensões e mergulhos para tríceps (lote 8). */
import { BODY, polar, round, twoBone } from '../engine/geometry'
import { DIP_BARS, FLAT_BENCH, FLOOR_Y, LOW_BENCH, SCOTT_BENCH, WALL_X } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import { ANKLE_Y, FOOT_DEG, sidePose, type SideLegs } from './figure'
import type { DemoFamily } from './index'

const base = (key: string, loop: MovementBase['loop'], root: MovementBase['root'], fixed: MovementBase['fixed'], start: Pose, end: Pose, durationMs = 2600): MovementBase => ({
  key,
  view: 'side',
  loop,
  durationMs,
  root,
  fixed,
  keyframes: [
    { at: 0, pose: start },
    { at: 1, pose: end },
  ],
})

const r = (p: Pose): Pose => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, round(v as Point)])) as unknown as Pose

/** Em pé, parado; só os antebraços se movem. */
const STANDING: SideLegs = { an: [92, ANKLE_Y], shinDeg: -88, thighDeg: -92, torsoDeg: -90 }
const STANDING_FIXED: MovementBase['fixed'] = ['an', 'toe', 'kn', 'hip', 'sh', 'head', 'el']

/** Cotovelo junto ao tronco, um pouco à frente; o antebraço gira em volta dele no ângulo `fore`. */
const elbowAtSide = (fore: number, upperDeg = 92) => (sh: Point) => {
  const el = polar(sh, BODY.upperArm, upperDeg)
  return { el, ha: polar(el, BODY.forearm, fore) }
}

/* ---------------------------------------------------------------- roscas em pé */

/** Rosca em pé: cotovelos parados ao lado do tronco; a carga sobe das coxas até perto dos ombros. */
const CURL = base('rosca-em-pe', 'reps', 'foot', STANDING_FIXED, sidePose(STANDING, elbowAtSide(86)), sidePose(STANDING, elbowAtSide(-62)), 2400)

/** Rosca alternada: um braço sobe enquanto o outro fica estendido; depois troca. */
function alternateCurl(fore: number): Pose {
  const p = sidePose(STANDING, elbowAtSide(fore))
  const rest = elbowAtSide(88, 93)(p.sh)
  return r({ ...p, el2: rest.el, ha2: rest.ha })
}
const ALT_CURL = base('rosca-alternada', 'alternate', 'foot', [...STANDING_FIXED, 'el2', 'ha2'], alternateCurl(86), alternateCurl(-62), 2200)

/** Polia baixa à frente dos pés. */
const LOW_PULLEY: Point = [WALL_X - 4, FLOOR_Y - 10]

/* ---------------------------------------------------------------- rosca Scott */

/**
 * Rosca Scott: sentado, a parte de trás do braço apoiada no banco inclinado; o antebraço sobe do braço
 * quase estendido até perto do ombro, sem tirar o braço do apoio.
 */
const SC_HIP: Point = [76, SCOTT_BENCH.seat.top - 6]
const SC_SH = polar(SC_HIP, BODY.torso, -80)
const SC_EL = polar(SC_SH, BODY.upperArm, 48)
const SC_AN: Point = [122, ANKLE_Y]
const SC_KN = twoBone(SC_HIP, BODY.thigh, SC_AN, BODY.shin, 'above')
const scott = (fore: number): Pose =>
  r({ head: polar(SC_SH, BODY.neck, -74), sh: SC_SH, el: SC_EL, ha: polar(SC_EL, BODY.forearm, fore), hip: SC_HIP, kn: SC_KN, an: SC_AN, toe: polar(SC_AN, BODY.foot, FOOT_DEG) })
const SCOTT = base('rosca-scott', 'reps', 'seat', ['hip', 'sh', 'head', 'el', 'kn', 'an', 'toe'], scott(62), scott(-66), 2600)

/* ---------------------------------------------------------------- rosca concentrada */

/** Rosca concentrada: sentado na ponta do banco, tronco inclinado, cotovelo apoiado perto do joelho. */
const CO_HIP: Point = [100, FLAT_BENCH.top - 6]
const CO_AN: Point = [150, ANKLE_Y]
const CO_KN = twoBone(CO_HIP, BODY.thigh, CO_AN, BODY.shin, 'above')
const CO_T = -35
const CO_SH = polar(CO_HIP, BODY.torso, CO_T)
const CO_EL = polar(CO_SH, BODY.upperArm, 98)
const concentration = (fore: number): Pose =>
  r({ head: polar(CO_SH, BODY.neck, CO_T + 10), sh: CO_SH, el: CO_EL, ha: polar(CO_EL, BODY.forearm, fore), hip: CO_HIP, kn: CO_KN, an: CO_AN, toe: polar(CO_AN, BODY.foot, FOOT_DEG) })
const CONCENTRATION = base('rosca-concentrada', 'reps', 'seat', ['hip', 'sh', 'head', 'el', 'kn', 'an', 'toe'], concentration(88), concentration(-72), 2600)

/* ---------------------------------------------------------------- tríceps testa */

/** Tríceps testa: deitado no banco, cabeça à esquerda; braço parado e a carga desce até perto da testa. */
const TE_SH: Point = [62, FLAT_BENCH.top - 6]
const TE_HIP: Point = [TE_SH[0] + BODY.torso, TE_SH[1]]
const TE_AN: Point = [150, ANKLE_Y]
const TE_KN = twoBone(TE_HIP, BODY.thigh, TE_AN, BODY.shin, 'above')
const TE_EL = polar(TE_SH, BODY.upperArm, -100)
const skullCrusher = (fore: number): Pose =>
  r({ head: polar(TE_SH, BODY.neck, 180), sh: TE_SH, el: TE_EL, ha: polar(TE_EL, BODY.forearm, fore), hip: TE_HIP, kn: TE_KN, an: TE_AN, toe: polar(TE_AN, BODY.foot, FOOT_DEG) })
const SKULL_CRUSHER = base('triceps-testa', 'reps', 'hip', ['hip', 'sh', 'head', 'el', 'kn', 'an', 'toe'], skullCrusher(-98), skullCrusher(160), 2600)

/* ---------------------------------------------------------------- tríceps na polia alta */

/** Tríceps na polia: de frente para a polia alta, cotovelos parados ao lado do tronco; as mãos descem até as coxas. */
const PUSHDOWN_STANCE: SideLegs = { ...STANDING, torsoDeg: -84 }
const PUSHDOWN = base('triceps-polia', 'reps', 'foot', STANDING_FIXED, sidePose(PUSHDOWN_STANCE, elbowAtSide(-38, 96)), sidePose(PUSHDOWN_STANCE, elbowAtSide(86, 96)), 2400)
const HIGH_PULLEY: Point = [WALL_X - 4, 30]

/* ---------------------------------------------------------------- tríceps francês */

/** Tríceps francês: braços apontando para o teto, junto à cabeça; o halter desce atrás da cabeça e volta. */
const overhead = (fore: number) => (sh: Point) => {
  const el = polar(sh, BODY.upperArm, -68)
  return { el, ha: polar(el, BODY.forearm, fore) }
}
const FRENCH = base('triceps-frances', 'reps', 'foot', STANDING_FIXED, sidePose(STANDING, overhead(-72)), sidePose(STANDING, overhead(132)), 2600)

/* ---------------------------------------------------------------- mergulhos */

/** Mergulho no banco: mãos na borda do banco atrás do corpo, calcanhares no chão; o corpo desce dobrando os cotovelos. */
const BD_HA: Point = [LOW_BENCH.x1 - 2, LOW_BENCH.top - 3]
const BD_AN: Point = [146, ANKLE_Y]
function benchDip(drop: number): Pose {
  const sh: Point = [BD_HA[0] + 4 + drop * 0.1, BD_HA[1] - BODY.upperArm - BODY.forearm + 1 + drop]
  const hip = polar(sh, BODY.torso, 86)
  return r({
    head: polar(sh, BODY.neck, -84), sh, el: twoBone(sh, BODY.upperArm, BD_HA, BODY.forearm, 'left'), ha: BD_HA,
    hip, kn: twoBone(hip, BODY.thigh, BD_AN, BODY.shin, 'above'), an: BD_AN, toe: polar(BD_AN, BODY.foot, -70),
  })
}
const BENCH_DIP = base('mergulho-banco', 'reps', 'hand', ['ha', 'an', 'toe'], benchDip(0), benchDip(26), 2600)

/** Paralelas: apoiado nas barras com os braços estendidos, joelhos dobrados; o corpo desce até os cotovelos a 90 graus. */
const DP_HA: Point = [DIP_BARS.x0 + 20, DIP_BARS.y]
function parallelDip(low: boolean): Pose {
  const sh: Point = low ? [DP_HA[0] - 8, DP_HA[1] - 18] : [DP_HA[0] - 3, DP_HA[1] - BODY.upperArm - BODY.forearm + 1]
  const lean = low ? 104 : 96
  const hip = polar(sh, BODY.torso, lean)
  const kn = polar(hip, BODY.thigh, lean - 4)
  const an = polar(kn, BODY.shin, 200)
  return r({
    head: polar(sh, BODY.neck, lean - 180 + 8), sh, el: twoBone(sh, BODY.upperArm, DP_HA, BODY.forearm, 'left'), ha: DP_HA,
    hip, kn, an, toe: polar(an, BODY.foot, 150),
  })
}
const PARALLEL_DIP = base('paralelas', 'reps', 'hand', ['ha'], parallelDip(false), parallelDip(true), 2600)

export const ISOLAMENTO_BRACOS: DemoFamily = {
  bases: [CURL, ALT_CURL, SCOTT, CONCENTRATION, SKULL_CRUSHER, PUSHDOWN, FRENCH, BENCH_DIP, PARALLEL_DIP],
  demos: {
    // Rosca direta e rosca 21 usam a mesma demonstração; a diferença está na amplitude de cada série.
    'rosca-direta-barra': { base: 'rosca-em-pe', gear: 'barra', scene: 'solo', implementAt: 'ha', caption: 'Pegada supinada, amplitude completa em todas as repetições' },
    'rosca-21-barra': { base: 'rosca-em-pe', gear: 'barra', scene: 'solo', implementAt: 'ha', caption: '7 repetições na metade de baixo, 7 na de cima e 7 completas' },
    // Direta e martelo com halteres: de perfil a pegada não aparece.
    'rosca-direta-halteres': { base: 'rosca-em-pe', gear: 'halteres', scene: 'solo', implementAt: 'ha', caption: 'Palmas para a frente, os dois braços juntos' },
    'rosca-martelo-halteres': { base: 'rosca-em-pe', gear: 'halteres', scene: 'solo', implementAt: 'ha', caption: 'Pegada neutra: palmas uma de frente para a outra' },
    'rosca-alternada-halteres': { base: 'rosca-alternada', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'rosca-cabo': { base: 'rosca-em-pe', gear: 'cabo', scene: 'parede', implementAt: 'ha', anchor: LOW_PULLEY },
    'rosca-scott-barra': { base: 'rosca-scott', gear: 'barra', scene: 'banco-scott', implementAt: 'ha' },
    'rosca-concentrada-halteres': { base: 'rosca-concentrada', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha' },
    'triceps-testa-barra': { base: 'triceps-testa', gear: 'barra', scene: 'banco-reto', implementAt: 'ha' },
    'triceps-testa-halteres': { base: 'triceps-testa', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha' },
    'triceps-corda-cabo': { base: 'triceps-polia', gear: 'corda', scene: 'parede', implementAt: 'ha', anchor: HIGH_PULLEY },
    'triceps-frances-halteres': { base: 'triceps-frances', gear: 'halteres', scene: 'solo', implementAt: 'ha' },
    'mergulho-banco-corporal': { base: 'mergulho-banco', gear: 'banco', scene: 'banco-baixo', implementAt: 'sh' },
    'paralelas-corporal': { base: 'paralelas', gear: 'peso-corporal', scene: 'paralelas', implementAt: 'sh' },
  },
}

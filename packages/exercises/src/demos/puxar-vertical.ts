/** Família "puxar na vertical": puxadas, barras fixas e pullovers. */
import { BODY, polar, round, twoBone } from '../engine/geometry'
import { FLAT_BENCH, PULL_UP_BAR, SEAT } from '../engine/scene-geometry'
import type { MovementBase, Point, Pose } from '../engine/types'
import type { DemoFamily } from './index'

/** Deitado de costas no banco reto, cabeça à esquerda, pés no chão. */
function lyingSupine(upperArmDeg: number, forearmDeg: number): Pose {
  const y = FLAT_BENCH.top - 6
  const sh: Point = [62, y]
  const hip: Point = [sh[0] + BODY.torso, y]
  const head = polar(sh, BODY.neck, 180)
  const kn = polar(hip, BODY.thigh, 28)
  const an = polar(kn, BODY.shin, 90) // pé no chão, abaixo do joelho
  const toe = polar(an, BODY.foot, 0)
  const el = polar(sh, BODY.upperArm, upperArmDeg)
  const ha = polar(el, BODY.forearm, forearmDeg)
  return { head: round(head), sh: round(sh), el: round(el), ha: round(ha), hip: round(hip), kn: round(kn), an: round(an), toe: round(toe) }
}

/** Pullover: o halter sai de cima do peito e desce em arco atrás da cabeça, cotovelos levemente dobrados. */
const PULLOVER: MovementBase = {
  key: 'pullover-deitado',
  view: 'side',
  loop: 'reps',
  durationMs: 3000,
  root: 'hip',
  fixed: ['hip', 'sh', 'head', 'kn', 'an', 'toe'],
  keyframes: [
    { at: 0, pose: lyingSupine(-80, -88) },
    { at: 1, pose: lyingSupine(185, 177) },
  ],
}

const ARM = BODY.upperArm + BODY.forearm

const pull = (key: string, root: MovementBase['root'], fixed: MovementBase['fixed'], top: Pose, bottom: Pose, durationMs = 2800): MovementBase => ({
  key,
  view: 'side',
  loop: 'reps',
  durationMs,
  root,
  fixed,
  keyframes: [
    { at: 0, pose: top },
    { at: 1, pose: bottom },
  ],
})

/**
 * Barra fixa de perfil: mãos paradas na barra e o corpo pendurado embaixo. Embaixo, os braços quase
 * estendidos; em cima, o queixo passa da barra e os cotovelos apontam para baixo. Joelhos dobrados,
 * pés para trás, para não tocar o chão.
 */
const BAR_HANDS: Point = [110, PULL_UP_BAR.y + 2]
function hanging(shY: number): Pose {
  const sh: Point = [BAR_HANDS[0] - 4, shY]
  const el = twoBone(sh, BODY.upperArm, BAR_HANDS, BODY.forearm, 'right')
  const hip = polar(sh, BODY.torso, 94)
  const kn = polar(hip, BODY.thigh, 80)
  const an = polar(kn, BODY.shin, 120)
  return {
    head: round(polar(sh, BODY.neck, -84)), sh, el: round(el), ha: BAR_HANDS, hip: round(hip), kn: round(kn), an: round(an),
    toe: round(polar(an, BODY.foot, 80)),
  }
}
const PULL_UP = pull('barra-fixa', 'hand', ['ha'], hanging(BAR_HANDS[1] + ARM - 2), hanging(BAR_HANDS[1] + 12))

/**
 * Puxada sentada no cabo: coxas presas sob o apoio, tronco levemente para trás. Em cima, os braços
 * estendidos seguram a barra; embaixo, a barra chega à parte de cima do peito com os cotovelos para trás.
 */
const LAT_HIP: Point = [SEAT.x0 + 30, SEAT.top - 6]
const LAT_TORSO = -98
const LAT_SH = polar(LAT_HIP, BODY.torso, LAT_TORSO)
const LAT_X = LAT_SH[0] + 10
/** Polia alta, logo acima das mãos. */
const LAT_ANCHOR: Point = [LAT_X, 12]
function latPulldown(ha: Point): Pose {
  const el = twoBone(LAT_SH, BODY.upperArm, ha, BODY.forearm, 'below')
  const kn = polar(LAT_HIP, BODY.thigh, 4)
  const an = polar(kn, BODY.shin, 86)
  return {
    head: round(polar(LAT_SH, BODY.neck, LAT_TORSO + 6)), sh: round(LAT_SH), el: round(el), ha: round(ha), hip: LAT_HIP, kn: round(kn), an: round(an),
    toe: round(polar(an, BODY.foot, 25.4)),
  }
}
const LAT = pull(
  'puxada-alta',
  'seat',
  ['hip', 'sh', 'head', 'kn', 'an', 'toe'],
  latPulldown([LAT_X, LAT_SH[1] - Math.sqrt(ARM * ARM - 100) + 0.5]),
  latPulldown([LAT_SH[0] + 12, LAT_SH[1] - 4]),
)

export const PUXAR_VERTICAL: DemoFamily = {
  bases: [PULLOVER, PULL_UP, LAT],
  demos: {
    'pullover-halteres': { base: 'pullover-deitado', gear: 'halteres', scene: 'banco-reto', implementAt: 'ha' },
    'pullover-barra': { base: 'pullover-deitado', gear: 'barra', scene: 'banco-reto', implementAt: 'ha' },
    // De perfil a pegada não aparece: as três barras fixas têm a mesma demonstração e legendas distintas.
    'barra-fixa-corporal': {
      base: 'barra-fixa', gear: 'barra-fixa', scene: 'barra-fixa', implementAt: 'ha',
      caption: 'Pegada pronada, mãos um pouco além da largura dos ombros',
    },
    'barra-fixa-supinada-corporal': {
      base: 'barra-fixa', gear: 'barra-fixa', scene: 'barra-fixa', implementAt: 'ha',
      caption: 'Pegada supinada, palmas voltadas para você',
    },
    'barra-fixa-neutra-corporal': {
      base: 'barra-fixa', gear: 'barra-fixa', scene: 'barra-fixa', implementAt: 'ha',
      caption: 'Pegada neutra, palmas voltadas uma para a outra',
    },
    // Barra fixa com a almofada da máquina sob os joelhos, que tira parte do peso.
    'pulldown-assistido-maquina': { base: 'barra-fixa', gear: 'maquina', scene: 'barra-fixa', implementAt: 'kn' },
    'puxada-alta-cabo': {
      base: 'puxada-alta', gear: 'cabo', scene: 'maquina', implementAt: 'ha', anchor: LAT_ANCHOR,
      caption: 'Pegada aberta, palmas para a frente',
    },
    'puxada-alta-fechada-cabo': {
      base: 'puxada-alta', gear: 'cabo', scene: 'maquina', implementAt: 'ha', anchor: LAT_ANCHOR,
      caption: 'Pegada fechada no triângulo, cotovelos junto ao corpo',
    },
    'puxada-alta-neutra-cabo': {
      base: 'puxada-alta', gear: 'cabo', scene: 'maquina', implementAt: 'ha', anchor: LAT_ANCHOR,
      caption: 'Pegadas paralelas na largura dos ombros, punhos neutros',
    },
    'puxada-unilateral-cabo': {
      base: 'puxada-alta', gear: 'cabo', scene: 'maquina', implementAt: 'ha', anchor: LAT_ANCHOR,
      caption: 'Uma mão de cada vez, cotovelo em direção ao quadril',
    },
  },
}

/**
 * Medidas das cenas no viewBox 220 × 250. A web desenha a cena com estes valores, e as poses
 * das bases usam os mesmos para apoiar a figura no lugar certo (pé no solo, quadril no banco).
 */
import type { Point } from './types'

export const VIEWBOX = { width: 220, height: 250 } as const

/** Linha do solo. */
export const FLOOR_Y = 240

/** Banco reto: tampo de `x0` a `x1`, superfície em `top`. */
export const FLAT_BENCH = { x0: 36, x1: 186, top: 176 } as const

/** Banco baixo (apoio de costas na elevação pélvica, pé no step-up do búlgaro). */
export const LOW_BENCH = { x0: 14, x1: 74, top: 184 } as const

/** Banco inclinado: encosto de `back[0]` (baixo) a `back[1]` (alto), assento em `seatTop`. */
export const INCLINE_BENCH = { back: [[96, 190], [40, 112]] as [Point, Point], seat: { x0: 96, x1: 150 }, seatTop: 190 } as const

/** Assento de máquina com encosto vertical em `backX`. */
export const SEAT = { x0: 62, x1: 146, top: 180, backX: 68, backTop: 96 } as const

/** Assento reclinado (leg press). */
export const RECLINED_SEAT = { from: [20, 120] as Point, to: [92, 204] as Point } as const

/** Barra fixa: barra em `y`, de `x0` a `x1`. */
export const PULL_UP_BAR = { x0: 40, x1: 180, y: 22 } as const

/** Paralelas: barra em `y`, de `x0` a `x1`. */
export const DIP_BARS = { x0: 92, x1: 134, y: 136 } as const

/** Parede vertical em `x`. */
export const WALL_X = 204

/** Degrau: caixa de `x0` a `x1`, topo em `top`. */
export const STEP = { x0: 120, x1: 182, top: 204 } as const

/** Banco romano (hiperextensão): apoio do quadril de `x0` a `x1` em `top`; o rolo dos tornozelos fica em `ankle`. */
export const ROMAN_CHAIR = { x0: 22, x1: 118, top: 150, ankle: [30, 136] as Point } as const

/** Colchonete sobre o solo. */
export const MAT = { x0: 18, x1: 202, top: 235 } as const

/** Coluna de máquina/polia em `x`, do topo `top` ao solo. */
export const MACHINE = { x: 200, top: 12 } as const

/** Origem padrão de cabo e elástico, quando a demonstração não define `anchor`. */
export const DEFAULT_ANCHOR: Point = [MACHINE.x, 40]

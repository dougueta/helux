/**
 * Geometria para escrever as bases com comprimento de osso exato (R5).
 * Ângulos em graus no sistema do SVG: 0° aponta para a direita e 90° para baixo.
 */
import type { MovementBase, Point } from './types'

/** Proporções da figura, em unidades do viewBox. Bases de perfil usam estes valores. */
export const BODY = {
  neck: 22,
  torso: 62,
  upperArm: 30,
  forearm: 28,
  thigh: 42,
  shin: 42,
  foot: 14,
} as const

export const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Ponto a `len` de `p`, no ângulo `deg`. */
export function polar(p: Point, len: number, deg: number): Point {
  const r = (deg * Math.PI) / 180
  return [p[0] + len * Math.cos(r), p[1] + len * Math.sin(r)]
}

/** Ângulo, em graus, da reta de `a` para `b`. */
export const heading = (a: Point, b: Point) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI

/**
 * Articulação intermediária (cotovelo, joelho) a `la` de `a` e `lb` de `b`.
 * `side` escolhe a solução acima ou abaixo da reta a→b (no SVG, "below" tem y maior).
 * Fora de alcance, estica em linha reta na direção de `b`.
 */
export function twoBone(a: Point, la: number, b: Point, lb: number, side: 'above' | 'below' | 'left' | 'right'): Point {
  const d = dist(a, b)
  if (d >= la + lb || d === 0) return polar(a, la, heading(a, b))
  const x = (d * d + la * la - lb * lb) / (2 * d)
  const h = Math.sqrt(Math.max(0, la * la - x * x))
  const ux = (b[0] - a[0]) / d
  const uy = (b[1] - a[1]) / d
  const c1: Point = [a[0] + ux * x - uy * h, a[1] + uy * x + ux * h]
  const c2: Point = [a[0] + ux * x + uy * h, a[1] + uy * x - ux * h]
  switch (side) {
    case 'below':
      return c1[1] > c2[1] ? c1 : c2
    case 'above':
      return c1[1] < c2[1] ? c1 : c2
    case 'right':
      return c1[0] > c2[0] ? c1 : c2
    case 'left':
      return c1[0] < c2[0] ? c1 : c2
  }
}

/** Ângulo interno, em graus, da articulação `b` entre os segmentos b→a e b→c. */
export function angleAt(a: Point, b: Point, c: Point): number {
  const v1 = [a[0] - b[0], a[1] - b[1]]
  const v2 = [c[0] - b[0], c[1] - b[1]]
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]))
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI
}

/** Espelha um ponto no eixo vertical do viewBox. */
export const mirrorX = (p: Point): Point => [220 - p[0], p[1]]

/** Arredonda para 2 casas, para dados estáveis e legíveis. */
export const round = (p: Point): Point => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]

/** Mesma base com o movimento no sentido oposto (ex.: abdução a partir da adução). */
export function reverseBase(base: MovementBase, key: string): MovementBase {
  return {
    ...base,
    key,
    keyframes: [...base.keyframes].reverse().map((k) => ({ at: Math.round((1 - k.at) * 1e6) / 1e6, pose: k.pose })),
  }
}

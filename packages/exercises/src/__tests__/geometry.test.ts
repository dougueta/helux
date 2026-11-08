import { describe, it, expect } from 'vitest'
import { dist, polar, twoBone, reverseBase, angleAt } from '../engine/geometry'
import type { MovementBase } from '../engine/types'

describe('geometria das bases', () => {
  it('polar: 0° à direita, 90° para baixo (SVG)', () => {
    const [x, y] = polar([10, 10], 5, 90)
    expect(x).toBeCloseTo(10)
    expect(y).toBeCloseTo(15)
  })

  it('twoBone: articulação a la de a e lb de b, do lado pedido', () => {
    const a: [number, number] = [0, 0]
    const b: [number, number] = [50, 0]
    const below = twoBone(a, 30, b, 28, 'below')
    const above = twoBone(a, 30, b, 28, 'above')
    expect(dist(below, a)).toBeCloseTo(30)
    expect(dist(below, b)).toBeCloseTo(28)
    expect(below[1]).toBeGreaterThan(0)
    expect(above[1]).toBeLessThan(0)
  })

  it('twoBone: fora de alcance, estica em linha reta', () => {
    const j = twoBone([0, 0], 30, [100, 0], 28, 'below')
    expect(j[0]).toBeCloseTo(30)
    expect(j[1]).toBeCloseTo(0)
  })

  it('angleAt: ângulo interno da articulação, em graus', () => {
    expect(angleAt([0, 0], [10, 0], [10, 10])).toBeCloseTo(90)
    expect(angleAt([0, 0], [10, 0], [20, 0])).toBeCloseTo(180)
  })

  it('reverseBase: inverte a ordem dos keyframes mantendo at crescente', () => {
    const base = {
      key: 'a', view: 'side', loop: 'reps', durationMs: 1000, root: 'foot', fixed: ['an'],
      keyframes: [{ at: 0, pose: { head: [1, 1] } }, { at: 0.3, pose: { head: [2, 2] } }, { at: 1, pose: { head: [3, 3] } }],
    } as unknown as MovementBase
    const rev = reverseBase(base, 'b')
    expect(rev.key).toBe('b')
    expect(rev.keyframes.map((k) => k.at)).toEqual([0, 0.7, 1])
    expect(rev.keyframes.map((k) => k.pose.head)).toEqual([[3, 3], [2, 2], [1, 1]])
  })
})

import { describe, it, expect } from 'vitest'
import { createRegistry, DEMO_SPECS, MOVEMENT_BASES } from '../demos'
import { loadDemo } from '../load-demo'
import type { MovementBase } from '../engine/types'

const base: MovementBase = {
  key: 'b1', view: 'side', loop: 'reps', durationMs: 2000, root: 'foot', fixed: ['an'],
  keyframes: [
    { at: 0, pose: { head: [110, 40], sh: [110, 70], el: [110, 100], ha: [110, 130], hip: [110, 150], kn: [110, 190], an: [110, 230], toe: [125, 230] } },
    { at: 1, pose: { head: [110, 40], sh: [110, 70], el: [140, 70], ha: [168, 70], hip: [110, 150], kn: [110, 190], an: [110, 230], toe: [125, 230] } },
  ],
}

describe('createRegistry', () => {
  it('reúne bases e demonstrações das famílias e resolve por id', () => {
    const reg = createRegistry([{ bases: [base], demos: { x: { base: 'b1', gear: 'halteres', scene: 'solo', implementAt: 'ha', caption: 'Teste' } } }])
    expect(Object.keys(reg.bases)).toEqual(['b1'])
    const demo = reg.resolve('x')!
    expect(demo.id).toBe('x')
    expect(demo.keyframes).toHaveLength(2)
    expect(demo.gear).toBe('halteres')
    expect(demo.caption).toBe('Teste')
    expect(reg.resolve('nao-existe')).toBeNull()
  })

  it('aplica poseOverrides por keyframe', () => {
    const reg = createRegistry([{ bases: [base], demos: { x: { base: 'b1', gear: 'halteres', scene: 'solo', implementAt: 'ha', poseOverrides: [{}, { ha: [170, 72] }] } } }])
    expect(reg.resolve('x')!.keyframes[1].pose.ha).toEqual([170, 72])
    expect(reg.resolve('x')!.keyframes[0].pose.ha).toEqual([110, 130])
  })

  it('recusa base ou demonstração duplicada entre famílias', () => {
    expect(() => createRegistry([{ bases: [base], demos: {} }, { bases: [base], demos: {} }])).toThrow('base duplicada: b1')
    const d = { base: 'b1', gear: 'halteres' as const, scene: 'solo' as const, implementAt: 'ha' as const }
    expect(() => createRegistry([{ bases: [base], demos: { x: d } }, { bases: [], demos: { x: d } }])).toThrow('demonstração duplicada: x')
  })
})

describe('registro real', () => {
  it('toda demonstração aponta para uma base registrada', () => {
    for (const [id, spec] of Object.entries(DEMO_SPECS)) expect(MOVEMENT_BASES[spec.base], `${id} → ${spec.base}`).toBeDefined()
  })
})

describe('loadDemo', () => {
  it('retorna null para item sem demonstração', async () => {
    await expect(loadDemo('item-inexistente')).resolves.toBeNull()
  })
})

describe('lote 1, Agachar (T058)', () => {
  it('os 15 itens têm demonstração, base válida, equipamento e orientação completos', async () => {
    const { AGACHAR } = await import('../demos/agachar')
    const { CATALOG } = await import('../catalog')
    const { MOVEMENT_BASES } = await import('../demos')
    const { missingContent, guidanceIssues } = await import('../review/check')
    const { validateBase } = await import('../engine/kinematics')
    const ids = Object.keys(AGACHAR.demos)
    expect(ids).toHaveLength(15)
    for (const id of ids) {
      const item = CATALOG.find((i) => i.id === id)!
      expect(missingContent(item, MOVEMENT_BASES), id).toEqual([])
      expect(guidanceIssues(item.guidance!, item.kind), id).toEqual([])
    }
    for (const base of AGACHAR.bases) expect(validateBase(base)).toEqual([])
  })
})

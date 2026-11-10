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

async function expectBatchComplete(family: { bases: import('../engine/types').MovementBase[]; demos: Record<string, unknown> }, size: number) {
  const { CATALOG } = await import('../catalog')
  const { MOVEMENT_BASES } = await import('../demos')
  const { missingContent, guidanceIssues } = await import('../review/check')
  const { validateBase } = await import('../engine/kinematics')
  const ids = Object.keys(family.demos)
  expect(ids).toHaveLength(size)
  for (const id of ids) {
    const item = CATALOG.find((i) => i.id === id)!
    expect(missingContent(item, MOVEMENT_BASES), id).toEqual([])
    expect(guidanceIssues(item.guidance!, item.kind), id).toEqual([])
  }
  for (const base of family.bases) expect(validateBase(base)).toEqual([])
  // FR-003: itens com a mesma demonstração resolvida precisam de legendas distintas, inclusive com o resto do catálogo.
  const { checkCatalog } = await import('../review/check')
  const captions = checkCatalog(CATALOG, { pending: new Set(), approvals: {}, bases: MOVEMENT_BASES }).filter(
    (m) => m.endsWith('falta legenda') && ids.includes(m.split(':')[0]),
  )
  expect(captions).toEqual([])
}

describe('lotes de força: demonstração, base válida, equipamento e orientação completos', () => {
  it('lote 1, Agachar (T058)', async () => {
    const { AGACHAR } = await import('../demos/agachar')
    await expectBatchComplete(AGACHAR, 15)
  })

  it('lote 2, Dobrar o quadril (T059)', async () => {
    const { DOBRAR_QUADRIL } = await import('../demos/dobrar-quadril')
    await expectBatchComplete(DOBRAR_QUADRIL, 15)
  })

  it('lote 3, Empurrar na horizontal (T060)', async () => {
    const { EMPURRAR_HORIZONTAL } = await import('../demos/empurrar-horizontal')
    await expectBatchComplete(EMPURRAR_HORIZONTAL, 11)
  })

  it('lote 4, Empurrar na vertical (T061)', async () => {
    const { EMPURRAR_VERTICAL } = await import('../demos/empurrar-vertical')
    // a família também tem a flexão pike, aprovada no piloto
    await expectBatchComplete(EMPURRAR_VERTICAL, 9)
  })

  it('lote 5, Puxar na vertical (T062)', async () => {
    const { PUXAR_VERTICAL } = await import('../demos/puxar-vertical')
    // a família também tem o pullover com halteres, aprovado no piloto
    await expectBatchComplete(PUXAR_VERTICAL, 10)
  })

  it('lote 6, Puxar na horizontal (T063)', async () => {
    const { PUXAR_HORIZONTAL } = await import('../demos/puxar-horizontal')
    await expectBatchComplete(PUXAR_HORIZONTAL, 11)
  })

  it('lote 7a, Core: pranchas, anti-rotação e rollouts (T064)', async () => {
    const { CORE: all } = await import('../demos/core')
    const ids7a = ['russian-twist-halteres', 'prancha-abdominal-corporal', 'prancha-lateral-corporal', 'prancha-rotacao', 'prancha-toque-ombro-corporal', 'dead-bug-corporal', 'hollow-hold-corporal', 'pallof-press-cabo', 'roda-abdominal', 'rollout-barra']
    // inclui o russian twist do piloto
    await expectBatchComplete({ bases: all.bases, demos: Object.fromEntries(ids7a.map((id) => [id, all.demos[id]])) }, 10)
  })

  it('lote 7b, Core: flexão e rotação de tronco (T064)', async () => {
    const { CORE } = await import('../demos/core')
    // 7a (com o russian twist do piloto) + 6 itens do 7b
    await expectBatchComplete(CORE, 16)
  })

  it('lote 8, Bíceps e tríceps (T065)', async () => {
    const { ISOLAMENTO_BRACOS } = await import('../demos/isolamento-bracos')
    await expectBatchComplete(ISOLAMENTO_BRACOS, 14)
  })

  it('lote 9, Ombro, trapézio e peito (T066)', async () => {
    const { ISOLAMENTO_TRONCO } = await import('../demos/isolamento-tronco')
    await expectBatchComplete(ISOLAMENTO_TRONCO, 11)
  })

  it('lote 10, Isolamento de pernas (T067)', async () => {
    const { ISOLAMENTO_PERNAS } = await import('../demos/isolamento-pernas')
    // inclui a cadeira adutora e a mesa flexora do piloto
    await expectBatchComplete(ISOLAMENTO_PERNAS, 10)
  })
})

describe('lotes de preparação: demonstração, base válida e orientação completas', () => {
  it('lote P1, Aquecimento geral e ativação de membros superiores (T079)', async () => {
    const { PREPARACAO_ATIVACAO } = await import('../demos/preparacao-ativacao')
    const { PREPARATION_ITEMS } = await import('../preparation')
    await expectBatchComplete(PREPARACAO_ATIVACAO, 11)
    // todo item da família está no catálogo de preparação, e o implemento da demonstração está em `needs`
    for (const [id, spec] of Object.entries(PREPARACAO_ATIVACAO.demos)) {
      const item = PREPARATION_ITEMS.find((p) => p.id === id)
      expect(item, id).toBeDefined()
      if (!['nenhum', 'peso-corporal'].includes(spec.gear)) expect(item!.needs, id).toContain(spec.gear)
    }
  })

  it('lote P2, Ativação inferior e mobilidade de quadril e tornozelo (T080)', async () => {
    const { PREPARACAO_QUADRIL } = await import('../demos/preparacao-quadril')
    const { PREPARATION_ITEMS } = await import('../preparation')
    await expectBatchComplete(PREPARACAO_QUADRIL, 11)
    for (const [id, spec] of Object.entries(PREPARACAO_QUADRIL.demos)) {
      const item = PREPARATION_ITEMS.find((p) => p.id === id)
      expect(item, id).toBeDefined()
      if (!['nenhum', 'peso-corporal'].includes(spec.gear)) expect(item!.needs, id).toContain(spec.gear)
    }
  })
})

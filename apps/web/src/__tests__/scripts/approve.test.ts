import { describe, it, expect } from 'vitest'
import type { CatalogEntry } from '@helux/exercises/src/gallery'
import type { MovementBase } from '@helux/exercises'
import { itemHash } from '@helux/exercises/src/review/check'
import { approve } from '../../../scripts/demos-approve'

const base: MovementBase = {
  key: 'b', view: 'side', loop: 'reps', durationMs: 2000, root: 'foot', fixed: ['an'],
  keyframes: [
    { at: 0, pose: { head: [110, 40], sh: [110, 70], el: [110, 100], ha: [110, 130], hip: [110, 150], kn: [110, 190], an: [110, 230], toe: [125, 230] } },
    { at: 1, pose: { head: [110, 40], sh: [110, 70], el: [140, 70], ha: [168, 70], hip: [110, 150], kn: [110, 190], an: [110, 230], toe: [125, 230] } },
  ],
}
const bases = { b: base }
const guidance = { setup: ['Em pé'], steps: ['Eleve o braço'], commonError: 'Encolher o ombro' }
const item = (id: string, over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  id, name: id.toUpperCase(), kind: 'forca', gear: 'halteres', guidance,
  demo: { base: 'b', gear: 'halteres', scene: 'solo', implementAt: 'ha', caption: `legenda ${id}` }, ...over,
})
const items = [item('a'), item('b'), item('c'), item('sem-demo', { demo: undefined })]
const state = () => ({ pending: { ids: ['a', 'b', 'c', 'sem-demo'] }, approvals: {} as Record<string, string> })

describe('approve', () => {
  it('grava o hash e tira o id de pending.json', () => {
    const out = approve(state(), { ids: ['a'] }, items, bases)
    expect(out.approvals).toEqual({ a: itemHash(items[0], bases) })
    expect(out.pending.ids).toEqual(['b', 'c', 'sem-demo'])
  })

  it('itens não citados continuam pendentes', () => {
    const out = approve(state(), { ids: ['b'] }, items, bases)
    expect(out.pending.ids).toEqual(['a', 'c', 'sem-demo'])
    expect(Object.keys(out.approvals)).toEqual(['b'])
  })

  it('falha para id inexistente', () => {
    expect(() => approve(state(), { ids: ['nao-existe'] }, items, bases)).toThrow('nao-existe: id inexistente')
  })

  it('falha para item sem demonstração', () => {
    expect(() => approve(state(), { ids: ['sem-demo'] }, items, bases)).toThrow('sem-demo: falta demo')
  })

  it('falha para item com orientação incompleta', () => {
    const broken = [item('a', { guidance: { setup: ['Em pé'], steps: [] } })]
    expect(() => approve({ pending: { ids: ['a'] }, approvals: {} }, { ids: ['a'] }, broken, bases)).toThrow('a: falta passos')
  })

  it('--all-in-pr cobre só os itens alterados (com demo e hash diferente do aprovado)', () => {
    const s = state()
    s.approvals.a = itemHash(items[0], bases) // já aprovado e inalterado
    s.pending.ids = ['b', 'c', 'sem-demo']
    s.approvals.c = '0'.repeat(64) // aprovado antes e alterado depois
    s.pending.ids = ['b', 'sem-demo']
    const out = approve(s, { allInPr: true }, items, bases)
    expect(Object.keys(out.approvals).sort()).toEqual(['a', 'b', 'c'])
    expect(out.approvals.c).toBe(itemHash(items[2], bases))
    expect(out.approvals.a).toBe(s.approvals.a)
    expect(out.pending.ids).toEqual(['sem-demo'])
  })
})

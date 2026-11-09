import { describe, it, expect } from 'vitest'
import type { MovementBase } from '@helux/exercises'
import type { CatalogEntry } from '@helux/exercises/src/gallery'
import { itemHash } from '@helux/exercises/src/review/check'
import { buildComment, COMMENT_MARKER, selectEvidenceItems } from '../../../scripts/demo-evidence'

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
  id, name: `Nome ${id}`, kind: 'forca', gear: 'halteres', guidance,
  demo: { base: 'b', gear: 'halteres', scene: 'solo', implementAt: 'ha', caption: id }, ...over,
})

describe('selectEvidenceItems', () => {
  const approved = item('aprovado')
  const items = [item('novo'), approved, item('pendente-sem-demo', { demo: undefined })]
  const approvals = { aprovado: itemHash(approved, bases) }

  it('sem --ids, seleciona os itens com demo cujo hash difere do aprovado', () => {
    expect(selectEvidenceItems(items, approvals, bases).map((i) => i.id)).toEqual(['novo'])
  })

  it('item aprovado e alterado depois volta para a evidência', () => {
    expect(selectEvidenceItems(items, { aprovado: '0'.repeat(64) }, bases).map((i) => i.id)).toEqual(['novo', 'aprovado'])
  })

  it('com --ids, usa os indicados e falha se algum não tiver demonstração', () => {
    expect(selectEvidenceItems(items, approvals, bases, ['aprovado']).map((i) => i.id)).toEqual(['aprovado'])
    expect(() => selectEvidenceItems(items, approvals, bases, ['pendente-sem-demo'])).toThrow('pendente-sem-demo: falta demo')
    expect(() => selectEvidenceItems(items, approvals, bases, ['x'])).toThrow('x: id inexistente')
  })
})

describe('buildComment', () => {
  const ctx = { repo: 'dono/helux', evidenceSha: 'f'.repeat(40), prSha: 'abc1234def', batch: 'Puxar na vertical' }

  it('começa com o marcador e traz contagem, commit e lote', () => {
    const body = buildComment([{ id: 'pullover-halteres', name: 'Pullover (Halteres)' }], ctx)
    expect(body.startsWith(COMMENT_MARKER)).toBe(true)
    expect(COMMENT_MARKER).toBe('<!-- demo-evidence -->')
    expect(body).toContain('## Demonstrações para revisão: 1 item')
    expect(body).toContain('Commit: abc1234. Lote: Puxar na vertical.')
  })

  it('linka GIF e cartão fixados por commit, com ?raw=true', () => {
    const body = buildComment([{ id: 'pullover-halteres', name: 'Pullover (Halteres)' }], ctx)
    const prefix = `https://github.com/dono/helux/blob/${ctx.evidenceSha}/pullover-halteres`
    expect(body).toContain(`| Pullover (Halteres) | [GIF](${prefix}/demo.gif?raw=true) | [cartão](${prefix}/card.png?raw=true) |`)
    expect(body).toContain('Para aprovar, responda com "aprovar tudo", ou "aprovar: id, id".')
    expect(body).toContain('O que não for citado continua pendente.')
  })

  it('avisa quando o lote passa de 15 itens, sem bloquear', () => {
    const many = Array.from({ length: 16 }, (_, i) => ({ id: `i${i}`, name: `Item ${i}` }))
    expect(buildComment(many, ctx)).toContain('16 itens passam do limite de 15 por lote')
    expect(buildComment(many.slice(0, 15), ctx)).not.toContain('limite de 15')
  })

  it('sem itens alterados, informa e não traz tabela', () => {
    const body = buildComment([], ctx)
    expect(body.startsWith(COMMENT_MARKER)).toBe(true)
    expect(body).toContain('Nenhuma demonstração alterada neste PR.')
    expect(body).not.toContain('| Item |')
  })
})

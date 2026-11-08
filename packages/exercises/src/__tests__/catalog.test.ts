import { afterAll, describe, it, expect } from 'vitest'
import { CATALOG, type CatalogEntry } from '../catalog'
import { DEMO_SPECS, MOVEMENT_BASES } from '../demos'
import { validateBase } from '../engine/kinematics'
import { PENDING_IDS } from '../resolve'
import { checkCatalog, coverageByKind, itemHash } from '../review/check'
import approvals from '../review/approvals.json'
import snapshot from './fixtures/strength-snapshot.json'
import type { MovementBase } from '../engine/types'

const APPROVALS = approvals as Record<string, string>

// Invariantes de contracts/catalog.md, rodados sobre o catálogo real.
describe('catálogo — invariantes', () => {
  afterAll(() => {
    // FR-022, FR-023: cobertura por catálogo no log do teste.
    for (const line of coverageByKind(CATALOG, PENDING_IDS)) console.log(line)
  })

  it('1. id e name são únicos entre todos os catálogos', () => {
    const ids = CATALOG.map((i) => i.id)
    const names = CATALOG.map((i) => i.name)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([])
  })

  it('2 e 3. todo item fora de pending.json tem demonstração, orientação e aprovação em dia', () => {
    expect(checkCatalog(CATALOG, { pending: PENDING_IDS, approvals: APPROVALS, bases: MOVEMENT_BASES })).toEqual([])
  })

  it('5. toda base registrada passa nas regras físicas', () => {
    expect(Object.values(MOVEMENT_BASES).flatMap(validateBase)).toEqual([])
  })

  it('toda demonstração registrada pertence a um item do catálogo', () => {
    const ids = new Set(CATALOG.map((i) => i.id))
    expect(Object.keys(DEMO_SPECS).filter((id) => !ids.has(id))).toEqual([])
  })

  it('4. os 122 nomes atuais continuam presentes', () => {
    const names = new Set(CATALOG.map((i) => i.name))
    for (const e of snapshot) expect(names, e.name).toContain(e.name)
  })
})

// Verificação com itens sintéticos: formato da mensagem e regras da demonstração.
describe('checkCatalog', () => {
  const base: MovementBase = {
    key: 'teste-base', view: 'side', loop: 'reps', durationMs: 2000, root: 'foot', fixed: ['an'],
    keyframes: [
      { at: 0, pose: { head: [110, 40], sh: [110, 70], el: [110, 100], ha: [110, 130], hip: [110, 150], kn: [110, 190], an: [110, 230], toe: [125, 232] } },
      { at: 1, pose: { head: [110, 60], sh: [110, 90], el: [110, 120], ha: [110, 150], hip: [100, 170], kn: [125, 200], an: [110, 230], toe: [125, 232] } },
    ],
  }
  const bases = { [base.key]: base }
  const guidance = { setup: ['Fique em pé'], steps: ['Desça e suba'], commonError: 'Tirar os calcanhares do chão' }
  const item = (over: Partial<CatalogEntry> = {}): CatalogEntry => ({
    id: 'item-teste', name: 'Item Teste', kind: 'forca', gear: 'halteres', guidance,
    demo: { base: 'teste-base', gear: 'halteres', scene: 'solo', implementAt: 'ha' }, ...over,
  })
  const ctx = (approvals: Record<string, string> = {}, pending: string[] = []) => ({ pending: new Set(pending), approvals, bases })
  const approveAll = (items: CatalogEntry[]) => Object.fromEntries(items.map((i) => [i.id, hashOf(i)]))
  const hashOf = (i: CatalogEntry) => itemHash(i, bases)

  it('item pendente não é verificado', () => {
    expect(checkCatalog([item({ demo: undefined, guidance: undefined })], ctx({}, ['item-teste']))).toEqual([])
  })

  it('aponta "<id>: falta demo" e "<id>: falta orientação"', () => {
    expect(checkCatalog([item({ demo: undefined, guidance: undefined })], ctx())).toEqual([
      'item-teste: falta demo',
      'item-teste: falta orientação',
    ])
  })

  it('aponta passos, posição inicial e erro comum ausentes em força', () => {
    const problems = checkCatalog([item({ guidance: { setup: [], steps: [] } })], ctx())
    expect(problems).toContain('item-teste: falta posição inicial')
    expect(problems).toContain('item-teste: falta passos')
    expect(problems).toContain('item-teste: falta erro comum')
  })

  it('aponta base inexistente e implemento divergente do item', () => {
    expect(checkCatalog([item({ demo: { base: 'nao-existe', gear: 'halteres', scene: 'solo', implementAt: 'ha' } })], ctx()))
      .toContain('item-teste: falta base nao-existe')
    expect(checkCatalog([item({ demo: { base: 'teste-base', gear: 'barra', scene: 'solo', implementAt: 'ha' } })], ctx()))
      .toContain('item-teste: falta gear halteres na demo')
  })

  it('sem hash aprovado: "falta aprovação"; com hash diferente: "falta nova aprovação"', () => {
    expect(checkCatalog([item()], ctx())).toEqual(['item-teste: falta aprovação'])
    expect(checkCatalog([item()], ctx({ 'item-teste': '0'.repeat(64) }))).toEqual(['item-teste: falta nova aprovação'])
  })

  it('completo e aprovado: passa; alterado depois de aprovado: volta a falhar', () => {
    const approved = { 'item-teste': hashOf(item()) }
    expect(checkCatalog([item()], ctx(approved))).toEqual([])
    const changed = item({ guidance: { ...guidance, steps: ['Desça devagar e suba'] } })
    expect(checkCatalog([changed], ctx(approved))).toEqual(['item-teste: falta nova aprovação'])
  })

  // FR-003: dois itens com a mesma demonstração resolvida precisam de legendas distintas.
  it('exige legenda quando dois itens têm a mesma demonstração resolvida', () => {
    const a = item({ id: 'a', name: 'A' })
    const b = item({ id: 'b', name: 'B' })
    const approvalsAB = approveAll([a, b])
    expect(checkCatalog([a, b], ctx(approvalsAB))).toEqual(['a: falta legenda', 'b: falta legenda'])
  })

  it('aceita a mesma base quando as legendas diferem', () => {
    const a = item({ id: 'a', name: 'A', demo: { ...item().demo!, caption: 'Pegada aberta' } })
    const b = item({ id: 'b', name: 'B', demo: { ...item().demo!, caption: 'Pegada fechada' } })
    expect(checkCatalog([a, b], ctx(approveAll([a, b])))).toEqual([])
  })
})

describe('coverageByKind', () => {
  it('informa aprovados/total por catálogo', () => {
    const lines = coverageByKind(CATALOG, PENDING_IDS)
    expect(lines.some((l) => /^forca: \d+\/122$/.test(l))).toBe(true)
    expect(lines.some((l) => /^cardio: \d+\/11$/.test(l))).toBe(true)
    expect(lines.some((l) => /^preparacao: \d+\/\d+$/.test(l))).toBe(true)
  })
})

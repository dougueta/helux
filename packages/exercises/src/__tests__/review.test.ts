import { describe, it, expect } from 'vitest'
import { CARDIO_BANK } from '@helux/types'
import { STRENGTH_EXERCISES } from '../strength'
import { isDemoReady, PENDING_IDS } from '../resolve'
import pending from '../review/pending.json'
import approvals from '../review/approvals.json'
import { contentHash } from '../review/hash'

// FR-032: publicação por etapas. Item pendente segue com o que existe hoje.
describe('lista de pendências', () => {
  it('é uma lista de ids sem repetição', () => {
    expect(Array.isArray(pending.ids)).toBe(true)
    expect(new Set(pending.ids).size).toBe(pending.ids.length)
  })

  it('só contém ids de itens que existem no catálogo de força ou de cardio', () => {
    const known = new Set([...STRENGTH_EXERCISES.map((e) => e.id), ...CARDIO_BANK.map((c) => c.id)])
    for (const id of pending.ids) expect(known, id).toContain(id)
  })

  it('nenhum id aparece ao mesmo tempo em pendentes e em aprovados', () => {
    for (const id of pending.ids) expect(Object.keys(approvals), id).not.toContain(id)
  })

  it('approvals.json mapeia id para um hash sha256 em hexadecimal', () => {
    for (const [id, hash] of Object.entries(approvals as Record<string, string>)) {
      expect(hash, id).toMatch(/^[0-9a-f]{64}$/)
    }
  })
})

describe('isDemoReady', () => {
  it('é verdadeiro para item fora da lista de pendências', () => {
    expect(isDemoReady('item-que-nao-esta-na-lista')).toBe(true)
  })

  it('é falso para todo item de pending.json', () => {
    expect(PENDING_IDS.size).toBe(pending.ids.length)
    for (const id of pending.ids) expect(isDemoReady(id), id).toBe(false)
  })
})

// FR-025, R12: o hash cobre a demonstração resolvida (inclusive a base) e a orientação.
describe('contentHash', () => {
  const guidance = { setup: ['Deite no banco'], steps: ['Desça o halter atrás da cabeça'], commonError: 'Flexionar demais os cotovelos' }
  const demo = {
    id: 'x', view: 'side', mirror: false, loop: 'reps', durationMs: 2400, root: 'seat', fixed: ['hip'],
    keyframes: [{ at: 0, pose: { head: [1, 2] } }, { at: 1, pose: { head: [3, 4] } }],
    gear: 'halteres', scene: 'banco-reto', implementAt: 'ha',
  }

  it('é determinístico e em hexadecimal de 64 caracteres', () => {
    const a = contentHash({ demo, guidance })
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(contentHash({ demo, guidance })).toBe(a)
  })

  it('não depende da ordem das chaves', () => {
    const reordered = { steps: guidance.steps, commonError: guidance.commonError, setup: guidance.setup }
    expect(contentHash({ guidance: reordered, demo })).toBe(contentHash({ demo, guidance }))
  })

  it('muda quando a base (keyframes) muda', () => {
    const other = { ...demo, keyframes: [demo.keyframes[0], { at: 1, pose: { head: [3, 5] } }] }
    expect(contentHash({ demo: other, guidance })).not.toBe(contentHash({ demo, guidance }))
  })

  it('muda quando a orientação muda', () => {
    expect(contentHash({ demo, guidance: { ...guidance, steps: ['Outro passo'] } })).not.toBe(contentHash({ demo, guidance }))
  })

  it('ignora campos indefinidos', () => {
    expect(contentHash({ demo, guidance: { ...guidance, context: undefined } })).toBe(contentHash({ demo, guidance }))
  })
})

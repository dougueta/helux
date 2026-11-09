import { describe, it, expect } from 'vitest'
import { checkPending } from '../../../scripts/demos-check-pending'

// FR-032, R12: pending.json só diminui. Item novo nunca entra na lista.
describe('checkPending', () => {
  const base = JSON.stringify({ ids: ['a', 'b', 'c'] })

  it('falha quando um id é adicionado, apontando qual', () => {
    const result = checkPending(base, { ids: ['a', 'b', 'c', 'novo'] })
    expect(result.ok).toBe(false)
    expect(result.added).toEqual(['novo'])
    expect(result.message).toContain('novo')
  })

  it('passa quando um id é removido', () => {
    expect(checkPending(base, { ids: ['a', 'c'] })).toMatchObject({ ok: true, added: [] })
  })

  it('passa com a lista igual, mesmo em outra ordem', () => {
    expect(checkPending(base, { ids: ['c', 'a', 'b'] }).ok).toBe(true)
  })

  it('passa quando a base ainda não tem o arquivo', () => {
    expect(checkPending(null, { ids: ['a', 'b'] }).ok).toBe(true)
  })
})

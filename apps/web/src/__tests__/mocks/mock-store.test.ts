import { describe, it, expect, beforeEach } from 'vitest'
import { createMockStore, MOCK_STATE_KEY } from '@/mocks/mock-store'
import type { MockDataset } from '@/mocks/types'

const base = (name: string) => ({ profile: { name } }) as unknown as MockDataset
const factory = (id: string) => base(id)

describe('mock-store (T003)', () => {
  let persona: string
  const store = () => createMockStore({ factory, getPersonaId: () => persona })

  beforeEach(() => {
    localStorage.clear()
    persona = 'standard-athlete'
  })

  it('sem estado salvo: dataset inicial da persona do cookie, persistido', () => {
    const s = store()
    expect(s.getDataset()).toEqual(base('standard-athlete'))
    expect(JSON.parse(localStorage.getItem(MOCK_STATE_KEY)!)).toMatchObject({ version: 1, personaId: 'standard-athlete' })
    expect(s.wasCorrupted()).toBe(false)
  })

  it('updateDataset persiste e um novo store lê o mesmo estado', () => {
    store().updateDataset(d => ({ ...d, profile: { name: 'mudou' } as never }))
    expect(store().getDataset().profile).toEqual({ name: 'mudou' })
  })

  it('reset volta ao dataset inicial da persona', () => {
    const s = store()
    s.updateDataset(() => ({ profile: null }))
    expect(s.reset()).toEqual(base('standard-athlete'))
    expect(store().getDataset()).toEqual(base('standard-athlete'))
  })

  it('loadPersona troca o dataset inteiro e grava a persona', () => {
    const s = store()
    expect(s.loadPersona('zero-state')).toEqual(base('zero-state'))
    expect(JSON.parse(localStorage.getItem(MOCK_STATE_KEY)!).personaId).toBe('zero-state')
  })

  it('estado de outra persona (cookie trocado): carrega a persona do cookie', () => {
    store()
    persona = 'exhausted-athlete'
    expect(store().getDataset()).toEqual(base('exhausted-athlete'))
  })

  it('estado corrompido ou de outra versão: fixtures + aviso', () => {
    localStorage.setItem(MOCK_STATE_KEY, '{not json')
    const s = store()
    expect(s.getDataset()).toEqual(base('standard-athlete'))
    expect(s.wasCorrupted()).toBe(true)

    localStorage.setItem(MOCK_STATE_KEY, JSON.stringify({ version: 99, personaId: 'standard-athlete', dataset: {} }))
    expect(store().wasCorrupted()).toBe(true)
  })

  it('a fábrica é chamada a cada reset (fixtures imutáveis não vazam mutações)', () => {
    const s = store()
    const d = s.getDataset() as unknown as { profile: { name: string } }
    d.profile.name = 'x'
    expect(s.reset()).toEqual(base('standard-athlete'))
  })
})

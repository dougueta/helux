import { describe, it, expect } from 'vitest'
import { SOURCE_KEYS, type IntegratedProfile, type SourceKey } from '@helux/types'
import { renderDay, renderProfile, sourcesUsedOf } from '../../agents/render-profile'

function profile(over: Partial<Record<SourceKey, Partial<IntegratedProfile['sources'][SourceKey]>>> = {}): IntegratedProfile {
  const sources = Object.fromEntries(
    SOURCE_KEYS.map(k => [k, { status: 'vazia', updatedAt: null, summary: '', data: null, ...over[k] }]),
  ) as IntegratedProfile['sources']
  return { generatedAt: '2026-10-20T10:00:00Z', sources }
}

describe('renderProfile (R6)', () => {
  const p = profile({
    genetica: { status: 'ativa', summary: 'MCM6 G,G: intolerância à lactose', updatedAt: '2026-01-01' },
    perfil: { status: 'ativa', summary: 'Objetivo: hipertrofia', updatedAt: '2026-09-01' },
    exames: { status: 'desativada', summary: 'não deveria aparecer' },
    checkins: { status: 'ativa', summary: 'Peso 81 kg', stale: true },
  })

  it('fontes ativas na ordem fixa, sem fontes desativadas nem datas/horas', () => {
    const text = renderProfile(p)
    expect(text.indexOf('Perfil declarado')).toBeLessThan(text.indexOf('Genética'))
    expect(text).toContain('MCM6 G,G')
    expect(text).not.toContain('não deveria aparecer')
    expect(text).not.toContain('2026-10-20')
    expect(text).toMatch(/Exames: desativada pelo usuário/)
    expect(text).toMatch(/Preferências de treino: sem dados/)
    expect(text).toMatch(/Check-ins corporais \(desatualizado\)/)
  })

  it('mesma entrada → mesma string (cache estável)', () => {
    expect(renderProfile(p)).toBe(renderProfile(structuredClone(p)))
  })

  it('sourcesUsedOf separa ativas, vazias e desativadas na ordem fixa', () => {
    const used = sourcesUsedOf(p)
    expect(used.ativa).toEqual(['perfil', 'checkins', 'genetica'])
    expect(used.desativada).toEqual(['exames'])
    expect(used.vazia).toHaveLength(SOURCE_KEYS.length - 4)
  })
})

describe('renderDay', () => {
  it('data, treino do dia, cansaço e avisos', () => {
    const text = renderDay({ date: '2026-10-20', todaySession: 'B — Costas e bíceps', tiredness: 'cansado', notices: ['A restrição "evitar supino" expirou em 18/10.'] })
    expect(text).toContain('2026-10-20')
    expect(text).toContain('Costas e bíceps')
    expect(text).toContain('cansado')
    expect(text).toContain('expirou')
  })
})

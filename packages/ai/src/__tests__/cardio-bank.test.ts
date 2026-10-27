import { describe, it, expect } from 'vitest'
import { CARDIO_BANK, findCardio } from '../cardio-bank'

// Spec 024 T051 — catálogo de cardio com impacto (R6).

describe('CARDIO_BANK', () => {
  it('ids únicos, impacto 0–2 e carga articular por articulação', () => {
    const ids = CARDIO_BANK.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of CARDIO_BANK) {
      expect([0, 1, 2]).toContain(c.impact)
      expect(Object.keys(c.stress).sort()).toEqual(['joelho', 'lombar', 'ombro'])
    }
  })

  it('ao menos 4 opções de impacto 0 (joelho operado/artrose)', () => {
    expect(CARDIO_BANK.filter(c => c.impact === 0).length).toBeGreaterThanOrEqual(4)
  })

  it('corrida é impacto 2 e bike é impacto 0', () => {
    expect(findCardio('corrida')?.impact).toBe(2)
    expect(findCardio('bike')?.impact).toBe(0)
  })

  it('acha pelo id ou pelo nome', () => {
    expect(findCardio('Bike ergométrica')?.id).toBe('bike')
    expect(findCardio('inexistente')).toBeUndefined()
  })
})

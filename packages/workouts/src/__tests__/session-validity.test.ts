import { describe, it, expect } from 'vitest'
import { sessionValidity } from '../session-validity'

// Spec 024 T093 — sessões suspeitas ficam fora da progressão e da análise (R9).

const set = (reps = 8, weight = 60) => ({ reps, weight, effort: 8 })
const row = (over: Record<string, unknown> = {}) => ({ duration_s: 3600, review_status: null, exercises: [{ name: 'Supino Reto (Barra)', sets: [set(), set(), set()] }], ...over })

describe('sessionValidity', () => {
  it('treino normal é válido', () => {
    expect(sessionValidity(row())).toEqual({ valid: true, reasons: [] })
  })

  it('sem séries, menos de 3 séries ou menos de 10 minutos → suspeita, com os motivos', () => {
    expect(sessionValidity(row({ exercises: [] }))).toEqual({ valid: false, reasons: ['sem séries registradas'] })
    expect(sessionValidity(row({ exercises: [{ name: 'Supino', sets: [set()] }] })).reasons).toEqual(['menos de 3 séries'])
    expect(sessionValidity(row({ duration_s: 124 })).reasons).toEqual(['duração de 2 min'])
    expect(sessionValidity(row({ duration_s: 84, exercises: [] })).reasons).toEqual(['sem séries registradas', 'duração de 1 min'])
  })

  it('séries puladas não contam; duração ausente (registro antigo) não pesa', () => {
    expect(sessionValidity(row({ exercises: [{ name: 'Supino', sets: [], skipped: true }] })).valid).toBe(false)
    expect(sessionValidity(row({ duration_s: null })).valid).toBe(true)
  })

  it('cardio concluído (minutos, carga 0) conta como treino', () => {
    expect(sessionValidity(row({ duration_s: 1500, exercises: [{ name: 'Bike ergométrica', sets: [{ reps: 25, weight: 0, effort: 5 }] }] })).valid).toBe(true)
  })

  it('confirmada pelo usuário é sempre válida', () => {
    expect(sessionValidity(row({ duration_s: 84, exercises: [], review_status: 'confirmada' }))).toEqual({ valid: true, reasons: [] })
  })
})

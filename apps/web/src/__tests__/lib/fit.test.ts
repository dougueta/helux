import { describe, it, expect } from 'vitest'
import { fitBand, fitColor, litRungs } from '@/lib/fit'

describe('fitBand (research V6)', () => {
  it.each([
    [0, 'baixo'],
    [49, 'baixo'],
    [50, 'médio'],
    [74, 'médio'],
    [75, 'alto'],
    [100, 'alto'],
  ] as const)('%d → %s', (v, band) => {
    expect(fitBand(v)).toBe(band)
  })

  it.each([
    [49, 'var(--fit-lo)'],
    [50, 'var(--fit-mid)'],
    [74, 'var(--fit-mid)'],
    [75, 'var(--fit-hi)'],
  ] as const)('token da faixa de %d', (v, token) => {
    expect(fitColor(v)).toBe(token)
  })

  it('traços acesos = round(n * fit / 100)', () => {
    expect(litRungs(68, 11)).toBe(7)
    expect(litRungs(68, 16)).toBe(11)
    expect(litRungs(0, 11)).toBe(0)
    expect(litRungs(100, 32)).toBe(32)
  })
})

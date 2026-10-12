import { describe, it, expect } from 'vitest'
import { formatNumber, formatDuration, formatClock } from '@/lib/format'

describe('formatNumber (pt-BR, research V7)', () => {
  it('inteiro sem casas', () => {
    expect(formatNumber(82)).toBe('82')
  })
  it('com 1 casa fixa', () => {
    expect(formatNumber(82, { decimals: 1 })).toBe('82,0')
  })
  it('ponto de milhar', () => {
    expect(formatNumber(9840)).toBe('9.840')
  })
  it('vírgula decimal', () => {
    expect(formatNumber(17.4)).toBe('17,4')
  })
  it('passo do stepper', () => {
    expect(formatNumber(82.5)).toBe('82,5')
  })
  it('arredonda para as casas pedidas', () => {
    expect(formatNumber(12.64, { decimals: 1 })).toBe('12,6')
  })
})

describe('formatDuration', () => {
  it('sem dado vira "—"', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(0)).toBe('—')
  })
  it('menos de 1 hora em minutos', () => {
    expect(formatDuration(52 * 60)).toBe('52 min')
  })
  it('1 hora ou mais', () => {
    expect(formatDuration(65 * 60)).toBe('1h05')
  })
})

describe('formatClock', () => {
  it('m:ss do descanso', () => {
    expect(formatClock(72)).toBe('1:12')
    expect(formatClock(5)).toBe('0:05')
    expect(formatClock(0)).toBe('0:00')
  })
})

describe('formatMonthYear (spec 012 T060)', () => {
  it('formats a YYYY-MM(-DD) month as "jul. 2026"', async () => {
    const { formatMonthYear } = await import('@/lib/format')
    expect(formatMonthYear('2026-07-01')).toBe('jul. 2026')
    expect(formatMonthYear('2026-05')).toBe('mai. 2026')
  })
})

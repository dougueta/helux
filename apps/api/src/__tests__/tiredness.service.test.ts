import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getTodayTirednessAssessment, todaySlug } from '../services/tiredness.service'

const NOW = new Date('2026-09-22T12:00:00.000Z')

function fakeSupabase(opts: {
  samples?: unknown[] | null
  samplesError?: unknown
  signal?: unknown
  signalError?: unknown
}) {
  const samplesOrder = vi.fn().mockResolvedValue({ data: opts.samples ?? [], error: opts.samplesError ?? null })
  const samplesGte = vi.fn(() => ({ order: samplesOrder }))
  const signalMaybeSingle = vi.fn().mockResolvedValue({ data: opts.signal ?? null, error: opts.signalError ?? null })
  const signalEqDate = vi.fn(() => ({ maybeSingle: signalMaybeSingle }))
  const from = vi.fn((table: string) => {
    if (table === 'daily_tiredness_signals') {
      return { select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: signalEqDate })) })) }
    }
    return { select: vi.fn(() => ({ eq: vi.fn(() => ({ gte: samplesGte })) })) }
  })
  return { client: { from } as unknown as SupabaseClient, samplesGte, signalEqDate }
}

describe('todaySlug', () => {
  it('usa a data UTC', () => {
    expect(todaySlug(NOW)).toBe('2026-09-22')
  })
})

describe('getTodayTirednessAssessment', () => {
  it('sem sinal e sem amostras → nenhum', async () => {
    const { client, samplesGte, signalEqDate } = fakeSupabase({})
    const a = await getTodayTirednessAssessment('user-1', client, NOW)
    expect(a).toMatchObject({ date: '2026-09-22', manualLevel: null, automaticLevel: null, effectiveLevel: null, source: 'none' })
    expect(samplesGte).toHaveBeenCalledWith('start_at', '2026-09-20T12:00:00.000Z')
    expect(signalEqDate).toHaveBeenCalledWith('date', '2026-09-22')
  })

  it('combina nível manual e HRV das amostras', async () => {
    const { client } = fakeSupabase({
      samples: [{ type: 'hrv', value: 45, unit: 'ms', start_at: '2026-09-22T08:00:00.000Z' }],
      signal: { level: 'otimo', override_automatic: true },
    })
    const a = await getTodayTirednessAssessment('user-1', client, NOW)
    expect(a).toMatchObject({
      manualLevel: 'otimo',
      overrideAutomatic: true,
      automaticLevel: 'cansado',
      automaticHrv: 45,
      effectiveLevel: 'otimo',
      source: 'manual',
      conflict: true,
    })
  })

  it('amostras sem HRV não geram nível automático', async () => {
    const { client } = fakeSupabase({
      samples: [{ type: 'heart_rate', value: 60, unit: 'bpm', start_at: '2026-09-22T08:00:00.000Z' }],
      signal: { level: 'cansado', override_automatic: false },
    })
    const a = await getTodayTirednessAssessment('user-1', client, NOW)
    expect(a.automaticLevel).toBeNull()
    expect(a.effectiveLevel).toBe('cansado')
  })

  it('propaga erro de leitura', async () => {
    const { client } = fakeSupabase({ signalError: { message: 'boom' } })
    await expect(getTodayTirednessAssessment('user-1', client, NOW)).rejects.toBeTruthy()
  })
})

import { describe, it, expect } from 'vitest'
import { fakeSupabase } from './helpers/fake-supabase'
import { effectiveStatus, getGenerationStatus, markFailed, markGenerating, markOk, shouldRetry, MAX_ATTEMPTS } from '../services/generation-status.service'

// Spec 024 T029 — estado da geração do mesociclo (R13, FR-031).

const NOW = new Date('2026-10-24T12:00:00Z')
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString()

describe('generation-status.service', () => {
  it('sem linha → null; transições gerando → ok zera as tentativas', async () => {
    const fake = fakeSupabase({ mesocycle_generation: [] })
    expect(await getGenerationStatus('u1', fake.client as never)).toBeNull()
    await markGenerating('u1', fake.client as never, NOW)
    expect(await getGenerationStatus('u1', fake.client as never)).toEqual({ status: 'gerando', attempts: 0, errorCode: null, startedAt: NOW.toISOString() })
    await markFailed('u1', 'incomplete-response', fake.client as never, NOW)
    await markGenerating('u1', fake.client as never, NOW)
    await markFailed('u1', 'unknown', fake.client as never, NOW)
    expect(await getGenerationStatus('u1', fake.client as never)).toMatchObject({ status: 'falhou', attempts: 2, errorCode: 'unknown' })
    await markGenerating('u1', fake.client as never, NOW)
    await markOk('u1', fake.client as never, NOW)
    expect(await getGenerationStatus('u1', fake.client as never)).toMatchObject({ status: 'ok', attempts: 0, errorCode: null })
  })

  it('gerando há mais de 10 min conta como falha', () => {
    expect(effectiveStatus({ status: 'gerando', attempts: 0, errorCode: null, startedAt: minutesAgo(5) }, NOW).status).toBe('gerando')
    expect(effectiveStatus({ status: 'gerando', attempts: 1, errorCode: null, startedAt: minutesAgo(11) }, NOW)).toEqual({ status: 'falhou', attempts: 2, errorCode: 'unknown', startedAt: minutesAgo(11) })
  })

  it('shouldRetry: sem estado, ok ou falhou abaixo do limite; nunca enquanto gera; para em 3 falhas', () => {
    expect(MAX_ATTEMPTS).toBe(3)
    expect(shouldRetry(null, NOW)).toBe(true)
    expect(shouldRetry({ status: 'ok', attempts: 0, errorCode: null, startedAt: null }, NOW)).toBe(true)
    expect(shouldRetry({ status: 'gerando', attempts: 0, errorCode: null, startedAt: minutesAgo(2) }, NOW)).toBe(false)
    expect(shouldRetry({ status: 'gerando', attempts: 0, errorCode: null, startedAt: minutesAgo(30) }, NOW)).toBe(true)
    // PR #19: geração que expira de novo e de novo também para no limite.
    expect(shouldRetry({ status: 'gerando', attempts: 2, errorCode: null, startedAt: minutesAgo(30) }, NOW)).toBe(false)
    expect(shouldRetry({ status: 'falhou', attempts: 2, errorCode: 'unknown', startedAt: null }, NOW)).toBe(true)
    expect(shouldRetry({ status: 'falhou', attempts: 3, errorCode: 'unknown', startedAt: null }, NOW)).toBe(false)
  })

  it('PR #19: nova geração depois de uma que expirou grava a falha; contagem nunca passa de 10', async () => {
    const fake = fakeSupabase({ mesocycle_generation: [{ user_id: 'u1', status: 'gerando', attempts: 1, error_code: null, started_at: minutesAgo(30) }] })
    await markGenerating('u1', fake.client as never, NOW)
    expect(await getGenerationStatus('u1', fake.client as never)).toMatchObject({ status: 'gerando', attempts: 2 })

    const full = fakeSupabase({ mesocycle_generation: [{ user_id: 'u1', status: 'falhou', attempts: 10, error_code: 'unknown', started_at: null }] })
    await markFailed('u1', 'unknown', full.client as never, NOW)
    expect(await getGenerationStatus('u1', full.client as never)).toMatchObject({ attempts: 10 })
    expect(effectiveStatus({ status: 'gerando', attempts: 10, errorCode: null, startedAt: minutesAgo(30) }, NOW).attempts).toBe(10)
  })
})

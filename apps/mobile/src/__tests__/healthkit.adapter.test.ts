import { describe, it, expect } from 'vitest'
import { MockHealthKitAdapter } from '../services/healthkit.adapter'

describe('MockHealthKitAdapter', () => {
  const adapter = new MockHealthKitAdapter()
  const from = new Date('2026-06-15T00:00:00Z')
  const to = new Date('2026-06-15T23:59:59Z')

  it('requestPermissions resolves without error', async () => {
    await expect(adapter.requestPermissions()).resolves.toBeUndefined()
  })

  it('readSamples returns heartRate, steps and hrv arrays', async () => {
    const payload = await adapter.readSamples(from, to)
    expect(Array.isArray(payload.heartRate)).toBe(true)
    expect(Array.isArray(payload.steps)).toBe(true)
    expect(Array.isArray(payload.hrv)).toBe(true)
  })

  it('readSamples heartRate samples have required fields', async () => {
    const payload = await adapter.readSamples(from, to)
    const sample = payload.heartRate![0]
    expect(sample).toMatchObject({
      uuid: expect.any(String),
      value: expect.any(Number),
      unit: 'bpm',
      startDate: expect.any(String),
      endDate: expect.any(String),
    })
  })

  it('readRecovery returns valid RecoveryData', async () => {
    const recovery = await adapter.readRecovery(from, to)
    expect(recovery).toMatchObject({
      date: expect.any(String),
      hrv: expect.any(Number),
      restingHR: expect.any(Number),
      activeCalories: expect.any(Number),
      source: 'healthkit',
    })
    expect(recovery.hrv).toBeGreaterThan(0)
    expect(recovery.restingHR).toBeGreaterThan(0)
  })
})

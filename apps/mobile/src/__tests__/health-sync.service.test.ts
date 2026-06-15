import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
  },
}))

vi.mock('../services/healthkit', () => ({
  healthKit: {
    requestPermissions: vi.fn().mockResolvedValue(undefined),
    readSamples: vi.fn().mockResolvedValue({
      heartRate: [{ uuid: '00000000-0000-4000-8000-000000000001', value: 65, unit: 'bpm', startDate: '2026-06-15T08:00:00Z', endDate: '2026-06-15T08:00:00Z' }],
      steps: [],
      hrv: [],
    }),
    readRecovery: vi.fn().mockResolvedValue({
      date: '2026-06-15',
      hrv: 52,
      restingHR: 58,
      activeCalories: 420,
      source: 'healthkit',
    }),
  },
}))

const mockFetch = vi.fn().mockResolvedValue({ ok: true })
global.fetch = mockFetch

import { syncHealthData } from '../services/health-sync.service'
import AsyncStorage from '@react-native-async-storage/async-storage'

describe('syncHealthData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('salva recovery no AsyncStorage', async () => {
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:recovery-data',
      expect.stringContaining('"hrv":52')
    )
  })

  it('salva last-sync-at no AsyncStorage', async () => {
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:last-sync-at',
      expect.any(String)
    )
  })

  it('faz POST para /api/health/sync com o token correto', async () => {
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/health/sync',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      })
    )
  })

  it('retorna SyncResult com recovery e syncedAt', async () => {
    const result = await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(result.recovery.hrv).toBe(52)
    expect(result.syncedAt).toBeInstanceOf(Date)
  })

  it('persiste dados localmente mesmo se o POST falhar', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:recovery-data',
      expect.any(String)
    )
  })
})

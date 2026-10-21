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

import {
  syncHealthData,
  HEALTH_SYNC_RETRY_DELAYS_MS,
  HEALTH_SYNC_TIMEOUT_MS,
} from '../services/health-sync.service'
import AsyncStorage from '@react-native-async-storage/async-storage'

const noSleep = vi.fn().mockResolvedValue(undefined)

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
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000', { sleep: noSleep })
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:recovery-data',
      expect.any(String)
    )
  })
})

// Spec 023 / FR-007, contrato 4: retry do POST para tolerar o cold start do Render.
describe('syncHealthData — retry do POST', () => {
  const API = 'http://localhost:3000'
  const SYNC_URL = `${API}/api/health/sync`
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    noSleep.mockResolvedValue(undefined)
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  const status = (code: number) => ({ ok: code >= 200 && code < 300, status: code })

  it('usa 3 tentativas com espera de 2 s, 4 s e 8 s e timeout de 45 s', () => {
    expect(HEALTH_SYNC_RETRY_DELAYS_MS).toEqual([2000, 4000, 8000])
    expect(HEALTH_SYNC_TIMEOUT_MS).toBe(45_000)
  })

  it('(a) 200 na primeira tentativa: sem retry', async () => {
    mockFetch.mockResolvedValueOnce(status(200))
    await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(noSleep).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('(b) 503, 503, 200: conclui com 3 chamadas e espera crescente', async () => {
    mockFetch
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(status(200))
    await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(mockFetch).toHaveBeenNthCalledWith(3, SYNC_URL, expect.objectContaining({ method: 'POST' }))
    expect(noSleep.mock.calls.map((c) => c[0])).toEqual([2000, 4000])
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('(c) erro de rede seguido de sucesso: conclui', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed')).mockResolvedValueOnce(status(200))
    await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('(d) 400: falha sem retry e registra o erro', async () => {
    mockFetch.mockResolvedValueOnce(status(400))
    await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(noSleep).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('(d) 500 não é transitório: falha sem retry', async () => {
    mockFetch.mockResolvedValueOnce(status(500))
    await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('(e) 3 falhas esgotam as tentativas, registram o erro e os dados locais já estavam salvos', async () => {
    mockFetch.mockResolvedValue(status(502))
    const result = await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(noSleep.mock.calls.map((c) => c[0])).toEqual([2000, 4000])
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('helux:recovery-data', expect.any(String))
    const savedAt = vi.mocked(AsyncStorage.setItem).mock.invocationCallOrder[0]
    expect(savedAt).toBeLessThan(mockFetch.mock.invocationCallOrder[0])
    expect(result.recovery.hrv).toBe(52)
  })

  it('(f) timeout aborta a tentativa e conta como falha', async () => {
    const hang = (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })
    mockFetch.mockImplementationOnce(hang).mockResolvedValueOnce(status(200))
    await syncHealthData('user-123', 'token-abc', API, { sleep: noSleep, timeoutMs: 5 })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
    expect(errorSpy).not.toHaveBeenCalled()
  })
})

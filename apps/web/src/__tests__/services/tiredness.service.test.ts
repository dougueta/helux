import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api-client', () => ({
  apiFetch: vi.fn(),
}))

const ASSESSMENT = {
  date: '2026-09-22',
  manualLevel: 'cansado',
  overrideAutomatic: false,
  automaticLevel: null,
  automaticHrv: null,
  effectiveLevel: 'cansado',
  source: 'manual',
  conflict: false,
}

describe('tiredness.service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getTirednessToday faz GET /api/tiredness-today e devolve a avaliação', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce(ASSESSMENT)
    const { getTirednessToday } = await import('@/services/tiredness.service')
    const result = await getTirednessToday()
    expect(apiFetch).toHaveBeenCalledWith('/api/tiredness-today')
    expect(result).toEqual(ASSESSMENT)
  })

  it('setTirednessToday faz PUT com nível e override', async () => {
    const { apiFetch } = await import('@/services/api-client')
    vi.mocked(apiFetch).mockResolvedValueOnce(ASSESSMENT)
    const { setTirednessToday } = await import('@/services/tiredness.service')
    const result = await setTirednessToday('cansado', true)
    expect(apiFetch).toHaveBeenCalledWith('/api/tiredness-today', {
      method: 'PUT',
      body: JSON.stringify({ level: 'cansado', overrideAutomatic: true }),
    })
    expect(result).toEqual(ASSESSMENT)
  })
})

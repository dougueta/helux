import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import { buildApp } from '../app';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

beforeEach(() => {
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  vi.mocked(createClient).mockReturnValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  } as any);
  mockGetUser.mockReset();
  mockFrom.mockReset();
});

// Helper to set up the query chain for health_samples.
// The route does: from('health_samples').select(...).eq(...).gte(...).order(...)
function mockSamples(samples: Array<{ type: string; value: number | string; unit: string; start_at: string }>) {
  const orderMock = vi.fn().mockResolvedValue({ data: samples, error: null });
  const gteMock = vi.fn().mockReturnValue({ order: orderMock });
  const eqMock = vi.fn().mockReturnValue({ gte: gteMock });
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
  mockFrom.mockReturnValue({ select: selectMock });
}

describe('GET /api/recovery/latest', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 when no Authorization header', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/recovery/latest',
    });
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when Bearer token is invalid', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/recovery/latest',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when no samples exist', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockSamples([]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/recovery/latest',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('No data found');
  });

  it('returns RecoveryData with correct aggregation on happy path', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockSamples([
      { type: 'hrv', value: 60, unit: 'ms', start_at: '2026-06-15T08:00:00.000Z' },
      { type: 'hrv', value: 90, unit: 'ms', start_at: '2026-06-15T07:00:00.000Z' },
      { type: 'hrv', value: 75, unit: 'ms', start_at: '2026-06-15T06:00:00.000Z' },
      { type: 'heart_rate', value: 55, unit: 'bpm', start_at: '2026-06-15T07:00:00.000Z' },
      { type: 'heart_rate', value: 65, unit: 'bpm', start_at: '2026-06-15T06:00:00.000Z' },
      { type: 'active_energy', value: 300, unit: 'kcal', start_at: '2026-06-15T07:00:00.000Z' },
      { type: 'active_energy', value: 200, unit: 'kcal', start_at: '2026-06-15T06:00:00.000Z' },
      { type: 'sleep_duration', value: 7.5, unit: 'hr', start_at: '2026-06-15T00:00:00.000Z' },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/recovery/latest',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // avg hrv: (60+90+75)/3 = 75
    expect(body.hrv).toBe(75);
    // avg restingHR: (55+65)/2 = 60
    expect(body.restingHR).toBe(60);
    // sum activeCalories: 300+200 = 500
    expect(body.activeCalories).toBe(500);
    expect(body.sleepHours).toBe(7.5);
    expect(body.source).toBe('healthkit');
    expect(body.date).toBe('2026-06-15');
  });

  it('returns undefined hrv and restingHR when those sample types are absent', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockSamples([
      { type: 'active_energy', value: 400, unit: 'kcal', start_at: '2026-06-15T07:00:00.000Z' },
      { type: 'sleep_duration', value: 8, unit: 'hr', start_at: '2026-06-15T00:00:00.000Z' },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/recovery/latest',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.hrv).toBeUndefined();
    expect(body.restingHR).toBeUndefined();
    expect(body.activeCalories).toBe(400);
    expect(body.sleepHours).toBe(8);
  });
});

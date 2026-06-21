import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import { buildApp } from '../app';

const mockGetUser = vi.fn();
const mockUpsert = vi.fn();

beforeEach(() => {
  process.env.SUPABASE_URL = 'http://localhost:54321';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  vi.mocked(createClient).mockReturnValue({
    auth: { getUser: mockGetUser },
    from: vi.fn().mockReturnValue({ upsert: mockUpsert }),
  } as any);
  mockGetUser.mockReset();
  mockUpsert.mockReset();
});

const validPayload = {
  heartRate: [
    {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      value: 72,
      unit: 'bpm',
      startDate: '2024-01-01T10:00:00.000Z',
      endDate: '2024-01-01T10:00:01.000Z',
    },
  ],
};

describe('POST /api/health/sync', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 when no Authorization header', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/health/sync',
      payload: validPayload,
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
      method: 'POST',
      url: '/api/health/sync',
      headers: { authorization: 'Bearer invalid-token' },
      payload: validPayload,
    });
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when payload is malformed', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/health/sync',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        heartRate: [{ invalid: 'object' }],
      },
    });
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Bad Request');
    expect(body.details).toBeDefined();
  });

  it('returns 202 with accepted count for valid payload', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });

    const response = await app.inject({
      method: 'POST',
      url: '/api/health/sync',
      headers: { authorization: 'Bearer valid-token' },
      payload: validPayload,
    });
    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('accepted');
    expect(body.count).toBe(1);
  });

  it('returns 202 with accepted count for the simple flat payload', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockUpsert.mockResolvedValue({ error: null });

    const response = await app.inject({
      method: 'POST',
      url: '/api/health/sync',
      headers: { authorization: 'Bearer valid-token' },
      payload: { hrv: 45, activeEnergy: 320 },
    });
    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('accepted');
    expect(body.count).toBe(2);
  });

  it('returns 500 when database insert fails', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'user-123' } }, error: null });
    mockUpsert.mockResolvedValueOnce({ error: { message: 'DB error' } });

    const response = await app.inject({
      method: 'POST',
      url: '/api/health/sync',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        heartRate: [{
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          value: 72,
          unit: 'bpm',
          startDate: '2026-06-15T10:00:00Z',
          endDate: '2026-06-15T10:00:00Z',
        }],
      },
    });

    expect(response.statusCode).toBe(500);
  });
});

import { describe, it, expect } from 'vitest';
import { processSync } from '../sync.service';
import type { HealthSyncPayload } from '../types';

const makeHeartRateSample = (overrides?: Partial<{
  uuid: string;
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
  metadata?: Record<string, unknown>;
}>) => ({
  uuid: '123e4567-e89b-12d3-a456-426614174000',
  value: 72,
  unit: 'bpm',
  startDate: '2026-06-15T08:00:00.000Z',
  endDate: '2026-06-15T08:00:01.000Z',
  ...overrides,
});

describe('processSync', () => {
  it('maps heartRate key to type heart_rate', () => {
    const payload: HealthSyncPayload = {
      heartRate: [makeHeartRateSample()],
    };
    const rows = processSync('user-1', payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('heart_rate');
  });

  it('maps steps key to type step_count', () => {
    const payload: HealthSyncPayload = {
      steps: [
        {
          uuid: '223e4567-e89b-12d3-a456-426614174001',
          value: 1000,
          unit: 'count',
          startDate: '2026-06-15T07:00:00.000Z',
          endDate: '2026-06-15T08:00:00.000Z',
        },
      ],
    };
    const rows = processSync('user-1', payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('step_count');
  });

  it('maps hrv key to type hrv', () => {
    const payload: HealthSyncPayload = {
      hrv: [
        {
          uuid: '323e4567-e89b-12d3-a456-426614174002',
          value: 45.5,
          unit: 'ms',
          startDate: '2026-06-15T06:00:00.000Z',
          endDate: '2026-06-15T06:01:00.000Z',
        },
      ],
    };
    const rows = processSync('user-1', payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('hrv');
  });

  it('handles empty payload and returns empty array', () => {
    const payload: HealthSyncPayload = {};
    const rows = processSync('user-1', payload);
    expect(rows).toEqual([]);
  });

  it('sets user_id correctly from the userId argument', () => {
    const payload: HealthSyncPayload = {
      heartRate: [makeHeartRateSample()],
    };
    const rows = processSync('user-abc-123', payload);
    expect(rows[0].user_id).toBe('user-abc-123');
  });

  it('sets id from sample uuid', () => {
    const uuid = '423e4567-e89b-12d3-a456-426614174003';
    const payload: HealthSyncPayload = {
      heartRate: [makeHeartRateSample({ uuid })],
    };
    const rows = processSync('user-1', payload);
    expect(rows[0].id).toBe(uuid);
  });

  it('maps startDate to start_at and endDate to end_at', () => {
    const startDate = '2026-06-15T09:00:00.000Z';
    const endDate = '2026-06-15T09:00:01.000Z';
    const payload: HealthSyncPayload = {
      heartRate: [makeHeartRateSample({ startDate, endDate })],
    };
    const rows = processSync('user-1', payload);
    expect(rows[0].start_at).toBe(startDate);
    expect(rows[0].end_at).toBe(endDate);
  });

  it('handles missing metadata and defaults to empty object', () => {
    const sample = makeHeartRateSample();
    // Ensure metadata is not set
    delete (sample as Record<string, unknown>)['metadata'];
    const payload: HealthSyncPayload = {
      heartRate: [sample],
    };
    const rows = processSync('user-1', payload);
    expect(rows[0].metadata).toEqual({});
  });

  it('includes all rows when multiple sample types are in one payload', () => {
    const payload: HealthSyncPayload = {
      heartRate: [makeHeartRateSample()],
      steps: [
        {
          uuid: '523e4567-e89b-12d3-a456-426614174004',
          value: 500,
          unit: 'count',
          startDate: '2026-06-15T07:00:00.000Z',
          endDate: '2026-06-15T08:00:00.000Z',
        },
      ],
      hrv: [
        {
          uuid: '623e4567-e89b-12d3-a456-426614174005',
          value: 55,
          unit: 'ms',
          startDate: '2026-06-15T06:00:00.000Z',
          endDate: '2026-06-15T06:01:00.000Z',
        },
      ],
    };
    const rows = processSync('user-1', payload);
    expect(rows).toHaveLength(3);
    const types = rows.map((r) => r.type).sort();
    expect(types).toEqual(['heart_rate', 'hrv', 'step_count']);
  });
});

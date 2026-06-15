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
    const payload: HealthSyncPayload = {
      heartRate: [makeHeartRateSample()],
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

  it('AC1: sends 10 heartRate samples with unique UUIDs and asserts exactly 10 rows returned', () => {
    const samples = Array.from({ length: 10 }, (_, i) => {
      const uuid = `${(i + 1).toString().padStart(3, '0')}e4567-e89b-12d3-a456-426614174000`;
      return makeHeartRateSample({
        uuid,
        value: 70 + i,
        startDate: `2026-06-15T${(8 + i).toString().padStart(2, '0')}:00:00.000Z`,
        endDate: `2026-06-15T${(8 + i).toString().padStart(2, '0')}:00:01.000Z`,
      });
    });

    const payload: HealthSyncPayload = {
      heartRate: samples,
    };

    const rows = processSync('user-1', payload);
    expect(rows).toHaveLength(10);

    // Verify all samples are present with their respective UUIDs
    const uuids = rows.map((r) => r.id);
    expect(uuids).toHaveLength(10);
    expect(new Set(uuids).size).toBe(10); // All UUIDs are unique

    // Verify values are mapped correctly
    rows.forEach((row, i) => {
      expect(row.type).toBe('heart_rate');
      expect(row.value).toBe(70 + i);
    });
  });

  it('AC2: documents duplicate-UUID behavior - processSync returns duplicate rows (DB deduplication via ON CONFLICT)', () => {
    // Service layer contract: processSync is a pure mapping function that does not deduplicate.
    // When the same UUID appears twice in the payload, it returns 2 rows.
    // Deduplication happens at the DB layer via ON CONFLICT DO NOTHING.
    const sharedUuid = '999e4567-e89b-12d3-a456-426614174999';
    const payload: HealthSyncPayload = {
      heartRate: [
        makeHeartRateSample({
          uuid: sharedUuid,
          value: 72,
          startDate: '2026-06-15T08:00:00.000Z',
          endDate: '2026-06-15T08:00:01.000Z',
        }),
        makeHeartRateSample({
          uuid: sharedUuid,
          value: 73,
          startDate: '2026-06-15T08:01:00.000Z',
          endDate: '2026-06-15T08:01:01.000Z',
        }),
      ],
    };

    const rows = processSync('user-1', payload);

    // processSync returns 2 rows, even though they share the same UUID
    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe(sharedUuid);
    expect(rows[1].id).toBe(sharedUuid);
    expect(rows[0].value).toBe(72);
    expect(rows[1].value).toBe(73);
  });
});

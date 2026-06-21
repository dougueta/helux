import { describe, it, expect } from 'vitest';
import { processSimpleSync } from '../sync.service';
import type { HealthSyncSimplePayload } from '../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('processSimpleSync', () => {
  it('maps hrv to type hrv with unit ms', () => {
    const payload: HealthSyncSimplePayload = { hrv: 45 };
    const rows = processSimpleSync('user-1', payload, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('hrv');
    expect(rows[0].value).toBe(45);
    expect(rows[0].unit).toBe('ms');
  });

  it('maps restingHR to type heart_rate with unit bpm', () => {
    const payload: HealthSyncSimplePayload = { restingHR: 58 };
    const rows = processSimpleSync('user-1', payload, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows[0].type).toBe('heart_rate');
    expect(rows[0].unit).toBe('bpm');
  });

  it('maps activeEnergy to type active_energy with unit kcal', () => {
    const payload: HealthSyncSimplePayload = { activeEnergy: 320 };
    const rows = processSimpleSync('user-1', payload, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows[0].type).toBe('active_energy');
    expect(rows[0].unit).toBe('kcal');
  });

  it('maps cardioRecovery to type cardio_recovery with unit bpm', () => {
    const payload: HealthSyncSimplePayload = { cardioRecovery: 28 };
    const rows = processSimpleSync('user-1', payload, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows[0].type).toBe('cardio_recovery');
    expect(rows[0].unit).toBe('bpm');
  });

  it('maps sleepHours to type sleep_duration with unit hr', () => {
    const payload: HealthSyncSimplePayload = { sleepHours: 7.3 };
    const rows = processSimpleSync('user-1', payload, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows[0].type).toBe('sleep_duration');
    expect(rows[0].unit).toBe('hr');
  });

  it('skips fields that are not present in the payload', () => {
    const payload: HealthSyncSimplePayload = { hrv: 45, sleepHours: 7.3 };
    const rows = processSimpleSync('user-1', payload, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows).toHaveLength(2);
    expect(rows.map(r => r.type).sort()).toEqual(['hrv', 'sleep_duration']);
  });

  it('handles empty payload and returns empty array', () => {
    const rows = processSimpleSync('user-1', {}, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows).toEqual([]);
  });

  it('sets start_at and end_at to the provided sync time', () => {
    const now = new Date('2026-06-20T08:15:00.000Z');
    const rows = processSimpleSync('user-1', { hrv: 45 }, now);
    expect(rows[0].start_at).toBe('2026-06-20T08:15:00.000Z');
    expect(rows[0].end_at).toBe('2026-06-20T08:15:00.000Z');
  });

  it('generates a valid UUID-shaped id', () => {
    const rows = processSimpleSync('user-1', { hrv: 45 }, new Date('2026-06-20T08:00:00.000Z'));
    expect(rows[0].id).toMatch(UUID_RE);
  });

  it('generates the same id for the same user+type+day (idempotent re-sync)', () => {
    const morning = new Date('2026-06-20T08:00:00.000Z');
    const evening = new Date('2026-06-20T20:00:00.000Z');
    const rowsMorning = processSimpleSync('user-1', { hrv: 45 }, morning);
    const rowsEvening = processSimpleSync('user-1', { hrv: 50 }, evening);
    expect(rowsMorning[0].id).toBe(rowsEvening[0].id);
  });

  it('generates a different id for a different day', () => {
    const day1 = new Date('2026-06-20T08:00:00.000Z');
    const day2 = new Date('2026-06-21T08:00:00.000Z');
    const rows1 = processSimpleSync('user-1', { hrv: 45 }, day1);
    const rows2 = processSimpleSync('user-1', { hrv: 45 }, day2);
    expect(rows1[0].id).not.toBe(rows2[0].id);
  });

  it('generates a different id for a different metric type on the same day', () => {
    const now = new Date('2026-06-20T08:00:00.000Z');
    const rows = processSimpleSync('user-1', { hrv: 45, activeEnergy: 320 }, now);
    expect(rows[0].id).not.toBe(rows[1].id);
  });

  it('generates a different id for a different user on the same day', () => {
    const now = new Date('2026-06-20T08:00:00.000Z');
    const rowsA = processSimpleSync('user-A', { hrv: 45 }, now);
    const rowsB = processSimpleSync('user-B', { hrv: 45 }, now);
    expect(rowsA[0].id).not.toBe(rowsB[0].id);
  });
});

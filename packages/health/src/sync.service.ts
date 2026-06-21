import { createHash } from 'crypto';
import { HealthSyncPayload, HealthSyncSimplePayload, HealthSampleRow } from './types';

const TYPE_MAP: Record<keyof HealthSyncPayload, string> = {
  heartRate: 'heart_rate',
  steps: 'step_count',
  hrv: 'hrv',
  activeEnergy: 'active_energy',
  sleepDuration: 'sleep_duration',
  cardioRecovery: 'cardio_recovery',
};

const SIMPLE_TYPE_MAP: Record<keyof HealthSyncSimplePayload, string> = {
  hrv: 'hrv',
  restingHR: 'heart_rate',
  activeEnergy: 'active_energy',
  cardioRecovery: 'cardio_recovery',
  sleepHours: 'sleep_duration',
};

const SIMPLE_UNIT_MAP: Record<keyof HealthSyncSimplePayload, string> = {
  hrv: 'ms',
  restingHR: 'bpm',
  activeEnergy: 'kcal',
  cardioRecovery: 'bpm',
  sleepHours: 'hr',
};

// Deterministic UUID-shaped id from a seed string, so re-syncing the same
// user+type+day is idempotent (ON CONFLICT DO NOTHING) without needing a
// real HealthKit sample UUID.
function deterministicId(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

export function processSync(userId: string, payload: HealthSyncPayload): HealthSampleRow[] {
  const rows: HealthSampleRow[] = [];

  for (const [key, samples] of Object.entries(payload)) {
    if (!samples) continue;
    const type = TYPE_MAP[key as keyof HealthSyncPayload];
    for (const sample of samples) {
      rows.push({
        id: sample.uuid,
        user_id: userId,
        type,
        value: sample.value,
        unit: sample.unit,
        start_at: sample.startDate,
        end_at: sample.endDate,
        metadata: sample.metadata ?? {},
      });
    }
  }

  return rows;
}

export function processSimpleSync(
  userId: string,
  payload: HealthSyncSimplePayload,
  now: Date = new Date(),
): HealthSampleRow[] {
  const rows: HealthSampleRow[] = [];
  const dateKey = now.toISOString().split('T')[0];
  const nowIso = now.toISOString();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    const type = SIMPLE_TYPE_MAP[key as keyof HealthSyncSimplePayload];
    const unit = SIMPLE_UNIT_MAP[key as keyof HealthSyncSimplePayload];
    rows.push({
      id: deterministicId(`${userId}:${type}:${dateKey}`),
      user_id: userId,
      type,
      value,
      unit,
      start_at: nowIso,
      end_at: nowIso,
      metadata: {},
    });
  }

  return rows;
}

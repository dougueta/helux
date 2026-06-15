import { HealthSyncPayload, HealthSampleRow } from './types';

const TYPE_MAP: Record<string, string> = {
  heartRate: 'heart_rate',
  steps: 'step_count',
  hrv: 'hrv',
};

export function processSync(userId: string, payload: HealthSyncPayload): HealthSampleRow[] {
  const rows: HealthSampleRow[] = [];

  for (const [key, samples] of Object.entries(payload)) {
    if (!samples) continue;
    const type = TYPE_MAP[key] ?? key;
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

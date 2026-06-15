import { z } from 'zod';

export const HealthSampleSchema = z.object({
  uuid: z.string().uuid(),
  value: z.number(),
  unit: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metadata: z.record(z.unknown()).optional(),
});

export const HealthSyncPayloadSchema = z.object({
  heartRate: z.array(HealthSampleSchema).optional(),
  steps: z.array(HealthSampleSchema).optional(),
  hrv: z.array(HealthSampleSchema).optional(),
});

export type HealthSample = z.infer<typeof HealthSampleSchema>;
export type HealthSyncPayload = z.infer<typeof HealthSyncPayloadSchema>;

export interface HealthSampleRow {
  id: string;
  user_id: string;
  type: string;
  value: number;
  unit: string;
  start_at: string;
  end_at: string;
  metadata: Record<string, unknown>;
}

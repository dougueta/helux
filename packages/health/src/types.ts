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
  activeEnergy: z.array(HealthSampleSchema).optional(),
  sleepDuration: z.array(HealthSampleSchema).optional(),
  cardioRecovery: z.array(HealthSampleSchema).optional(),
});

export type HealthSample = z.infer<typeof HealthSampleSchema>;
export type HealthSyncPayload = z.infer<typeof HealthSyncPayloadSchema>;

export const HealthSyncSimplePayloadSchema = z.object({
  hrv: z.number().optional(),
  restingHR: z.number().optional(),
  activeEnergy: z.number().optional(),
  cardioRecovery: z.number().optional(),
  sleepHours: z.number().optional(),
});

export type HealthSyncSimplePayload = z.infer<typeof HealthSyncSimplePayloadSchema>;

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

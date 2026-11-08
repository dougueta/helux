// Spec 029: pesagens diárias e registros de medidas (antes: check-in mensal único).

/** Uma pesagem por dia. */
export interface BodyWeight {
  id: string
  /** YYYY-MM-DD */
  date: string
  weight_kg: number
}

/** De onde veio um % de gordura: a fita (método da Marinha) ou um aparelho. */
export type BodyFatSource = 'navy' | 'bioimpedancia' | 'adipometro' | 'dexa' | 'outro'
export type DeviceBodyFatSource = Exclude<BodyFatSource, 'navy'>

/** Registro de medidas com fita, datado. */
export interface BodyMeasurement {
  id: string
  /** YYYY-MM-DD */
  measured_on: string
  neck_cm?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  shoulders_cm?: number | null
  chest_cm?: number | null
  arm_left_cm?: number | null
  arm_right_cm?: number | null
  leg_left_cm?: number | null
  leg_right_cm?: number | null
  calf_left_cm?: number | null
  calf_right_cm?: number | null
  /** Calculado no servidor pela fita (Marinha), com o perfil do momento do registro. */
  body_fat_navy_pct?: number | null
  body_fat_device_pct?: number | null
  body_fat_device_source?: DeviceBodyFatSource | null
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
  notes?: string | null
  created_at: string
}

export type MeasurementInput = Omit<BodyMeasurement, 'id' | 'created_at' | 'body_fat_navy_pct'>

/** Por que a estimativa pela fita saiu (ou não) ao salvar as medidas. */
export type NavyStatus = 'ok' | 'sem-perfil' | 'sem-medidas' | 'inconsistente'

/**
 * Foto do corpo numa data, para comparar dois registros de medidas (spec 024, R10):
 * medidas do registro + peso de referência e % de gordura com a origem.
 */
export interface BodySnapshot {
  /** YYYY-MM-DD */
  date: string
  weight_kg?: number | null
  body_fat_pct?: number | null
  body_fat_source?: BodyFatSource | null
  waist_cm?: number | null
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
}

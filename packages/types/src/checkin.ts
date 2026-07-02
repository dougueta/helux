export interface BodyCheckin {
  id: string
  month: string
  weight_kg?: number | null
  body_fat_pct?: number | null
  waist_cm?: number | null
  hip_cm?: number | null
  arm_cm?: number | null
  leg_cm?: number | null
  squat_kg?: number | null
  bench_kg?: number | null
  deadlift_kg?: number | null
  notes?: string | null
  created_at: string
}

export interface CheckinInput {
  month: string
  weight_kg?: number
  body_fat_pct?: number
  waist_cm?: number
  hip_cm?: number
  arm_cm?: number
  leg_cm?: number
  squat_kg?: number
  bench_kg?: number
  deadlift_kg?: number
  notes?: string
}

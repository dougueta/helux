export interface BodyCheckin {
  id: string
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

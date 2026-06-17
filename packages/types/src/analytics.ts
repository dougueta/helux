export interface WeeklyVolume {
  weekStart: string
  tonnage: number
  sessions: number
}

export interface PersonalRecord {
  exerciseName: string
  maxWeight: number
  reps: number
  achievedAt: string
}

export interface WorkoutAnalytics {
  weeklyVolume: WeeklyVolume[]
  personalRecords: PersonalRecord[]
  totalSessions: number
  currentStreakWeeks: number
  thisWeekSessions: number
}

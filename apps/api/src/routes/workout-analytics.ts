import type { FastifyInstance } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import type { WorkoutAnalytics, WeeklyVolume, PersonalRecord } from '@helux/types'

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

export async function workoutAnalyticsRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

  app.get('/api/workouts/analytics', async (request, reply) => {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return reply.code(401).send({ error: 'Unauthorized' })
    const token = authHeader.slice(7)

    const verifyClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
    if (authError || !user) return reply.code(401).send({ error: 'Unauthorized' })

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: sessions, error } = await supabase
      .from('workout_sessions')
      .select('date, exercises')
      .eq('user_id', user.id)
      .order('date', { ascending: true })

    if (error) {
      app.log.error(error, 'workout-analytics query error')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }

    const rows = sessions ?? []

    // Weekly volume map
    const weekMap = new Map<string, { tonnage: number; sessions: number }>()
    for (const row of rows) {
      const week = getMondayOf(row.date as string)
      const prev = weekMap.get(week) ?? { tonnage: 0, sessions: 0 }
      let tonnage = 0
      for (const ex of (row.exercises as any[]) ?? []) {
        for (const s of (ex.sets as any[]) ?? []) {
          tonnage += ((s.weight as number) ?? 0) * ((s.reps as number) ?? 0)
        }
      }
      weekMap.set(week, { tonnage: prev.tonnage + tonnage, sessions: prev.sessions + 1 })
    }

    // Last 8 weeks (oldest first, fill zeros)
    const today = new Date()
    const weeklyVolume: WeeklyVolume[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today)
      d.setUTCDate(d.getUTCDate() - i * 7)
      const week = getMondayOf(d.toISOString().split('T')[0])
      const v = weekMap.get(week) ?? { tonnage: 0, sessions: 0 }
      weeklyVolume.push({ weekStart: week, tonnage: v.tonnage, sessions: v.sessions })
    }

    // Personal records
    const prMap = new Map<string, PersonalRecord>()
    for (const row of rows) {
      for (const ex of (row.exercises as any[]) ?? []) {
        const name = ex.name as string
        for (const s of (ex.sets as any[]) ?? []) {
          const w = (s.weight as number) ?? 0
          const existing = prMap.get(name)
          if (!existing || w > existing.maxWeight) {
            prMap.set(name, { exerciseName: name, maxWeight: w, reps: (s.reps as number) ?? 0, achievedAt: row.date as string })
          }
        }
      }
    }
    const personalRecords: PersonalRecord[] = [...prMap.values()]
      .filter(pr => pr.maxWeight > 0)
      .sort((a, b) => b.maxWeight - a.maxWeight)
      .slice(0, 8)

    // Streak (consecutive weeks ending this week)
    const thisWeekMonday = getMondayOf(today.toISOString().split('T')[0])
    let streak = 0
    let checkWeek = thisWeekMonday
    for (let i = 0; i < 52; i++) {
      if (weekMap.has(checkWeek)) {
        streak++
        const d = new Date(checkWeek + 'T12:00:00Z')
        d.setUTCDate(d.getUTCDate() - 7)
        checkWeek = d.toISOString().split('T')[0]
      } else {
        break
      }
    }

    const analytics: WorkoutAnalytics = {
      weeklyVolume,
      personalRecords,
      totalSessions: rows.length,
      currentStreakWeeks: streak,
      thisWeekSessions: weekMap.get(thisWeekMonday)?.sessions ?? 0,
    }

    return reply.send(analytics)
  })
}

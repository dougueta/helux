import type { FastifyInstance } from 'fastify'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExerciseSet } from '@helux/types'
import { sessionValidity } from '@helux/workouts'
import { authenticate } from './nutrition-auth'

interface Row {
  id: string
  date: string
  duration_s: number | null
  review_status: string | null
  exercises: ExerciseSet[]
}

/** Revisão das sessões suspeitas (spec 024, R9): listar, confirmar como real ou excluir. */
export async function workoutReviewRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/workouts/review', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const { data, error } = await auth.supabase.from('workout_sessions').select('id, date, duration_s, review_status, exercises').eq('user_id', auth.user.id).order('date', { ascending: false })
    if (error) {
      app.log.error(error, 'workout review: failed to list')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    const sessions = ((data ?? []) as Row[])
      .map(s => ({ s, v: sessionValidity(s) }))
      .filter(({ v }) => !v.valid)
      .map(({ s, v }) => ({ id: s.id, date: s.date, durationS: s.duration_s, exercises: s.exercises.map(e => e.name), reasons: v.reasons }))
    return reply.send({ sessions })
  })

  async function own(userId: string, id: string, supabase: SupabaseClient) {
    const { data, error } = await supabase.from('workout_sessions').select('id').eq('user_id', userId).eq('id', id).maybeSingle()
    if (error) throw error
    return !!data
  }

  app.post<{ Params: { id: string } }>('/api/workouts/:id/confirm', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      if (!(await own(auth.user.id, request.params.id, auth.supabase))) return reply.code(404).send({ error: 'Treino não encontrado.' })
      const { error } = await auth.supabase.from('workout_sessions').update({ review_status: 'confirmada' }).eq('user_id', auth.user.id).eq('id', request.params.id)
      if (error) throw error
      return reply.send({ id: request.params.id, reviewStatus: 'confirmada' })
    } catch (error) {
      app.log.error(error, 'workout review: failed to confirm')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  // Exclusão explícita pelo usuário, uma sessão por vez.
  app.delete<{ Params: { id: string } }>('/api/workouts/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      if (!(await own(auth.user.id, request.params.id, auth.supabase))) return reply.code(404).send({ error: 'Treino não encontrado.' })
      const { error } = await auth.supabase.from('workout_sessions').delete().eq('user_id', auth.user.id).eq('id', request.params.id)
      if (error) throw error
      return reply.code(204).send()
    } catch (error) {
      app.log.error(error, 'workout review: failed to delete')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

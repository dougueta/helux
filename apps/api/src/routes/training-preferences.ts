import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { findBankExercise, validatePlanAgainstConstraints } from '@helux/ai'
import { EQUIPMENT, HARD_PREFERENCE_FIELDS, type TrainingPreferences, type WorkoutAdjustmentProposal } from '@helux/types'
import { toPreferences, type PreferencesRow } from '../services/agent-rows'
import { BudgetExceededError } from '../services/ai-budget.service'
import { buildIntegratedProfile } from '../services/integrated-profile.service'
import { requestSessionAdjustment } from '../services/proposals.service'
import { authenticate } from './nutrition-auth'

const bankId = z.string().refine(id => !!findBankExercise(id), 'exercício fora do banco')

const InputSchema = z
  .object({
    availableDays: z.array(z.number().int().min(0).max(6)).max(7).refine(d => new Set(d).size === d.length, 'dias repetidos'),
    maxSessionMinutes: z.number().int().min(15).max(180).nullable(),
    location: z.enum(['academia', 'casa', 'ao-ar-livre', 'hotel']).nullable(),
    availableEquipment: z.array(z.enum(EQUIPMENT)).refine(e => new Set(e).size === e.length, 'equipamento repetido'),
    favoriteExercises: z.array(bankId),
    exercisesToAvoid: z.array(bankId),
    priorityMuscleGroups: z.array(z.string().min(1).max(40)).max(20),
    trainingStyle: z.enum(['hipertrofia-classica', 'forca', 'funcional', 'circuito', 'misto']).nullable(),
    freeInstructions: z.string().max(1000).nullable(),
  })
  .refine(p => !p.favoriteExercises.some(f => p.exercisesToAvoid.includes(f)), { message: 'exercício favorito e a evitar ao mesmo tempo', path: ['exercisesToAvoid'] })

type Input = z.infer<typeof InputSchema>

const toRow = (p: Input) => ({
  available_days: p.availableDays,
  max_session_minutes: p.maxSessionMinutes,
  location: p.location,
  available_equipment: p.availableEquipment,
  favorite_exercises: p.favoriteExercises,
  exercises_to_avoid: p.exercisesToAvoid,
  priority_muscle_groups: p.priorityMuscleGroups,
  training_style: p.trainingStyle,
  free_instructions: p.freeInstructions,
})

const sameList = (a: unknown, b: unknown) => JSON.stringify([...((a as unknown[]) ?? [])].sort()) === JSON.stringify([...((b as unknown[]) ?? [])].sort())
const hardChanged = (prev: TrainingPreferences, next: Input) =>
  HARD_PREFERENCE_FIELDS.some(f => (f === 'maxSessionMinutes' ? prev[f] !== next[f] : !sameList(prev[f], next[f])))

/** Preferências de treino (spec 022, FR-005, FR-011, R8). */
export async function trainingPreferencesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/training-preferences', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const { data, error } = await auth.supabase.from('training_preferences').select('*').eq('user_id', auth.user.id).maybeSingle()
    if (error) {
      app.log.error(error, 'training preferences: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    return reply.send(toPreferences(data as PreferencesRow | null))
  })

  app.put('/api/training-preferences', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = InputSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    const { user, supabase } = auth
    try {
      const { data: prevRow } = await supabase.from('training_preferences').select('*').eq('user_id', user.id).maybeSingle()
      const previous = toPreferences(prevRow as PreferencesRow | null)
      const isFirst = !prevRow
      const hard = !isFirst && hardChanged(previous, parsed.data)
      const now = new Date().toISOString()

      const { data: saved, error } = await supabase
        .from('training_preferences')
        .upsert({ user_id: user.id, ...toRow(parsed.data), updated_at: now }, { onConflict: 'user_id' })
        .select('*')
        .single()
      if (error) throw error
      await supabase.from('training_preferences_history').insert({ user_id: user.id, previous: prevRow ?? null, next: toRow(parsed.data), hard_change: hard })

      // Restrição rígida nova: só as sessões pendentes que passaram a violar recebem proposta (FR-011).
      let proposal: WorkoutAdjustmentProposal | null = null
      let budgetBlocked = false
      if (isFirst || hard) {
        const build = await buildIntegratedProfile(user.id, supabase)
        const sessions = build.mesocycle?.sessions ?? []
        const violated = [...new Set(validatePlanAgainstConstraints(sessions, build.constraints).map(v => v.sessionIndex))].filter(i => sessions[i]?.completedAt === null)
        if (violated.length > 0) {
          try {
            proposal = await requestSessionAdjustment(user.id, supabase, {
              request: 'Adaptar as sessões pendentes às novas restrições do usuário (equipamentos, exercícios a evitar e duração máxima), mudando o mínimo necessário.',
              scope: 'pendentes',
              kind: 'adaptacao-restricao',
              sessionIndexes: violated,
            })
          } catch (err) {
            if (err instanceof BudgetExceededError) budgetBlocked = true
            else app.log.error(err, 'training preferences: adaptation proposal failed')
          }
        }
      }

      return reply.send({
        preferences: toPreferences(saved as PreferencesRow),
        appliesFrom: hard ? 'imediato' : 'proximo-mesociclo',
        proposal,
        ...(budgetBlocked ? { budgetBlocked: true } : {}),
      })
    } catch (err) {
      app.log.error(err, 'training preferences: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

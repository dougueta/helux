import type { FastifyInstance } from 'fastify'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { EQUIPMENT, GOALS } from '@helux/types'
import { toPreferences, type PreferencesRow } from '../services/agent-rows'
import { listConditions } from '../services/conditions.service'
import { goalFieldsProblem, goalFieldsToRow, GoalFieldsSchema, toProfile, type ProfileRow } from '../services/profile-rows'
import { authenticate } from './nutrition-auth'

// Spec 024 (FR-001..004): onboarding em passos, retomável e pré-preenchido.

const cardioIds = z.array(z.string().min(1).max(40))

const PutSchema = z.object({
  step: z.number().int().min(0).max(10),
  goal: z
    .object({
      primary: z.enum(GOALS),
      secondary: z.enum(GOALS).nullable().optional(),
      target: z.string().max(140).nullable().optional(),
      text: z.string().max(300).optional(),
    })
    .optional(),
  experience: z
    .object({
      level: z.enum(['iniciante', 'intermediario', 'avancado']),
      trainingTime: z.string().max(300).optional(),
      timeOff: z.string().max(300).optional(),
    })
    .optional(),
  cardio: z.object({ likes: cardioIds, avoid: cardioIds }).optional(),
  availability: z
    .object({
      availableDays: z.array(z.number().int().min(0).max(6)).max(7).refine(d => new Set(d).size === d.length, 'dias repetidos').optional(),
      maxSessionMinutes: z.number().int().min(15).max(180).nullable().optional(),
      location: z.enum(['academia', 'casa', 'ao-ar-livre', 'hotel']).nullable().optional(),
      availableEquipment: z.array(z.enum(EQUIPMENT)).optional(),
    })
    .optional(),
})

async function load(userId: string, supabase: SupabaseClient) {
  const [profileRes, prefsRes, conditions] = await Promise.all([
    supabase.from('user_training_profile').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('training_preferences').select('*').eq('user_id', userId).maybeSingle(),
    listConditions(userId, supabase),
  ])
  if (profileRes.error) throw profileRes.error
  if (prefsRes.error) throw prefsRes.error
  const row = profileRes.data as (ProfileRow & { updated_at: string }) | null
  const profile = row ? toProfile(row) : null
  return {
    step: profile?.onboardingStep ?? null,
    completedAt: profile?.onboardingCompletedAt ?? null,
    profile,
    preferences: toPreferences(prefsRes.data as PreferencesRow | null),
    conditions,
    // Textos livres antigos (008) para o usuário converter em campos estruturados (FR-003).
    suggestions: { goalText: row?.goal ?? null, injuryText: row?.current_injury ?? null },
  }
}

export async function onboardingRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/onboarding', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      return reply.send(await load(auth.user.id, auth.supabase))
    } catch (error) {
      app.log.error(error, 'onboarding: failed to load')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.put('/api/onboarding', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = PutSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    const { step, goal, experience, cardio, availability } = parsed.data
    const goalFields = {
      ...(goal ? { goalPrimary: goal.primary, goalSecondary: goal.secondary ?? null, goalTarget: goal.target ?? null } : {}),
      ...(cardio ? { cardioLikes: cardio.likes, cardioAvoid: cardio.avoid } : {}),
    }
    // Cardio só do catálogo e regras entre campos (mesmas do POST /api/profile).
    const problem = GoalFieldsSchema.safeParse(goalFields).success ? goalFieldsProblem(goalFields) : 'modalidade de cardio fora do catálogo'
    if (problem) return reply.code(400).send({ error: 'Bad Request', details: [{ path: [], message: problem }] })
    try {
      const profileFields: Record<string, unknown> = { onboarding_step: step, ...goalFieldsToRow(goalFields), updated_at: new Date().toISOString() }
      if (goal?.text !== undefined) profileFields.goal = goal.text
      if (experience) {
        profileFields.level = experience.level
        if (experience.trainingTime !== undefined) profileFields.training_time = experience.trainingTime
        if (experience.timeOff !== undefined) profileFields.time_off = experience.timeOff
      }
      const profileRes = await auth.supabase.from('user_training_profile').upsert({ user_id: auth.user.id, ...profileFields }, { onConflict: 'user_id' })
      if (profileRes.error) throw profileRes.error

      if (availability) {
        const prefFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (availability.availableDays !== undefined) prefFields.available_days = availability.availableDays
        if (availability.maxSessionMinutes !== undefined) prefFields.max_session_minutes = availability.maxSessionMinutes
        if (availability.location !== undefined) prefFields.location = availability.location
        if (availability.availableEquipment !== undefined) prefFields.available_equipment = availability.availableEquipment
        const prefsRes = await auth.supabase.from('training_preferences').upsert({ user_id: auth.user.id, ...prefFields }, { onConflict: 'user_id' })
        if (prefsRes.error) throw prefsRes.error
      }
      return reply.send(await load(auth.user.id, auth.supabase))
    } catch (error) {
      app.log.error(error, 'onboarding: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/onboarding/complete', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const current = await load(auth.user.id, auth.supabase)
      const missing = [
        !current.profile?.goalPrimary && 'goalPrimary',
        !current.profile?.level && 'level',
        current.preferences.availableDays.length === 0 && 'availableDays',
      ].filter((m): m is string => !!m)
      if (missing.length > 0) return reply.code(400).send({ error: 'Faltam respostas no onboarding.', code: 'onboarding-incomplete', missing })
      const completedAt = new Date().toISOString()
      const { error } = await auth.supabase.from('user_training_profile').update({ onboarding_completed_at: completedAt }).eq('user_id', auth.user.id)
      if (error) throw error
      return reply.send({ completedAt })
    } catch (error) {
      app.log.error(error, 'onboarding: failed to complete')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

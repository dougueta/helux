import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { REGIONS, type TirednessLevel } from '@helux/types'
import { listConditions } from '../services/conditions.service'
import { regionsToProtect } from '../services/session-checkins.service'
import { authenticate } from './nutrition-auth'

const scale = (max: number) => z.number().int().min(1).max(max)

const Pain = z.object({ region: z.enum(REGIONS), intensity: z.union([z.literal(1), z.literal(2), z.literal(3)]), exercise: z.string().max(120).optional() })

const BodySchema = z
  .object({
    phase: z.enum(['antes', 'depois']),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mesocycleId: z.string().uuid().nullable().optional(),
    sessionIndex: z.number().int().min(0).max(500).nullable().optional(),
    energy: scale(5).optional(),
    sleep: scale(5).optional(),
    motivation: scale(5).optional(),
    rpe: scale(10).optional(),
    feeling: scale(5).optional(),
    pains: z.array(Pain).max(10),
    note: z.string().max(280).nullable().optional(),
  })
  .refine(b => b.phase === 'antes' || (b.energy === undefined && b.sleep === undefined && b.motivation === undefined), { message: 'energia, sono e motivação só no check-in de antes' })
  .refine(b => b.phase === 'depois' || (b.rpe === undefined && b.feeling === undefined), { message: 'esforço e sensação só no check-in de depois' })

/** Energia do check-in de antes → cansaço do dia (spec 011). */
const LEVEL_BY_ENERGY: Record<number, TirednessLevel> = { 1: 'exausto', 2: 'cansado', 3: 'normal', 4: 'normal', 5: 'otimo' }

/** Check-ins de sensação antes e depois do treino (spec 024, FR-017/018). */
export async function sessionCheckinsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/session-checkins', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = BodySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    const b = parsed.data
    try {
      // Um check-in por dia, fase e sessão: o novo substitui o anterior.
      let existing = auth.supabase.from('session_checkins').select('id').eq('user_id', auth.user.id).eq('date', b.date).eq('phase', b.phase)
      // Sem sessão informada, substitui só o check-in também sem sessão (PR #19).
      existing = b.sessionIndex !== undefined && b.sessionIndex !== null ? existing.eq('session_index', b.sessionIndex) : existing.is('session_index', null)
      const found = await existing
      if (found.error) throw found.error
      for (const row of (found.data ?? []) as { id: string }[]) {
        const del = await auth.supabase.from('session_checkins').delete().eq('user_id', auth.user.id).eq('id', row.id)
        if (del.error) throw del.error
      }
      const { data, error } = await auth.supabase
        .from('session_checkins')
        .insert({
          user_id: auth.user.id,
          date: b.date,
          phase: b.phase,
          mesocycle_id: b.mesocycleId ?? null,
          session_index: b.sessionIndex ?? null,
          energy: b.energy ?? null,
          sleep: b.sleep ?? null,
          motivation: b.motivation ?? null,
          rpe: b.rpe ?? null,
          feeling: b.feeling ?? null,
          pains: b.pains,
          note: b.note ?? null,
        })
        .select('*')
        .single()
      if (error) throw error

      if (b.phase === 'depois') return reply.code(201).send({ checkin: data })

      // Energia baixa vira o cansaço do dia, se o usuário ainda não marcou (não sobrescreve escolha manual).
      let tirednessChanged = false
      if (b.energy !== undefined) {
        const signal = await auth.supabase.from('daily_tiredness_signals').select('level').eq('user_id', auth.user.id).eq('date', b.date).maybeSingle()
        if (signal.error) throw signal.error
        if (!signal.data) {
          const saved = await auth.supabase
            .from('daily_tiredness_signals')
            .upsert({ user_id: auth.user.id, date: b.date, level: LEVEL_BY_ENERGY[b.energy], override_automatic: false, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
          if (saved.error) throw saved.error
          // Cansado ou exausto reduz o treino do dia: a tela recarrega antes da primeira série (PR #19).
          tirednessChanged = LEVEL_BY_ENERGY[b.energy] !== 'normal' && LEVEL_BY_ENERGY[b.energy] !== 'otimo'
        }
      }

      const regions = regionsToProtect(b.pains, await listConditions(auth.user.id, auth.supabase))
      return reply.code(201).send({
        checkin: data,
        ...(tirednessChanged ? { tirednessChanged: true } : {}),
        ...(regions.length > 0 ? { adjustment: { regions, reason: `Hoje o treino poupa ${regions.join(' e ')}: os exercícios que carregam essa região foram trocados.` } } : {}),
      })
    } catch (error) {
      app.log.error(error, 'session-checkins: failed to save')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

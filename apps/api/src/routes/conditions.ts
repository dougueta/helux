import type { FastifyInstance, FastifyReply } from 'fastify'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { proposeConditionRules } from '@helux/ai'
import { REGIONS, type HealthCondition } from '@helux/types'
import { CONDITION_CATALOG, findCatalogCondition, rulesFor } from '@helux/workouts'
import { assertBudget, BudgetExceededError, recordUsage } from '../services/ai-budget.service'
import { listConditions, toCondition, type ConditionRow } from '../services/conditions.service'
import { toGuidance, type GuidanceRow } from '../services/agent-rows'
import { authenticate } from './nutrition-auth'

const FLARE_DEFAULT_DAYS = 5
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const CreateSchema = z
  .object({
    catalogKey: z.string().min(1).optional(),
    customLabel: z.string().min(2).max(120).optional(),
    region: z.enum(REGIONS),
    side: z.enum(['esquerdo', 'direito', 'ambos']).nullable().optional(),
    since: date.nullable().optional(),
    count: z.number().int().min(1).max(20).optional(),
    status: z.enum(['ativa', 'controlada', 'resolvida']),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine(c => !!c.catalogKey !== !!c.customLabel, { message: 'informe catalogKey ou customLabel', path: ['catalogKey'] })
  .refine(c => !c.catalogKey || !!findCatalogCondition(c.catalogKey), { message: 'condição fora do catálogo', path: ['catalogKey'] })
  .refine(c => !c.catalogKey || !findCatalogCondition(c.catalogKey) || findCatalogCondition(c.catalogKey)!.regions.includes(c.region), { message: 'região não se aplica à condição', path: ['region'] })

const PatchSchema = z.object({
  side: z.enum(['esquerdo', 'direito', 'ambos']).nullable().optional(),
  since: date.nullable().optional(),
  count: z.number().int().min(1).max(20).optional(),
  status: z.enum(['ativa', 'controlada', 'resolvida']).optional(),
  notes: z.string().max(500).nullable().optional(),
})

const FlareSchema = z.object({ region: z.enum(REGIONS), until: date.optional() })

const withRules = (c: HealthCondition) => ({ ...c, rules: rulesFor(c) })

/** Catálogo com as regras do estado "controlada" na primeira região (para a tela explicar). */
const catalogView = () =>
  CONDITION_CATALOG.map(c => ({
    key: c.key,
    label: c.label,
    regions: c.regions,
    rules: rulesFor({ id: c.key, catalogKey: c.key, customLabel: null, region: c.regions[0], side: null, since: null, count: 1, status: 'controlada', notes: null, flare: null }),
  }))

async function ownCondition(userId: string, id: string, supabase: SupabaseClient, reply: FastifyReply): Promise<HealthCondition | null> {
  const { data, error } = await supabase.from('health_conditions').select('*').eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) {
    await reply.code(404).send({ error: 'Condição não encontrada.' })
    return null
  }
  return toCondition(data as ConditionRow)
}

async function update(userId: string, id: string, fields: Record<string, unknown>, supabase: SupabaseClient): Promise<HealthCondition> {
  const { data, error } = await supabase
    .from('health_conditions')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return toCondition(data as ConditionRow)
}

/** Condições de saúde e cirurgias (spec 024, FR-005..010). */
export async function conditionsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/conditions', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const conditions = await listConditions(auth.user.id, auth.supabase)
      return reply.send({ conditions: conditions.map(withRules), catalog: catalogView() })
    } catch (error) {
      app.log.error(error, 'conditions: failed to list')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post('/api/conditions', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = CreateSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    const c = parsed.data
    try {
      const { data, error } = await auth.supabase
        .from('health_conditions')
        .insert({
          user_id: auth.user.id,
          catalog_key: c.catalogKey ?? null,
          custom_label: c.customLabel ?? null,
          region: c.region,
          side: c.side ?? null,
          since: c.since ?? null,
          count: c.count ?? 1,
          status: c.status,
          notes: c.notes ?? null,
        })
        .select('*')
        .single()
      if (error) throw error
      const condition = toCondition(data as ConditionRow)
      if (condition.catalogKey) return reply.code(201).send({ condition, rules: rulesFor(condition) })

      // "Outra": a Medicina propõe regras; só valem depois do aceite (FR-007).
      try {
        await assertBudget(auth.user.id, auth.supabase)
      } catch (err) {
        if (err instanceof BudgetExceededError) {
          return reply.code(201).send({ condition, proposedGuidance: [], notice: 'O teto mensal de IA foi atingido: as regras desta condição serão propostas quando houver saldo.' })
        }
        throw err
      }
      const { rules, usages } = await proposeConditionRules({ customLabel: condition.customLabel, region: condition.region, side: condition.side, status: condition.status, notes: condition.notes })
      await recordUsage(auth.user.id, usages, auth.supabase)
      const proposedGuidance = []
      for (const rule of rules) {
        const inserted = await auth.supabase
          .from('shared_guidance')
          .insert({
            user_id: auth.user.id,
            kind: 'restricao-seguranca',
            text: rule.text,
            reason: rule.reason,
            origin_agent: 'medicina',
            status: 'pendente',
            blocked_patterns: rule.blockedPatterns,
            blocked_exercises: rule.blockedExercises,
            condition_id: condition.id,
          })
          .select('*')
          .single()
        if (inserted.error) throw inserted.error
        proposedGuidance.push(toGuidance(inserted.data as GuidanceRow))
      }
      return reply.code(201).send({ condition, proposedGuidance, ...(rules.length === 0 ? { notice: 'Não foi possível propor regras para esta condição agora.' } : {}) })
    } catch (error) {
      app.log.error(error, 'conditions: failed to create')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.patch<{ Params: { id: string } }>('/api/conditions/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = PatchSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      if (!(await ownCondition(auth.user.id, request.params.id, auth.supabase, reply))) return
      const p = parsed.data
      const fields: Record<string, unknown> = {}
      if (p.side !== undefined) fields.side = p.side
      if (p.since !== undefined) fields.since = p.since
      if (p.count !== undefined) fields.count = p.count
      if (p.status !== undefined) fields.status = p.status
      if (p.notes !== undefined) fields.notes = p.notes
      const condition = await update(auth.user.id, request.params.id, fields, auth.supabase)
      return reply.send({ condition, rules: rulesFor(condition) })
    } catch (error) {
      app.log.error(error, 'conditions: failed to update')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.delete<{ Params: { id: string } }>('/api/conditions/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      if (!(await ownCondition(auth.user.id, request.params.id, auth.supabase, reply))) return
      // As orientações ligadas saem junto (on delete cascade no banco).
      const { error } = await auth.supabase.from('health_conditions').delete().eq('user_id', auth.user.id).eq('id', request.params.id)
      if (error) throw error
      return reply.code(204).send()
    } catch (error) {
      app.log.error(error, 'conditions: failed to delete')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.post<{ Params: { id: string } }>('/api/conditions/:id/flare', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = FlareSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    try {
      const current = await ownCondition(auth.user.id, request.params.id, auth.supabase, reply)
      if (!current) return
      if (current.catalogKey !== 'gota') return reply.code(400).send({ error: 'Crise só pode ser marcada para gota.', code: 'flare-not-supported' })
      const until = parsed.data.until ?? new Date(Date.now() + FLARE_DEFAULT_DAYS * 86_400_000).toISOString().slice(0, 10)
      const condition = await update(auth.user.id, current.id, { flare_region: parsed.data.region, flare_until: until }, auth.supabase)
      return reply.send({ condition, rules: rulesFor(condition) })
    } catch (error) {
      app.log.error(error, 'conditions: failed to set flare')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.delete<{ Params: { id: string } }>('/api/conditions/:id/flare', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      if (!(await ownCondition(auth.user.id, request.params.id, auth.supabase, reply))) return
      const condition = await update(auth.user.id, request.params.id, { flare_region: null, flare_until: null }, auth.supabase)
      return reply.send({ condition, rules: rulesFor(condition) })
    } catch (error) {
      app.log.error(error, 'conditions: failed to clear flare')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

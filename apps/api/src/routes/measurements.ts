import type { FastifyInstance, FastifyReply } from 'fastify'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { BodyMeasurement, NavyStatus, Sex } from '@helux/types'
import { navyEstimate } from '@helux/nutrition'
import { authenticate } from './nutrition-auth'
import { DATE_RE, isValidDate, localToday } from '../services/local-date'

// Spec 029 (US2): registros de medidas com fita, datados. O % pela fita
// (Marinha) é calculado aqui, com o perfil do momento do registro.

const cm = (min: number, max: number) => z.number().min(min).max(max).nullable().optional()

const MeasurementSchema = z
  .object({
    measured_on: z.string().regex(DATE_RE, 'measured_on must be YYYY-MM-DD').refine(isValidDate, 'invalid date'),
    neck_cm: cm(20, 70),
    waist_cm: cm(30, 300),
    hip_cm: cm(30, 300),
    shoulders_cm: cm(60, 200),
    chest_cm: cm(50, 200),
    arm_left_cm: cm(10, 100),
    arm_right_cm: cm(10, 100),
    leg_left_cm: cm(10, 150),
    leg_right_cm: cm(10, 150),
    calf_left_cm: cm(15, 80),
    calf_right_cm: cm(15, 80),
    body_fat_device_pct: cm(1, 70),
    body_fat_device_source: z.enum(['bioimpedancia', 'adipometro', 'dexa', 'outro']).nullable().optional(),
    squat_kg: cm(0, 1000),
    bench_kg: cm(0, 1000),
    deadlift_kg: cm(0, 1000),
    notes: z.string().max(500).nullable().optional(),
  })
  // body_fat_navy_pct, id e user_id nunca vêm do cliente.
  .strip()
  .refine(v => v.body_fat_device_pct == null || v.body_fat_device_source != null, {
    message: 'body_fat_device_source is required with body_fat_device_pct',
    path: ['body_fat_device_source'],
  })

type MeasurementBody = z.infer<typeof MeasurementSchema>

const ListQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(24) })

const NUMERIC_KEYS = [
  'neck_cm', 'waist_cm', 'hip_cm', 'shoulders_cm', 'chest_cm',
  'arm_left_cm', 'arm_right_cm', 'leg_left_cm', 'leg_right_cm', 'calf_left_cm', 'calf_right_cm',
  'body_fat_navy_pct', 'body_fat_device_pct', 'squat_kg', 'bench_kg', 'deadlift_kg',
] as const

/** Postgres devolve numeric como string; a API sempre responde número. */
export function toMeasurement(row: Record<string, unknown>): BodyMeasurement {
  const out: Record<string, unknown> = { ...row }
  delete out.user_id
  delete out.updated_at
  for (const k of NUMERIC_KEYS) if (out[k] != null) out[k] = Number(out[k])
  return out as unknown as BodyMeasurement
}

function hasContent(body: MeasurementBody): boolean {
  return Object.entries(body).some(([k, v]) => k !== 'measured_on' && v != null && !(typeof v === 'string' && v.trim() === ''))
}

async function withNavy(supabase: SupabaseClient, userId: string, body: MeasurementBody) {
  const { data, error } = await supabase.from('user_training_profile').select('height_cm, sex').eq('user_id', userId).maybeSingle()
  if (error) throw error
  const p = data as { height_cm: number | null; sex: Sex | null } | null
  const { pct, status } = navyEstimate(
    { heightCm: p?.height_cm != null ? Number(p.height_cm) : null, sex: p?.sex ?? null },
    { waistCm: body.waist_cm, neckCm: body.neck_cm, hipCm: body.hip_cm },
  )
  const navy_status: NavyStatus = status
  return { values: { ...body, body_fat_navy_pct: pct, body_fat_device_source: body.body_fat_device_pct == null ? null : body.body_fat_device_source }, navy_status }
}

export async function measurementsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/measurements', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const parsed = ListQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
    const { data, error } = await auth.supabase
      .from('body_checkins')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('measured_on', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(parsed.data.limit)
    if (error) {
      app.log.error(error, 'measurements: list failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
    return reply.send({ measurements: (data ?? []).map(r => toMeasurement(r as Record<string, unknown>)) })
  })

  function parseBody(body: unknown, reply: FastifyReply) {
    const parsed = MeasurementSchema.safeParse(body)
    if (!parsed.success) {
      void reply.code(400).send({ error: 'Bad Request', details: parsed.error.errors })
      return null
    }
    if (parsed.data.measured_on > localToday()) {
      void reply.code(400).send({ error: 'future-date', details: [{ path: ['measured_on'], message: 'date in the future' }] })
      return null
    }
    if (!hasContent(parsed.data)) {
      void reply.code(400).send({ error: 'empty' })
      return null
    }
    return parsed.data
  }

  app.post('/api/measurements', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const body = parseBody(request.body, reply)
    if (!body) return
    try {
      const { values, navy_status } = await withNavy(auth.supabase, auth.user.id, body)
      const { data, error } = await auth.supabase
        .from('body_checkins')
        .insert({ ...values, user_id: auth.user.id })
        .select('*')
        .single()
      if (error) throw error
      return reply.code(201).send({ measurement: toMeasurement(data as Record<string, unknown>), navy_status })
    } catch (error) {
      app.log.error(error, 'measurements: create failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.put<{ Params: { id: string } }>('/api/measurements/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    const body = parseBody(request.body, reply)
    if (!body) return
    try {
      const { data: existing, error: findError } = await auth.supabase
        .from('body_checkins')
        .select('id')
        .eq('id', request.params.id)
        .eq('user_id', auth.user.id)
        .maybeSingle()
      if (findError) throw findError
      if (!existing) return reply.code(404).send({ error: 'Not Found' })

      const { values, navy_status } = await withNavy(auth.supabase, auth.user.id, body)
      // Campos ausentes no corpo viram null: o formulário manda o registro inteiro.
      const full: Record<string, unknown> = { measured_on: values.measured_on, updated_at: new Date().toISOString() }
      for (const k of [...NUMERIC_KEYS, 'body_fat_device_source', 'notes'] as const) full[k] = (values as Record<string, unknown>)[k] ?? null
      const { data, error } = await auth.supabase
        .from('body_checkins')
        .update(full)
        .eq('id', request.params.id)
        .eq('user_id', auth.user.id)
        .select('*')
        .single()
      if (error) throw error
      return reply.send({ measurement: toMeasurement(data as Record<string, unknown>), navy_status })
    } catch (error) {
      app.log.error(error, 'measurements: update failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })

  app.delete<{ Params: { id: string } }>('/api/measurements/:id', async (request, reply) => {
    const auth = await authenticate(request, reply)
    if (!auth) return
    try {
      const { data: existing, error: findError } = await auth.supabase
        .from('body_checkins')
        .select('id')
        .eq('id', request.params.id)
        .eq('user_id', auth.user.id)
        .maybeSingle()
      if (findError) throw findError
      if (!existing) return reply.code(404).send({ error: 'Not Found' })
      const { error } = await auth.supabase.from('body_checkins').delete().eq('id', request.params.id).eq('user_id', auth.user.id)
      if (error) throw error
      return reply.code(204).send()
    } catch (error) {
      app.log.error(error, 'measurements: delete failed')
      return reply.code(500).send({ error: 'Internal Server Error' })
    }
  })
}

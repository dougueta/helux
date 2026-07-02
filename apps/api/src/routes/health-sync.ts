import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { HealthSyncPayloadSchema, HealthSyncSimplePayloadSchema, processSync, processSimpleSync, type HealthSampleRow } from '@helux/health';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { timingSafeEqual, createHash } from 'crypto';

// The complex (array-of-samples) shape is for clients with real HealthKit
// sample data (uuid/startDate/endDate). The simple (flat-number) shape is
// for the iOS Shortcut, which can only realistically produce a single
// aggregated reading per metric per sync — see docs/shortcuts-guide.md.
function isSimplePayload(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  return Object.values(body as Record<string, unknown>).every(
    (v) => typeof v === 'number' || v === undefined,
  );
}

const safeEqual = (a: string, b: string): boolean => {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export async function healthSyncRoutes(app: FastifyInstance): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  const verifyClient = createClient(supabaseUrl, supabaseAnonKey);

  app.post('/api/health/sync', async (request, reply) => {
    let userId: string
    let supabase: SupabaseClient

    const apiKey = request.headers['x-api-key'] as string | undefined
    const personalApiKey = process.env.PERSONAL_API_KEY
    const personalUserId = process.env.PERSONAL_USER_ID

    if (apiKey && personalApiKey && personalUserId && safeEqual(apiKey, personalApiKey)) {
      // iOS Shortcut path — personal API key, no Supabase session/JWT exists.
      // RLS requires auth.uid() = user_id, which only resolves from a real
      // JWT, so this path must use the service role key to bypass RLS —
      // identity here was already verified above via the API key match.
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      }
      userId = personalUserId
      supabase = createClient(supabaseUrl, serviceRoleKey)
    } else {
      // App path — Supabase Bearer token
      const authHeader = request.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
      const token = authHeader.slice(7)
      const { data: { user }, error: authError } = await verifyClient.auth.getUser(token)
      if (authError || !user) {
        return reply.code(401).send({ error: 'Unauthorized' })
      }
      userId = user.id
      // Use user-scoped client so auth.uid() is set and RLS passes
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    }

    let rows: HealthSampleRow[];
    try {
      if (isSimplePayload(request.body)) {
        const payload = HealthSyncSimplePayloadSchema.parse(request.body);
        rows = processSimpleSync(userId, payload);
      } else {
        const payload = HealthSyncPayloadSchema.parse(request.body);
        rows = processSync(userId, payload);
      }
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.code(400).send({ error: 'Bad Request', details: err.errors });
      }
      throw err;
    }

    // Deduplication: ON CONFLICT DO NOTHING ensures idempotent re-syncs (AC2)
    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from('health_samples')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: true });

      if (insertError) {
        app.log.error(insertError, 'health-sync insert error');
        return reply.code(500).send({ error: 'Internal Server Error' });
      }
    }

    return reply.code(202).send({ status: 'accepted', count: rows.length });
  });
}

import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { HealthSyncPayloadSchema, processSync } from '@helux/health';
import { createClient } from '@supabase/supabase-js';

export async function healthSyncRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/health/sync', async (request, reply) => {
    // Extract user from JWT — Supabase JWT has sub as user_id
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    // Validate and decode token via Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // Validate payload
    let payload;
    try {
      payload = HealthSyncPayloadSchema.parse(request.body);
    } catch (err) {
      if (err instanceof ZodError) {
        return reply.code(400).send({ error: 'Bad Request', details: err.errors });
      }
      throw err;
    }

    // Map to DB rows
    const rows = processSync(user.id, payload);

    // Insert with deduplication via ON CONFLICT DO NOTHING
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

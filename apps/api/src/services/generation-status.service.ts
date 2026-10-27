import type { SupabaseClient } from '@supabase/supabase-js'
import type { GenerationErrorCode, GenerationStatus } from '@helux/types'

// Spec 024 (R13, FR-031): estado da geração do mesociclo, para tentar de novo
// sem ficar preso em "gerando" e para mostrar a falha ao usuário.

/** Falhas seguidas antes de parar de tentar sozinho. */
export const MAX_ATTEMPTS = 3
/** "gerando" há mais tempo que isso é tratado como falha (o processo morreu). */
const STALE_MS = 10 * 60_000
/** Teto da coluna `attempts` no banco (check 0–10). */
const MAX_STORED_ATTEMPTS = 10
const nextAttempt = (attempts: number) => Math.min(MAX_STORED_ATTEMPTS, attempts + 1)

interface Row {
  status: GenerationStatus['status']
  attempts: number
  error_code: GenerationErrorCode | null
  started_at: string | null
}

const toStatus = (r: Row): GenerationStatus => ({ status: r.status, attempts: r.attempts, errorCode: r.error_code, startedAt: r.started_at })

export async function getGenerationStatus(userId: string, supabase: SupabaseClient): Promise<GenerationStatus | null> {
  const { data, error } = await supabase.from('mesocycle_generation').select('status, attempts, error_code, started_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ? toStatus(data as Row) : null
}

async function write(userId: string, supabase: SupabaseClient, values: Partial<Row>, now: Date): Promise<void> {
  const { error } = await supabase.from('mesocycle_generation').upsert({ user_id: userId, ...values, updated_at: now.toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

/** Começou a gerar: mantém a contagem de falhas até dar certo (uma geração anterior que expirou conta como falha). */
export async function markGenerating(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<void> {
  const current = await getGenerationStatus(userId, supabase)
  await write(userId, supabase, { status: 'gerando', started_at: now.toISOString(), attempts: current ? effectiveStatus(current, now).attempts : 0, error_code: null }, now)
}

export async function markOk(userId: string, supabase: SupabaseClient, now: Date = new Date()): Promise<void> {
  await write(userId, supabase, { status: 'ok', attempts: 0, error_code: null }, now)
}

export async function markFailed(userId: string, code: GenerationErrorCode, supabase: SupabaseClient, now: Date = new Date()): Promise<void> {
  const current = await getGenerationStatus(userId, supabase)
  await write(userId, supabase, { status: 'falhou', attempts: nextAttempt(current?.attempts ?? 0), error_code: code }, now)
}

/** Estado visto pelo usuário: "gerando" velho demais vira falha. */
export function effectiveStatus(s: GenerationStatus, now: Date = new Date()): GenerationStatus {
  if (s.status === 'gerando' && s.startedAt && now.getTime() - Date.parse(s.startedAt) > STALE_MS) {
    return { ...s, status: 'falhou', attempts: nextAttempt(s.attempts), errorCode: 'unknown' }
  }
  return s
}

/** Pode disparar (de novo) a geração? Nunca enquanto gera; para após MAX_ATTEMPTS falhas. */
export function shouldRetry(s: GenerationStatus | null, now: Date = new Date()): boolean {
  if (!s) return true
  const e = effectiveStatus(s, now)
  if (e.status === 'gerando') return false
  // Geração que expirou conta como falha: o limite vale para ela também (PR #19).
  if (e.status === 'falhou') return e.attempts < MAX_ATTEMPTS
  return true
}

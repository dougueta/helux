import type { SupabaseClient } from '@supabase/supabase-js'
import { parseGeneraJson, parseGeneraTraits } from '@helux/genetics'
import type { GeneticProfileView } from '@helux/types'

// Spec 024 (R14): o laudo genético fica no banco, por usuário (RLS), e não
// mais num arquivo do repositório.

/** O JSON enviado não é um laudo Genera reconhecível. */
export class InvalidGeneticReportError extends Error {
  readonly code = 'invalid-report'
  constructor() {
    super('Laudo genético inválido: envie o JSON do Genera com a seção "fit".')
  }
}

/** JSON bruto do laudo do usuário, ou null. */
export async function getGeneticRaw(userId: string, supabase: SupabaseClient): Promise<unknown | null> {
  const { data, error } = await supabase.from('genetic_reports').select('raw').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return (data as { raw: unknown } | null)?.raw ?? null
}

/** Resumo + marcadores (com força da evidência) do laudo do usuário, ou null. */
export async function getGeneticReport(userId: string, supabase: SupabaseClient): Promise<GeneticProfileView | null> {
  const raw = await getGeneticRaw(userId, supabase)
  return raw ? { ...parseGeneraJson(raw as never), traits: parseGeneraTraits(raw) } : null
}

function isGeneraReport(raw: unknown): boolean {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as { fit?: unknown }).fit === 'object' && (raw as { fit?: unknown }).fit !== null
}

/** Valida e grava (substitui) o laudo do usuário. */
export async function saveGeneticReport(userId: string, raw: unknown, supabase: SupabaseClient): Promise<{ traits: number }> {
  if (!isGeneraReport(raw)) throw new InvalidGeneticReportError()
  const traits = parseGeneraTraits(raw)
  const { error } = await supabase.from('genetic_reports').upsert({ user_id: userId, source: 'genera', raw, uploaded_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
  return { traits: traits.length }
}

export async function deleteGeneticReport(userId: string, supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.from('genetic_reports').delete().eq('user_id', userId)
  if (error) throw error
}

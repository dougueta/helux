import type { SupabaseClient } from '@supabase/supabase-js'
import type { HealthCondition, Joint, PainReport } from '@helux/types'

// Spec 024 (FR-017/018): dor relatada antes do treino protege a articulação na sessão do dia.

const JOINTS: readonly Joint[] = ['joelho', 'ombro', 'lombar']
const isJoint = (r: string): r is Joint => (JOINTS as readonly string[]).includes(r)

/** Articulações a poupar hoje: dor forte (≥ 2) ou dor numa região com condição registrada. */
export function regionsToProtect(pains: PainReport[], conditions: HealthCondition[]): Joint[] {
  const withCondition = new Set(conditions.filter(c => c.status !== 'resolvida').map(c => c.region as string))
  const regions = pains.filter(p => p.intensity >= 2 || withCondition.has(p.region)).map(p => p.region as string)
  return [...new Set(regions)].filter(isJoint)
}

/** Dores do check-in de antes do treino de hoje. */
export async function getTodayPains(userId: string, supabase: SupabaseClient, date: string): Promise<PainReport[]> {
  const { data, error } = await supabase.from('session_checkins').select('pains').eq('user_id', userId).eq('date', date).eq('phase', 'antes')
  if (error) throw error
  return ((data ?? []) as { pains: PainReport[] | null }[]).flatMap(r => r.pains ?? [])
}

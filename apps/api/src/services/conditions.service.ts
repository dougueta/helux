import type { SupabaseClient } from '@supabase/supabase-js'
import type { HealthCondition, Region } from '@helux/types'

// Spec 024 (FR-005..009): condições de saúde e cirurgias do usuário.

export interface ConditionRow {
  id: string
  user_id?: string
  catalog_key: string | null
  custom_label: string | null
  region: Region
  side: HealthCondition['side']
  since: string | null
  count: number
  status: HealthCondition['status']
  notes: string | null
  flare_region: Region | null
  flare_until: string | null
}

export function toCondition(row: ConditionRow): HealthCondition {
  return {
    id: row.id,
    catalogKey: row.catalog_key,
    customLabel: row.custom_label,
    region: row.region,
    side: row.side ?? null,
    since: row.since ?? null,
    count: row.count ?? 1,
    status: row.status,
    notes: row.notes ?? null,
    flare: row.flare_region && row.flare_until ? { region: row.flare_region, until: row.flare_until } : null,
  }
}

export async function listConditions(userId: string, supabase: SupabaseClient): Promise<HealthCondition[]> {
  const { data, error } = await supabase.from('health_conditions').select('*').eq('user_id', userId).order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as ConditionRow[]).map(toCondition)
}

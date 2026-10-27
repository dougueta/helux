import type { SupabaseClient } from '@supabase/supabase-js'

// Spec 024 (FR-001/002): o próximo mesociclo só é gerado depois do onboarding.

export async function isOnboardingComplete(userId: string, supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.from('user_training_profile').select('onboarding_completed_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return !!(data as { onboarding_completed_at: string | null } | null)?.onboarding_completed_at
}

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Shell } from '@/components/layout/Shell'
import { NutricaoClient } from './NutricaoClient'

export default async function NutricaoPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Nutrição esportiva genética
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Nutrição
      </h1>
      <NutricaoClient />
    </Shell>
  )
}

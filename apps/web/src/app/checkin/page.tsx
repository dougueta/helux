import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Shell } from '@/components/layout/Shell'
import { CheckinForm } from '@/components/checkin/CheckinForm'

export default async function CheckinPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Mensal</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Check-in
          </h1>
        </div>
        <Link href="/checkin/history" className="hx-btn hx-btn--ghost">
          Histórico
        </Link>
      </header>
      <CheckinForm />
    </Shell>
  )
}

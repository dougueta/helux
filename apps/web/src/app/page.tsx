import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { HomeClient } from './HomeClient'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getLatestPlan() {
  try {
    const res = await fetch(`${API}/workout/latest-plan`, { next: { revalidate: 300 } })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getRecovery(token: string) {
  try {
    const res = await fetch(`${API}/api/recovery/latest`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getGeneticInsight() {
  try {
    const res = await fetch(`${API}/genetic-profile`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const p = await res.json()
    if (p?.drivers?.[0]) return p.drivers[0]
    return null
  } catch { return null }
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [plan, recovery, insight] = await Promise.all([
    getLatestPlan(),
    getRecovery(session.access_token),
    getGeneticInsight(),
  ])

  const firstName = session.user.email?.split('@')[0] ?? 'atleta'

  return (
    <HomeClient
      plan={plan}
      recovery={recovery}
      insight={insight}
      firstName={firstName}
    />
  )
}

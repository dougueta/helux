import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { HomeClient } from './HomeClient'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getLatestPlan(token: string) {
  try {
    const res = await fetch(`${API}/workout/latest-plan`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

async function getLatestCheckins(token: string) {
  try {
    const res = await fetch(`${API}/api/checkins?limit=2`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.checkins ?? []
  } catch { return [] }
}

async function getAnalytics(token: string) {
  try {
    const res = await fetch(`${API}/api/workouts/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [plan, checkinsRaw, analytics] = await Promise.all([
    getLatestPlan(session.access_token),
    getLatestCheckins(session.access_token),
    getAnalytics(session.access_token),
  ])

  const checkins = checkinsRaw.sort((a: { month: string }, b: { month: string }) => b.month.localeCompare(a.month))

  const firstName = session.user.email?.split('@')[0] ?? 'atleta'

  return (
    <HomeClient
      plan={plan}
      firstName={firstName}
      checkins={checkins}
      analytics={analytics}
    />
  )
}

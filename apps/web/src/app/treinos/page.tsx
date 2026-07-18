// apps/web/src/app/treinos/page.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { TreinosClient } from './TreinosClient'

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

async function getRecentHistory(token: string) {
  try {
    const res = await fetch(`${API}/api/workouts/history?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions ?? []
  } catch { return [] }
}

export default async function TreinosPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [plan, recentSessions] = await Promise.all([
    getLatestPlan(session.access_token),
    getRecentHistory(session.access_token),
  ])

  return <TreinosClient plan={plan} recentSessions={recentSessions} />
}

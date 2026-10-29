// apps/web/src/app/treinos/page.tsx
import { redirect } from 'next/navigation'
import { getLatestPlan, serverFetch } from '@/lib/server-api'
import { getServerSession } from '@/lib/server-session'
import { TreinosClient } from './TreinosClient'


async function getRecentHistory(token: string) {
  try {
    const res = await serverFetch(`/api/workouts/history?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions ?? []
  } catch { return [] }
}

export default async function TreinosPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const [plan, recentSessions] = await Promise.all([
    getLatestPlan(session.access_token),
    getRecentHistory(session.access_token),
  ])

  return <TreinosClient plan={plan} recentSessions={recentSessions} />
}

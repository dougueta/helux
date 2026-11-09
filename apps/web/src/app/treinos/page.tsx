// apps/web/src/app/treinos/page.tsx
import { redirect } from 'next/navigation'
import type { ComplementaryRoutinesView } from '@helux/types'
import { getLatestPlan, serverFetch } from '@/lib/server-api'
import { getServerSession } from '@/lib/server-session'
import { TreinosClient } from './TreinosClient'

async function getRecentHistory(token: string) {
  try {
    const res = await serverFetch(`/api/workouts/history?limit=3`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions ?? []
  } catch {
    return []
  }
}

async function getRoutinesViewServer(token: string): Promise<ComplementaryRoutinesView | null> {
  try {
    const res = await serverFetch(`/api/routines?days=30`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    })
    return res.ok ? ((await res.json()) as ComplementaryRoutinesView) : null
  } catch {
    return null
  }
}

export default async function TreinosPage({
  searchParams,
}: {
  searchParams?: { aba?: string }
}) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const [plan, recentSessions, routinesView] = await Promise.all([
    getLatestPlan(session.access_token),
    getRecentHistory(session.access_token),
    getRoutinesViewServer(session.access_token),
  ])

  const initialTab = searchParams?.aba === 'rotinas' ? 'rotinas' : 'academia'

  return (
    <TreinosClient
      plan={plan}
      recentSessions={recentSessions}
      routinesView={routinesView}
      initialTab={initialTab}
    />
  )
}

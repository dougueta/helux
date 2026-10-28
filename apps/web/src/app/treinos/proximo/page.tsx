// apps/web/src/app/treinos/proximo/page.tsx
import { redirect } from 'next/navigation'
import { serverFetch } from '@/lib/server-api'
import { getServerSession } from '@/lib/server-session'
import { ProximoTreinoClient } from './ProximoTreinoClient'

async function getLatestPlan(token: string) {
  try {
    const res = await serverFetch(`/workout/latest-plan`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

/** Preview do próximo treino (spec 026, US2). */
export default async function ProximoTreinoPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const plan = await getLatestPlan(session.access_token)
  return <ProximoTreinoClient plan={plan} />
}

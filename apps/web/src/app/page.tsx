import { redirect } from 'next/navigation'
import { getLatestPlan, serverFetch } from '@/lib/server-api'
import { getServerSession } from '@/lib/server-session'
import { HomeClient } from './HomeClient'


/** Spec 029: pesagens dos últimos 30 dias e os 2 últimos registros de medidas. */
async function getBody(token: string) {
  const get = async (path: string, key: string) => {
    try {
      const res = await serverFetch(path, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } })
      if (!res.ok) return []
      const data = await res.json()
      return data[key] ?? []
    } catch {
      return []
    }
  }
  const [weights, measurements] = await Promise.all([get('/api/weights?days=30', 'weights'), get('/api/measurements?limit=2', 'measurements')])
  return { weights, measurements }
}

async function getAnalytics(token: string) {
  try {
    const res = await serverFetch(`/api/workouts/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 300 }
    })
    return res.ok ? res.json() : null
  } catch { return null }
}

export default async function HomePage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const [plan, body, analytics] = await Promise.all([
    getLatestPlan(session.access_token),
    getBody(session.access_token),
    getAnalytics(session.access_token),
  ])

  const firstName = session.user.email?.split('@')[0] ?? 'atleta'

  return (
    <HomeClient
      plan={plan}
      firstName={firstName}
      weights={body.weights}
      measurements={body.measurements}
      analytics={analytics}
    />
  )
}

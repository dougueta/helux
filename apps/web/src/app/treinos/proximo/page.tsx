// apps/web/src/app/treinos/proximo/page.tsx
import { redirect } from 'next/navigation'
import { getLatestPlan } from '@/lib/server-api'
import { getServerSession } from '@/lib/server-session'
import { ProximoTreinoClient } from './ProximoTreinoClient'

/** Preview do próximo treino (spec 026, US2). */
export default async function ProximoTreinoPage({ searchParams }: { searchParams?: { de?: string } }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const plan = await getLatestPlan(session.access_token)
  return <ProximoTreinoClient plan={plan} from={searchParams?.de} />
}

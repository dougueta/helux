import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Antes do próximo ciclo
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Vamos montar seu treino
      </h1>
      <OnboardingClient />
    </Shell>
  )
}

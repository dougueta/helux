import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { IntegratedProfileView } from '@/components/agents/IntegratedProfileView'

export default async function PerfilIntegradoPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Equipe Helux
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Perfil Integrado
      </h1>
      <IntegratedProfileView />
    </Shell>
  )
}

import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { PreferenciasClient } from './PreferenciasClient'

export default async function PreferenciasPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Agente de Treino
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Preferências de treino
      </h1>
      <PreferenciasClient />
    </Shell>
  )
}

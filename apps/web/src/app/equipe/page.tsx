import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { EquipeClient } from './EquipeClient'

export default async function EquipePage({ searchParams }: { searchParams?: { agente?: string } }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Treino · Medicina Esportiva · Nutrição Genética
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Equipe Helux
      </h1>
      <EquipeClient initial={searchParams?.agente ?? null} />
    </Shell>
  )
}

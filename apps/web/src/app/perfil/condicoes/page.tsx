import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { ConditionsEditor } from '@/components/conditions/ConditionsEditor'

export default async function CondicoesPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Saúde
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Condições e cirurgias
      </h1>
      <p className="t-secondary" style={{ marginTop: 8 }}>
        Cada condição vira regras que o app confere em todo treino. O Helux não substitui seu médico.
      </p>
      <ConditionsEditor />
    </Shell>
  )
}

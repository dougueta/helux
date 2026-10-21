import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { CheckinForm } from '@/components/checkin/CheckinForm'

// Spec 018: de onde o usuário veio e para onde volta depois de salvar (só destinos conhecidos).
const RETURN_TO: Record<string, string> = { nutricao: '/nutricao' }

export default async function CheckinPage({ searchParams }: { searchParams?: { voltar?: string } }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Mensal</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Check-in
          </h1>
        </div>
        <Link href="/checkin/history" className="hx-btn hx-btn--ghost">
          Histórico
        </Link>
      </header>
      <CheckinForm returnTo={searchParams?.voltar ? RETURN_TO[searchParams.voltar] : undefined} />
    </Shell>
  )
}

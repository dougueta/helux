import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { WeightForm } from '@/components/checkin/WeightForm'

// Spec 029 (US1): registrar (ou corrigir, com ?data=YYYY-MM-DD) uma pesagem.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
// Spec 018/029: de onde o usuário veio e para onde volta depois de salvar (só destinos conhecidos).
const RETURN_TO: Record<string, string> = { nutricao: '/nutricao' }

export default async function WeightPage({ searchParams }: { searchParams?: { data?: string; voltar?: string } }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  const date = searchParams?.data && DATE_RE.test(searchParams.data) ? searchParams.data : undefined

  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Check-in</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Registrar peso
          </h1>
        </div>
        <Link href="/checkin" className="hx-btn hx-btn--ghost">
          Voltar
        </Link>
      </header>
      <WeightForm
        initialDate={date}
        returnTo={(searchParams?.voltar && RETURN_TO[searchParams.voltar]) || (date ? '/checkin/history' : '/checkin')}
      />
    </Shell>
  )
}

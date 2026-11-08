import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { MeasurementFormWithGuide } from '@/components/checkin/MeasurementFormWithGuide'

// Spec 018: de onde o usuário veio e para onde volta depois de salvar (só destinos conhecidos).
const RETURN_TO: Record<string, string> = { nutricao: '/nutricao' }

export default async function MeasurementsPage({ searchParams }: { searchParams?: { voltar?: string } }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <div>
          <p className="t-secondary">Check-in</p>
          <h1 className="t-display" style={{ marginTop: 4 }}>
            Registrar medidas
          </h1>
        </div>
        <Link href="/checkin" className="hx-btn hx-btn--ghost">
          Voltar
        </Link>
      </header>
      <MeasurementFormWithGuide returnTo={searchParams?.voltar ? RETURN_TO[searchParams.voltar] : undefined} />
    </Shell>
  )
}

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { CheckinHome } from '@/components/checkin/CheckinHome'

// Spec 029: resumo — peso de tendência, últimas medidas e os dois registros.

export default async function CheckinPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 20 }}>
        <h1 className="t-display">Check-in</h1>
        <Link href="/checkin/history" className="hx-btn hx-btn--ghost">
          Histórico
        </Link>
      </header>
      <CheckinHome />
    </Shell>
  )
}

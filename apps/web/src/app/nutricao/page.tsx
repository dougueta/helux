import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { NutricaoClient } from './NutricaoClient'

export default async function NutricaoPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Nutrição esportiva genética
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Nutrição
      </h1>
      <NutricaoClient />
    </Shell>
  )
}

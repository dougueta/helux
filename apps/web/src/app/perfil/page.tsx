import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Shell } from '@/components/layout/Shell'
import { PerfilClient } from './PerfilClient'

export default async function PerfilPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <div className="max-w-lg mx-auto" style={{ paddingBottom: 96 }}>
        <header style={{ padding: '48px 16px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 4 }}>
            Situacional
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Perfil de treino
          </h1>
        </header>
        <PerfilClient />
      </div>
    </Shell>
  )
}

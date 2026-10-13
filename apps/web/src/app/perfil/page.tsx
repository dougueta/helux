import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Shell } from '@/components/layout/Shell'
import { Icon } from '@/components/ui/icons'
import { PerfilClient } from './PerfilClient'

export default async function PerfilPage() {
  const supabase = createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  return (
    <Shell>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Situacional
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Perfil de treino
      </h1>

      <div className="hx-card" style={{ marginTop: 20, overflow: 'hidden' }}>
        <Link href="/dna" className="hx-row-btn">
          <span style={{ width: 40, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            <Icon name="dna" size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t-body-m" style={{ display: 'block' }}>
              Seu DNA
            </span>
            <span className="t-secondary">Marcadores genéticos do teste Genera</span>
          </span>
          <span className="dim">
            <Icon name="chev" size={20} />
          </span>
        </Link>
      </div>

      <PerfilClient />
    </Shell>
  )
}

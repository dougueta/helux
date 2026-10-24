import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server-session'
import { Shell } from '@/components/layout/Shell'
import { Icon } from '@/components/ui/icons'
import { PerfilClient } from './PerfilClient'
import { GeneticReportUpload } from '@/components/perfil/GeneticReportUpload'

export default async function PerfilPage() {
  const session = await getServerSession()
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
        <Link href="/perfil/integrado" className="hx-row-btn">
          <span style={{ width: 40, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            <Icon name="user" size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t-body-m" style={{ display: 'block' }}>
              Perfil Integrado
            </span>
            <span className="t-secondary">O que os agentes sabem sobre você e o teto de IA</span>
          </span>
          <span className="dim">
            <Icon name="chev" size={20} />
          </span>
        </Link>
        <Link href="/perfil/preferencias" className="hx-row-btn">
          <span style={{ width: 40, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            <Icon name="dumbbell" size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t-body-m" style={{ display: 'block' }}>
              Preferências de treino
            </span>
            <span className="t-secondary">Dias, duração, equipamentos e o que evitar</span>
          </span>
          <span className="dim">
            <Icon name="chev" size={20} />
          </span>
        </Link>
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
      <GeneticReportUpload />
    </Shell>
  )
}

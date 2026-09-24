import Link from 'next/link'
import { Icon } from '@/components/ui/icons'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { DnaClient } from './DnaClient'

async function getGeneticProfile() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/genetic-profile`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export default async function DnaPage() {
  const profile = await getGeneticProfile()

  return (
    <div style={{ maxWidth: 'var(--col)', margin: '0 auto', paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 120 }}>
      <ScreenHeader
        left={
          <Link href="/perfil" className="hx-icbtn hx-icbtn--bare" aria-label="voltar">
            <Icon name="back" size={22} />
          </Link>
        }
        title="Perfil"
      />
      <div style={{ padding: '0 16px' }}>
        <h1 className="t-display" style={{ marginTop: 8 }}>
          Seu DNA
        </h1>
        <DnaClient profile={profile} />
      </div>
    </div>
  )
}

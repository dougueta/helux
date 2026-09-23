import { DnaClient } from './DnaClient'
import { pageContainer } from '@/components/ui/layout'

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
    <div style={{ ...pageContainer, paddingTop: 48, paddingBottom: 96 }}>
      <header style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
          Perfil Helux
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          Seu DNA
        </h1>
      </header>
      <DnaClient profile={profile} />
    </div>
  )
}

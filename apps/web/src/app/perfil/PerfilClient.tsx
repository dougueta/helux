'use client'

import { useProfile } from '@/hooks/useProfile'
import { ProfileForm } from '@/components/perfil/ProfileForm'

export function PerfilClient() {
  const { profile, loading, saving, save } = useProfile()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <p style={{ color: 'var(--text-faint)', fontSize: 14 }}>Carregando…</p>
      </div>
    )
  }

  return <ProfileForm initial={profile} saving={saving} onSave={async (input) => { await save(input) }} />
}

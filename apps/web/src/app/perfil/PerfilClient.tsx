'use client'

import { useProfile } from '@/hooks/useProfile'
import { ProfileForm } from '@/components/perfil/ProfileForm'
import { Skeleton } from '@/components/ui/Skeleton'

export function PerfilClient() {
  const { profile, loading, saving, save } = useProfile()

  if (loading) {
    return (
      <div aria-busy="true" aria-label="carregando perfil">
        {[0, 1, 2].map(i => (
          <Skeleton key={i} h={74} style={{ marginTop: i ? 16 : 28 }} />
        ))}
      </div>
    )
  }

  return <ProfileForm initial={profile} saving={saving} onSave={async (input) => { await save(input) }} />
}

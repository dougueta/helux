'use client'

import { Button } from '@/components/ui/Button'
import { HelixMark } from '@/components/ui/icons'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient()

  async function handleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main
      className="hx-page"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 'var(--safe-b)' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 24, letterSpacing: '-.02em' }}>
        <HelixMark size={30} />
        helux
      </span>
      <h1 className="t-display" style={{ marginTop: 24 }}>
        Seu treino personalizado
      </h1>
      <p className="t-body dim" style={{ marginTop: 8 }}>
        Entre para ver o treino de hoje.
      </p>
      <div style={{ marginTop: 32 }}>
        <Button kind="primary" size="lg" block onClick={handleLogin}>
          Entrar com Google
        </Button>
      </div>
    </main>
  )
}

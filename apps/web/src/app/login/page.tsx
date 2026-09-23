'use client'

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
    <main style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 36, lineHeight: '40px', fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.025em' }}>
          HELUX
        </h1>
        <p style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 14, lineHeight: '20px' }}>
          Seu treino personalizado
        </p>
      </div>

      <button
        onClick={handleLogin}
        style={{
          width: '100%', maxWidth: 320, padding: '16px 24px', borderRadius: 'var(--r-sm)',
          background: 'var(--accent)', color: 'var(--accent-ink)',
          fontWeight: 600, fontSize: 16, lineHeight: '24px',
        }}
      >
        Entrar com Google
      </button>
    </main>
  )
}

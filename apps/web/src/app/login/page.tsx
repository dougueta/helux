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
    <main className="min-h-screen bg-helux-dark flex flex-col items-center justify-center px-6">
      <div className="mb-12 text-center">
        <h1 className="font-mono text-4xl font-bold text-helux-accent tracking-tight">
          HELUX
        </h1>
        <p className="mt-2 text-helux-muted text-sm">
          Seu treino personalizado
        </p>
      </div>

      <button
        onClick={handleLogin}
        className="w-full max-w-xs bg-helux-accent text-helux-dark font-sans font-semibold py-4 px-6 rounded-xl text-base active:scale-95 transition-transform"
      >
        Entrar com Google
      </button>
    </main>
  )
}

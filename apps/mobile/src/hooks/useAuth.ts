import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthService, supabase } from '../services/auth.service'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    AuthService.getSession()
      .then(s => { if (mounted) setSession(s) })
      .finally(() => { if (mounted) setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (mounted) setSession(s)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async () => {
    const session = await AuthService.signInWithGoogle()
    setSession(session)
  }

  const signOut = async () => {
    await AuthService.signOut()
    setSession(null)
  }

  return { session, loading, signIn, signOut }
}

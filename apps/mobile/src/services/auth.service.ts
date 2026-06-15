import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const AuthService = {
  async signInWithGoogle(): Promise<Session> {
    const redirectUrl = makeRedirectUri({ scheme: 'helux', path: 'auth/callback' })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
    })

    if (error || !data.url) throw error ?? new Error('OAuth URL não disponível')

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

    if (result.type !== 'success') throw new Error('Login cancelado')

    const hash = new URL(result.url).hash.slice(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) throw new Error('Tokens ausentes no redirect')

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) throw sessionError
    return sessionData.session!
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut()
  },

  async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  async getAccessToken(): Promise<string> {
    const session = await AuthService.getSession()
    if (!session) throw new Error('Usuário não autenticado')
    return session.access_token
  },
}

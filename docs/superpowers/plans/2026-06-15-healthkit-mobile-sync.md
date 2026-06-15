# HealthKit Mobile Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar coleta de dados HealthKit no app mobile com autenticação Google, sync manual para o backend, e exibição de HRV + FC de repouso no RecoveryCard.

**Architecture:** Camada de serviços em `apps/mobile/src/services/` com `IHealthKitAdapter` (interface + Mock + stub Native), `AuthService` (Google OAuth via Supabase + expo-auth-session), e `syncHealthData()` que lê o HealthKit, persiste em AsyncStorage e envia para `POST /api/health/sync`. Hooks React finos consomem os serviços. UI: guarda de auth em `_layout.tsx`, tela de login, botão sync na topbar, RecoveryCard com dados reais.

**Tech Stack:** TypeScript, Expo Router, `@supabase/supabase-js`, `expo-auth-session`, `expo-web-browser`, `@react-native-async-storage/async-storage` (já instalado), `@helux/health` (HealthSyncPayload), `@helux/types` (RecoveryData), Vitest para testes de serviços.

---

## Mapeamento de Arquivos

**Novos:**
- `apps/mobile/src/services/healthkit.adapter.ts` — Interface + MockAdapter + NativeAdapter (stub)
- `apps/mobile/src/services/healthkit.ts` — singleton que seleciona impl mock vs native
- `apps/mobile/src/services/auth.service.ts` — Supabase client, Google OAuth, getAccessToken
- `apps/mobile/src/services/health-sync.service.ts` — orquestra leitura → AsyncStorage → POST API
- `apps/mobile/src/hooks/useAuth.ts` — estado de sessão, signIn, signOut
- `apps/mobile/src/hooks/useRecoveryData.ts` — lê RecoveryData do AsyncStorage
- `apps/mobile/src/hooks/useHealthSync.ts` — trigger sync, loading state
- `apps/mobile/app/login.tsx` — tela de login com botão Google
- `apps/mobile/src/__tests__/healthkit.adapter.test.ts`
- `apps/mobile/src/__tests__/health-sync.service.test.ts`
- `apps/mobile/vitest.config.ts`
- `apps/mobile/.env` (gitignored)

**Modificados:**
- `apps/mobile/package.json` — novas deps + `@helux/types` + vitest
- `apps/mobile/app/_layout.tsx` — guarda de auth + `Stack.Screen` para login
- `apps/mobile/app/(tabs)/index.tsx` — botão sync na topbar + RecoveryCard com dados reais
- `apps/mobile/src/components/home/RecoveryCard.tsx` — props mudam de `value: number` para `data: RecoveryData | null`

---

### Tarefa 1: Instalar dependências e configurar ambiente de testes

**Files:**
- Modify: `apps/mobile/package.json`
- Create: `apps/mobile/vitest.config.ts`
- Create: `apps/mobile/.env`

- [ ] **Passo 1: Adicionar dependências ao `apps/mobile/package.json`**

Adicione em `dependencies`:
```json
"@helux/types": "workspace:*",
"@supabase/supabase-js": "^2.49.1",
"expo-auth-session": "~6.1.5",
"expo-web-browser": "~14.1.6"
```

Adicione em `devDependencies`:
```json
"vitest": "^3.2.6"
```

Adicione em `scripts`:
```json
"test": "vitest run"
```

- [ ] **Passo 2: Instalar dependências**

```bash
cd apps/mobile
pnpm install
```

Esperado: `Done in Xs`

- [ ] **Passo 3: Criar `apps/mobile/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
})
```

- [ ] **Passo 4: Criar `apps/mobile/.env`**

```
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> ⚠️ Preencher com valores reais do Supabase dashboard antes de testar E2E. O `.env` já está no `.gitignore` raiz via `**/.env`.

- [ ] **Passo 5: Verificar que vitest roda sem erro**

```bash
pnpm --filter @helux/mobile test
```

Esperado: `Test Files 0 passed (0)` — sem erro, sem testes ainda.

- [ ] **Passo 6: Commit**

```bash
git add apps/mobile/package.json apps/mobile/vitest.config.ts pnpm-lock.yaml
git commit -m "chore: add supabase, auth-session and vitest to mobile"
```

---

### Tarefa 2: HealthKit Adapter (Interface + Mock + NativeStub)

**Files:**
- Create: `apps/mobile/src/services/healthkit.adapter.ts`
- Create: `apps/mobile/src/services/healthkit.ts`
- Create: `apps/mobile/src/__tests__/healthkit.adapter.test.ts`

- [ ] **Passo 1: Escrever o teste antes da implementação**

Criar `apps/mobile/src/__tests__/healthkit.adapter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { MockHealthKitAdapter } from '../services/healthkit.adapter'

describe('MockHealthKitAdapter', () => {
  const adapter = new MockHealthKitAdapter()
  const from = new Date('2026-06-15T00:00:00Z')
  const to = new Date('2026-06-15T23:59:59Z')

  it('requestPermissions resolves without error', async () => {
    await expect(adapter.requestPermissions()).resolves.toBeUndefined()
  })

  it('readSamples returns heartRate, steps and hrv arrays', async () => {
    const payload = await adapter.readSamples(from, to)
    expect(Array.isArray(payload.heartRate)).toBe(true)
    expect(Array.isArray(payload.steps)).toBe(true)
    expect(Array.isArray(payload.hrv)).toBe(true)
  })

  it('readSamples heartRate samples have required fields', async () => {
    const payload = await adapter.readSamples(from, to)
    const sample = payload.heartRate![0]
    expect(sample).toMatchObject({
      uuid: expect.any(String),
      value: expect.any(Number),
      unit: 'bpm',
      startDate: expect.any(String),
      endDate: expect.any(String),
    })
  })

  it('readRecovery returns valid RecoveryData', async () => {
    const recovery = await adapter.readRecovery(from, to)
    expect(recovery).toMatchObject({
      date: expect.any(String),
      hrv: expect.any(Number),
      restingHR: expect.any(Number),
      activeCalories: expect.any(Number),
      source: 'healthkit',
    })
    expect(recovery.hrv).toBeGreaterThan(0)
    expect(recovery.restingHR).toBeGreaterThan(0)
  })
})
```

- [ ] **Passo 2: Rodar para confirmar falha**

```bash
pnpm --filter @helux/mobile test
```

Esperado: `FAIL — Cannot find module '../services/healthkit.adapter'`

- [ ] **Passo 3: Criar `apps/mobile/src/services/healthkit.adapter.ts`**

```typescript
import type { HealthSyncPayload } from '@helux/health'
import type { RecoveryData } from '@helux/types'

export interface IHealthKitAdapter {
  requestPermissions(): Promise<void>
  readSamples(from: Date, to: Date): Promise<HealthSyncPayload>
  readRecovery(from: Date, to: Date): Promise<RecoveryData>
}

export class MockHealthKitAdapter implements IHealthKitAdapter {
  async requestPermissions(): Promise<void> {}

  async readSamples(from: Date, to: Date): Promise<HealthSyncPayload> {
    const startDate = from.toISOString()
    const endDate = to.toISOString()
    return {
      heartRate: [
        { uuid: 'mock-hr-001', value: 62, unit: 'bpm', startDate, endDate },
        { uuid: 'mock-hr-002', value: 58, unit: 'bpm', startDate, endDate },
        { uuid: 'mock-hr-003', value: 71, unit: 'bpm', startDate, endDate },
      ],
      steps: [
        { uuid: 'mock-steps-001', value: 3240, unit: 'count', startDate, endDate },
      ],
      hrv: [
        { uuid: 'mock-hrv-001', value: 52, unit: 'ms', startDate, endDate },
        { uuid: 'mock-hrv-002', value: 48, unit: 'ms', startDate, endDate },
      ],
    }
  }

  async readRecovery(from: Date, to: Date): Promise<RecoveryData> {
    return {
      date: from.toISOString().split('T')[0],
      hrv: 52,
      restingHR: 58,
      activeCalories: 420,
      source: 'healthkit',
    }
  }
}

// NativeHealthKitAdapter é um stub — retorna os mesmos dados do Mock.
// A implementação nativa com react-native-health é adicionada quando
// o ambiente de build (expo-dev-client) for definido.
export class NativeHealthKitAdapter extends MockHealthKitAdapter {}
```

- [ ] **Passo 4: Criar `apps/mobile/src/services/healthkit.ts`**

```typescript
import { MockHealthKitAdapter, NativeHealthKitAdapter } from './healthkit.adapter'
import type { IHealthKitAdapter } from './healthkit.adapter'

// Platform não está disponível em testes Node. Guard com typeof.
const isNativeIOS =
  typeof navigator !== 'undefined' &&
  typeof __DEV__ !== 'undefined' &&
  !__DEV__

export const healthKit: IHealthKitAdapter = isNativeIOS
  ? new NativeHealthKitAdapter()
  : new MockHealthKitAdapter()
```

- [ ] **Passo 5: Rodar testes para confirmar verde**

```bash
pnpm --filter @helux/mobile test
```

Esperado: `Test Files 1 passed (1) | Tests 4 passed (4)`

- [ ] **Passo 6: Commit**

```bash
git add apps/mobile/src/services/healthkit.adapter.ts apps/mobile/src/services/healthkit.ts apps/mobile/src/__tests__/healthkit.adapter.test.ts
git commit -m "feat: add healthkit adapter with mock and native stub"
```

---

### Tarefa 3: HealthSyncService

**Files:**
- Create: `apps/mobile/src/services/health-sync.service.ts`
- Create: `apps/mobile/src/__tests__/health-sync.service.test.ts`

- [ ] **Passo 1: Escrever teste antes da implementação**

Criar `apps/mobile/src/__tests__/health-sync.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
  },
}))

vi.mock('../services/healthkit', () => ({
  healthKit: {
    requestPermissions: vi.fn().mockResolvedValue(undefined),
    readSamples: vi.fn().mockResolvedValue({
      heartRate: [{ uuid: 'hr-1', value: 65, unit: 'bpm', startDate: '2026-06-15T08:00:00Z', endDate: '2026-06-15T08:00:00Z' }],
      steps: [],
      hrv: [],
    }),
    readRecovery: vi.fn().mockResolvedValue({
      date: '2026-06-15',
      hrv: 52,
      restingHR: 58,
      activeCalories: 420,
      source: 'healthkit',
    }),
  },
}))

const mockFetch = vi.fn().mockResolvedValue({ ok: true })
global.fetch = mockFetch

import { syncHealthData } from '../services/health-sync.service'
import AsyncStorage from '@react-native-async-storage/async-storage'

describe('syncHealthData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true })
  })

  it('salva recovery no AsyncStorage', async () => {
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:recovery-data',
      expect.stringContaining('"hrv":52')
    )
  })

  it('salva last-sync-at no AsyncStorage', async () => {
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:last-sync-at',
      expect.any(String)
    )
  })

  it('faz POST para /api/health/sync com o token correto', async () => {
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/health/sync',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      })
    )
  })

  it('retorna SyncResult com recovery e syncedAt', async () => {
    const result = await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(result.recovery.hrv).toBe(52)
    expect(result.syncedAt).toBeInstanceOf(Date)
  })

  it('persiste dados localmente mesmo se o POST falhar', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    await syncHealthData('user-123', 'token-abc', 'http://localhost:3000')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'helux:recovery-data',
      expect.any(String)
    )
  })
})
```

- [ ] **Passo 2: Rodar para confirmar falha**

```bash
pnpm --filter @helux/mobile test
```

Esperado: `FAIL — Cannot find module '../services/health-sync.service'`

- [ ] **Passo 3: Criar `apps/mobile/src/services/health-sync.service.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { healthKit } from './healthkit'

const RECOVERY_KEY = 'helux:recovery-data'
const LAST_SYNC_KEY = 'helux:last-sync-at'

export interface SyncResult {
  recovery: RecoveryData
  syncedAt: Date
}

export async function syncHealthData(
  userId: string,
  token: string,
  apiUrl: string,
): Promise<SyncResult> {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)

  const [samples, recovery] = await Promise.all([
    healthKit.readSamples(from, to),
    healthKit.readRecovery(from, to),
  ])

  // Persiste localmente antes do POST — dados ficam disponíveis mesmo offline
  await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery))
  await AsyncStorage.setItem(LAST_SYNC_KEY, to.toISOString())

  try {
    await fetch(`${apiUrl}/api/health/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(samples),
    })
  } catch (err) {
    console.error('[HealthSync] POST falhou, dados salvos localmente:', err)
  }

  return { recovery, syncedAt: to }
}
```

- [ ] **Passo 4: Rodar testes para confirmar verde**

```bash
pnpm --filter @helux/mobile test
```

Esperado: `Test Files 2 passed (2) | Tests 9 passed (9)`

- [ ] **Passo 5: Commit**

```bash
git add apps/mobile/src/services/health-sync.service.ts apps/mobile/src/__tests__/health-sync.service.test.ts
git commit -m "feat: add health sync service with local persistence"
```

---

### Tarefa 4: AuthService

**Files:**
- Create: `apps/mobile/src/services/auth.service.ts`

> Nota: `signInWithGoogle` abre browser real — não é testável em Vitest. Testamos apenas `getSession` e `getAccessToken` via integração manual.

- [ ] **Passo 1: Criar `apps/mobile/src/services/auth.service.ts`**

```typescript
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { createClient } from '@supabase/supabase-js'
import type { Session } from '@supabase/supabase-js'

WebBrowser.maybeCompleteAuthSession()

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
    const session = await this.getSession()
    if (!session) throw new Error('Usuário não autenticado')
    return session.access_token
  },
}
```

- [ ] **Passo 2: Verificar typecheck**

```bash
pnpm --filter @helux/mobile typecheck
```

Esperado: sem erros.

- [ ] **Passo 3: Commit**

```bash
git add apps/mobile/src/services/auth.service.ts
git commit -m "feat: add auth service with google oauth via supabase"
```

---

### Tarefa 5: Hooks (useAuth, useRecoveryData, useHealthSync)

**Files:**
- Create: `apps/mobile/src/hooks/useAuth.ts`
- Create: `apps/mobile/src/hooks/useRecoveryData.ts`
- Create: `apps/mobile/src/hooks/useHealthSync.ts`

> Hooks React não têm testes unitários neste plano — testados manualmente no app.

- [ ] **Passo 1: Criar `apps/mobile/src/hooks/useAuth.ts`**

```typescript
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthService, supabase } from '../services/auth.service'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AuthService.getSession()
      .then(setSession)
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
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
```

- [ ] **Passo 2: Criar `apps/mobile/src/hooks/useRecoveryData.ts`**

```typescript
import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'

const RECOVERY_KEY = 'helux:recovery-data'

export function useRecoveryData() {
  const [data, setData] = useState<RecoveryData | null>(null)

  const load = useCallback(async () => {
    const raw = await AsyncStorage.getItem(RECOVERY_KEY)
    if (raw) setData(JSON.parse(raw) as RecoveryData)
  }, [])

  useEffect(() => { load() }, [load])

  return { data, refresh: load }
}
```

- [ ] **Passo 3: Criar `apps/mobile/src/hooks/useHealthSync.ts`**

```typescript
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecoveryData } from '@helux/types'
import { AuthService } from '../services/auth.service'
import { syncHealthData } from '../services/health-sync.service'
import { useAuth } from './useAuth'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
const RECOVERY_KEY = 'helux:recovery-data'

export function useHealthSync() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [recovery, setRecovery] = useState<RecoveryData | null>(null)

  // Carrega do AsyncStorage na montagem
  useEffect(() => {
    AsyncStorage.getItem(RECOVERY_KEY).then(raw => {
      if (raw) setRecovery(JSON.parse(raw) as RecoveryData)
    })
  }, [])

  const sync = async () => {
    if (!session) return
    setLoading(true)
    try {
      const token = await AuthService.getAccessToken()
      const result = await syncHealthData(session.user.id, token, API_URL)
      setLastSyncAt(result.syncedAt)
      setRecovery(result.recovery)  // atualiza direto — sem dependência de outra instância de hook
    } catch (err) {
      console.error('[useHealthSync]', err)
    } finally {
      setLoading(false)
    }
  }

  return { sync, loading, lastSyncAt, recovery }
}
```

- [ ] **Passo 4: Verificar typecheck**

```bash
pnpm --filter @helux/mobile typecheck
```

Esperado: sem erros.

- [ ] **Passo 5: Commit**

```bash
git add apps/mobile/src/hooks/
git commit -m "feat: add useAuth, useRecoveryData and useHealthSync hooks"
```

---

### Tarefa 6: Tela de Login + guarda de auth em `_layout.tsx`

**Files:**
- Create: `apps/mobile/app/login.tsx`
- Modify: `apps/mobile/app/_layout.tsx`

- [ ] **Passo 1: Criar `apps/mobile/app/login.tsx`**

```typescript
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { colors, fontFamilies } from '@/constants/theme'
import HelixMark from '@/components/shared/HelixMark'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try {
      await signIn()
    } catch (err) {
      console.error('[Login]', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.brand}>
        <HelixMark size={40} />
        <Text style={styles.brandName}>helux</Text>
      </View>
      <Text style={styles.tagline}>Treinos personalizados pelo seu DNA</Text>
      <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.buttonText}>Continuar com Google</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 36,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  tagline: {
    fontSize: 15,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fontFamilies.uiBold,
    color: colors.bg,
  },
})
```

- [ ] **Passo 2: Atualizar `apps/mobile/app/_layout.tsx`**

Substituir o conteúdo completo por:

```typescript
import { useEffect } from 'react'
import { Stack, Redirect } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk'
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { colors } from '@/constants/theme'
import { useAuth } from '@/hooks/useAuth'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_600SemiBold,
  })
  const { session, loading: authLoading } = useAuth()

  useEffect(() => {
    if (fontsLoaded && !authLoading) SplashScreen.hideAsync()
  }, [fontsLoaded, authLoading])

  if (!fontsLoaded || authLoading) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="treino-ativo" options={{ presentation: 'modal' }} />
      </Stack>
      {!session && <Redirect href="/login" />}
    </GestureHandlerRootView>
  )
}
```

- [ ] **Passo 3: Verificar typecheck**

```bash
pnpm --filter @helux/mobile typecheck
```

Esperado: sem erros.

- [ ] **Passo 4: Commit**

```bash
git add apps/mobile/app/login.tsx apps/mobile/app/_layout.tsx
git commit -m "feat: add login screen and auth guard in root layout"
```

---

### Tarefa 7: UI — RecoveryCard + botão sync na topbar

**Files:**
- Modify: `apps/mobile/src/components/home/RecoveryCard.tsx`
- Modify: `apps/mobile/app/(tabs)/index.tsx`

- [ ] **Passo 1: Atualizar `apps/mobile/src/components/home/RecoveryCard.tsx`**

Substituir o conteúdo completo por:

```typescript
import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, radii, fontFamilies } from '@/constants/theme'
import type { RecoveryData } from '@helux/types'

interface RecoveryCardProps {
  data: RecoveryData | null
}

export function RecoveryCard({ data }: RecoveryCardProps) {
  if (!data) {
    return (
      <View style={styles.card}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sincronize para{'\n'}ver recuperação</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.metricBlock}>
        <Text style={styles.metricValue}>{data.hrv}</Text>
        <Text style={styles.metricUnit}>ms</Text>
      </View>
      <View style={styles.textBlock}>
        <View style={styles.row}>
          <Text style={styles.label}>HRV</Text>
          <Text style={styles.value}>{data.hrv} ms</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>FC repouso</Text>
          <Text style={styles.value}>{data.restingHR} bpm</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
  },
  metricBlock: {
    alignItems: 'center',
    width: 44,
  },
  metricValue: {
    fontFamily: fontFamilies.mono,
    fontSize: 20,
    color: colors.accent,
    lineHeight: 24,
  },
  metricUnit: {
    fontFamily: fontFamilies.ui,
    fontSize: 10,
    color: colors.textFaint,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
  },
  value: {
    fontSize: 13,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    textAlign: 'center',
    lineHeight: 18,
  },
})
```

- [ ] **Passo 2: Atualizar `apps/mobile/app/(tabs)/index.tsx`**

Substituir a seção de imports e o início do componente para incluir os novos hooks e o botão sync. Substituir o arquivo completo por:

```typescript
import React from 'react'
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fontFamilies } from '@/constants/theme'
import { MOCK_WORKOUTS, MOCK_GENETICS, MOCK_USER } from '@/data/mock'
import { HeroCard } from '@/components/home/HeroCard'
import { RecoveryCard } from '@/components/home/RecoveryCard'
import { WeekDotsCard } from '@/components/home/WeekDotsCard'
import { GeneticInsightCard } from '@/components/home/GeneticInsightCard'
import HelixMark from '@/components/shared/HelixMark'
import Icon from '@/components/shared/Icon'
import { useHealthSync } from '@/hooks/useHealthSync'

function getFormattedDate(): string {
  const now = new Date()
  const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' })
  const day = now.getDate()
  const month = now.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  const capitalWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${capitalWeekday} · ${day} ${month}`
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets()
  const todayWorkout = MOCK_WORKOUTS.find((w) => w.today)!
  const driver = MOCK_GENETICS.drivers[0]
  const { sync, loading: syncing, recovery: recoveryData } = useHealthSync()

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 8 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Topbar */}
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <HelixMark size={22} />
          <Text style={styles.brandName}>helux</Text>
        </View>
        <View style={styles.topbarRight}>
          <View style={styles.streak}>
            <Icon name="flame" size={15} stroke={colors.accent} fill={colors.accentSoft} />
            <Text style={styles.streakNum}>{MOCK_USER.streak}</Text>
            <Text style={styles.streakUnit}>sem</Text>
          </View>
          <TouchableOpacity style={styles.syncBtn} onPress={sync} disabled={syncing}>
            {syncing ? (
              <ActivityIndicator size="small" color={colors.textFaint} />
            ) : (
              <Text style={styles.syncIcon}>⟳</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateSub}>{getFormattedDate()}</Text>
        <Text style={styles.greeting}>
          {'Bom treino,\n'}
          <Text style={styles.greetingName}>{MOCK_USER.firstName}</Text>
        </Text>
      </View>

      {/* Hero Card */}
      <View style={styles.heroContainer}>
        <HeroCard
          workout={todayWorkout}
          onStart={() => router.push('/treino-ativo')}
        />
      </View>

      {/* Grid: Recovery + Week Dots */}
      <View style={styles.grid}>
        <RecoveryCard data={recoveryData} />
        <WeekDotsCard done={MOCK_USER.week.done} target={MOCK_USER.week.target} />
      </View>

      {/* Genetic Insight */}
      <View style={styles.insightContainer}>
        <GeneticInsightCard
          driver={driver}
          onPress={() => router.push('/(tabs)/dna')}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
  },
  topbar: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 18,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  streakNum: {
    fontSize: 13,
    fontFamily: fontFamilies.mono,
    color: colors.text,
  },
  streakUnit: {
    fontSize: 12,
    fontFamily: fontFamilies.ui,
    color: colors.textDim,
  },
  syncBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncIcon: {
    fontSize: 18,
    color: colors.textFaint,
    lineHeight: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  dateSub: {
    fontSize: 13,
    fontFamily: fontFamilies.ui,
    color: colors.textFaint,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 32,
    fontFamily: fontFamilies.uiBold,
    color: colors.text,
    lineHeight: 40,
  },
  greetingName: {
    color: colors.accent,
  },
  heroContainer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  insightContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bottomSpacer: {
    height: 80,
  },
})
```

- [ ] **Passo 3: Verificar typecheck**

```bash
pnpm --filter @helux/mobile typecheck
```

Esperado: sem erros.

- [ ] **Passo 4: Rodar todos os testes**

```bash
pnpm --filter @helux/mobile test
```

Esperado: `Test Files 2 passed (2) | Tests 9 passed (9)`

- [ ] **Passo 5: Commit**

```bash
git add apps/mobile/src/components/home/RecoveryCard.tsx apps/mobile/app/(tabs)/index.tsx
git commit -m "feat: wire healthkit data to RecoveryCard and add sync button"
```

---

## Verificação Final (Manual)

Após implementação, verificar no app (Expo Go ou dev build):

1. App abre → redireciona para tela de login
2. Botão "Continuar com Google" abre browser OAuth
3. Após login → vai para tabs normalmente
4. Tela Hoje → RecoveryCard mostra "Sincronize para ver recuperação"
5. Tap no botão `⟳` → spinner aparece, depois RecoveryCard mostra HRV 52 ms / FC 58 bpm (dados do Mock)
6. Fechar e reabrir o app → dados persistem no RecoveryCard

> Em modo dev (`__DEV__ = true`), o `MockHealthKitAdapter` é usado automaticamente — o fluxo completo funciona sem build nativo.

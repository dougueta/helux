# Design: Coleta HealthKit + Sync Mobile

**Data:** 2026-06-15  
**Escopo:** `apps/mobile` — autenticação Google, leitura HealthKit, sync manual com backend  
**Spec relacionada:** `specs/003-health-backend/spec.md` (backend já implementado)

---

## 1. Visão Geral

O app mobile passa a coletar batimentos cardíacos, passos e HRV do Apple Watch via HealthKit, disponibilizando esses dados localmente para a UI (RecoveryCard, geração de planos de treino) e sincronizando com o backend Supabase via `POST /api/health/sync`.

O usuário autentica via **Google OAuth** e dispara o sync manualmente por um botão na topbar da tela Hoje.

---

## 2. Arquitetura

### Fluxo principal

```
[Tap "⟳" na topbar]
        │
        ▼
useHealthSync.sync()
        │
        ▼
HealthSyncService.syncHealthData(userId, token)
        │
        ├── healthKit.readSamples(from, to)  ──► POST /api/health/sync
        │
        └── healthKit.readRecovery(from, to)
                │
                ├── AsyncStorage('helux:recovery-data')
                └── AsyncStorage('helux:last-sync-at')
                        │
                        ▼
                 useRecoveryData() hook
                        │
                        ▼
                 RecoveryCard (HRV + FC repouso reais)
```

### Novos arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/services/auth.service.ts` | Supabase client, Google OAuth, getAccessToken |
| `src/services/healthkit.adapter.ts` | Interface `IHealthKitAdapter` + `MockHealthKitAdapter` + `NativeHealthKitAdapter` |
| `src/services/healthkit.ts` | Singleton — seleciona impl mock vs native |
| `src/services/health-sync.service.ts` | Orquestra leitura → cache local → POST API |
| `src/hooks/useAuth.ts` | Estado de sessão, signIn, signOut |
| `src/hooks/useHealthSync.ts` | `{ sync, loading, lastSyncAt }` |
| `src/hooks/useRecoveryData.ts` | Lê `RecoveryData` do AsyncStorage |
| `app/login.tsx` | Tela de login — botão "Continuar com Google" |

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `app/_layout.tsx` | Guarda de auth — redireciona para login se sem sessão |
| `app/(tabs)/index.tsx` | Botão sync na topbar, conecta `useRecoveryData` |
| `src/components/home/RecoveryCard.tsx` | Aceita `RecoveryData | null` em vez de `number` |

---

## 3. Autenticação (Google OAuth)

**Biblioteca:** `expo-auth-session` + `expo-web-browser` (funciona em Expo Go, dev build e produção)

**Provider:** Google via Supabase Auth (OAuth 2.0)

**`AuthService`:**
```typescript
const supabase = createClient(EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY)

export const AuthService = {
  signInWithGoogle(): Promise<Session>   // abre browser → OAuth → deep link
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
  getAccessToken(): Promise<string>      // usado pelo HealthSyncService
}
```

**Fluxo de navegação:**
- App abre → `_layout.tsx` checa sessão
- Sem sessão → `app/login.tsx` (botão Google)
- Com sessão → tabs (normal)

**Variáveis de ambiente** (`apps/mobile/.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Pré-requisitos de configuração (manual, fora do código):**
1. Google Cloud Project com OAuth 2.0 credentials (Client ID + Secret)
2. Google configurado como provider em Supabase → Authentication → Providers
3. URL scheme no `app.json`: `"scheme": "helux"` (para deep link de retorno)
4. Redirect URL autorizada no Google Cloud: `https://<project>.supabase.co/auth/v1/callback`

---

## 4. HealthKit Adapter

### Interface

```typescript
export interface IHealthKitAdapter {
  requestPermissions(): Promise<void>
  readSamples(from: Date, to: Date): Promise<HealthSyncPayload>
  readRecovery(from: Date, to: Date): Promise<RecoveryData>
}
```

`HealthSyncPayload` e `RecoveryData` vêm de `@helux/health` e `@helux/types` respectivamente.

### MockHealthKitAdapter

Retorna dados fixos realistas. Ativa em `__DEV__` ou quando `Platform.OS !== 'ios'`. Permite desenvolvimento completo sem build nativo.

### NativeHealthKitAdapter

Usa `react-native-health` (requer dev build via `expo-dev-client`).

**Na implementação inicial esta classe é um stub** — retorna dados fixos idênticos ao Mock. A implementação nativa real é feita quando o build method for definido (Opção A, B ou C da Seção de Build). Isso permite que todo o restante da feature seja implementado e testado antes de escolher o ambiente de build.

Lógica de `readRecovery`:
- **HRV:** mediana dos samples HRV do período
- **restingHR:** menor FC registrada fora de períodos de atividade
- **activeCalories:** soma de active energy burned samples

### Seleção de implementação

```typescript
// src/services/healthkit.ts
export const healthKit: IHealthKitAdapter =
  Platform.OS === 'ios' && !__DEV__
    ? new NativeHealthKitAdapter()
    : new MockHealthKitAdapter()
```

---

## 5. Sync Service

```typescript
// src/services/health-sync.service.ts
export async function syncHealthData(userId: string, token: string): Promise<SyncResult> {
  const to = new Date()
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000)  // últimas 24h

  const [samples, recovery] = await Promise.all([
    healthKit.readSamples(from, to),
    healthKit.readRecovery(from, to),
  ])

  await AsyncStorage.setItem('helux:recovery-data', JSON.stringify(recovery))
  await AsyncStorage.setItem('helux:last-sync-at', to.toISOString())

  await fetch(`${API_URL}/api/health/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(samples),
  })

  return { recovery, syncedAt: to }
}

export interface SyncResult {
  recovery: RecoveryData
  syncedAt: Date
}
```

**Tratamento de erro:** se o POST falhar, os dados locais já foram salvos — o usuário vê dados atualizados mesmo offline. O erro de rede é silenciado com log (sem toast intrusivo no MVP).

---

## 6. AsyncStorage Keys

| Chave | Tipo | Conteúdo |
|-------|------|----------|
| `helux:recovery-data` | `RecoveryData` JSON | Último dado de recuperação |
| `helux:last-sync-at` | string ISO 8601 | Timestamp do último sync bem-sucedido |

---

## 7. Mudanças na UI

### Topbar da tela Hoje

Botão `⟳` ao lado do streak. Durante sync mostra `ActivityIndicator`. Após sync: ícone volta ao normal.

```
[helux ∿]   [🔥 3 sem]   [⟳]
```

### RecoveryCard

Props mudam de `{ value: number }` para `{ data: RecoveryData | null }`.

Estado `null` (antes do primeiro sync): mostra skeleton / "Sincronize para ver recuperação".

Estado com dados: mostra HRV em ms e FC de repouso em bpm.

```
┌─────────────────────────────┐
│  ◎  HRV    52 ms            │
│     FC rep 58 bpm           │
└─────────────────────────────┘
```

---

## 8. Dependências novas

```json
"@supabase/supabase-js": "^2.49.1",
"expo-auth-session": "~6.1.5",
"expo-web-browser": "~14.1.6",
"react-native-health": "^1.21.0"
```

`react-native-health` requer `expo-dev-client` para build nativo. A `MockHealthKitAdapter` elimina essa dependência durante desenvolvimento.

---

## 9. Critérios de Aceite

1. Usuário não autenticado é redirecionado para `app/login.tsx`
2. Tap em "Continuar com Google" abre browser OAuth e retorna sessão válida
3. Topbar mostra botão sync; tap executa o fluxo completo
4. `RecoveryCard` exibe HRV e FC de repouso após primeiro sync
5. Dados persistem após fechar e reabrir o app (AsyncStorage)
6. Supabase recebe os samples via `POST /api/health/sync` com JWT válido
7. Em modo dev (`__DEV__`), `MockHealthKitAdapter` é usado automaticamente

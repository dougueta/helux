# Data Model: Ambiente Local Integrado e Verificação de Ponta a Ponta

Sem mudanças de schema. As entidades abaixo existem só em tempo de execução da verificação.

## LocalEnv (credenciais do ambiente local)

Obtido de `supabase status -o env`.

| Campo | Origem | Uso |
|---|---|---|
| `apiUrl` | `API_URL` | `SUPABASE_URL` da API e dos clientes do teste |
| `anonKey` | `ANON_KEY` | `SUPABASE_ANON_KEY` da API; signup do usuário de teste |
| `serviceRoleKey` | `SERVICE_ROLE_KEY` | cliente de preparação e asserts (bypass de RLS), nunca passado à API |
| `startedBySuite` | booleano | decide se o teardown roda `supabase stop` |

Regra: `apiUrl` MUST apontar para `127.0.0.1`/`localhost`. Caso contrário a suíte aborta (proteção extra do FR-002/SC-006).

## FakeAnthropic

| Campo | Descrição |
|---|---|
| `url` | `http://127.0.0.1:<porta efêmera>` |
| `calls` | número de `POST /v1/messages` recebidos |
| `plan` | mesociclo fixo: 4 sessões (A Inferior, B Superior, C Inferior, D Superior), exercícios do `EXERCISE_BANK` |
| `close()` | encerra o servidor |

## E2EUser

| Campo | Descrição |
|---|---|
| `email` | `e2e-<timestamp>-<aleatório>@helux.test` (novo a cada execução, FR-009) |
| `id` | `auth.users.id` retornado pelo signup |
| `token` | access token usado em `Authorization: Bearer` |

## Transições verificadas (mesociclo do usuário de teste)

```text
sem mesociclo ──GET latest-plan──▶ generating ──(IA)──▶ ciclo#1 0/4
ciclo#1 k/4 ──POST session──▶ ciclo#1 (k+1)/4          (k < 3, sem chamada à IA)
ciclo#1 3/4 ──POST session──▶ ciclo#1 4/4 ──(IA)──▶ ciclo#2 0/4
```

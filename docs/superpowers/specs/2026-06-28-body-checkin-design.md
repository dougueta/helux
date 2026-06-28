# Design: Body Check-in Mensal com Personalização Adaptativa de Treino

**Data**: 2026-06-28
**Status**: Aprovado
**Área**: `apps/web` · `apps/api` · `packages/ai` · `packages/types` · Supabase

---

## Resumo

Adicionar um sistema de check-in mensal de medidas corporais e performance que alimenta a IA de geração de treinos com regras explícitas de ajuste dinâmico. O usuário registra peso, composição corporal, circunferências e cargas dos lifts principais uma vez por mês via formulário web. A IA compara os dois check-ins mais recentes e ajusta o plano da sessão (volume, intensidade, cardio) conforme a tendência detectada.

---

## Contexto

Hoje o plano de treino é personalizado por: perfil genético, HRV + dados de recuperação diários, histórico de sessões recentes, objetivo (texto livre) e nível de experiência. Falta a camada de **progresso físico ao longo do tempo** — dados que mudam mês a mês e que revelam se o programa está funcionando.

---

## Modelo de Dados

### Tabela `body_checkins` (nova, Supabase)

```sql
create table body_checkins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  month        date not null,           -- sempre o dia 01 do mês (ex: 2026-06-01)
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  waist_cm     numeric(5,1),
  hip_cm       numeric(5,1),
  arm_cm       numeric(5,1),
  leg_cm       numeric(5,1),
  squat_kg     numeric(6,2),
  bench_kg     numeric(6,2),
  deadlift_kg  numeric(6,2),
  notes        text,
  created_at   timestamptz not null default now(),
  unique (user_id, month)              -- 1 check-in por mês; upsert para edição
);

-- RLS
alter table body_checkins enable row level security;
create policy "users manage own checkins" on body_checkins
  for all using (auth.uid() = user_id);
```

Todos os campos de medida são opcionais — o usuário pode preencher só o que tem disponível.

---

## Tipo Compartilhado (`packages/types`)

```ts
// packages/types/src/checkin.ts
export interface BodyCheckin {
  id: string
  month: string           // 'YYYY-MM-01'
  weight_kg?: number
  body_fat_pct?: number
  waist_cm?: number
  hip_cm?: number
  arm_cm?: number
  leg_cm?: number
  squat_kg?: number
  bench_kg?: number
  deadlift_kg?: number
  notes?: string
  created_at: string
}
```

`PlanInput` (em `packages/types/src/plan.ts`) ganha:

```ts
bodyCheckins?: BodyCheckin[]  // últimos 2, ordem crescente (mais antigo primeiro)
```

---

## API Endpoints (`apps/api`)

### `POST /api/checkins`

- **Auth**: Bearer token (padrão existente via Supabase)
- **Body**: campos de `BodyCheckin` exceto `id`, `user_id`, `created_at`
- **Comportamento**: upsert por `(user_id, month)` — sobrescreve se já existe check-in do mês
- **Resposta 200**: o registro salvo
- **Validação Zod**: `month` deve ser string `YYYY-MM-DD` com dia = 01; campos numéricos opcionais com range mínimo sensato (peso > 20, gordura 1–60, etc.)

### `GET /api/checkins`

- **Auth**: Bearer token
- **Query param**: `limit` (number, default 13, max 60)
- **Resposta 200**: array de `BodyCheckin` ordenado por `month desc`

### Integração na geração de treino

O handler de `POST /workout/generate` (existente) passa a buscar os 2 check-ins mais recentes do usuário via `GET /api/checkins?limit=2` antes de chamar `generateWorkoutPlan`, e os injeta em `PlanInput.bodyCheckins`.

---

## Integração com a IA (`packages/ai`)

### `buildUserPrompt`

Quando `bodyCheckins` tem 2 entradas, calcula e injeta a seção de tendência:

```
### Tendência de Progresso (check-in mensal)

Check-in anterior (Mai/2026) → atual (Jun/2026):
Peso:         82.4kg → 81.2kg  (Δ -1.2kg)  ✅
Gordura:      19.0%  → 18.1%   (Δ -0.9pp)  ✅
Agachamento:  115kg  → 120kg   (Δ +5kg)    ✅
Supino:       90kg   → 90kg    (Δ =)       →
Terra:        140kg  → 145kg   (Δ +5kg)    ✅
```

Quando há apenas 1 check-in, injeta os dados brutos sem delta. Quando não há nenhum, a seção é omitida.

### `buildSystemPrompt`

Nova seção adicionada após as regras de recuperação:

```
## Regras de Ajuste por Tendência de Progresso — OBRIGATÓRIO quando dados disponíveis

| Situação detectada                          | Ajuste obrigatório                                              |
|---------------------------------------------|-----------------------------------------------------------------|
| Δ gordura > +1pp                            | Adicionar 1 sessão de cardio moderado; reduzir volume em ~20%  |
| Δ gordura < -1pp                            | Manter direção; não reduzir carga                              |
| Δ peso estável + lifts estagnados (Δ = 0)   | Aumentar cargas em 5-10%; adicionar 1 série por exercício       |
| Δ peso estável + gordura caindo             | Recomposição em curso; manter programa atual                   |
| Δ peso caindo + lifts caindo                | Reduzir volume, priorizar técnica e recuperação                |

Quando não há dados de check-in, ignore esta seção e use apenas o perfil genético e HRV.
```

---

## Web App (`apps/web`)

### Rotas novas

| Rota | Componente | Descrição |
|---|---|---|
| `/checkin` | `CheckinPage` | Formulário de check-in do mês atual |
| `/checkin/history` | `CheckinHistoryPage` | Tabela de todos os check-ins |

### `/checkin` — Formulário

- Ao carregar, busca `GET /api/checkins?limit=1` para verificar se já existe check-in do mês atual
- Se existe: pré-preenche campos (modo edição)
- Formulário dividido em 3 blocos (colapsáveis no mobile):
  - **Composição**: peso, % gordura, cintura, quadril, braço, coxa
  - **Performance**: agachamento, supino, terra
  - **Observações**: textarea opcional
- Botão único: "Salvar check-in de [Mês/Ano]"
- Todos os campos são opcionais — salvar com campos em branco é válido
- Após salvar: toast de confirmação + redirect para `/checkin/history`

### `/checkin/history` — Tabela

- Lista todos os check-ins, mais recente primeiro
- Colunas: Mês | Peso | Gordura | Cintura | Braço | Agach. | Supino | Terra
- Delta calculado na coluna em relação ao check-in anterior (verde = melhora, vermelho = piora, cinza = neutro)
- Link "Editar" em cada linha volta para `/checkin` pré-preenchido com aquele mês
- Link "Novo check-in" no topo

### Card na Home

Novo `CheckinCard` exibido na home abaixo do `WorkoutCard`, apenas quando há pelo menos 1 check-in:

```
┌─────────────────────────────────────────┐
│ Check-in Jun/2026  · há 3 dias    [→]   │
│ Peso 81.2kg ▼1.2   Gordura 18.1% ▼0.9pp│
│ Agach. 120kg ▲5    Supino 90kg =        │
└─────────────────────────────────────────┘
```

Clicável — abre `/checkin/history`.

### NavBar

O tab "DNA" é substituído por "Check-in" (ícone de régua). O perfil genético passa a ser acessível via link dentro da página de Check-in (botão "Ver perfil genético" → `/dna`). A rota `/dna` continua existindo.

### Hooks novos

| Hook | Responsabilidade |
|---|---|
| `useCheckin` | Busca check-in do mês atual; POST/upsert |
| `useCheckinHistory` | Busca lista paginada de check-ins |

### Services

- `checkin.service.ts` — `getCheckins(limit)`, `upsertCheckin(data)`

---

## Testes

### `apps/api`
- `POST /api/checkins`: cria, sobrescreve mesmo mês, rejeita mês inválido, rejeita sem auth
- `GET /api/checkins`: retorna ordenado desc, respeita limit, retorna vazio quando sem registros

### `apps/web`
- `CheckinCard`: renderiza com 1 check-in (sem delta), com 2 (com delta), não renderiza sem check-ins
- `useCheckin`: pré-preenche quando mês atual existe; POST correto no upsert
- `checkin.service`: mock do apiFetch para get e upsert

### `packages/ai`
- `buildUserPrompt` com `bodyCheckins` vazio → seção omitida
- `buildUserPrompt` com 1 check-in → dados brutos sem delta
- `buildUserPrompt` com 2 check-ins → seção de tendência com Δ calculado

---

## Fora de Escopo (MVP)

- Upload de fotos de progresso
- Notificação/lembrete mensal para fazer check-in
- Gráficos de linha (linha do tempo visual por métrica)
- Check-in via iOS Shortcut
- Cálculo automático de 1RM (usar carga máxima recente como proxy)

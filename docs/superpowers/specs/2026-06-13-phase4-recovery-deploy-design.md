# Design: Phase 4 — Recovery Loop + Deploy

**Date**: 2026-06-13  
**Status**: Approved  
**Scope**: iOS Shortcuts como fonte de dados HealthKit + deploy no Fly.io + endpoints de recuperação e histórico de treinos

---

## Problema

Atualmente o `POST /workout/generate` recebe `workoutHistory` e `recoveryData` no body, mas o cliente não tem como populá-los automaticamente. Sem esses dados, o Claude planeja de forma genética mas estática — não adapta ao estado de recuperação real do atleta.

---

## Solução

Fechar o loop com três peças:

1. **iOS Shortcuts** — automação nativa do iPhone que lê HRV, FC repouso e calorias ativas do HealthKit e envia para a API uma vez por dia (semi-manual: o usuário toca um widget de manhã)
2. **Fly.io** — deploy da API com volume persistente para manter os arquivos JSON (`genera.json`, `recovery.json`, `history.json`) entre restarts
3. **Novos endpoints** — a API passa a armazenar e recuperar os dados de recuperação e histórico de treinos automaticamente

---

## Arquitetura

```
iPhone (iOS Shortcut — toque matinal)
  └─ lê HealthKit: HRV, FC repouso, calorias ativas
  └─ POST https://helux.fly.dev/recovery

Fly.io — apps/api (sempre disponível)
  ├─ POST /recovery          (recebe do Shortcut)
  ├─ GET  /recovery          (lista histórico)
  ├─ POST /workouts          (registra sessão concluída)
  ├─ GET  /workouts          (lista histórico)
  ├─ POST /workout/generate  (atualizado — lê do disco)
  └─ GET  /workout/latest-plan

Volume persistente Fly.io (montado em /data)
  ├─ data/genetics/genera.json      (upload manual único via fly sftp)
  ├─ data/workouts/recovery.json    (RecoveryData[], append diário)
  ├─ data/workouts/history.json     (WorkoutSession[], append por sessão)
  ├─ data/workouts/latest-plan.json (último plano gerado)
  └─ data/user-rules.json           (string[], regras pessoais — opcional)
```

---

## Endpoints

### POST /recovery
Recebe um `RecoveryData` do Shortcut iOS. Faz append em `data/workouts/recovery.json`.

**Body:**
```typescript
{
  date: string        // "2026-06-13"
  hrv: number         // ms
  restingHR: number   // bpm
  activeCalories: number
  source: 'healthkit'
}
```
**Response:** `201 { "ok": true }`

### GET /recovery
Lista os últimos N dias de recuperação (default: 7).

**Response:** `RecoveryData[]` ordenado por data desc

### POST /workouts
Registra uma sessão de treino concluída. Faz append em `data/workouts/history.json`.

**Body:** `WorkoutSession` (já tipado em `@helux/types`)  
**Response:** `201 { "ok": true }`

### GET /workouts
Lista as últimas N sessões (default: 5).

**Response:** `WorkoutSession[]` ordenado por data desc

### POST /workout/generate (atualizado)
Body simplificado — a API lê o contexto do disco:

```typescript
// Antes (cliente passava tudo):
{ geneticProfile, constraints, workoutHistory, recoveryData, userGoals, userLevel, availableDaysPerWeek }

// Depois (só preferências do usuário):
{ userGoals: string, userLevel: string, availableDaysPerWeek: number }
```

Internamente a rota:
1. Lê `genera.json` → deriva `GeneticProfile` + `WorkoutConstraints`
2. Lê últimos 7 dias de `recovery.json`
3. Lê últimas 5 sessões de `history.json`
4. Lê `user-rules.json` se existir (regras pessoais adicionais ao prompt)
5. Chama `generateWorkoutPlan()` com tudo montado

---

## Deploy — Fly.io

- **Runtime**: Node.js 20 + Dockerfile
- **Volume**: 1GB montado em `/app/data` (gratuito no free tier)
- **Secrets**: `ANTHROPIC_API_KEY` via `fly secrets set`
- **Upload inicial**: `fly sftp` para enviar `data/genetics/genera.json` (único momento em que dado sensível sai da máquina local, via conexão criptografada)
- **Auto-deploy**: GitHub Actions → `fly deploy` a cada push na `main`

---

## iOS Shortcut

Configuração manual pelo usuário no app Atalhos do iPhone:

1. **Trigger**: Manual (widget na tela inicial) ou Automação diária às 7h
2. **Ações**:
   - "Buscar amostras de saúde" → Variabilidade da FC (HRV), últimas 8h
   - "Buscar amostras de saúde" → Frequência Cardíaca em Repouso, hoje
   - "Buscar amostras de saúde" → Calorias Ativas, ontem
   - "Obter conteúdo da URL" → POST `https://helux.fly.dev/recovery` com JSON montado
3. **Permissão**: iOS pede autorização de leitura do HealthKit na primeira execução

---

## Extensibilidade: Regras Pessoais

`data/user-rules.json` é um array de strings que o `buildSystemPrompt()` inclui no prompt do Claude como restrições adicionais:

```json
["Nunca prescrever treino de costas na segunda-feira",
 "Sempre incluir mobilidade de quadril no aquecimento",
 "Preferir agachamento livre ao leg press"]
```

Endpoint futuro `POST /user-rules` para gerenciar via API. Não faz parte do escopo desta fase.

---

## O Que Não Está no Escopo

- App mobile nativo (Expo/React Native)
- Interface gráfica para visualizar histórico
- Múltiplos usuários ou autenticação
- Endpoint para gerenciar `user-rules.json`
- Logs de treino via UI (apenas via `POST /workouts` direto)

---

## Fluxo do Dia a Dia (após implementação)

```
06h30  Doug acorda
       → toca widget "Sincronizar Recuperação" no iPhone
       → Shortcut lê HRV=52ms, FC=56bpm do Apple Watch
       → POST /recovery → salvo em recovery.json no Fly.io

08h00  Doug quer saber o treino de hoje
       → POST /workout/generate { userGoals: "ganhar massa", ... }
       → API lê HRV=52ms (recuperação moderada)
       → Claude prescreve volume moderado, descanso 90-120s
       → Retorna NextWorkoutPlan

18h00  Doug termina o treino
       → POST /workouts { exercícios executados... }
       → Salvo em history.json

Amanhã → ciclo recomeça com dados reais acumulados
```

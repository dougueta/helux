# Contracts — API (030)

Todas as rotas exigem `Authorization: Bearer <token>` (401 sem token válido) e respondem `400 { error, details }` em validação Zod. Datas `performed_on` em `YYYY-MM-DD`, fuso `America/Sao_Paulo`.

## Rotinas Complementares

### `GET /api/routines`
Retorna as 3 rotinas complementares fixas do usuário (calculadas deterministicamente sobre o perfil, condições ativas, mesociclo atual e `complementary_preferences`), o progresso da semana corrente, os logs recentes e as categorias já concluídas hoje.

- **Query opcional**: `?days=30` (1–365, padrão 30) — janela de histórico retornada em `recentLogs`.
- **200 OK** → `ComplementaryRoutinesView`:
  ```json
  {
    "routines": {
      "alongamento-mobilidade": { ... },
      "core-abdominal": { ... },
      "cardio": { ... }
    },
    "progress": {
      "alongamento-mobilidade": {
        "category": "alongamento-mobilidade",
        "doneToday": true,
        "completedThisWeek": 3,
        "targetPerWeek": 5,
        "lastPerformedOn": "2026-11-08"
      },
      "core-abdominal": { ... },
      "cardio": { ... }
    },
    "recentLogs": [ ... ],
    "preferences": { ... },
    "completedToday": ["alongamento-mobilidade"]
  }
  ```

### `PUT /api/routines/preferences`
Atualiza as preferências do usuário (`complementary_preferences` em `user_training_profile`) para uma ou mais categorias e devolve a visão recalculada imediatamente (FR-008, SC-002).

- **Body**:
  ```json
  {
    "alongamento-mobilidade": {
      "daysPerWeek": 7,
      "targetMinutes": 10,
      "focusRegions": ["joelho", "quadril"]
    },
    "core-abdominal": {
      "daysPerWeek": 3,
      "targetMinutes": 10
    },
    "cardio": {
      "daysPerWeek": 3,
      "targetMinutes": 25,
      "preferredModality": "bike"
    }
  }
  ```
- **Validação**:
  - `daysPerWeek`: inteiro 1–7.
  - `targetMinutes`: 5–30 para `alongamento-mobilidade` e `core-abdominal`; 10–90 para `cardio`.
  - `preferredModality`: deve existir em `CARDIO_BANK` e não violar as restrições de impacto/carga articular das condições ativas do usuário (400 `{ error: 'invalid-modality' }` se violar).
- **200 OK** → `ComplementaryRoutinesView` recalculada.

### `POST /api/routines/logs`
Registra a conclusão de uma rotina complementar no histórico, sem tocar em `mesocycle_plans` nem em `workout_sessions` (FR-002, FR-013).

- **Body**:
  ```json
  {
    "category": "cardio",
    "performed_on": "2026-11-08",
    "duration_minutes": 25,
    "modality": "bike",
    "zone": "leve",
    "effort": 7,
    "items": [
      { "id": "bike", "name": "Bike ergométrica", "setsCompleted": 1, "secondsOrReps": "25 min" }
    ],
    "notes": "Feito de manhã antes do trabalho"
  }
  ```
- **Validação**:
  - `performed_on` não pode ser data futura (`400 { error: 'future-date' }`).
  - `duration_minutes`: inteiro 1–240.
  - `effort`: opcional, inteiro 1–10.
- **201 Created** → `{ log: ComplementaryRoutineLog, view: ComplementaryRoutinesView }`.

### `DELETE /api/routines/logs/:id`
Apaga um registro de rotina complementar do usuário (para correção de lançamento acidental).
- **204 No Content**; **404** se não existir ou não pertencer ao usuário.

---

## Alterações em rotas e serviços existentes

- `POST /api/mesocycle/generate` (e geração no onboarding/fim de ciclo): `weekTemplate` contém apenas as sessões de força (`kind: 'forca'`), enquanto `cardio` e `mobilidade` dedicados vivem em `/api/routines` (FR-002a).
- `GET /api/mesocycle/:id/review` (`cycle-analysis.service.ts`) e `GET /api/agents/profile` (`integrated-profile.service.ts`): incluem a aderência semanal das 3 rotinas complementares (`complementaryAdherence`) a partir de `complementary_routine_logs` (FR-016).

# Contracts — API (031)

Todas as rotas exigem `Authorization: Bearer <token>` (401 sem token válido) e respondem `400 { error, details }` em validação Zod. Datas em `YYYY-MM-DD` e mês em `YYYY-MM`, fuso `America/Sao_Paulo` (`localToday`).

## Calendário de Treino

### `GET /api/workouts/calendar`

Retorna a visão completa do Calendário de Treino (`TrainingCalendarMonthView`) para o mês solicitado (ou o mês corrente, quando omitido), incluindo:
- Grade mensal completa dividida em semanas de segunda a domingo (`weeks`);
- Totais do mês (`monthTotals`);
- Saldo da Semana (`weeklyBalances[weekStart]`) com deltas contra a semana anterior para todas as semanas visíveis na grade;
- Curiosidades determinísticas de cada semana (`weeklyCuriosities[weekStart]`) e do mês inteiro (`monthCuriosities`).

- **Query opcional**: `?month=YYYY-MM` (padrão: mês atual em `America/Sao_Paulo`, ex.: `2026-11`).
  - Se `month` tiver formato inválido (`!/^\d{4}-(0[1-9]|1[0-2])$/`): responde `400 { error: 'invalid-month' }`.
  - Se `month` estiver no futuro em relação ao mês atual (`month > currentMonth`): responde `400 { error: 'future-month' }`.
- **Consultas realizadas pelo serviço (`workout-calendar.service.ts`)**:
  - Determina o intervalo estendido `[firstGridMonday - 7 dias, lastGridSunday]` para cobrir todas as semanas da grade e a semana anterior à primeira linha.
  - Lê em paralelo (`Promise.all`):
    1. `workout_sessions` (com `session_checkins(phase, rpe)`) do usuário;
    2. `complementary_routine_logs` no intervalo `[firstGridMonday - 7 dias, lastGridSunday]`;
    3. `body_weights` no intervalo `[firstGridMonday - 7 dias, lastGridSunday]`;
    4. `user_training_profile` (`days_per_week`) para a meta semanal `targetGymDays`.
  - Chama `buildTrainingCalendarMonth` (`@helux/workouts`) e devolve o payload.
- **200 OK** → `TrainingCalendarMonthView`:
  ```json
  {
    "month": "2026-11",
    "monthLabel": "Novembro 2026",
    "today": "2026-11-20",
    "canGoNext": false,
    "monthTotals": {
      "activeDays": 12,
      "gymDays": 10,
      "complementaryCount": 7,
      "tonnageKg": 42600,
      "totalSets": 148,
      "activeMinutes": 695
    },
    "weeks": [
      {
        "weekStart": "2026-11-16",
        "weekEnd": "2026-11-22",
        "label": "16–22 nov.",
        "days": [
          {
            "date": "2026-11-16",
            "dayOfMonth": 16,
            "weekdayIndex": 0,
            "inCurrentMonth": true,
            "isToday": false,
            "isFuture": false,
            "hasGymWorkout": true,
            "hasComplementaryRoutine": true,
            "gymSessions": [
              {
                "id": "sess-1",
                "date": "2026-11-16",
                "title": "Supino reto, Desenvolvimento, Tríceps +2",
                "sets": 16,
                "tonnageKg": 4820,
                "durationMin": 52,
                "avgEffort": 8
              }
            ],
            "routines": [
              {
                "id": "rout-1",
                "category": "cardio",
                "date": "2026-11-16",
                "durationMin": 25,
                "modality": "bike",
                "effort": 7
              }
            ],
            "weightKg": 81.8
          }
        ]
      }
    ],
    "weeklyBalances": {
      "2026-11-16": {
        "weekStart": "2026-11-16",
        "weekEnd": "2026-11-22",
        "label": "16 a 22 de nov.",
        "activeDays": 4,
        "gymDays": 3,
        "targetGymDays": 4,
        "gymSessionsCount": 3,
        "complementaryCount": 2,
        "tonnageKg": 13450,
        "totalSets": 46,
        "activeMinutes": 195,
        "avgEffort": 7.8,
        "effortClassification": "moderado",
        "avgWeightKg": 81.6,
        "latestWeightKg": 81.5,
        "weightEntriesCount": 4,
        "deltas": {
          "activeDaysDelta": 1,
          "gymDaysDelta": 0,
          "tonnageKgDelta": 1250,
          "avgEffortDelta": 0.3,
          "avgWeightKgDelta": -0.4
        }
      }
    },
    "weeklyCuriosities": {
      "2026-11-16": [
        {
          "id": "tonelagem-equivalente",
          "scope": "semana",
          "category": "tonelagem",
          "title": "Peso total movimentado",
          "highlight": "13,5 t",
          "description": "Equivale a levantar ~11 carros populares nesta semana."
        }
      ]
    },
    "monthCuriosities": [
      {
        "id": "tonelagem-equivalente",
        "scope": "mes",
        "category": "tonelagem",
        "title": "Tonelagem do mês",
        "highlight": "42,6 t",
        "description": "Você moveu o equivalente a ~35 carros populares em novembro."
      }
    ],
    "defaultSelectedWeekStart": "2026-11-16",
    "defaultSelectedDate": "2026-11-20"
  }
  ```

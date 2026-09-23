# Contratos de API — 011

Todas as rotas exigem `Authorization: Bearer <token>` (401 sem token/inválido).

## GET /api/tiredness-today

Avaliação consolidada do dia (reaproveitável pela spec 015).

**200**
```json
{
  "date": "2026-09-22",
  "manualLevel": "otimo",
  "overrideAutomatic": false,
  "automaticLevel": "cansado",
  "automaticHrv": 45,
  "effectiveLevel": "cansado",
  "source": "automatic",
  "conflict": true
}
```
**500** erro ao ler sinal ou amostras.

## PUT /api/tiredness-today

Salva (upsert) o nível manual do dia.

**Body**
```json
{ "level": "exausto", "overrideAutomatic": false }
```
- `level`: obrigatório, um de `otimo|normal|cansado|exausto` (400 caso contrário).
- `overrideAutomatic`: opcional, default `false`.

**200** `TirednessAssessment` recalculada após salvar. **400** body inválido. **500** erro de banco.

## (removidos) POST / DELETE /api/tiredness-today

Substituídos pelo PUT acima (a web é o único cliente).

## GET /workout/latest-plan (alterado)

`today` (quando existe) passa a incluir:

```json
{
  "letter": "A", "focus": "Peito",
  "exercises": [{ "name": "Supino Reto", "sets": 3, "reps": "8-10", "weight": "72kg" }],
  "plannedExercises": [{ "name": "Supino Reto", "sets": 4, "reps": "8-10", "weight": "80kg" }],
  "changes": [{ "name": "Supino Reto", "setsBefore": 4, "setsAfter": 3, "weightBefore": "80kg", "weightAfter": "72kg" }],
  "adjusted": true,
  "adjustmentReason": "Você marcou \"exausto\" hoje",
  "tiredness": { "...": "TirednessAssessment" }
}
```

# Contracts — API (029)

Todas as rotas exigem `Authorization: Bearer <token>` (401 sem token válido) e respondem `400 { error, details }` em validação Zod. Datas em `YYYY-MM-DD`, fuso `America/Sao_Paulo`.

## Pesagens

### `GET /api/weights?days=90`
- `days`: 1–730, padrão 90 (janela até hoje).
- 200 → `{ weights: BodyWeight[] }` ordenadas por `date` asc.

### `PUT /api/weights/:date`
- Body: `{ weight_kg: number (20–500) }`.
- `:date` futura → 400 `{ error: 'future-date' }`.
- Upsert em `(user_id, date)`.
- 200 → `{ weight: BodyWeight, replaced: boolean }` (`replaced` = já havia pesagem no dia; FR-002).

### `DELETE /api/weights/:date`
- 204; 404 se não houver pesagem no dia.

## Registros de medidas (substitui `/api/checkins`)

### `GET /api/measurements?limit=24`
- `limit` 1–100, padrão 24. 200 → `{ measurements: BodyMeasurement[] }` por `measured_on` desc, `created_at` desc.

### `POST /api/measurements`
- Body: `MeasurementInput` (todos os campos opcionais exceto `measured_on`, que não pode ser futura). Limites:
  pescoço 20–70, cintura 30–300, quadril 30–300, ombros 60–200, peitoral 50–200, braço 10–100, coxa 10–150, panturrilha 15–80, % aparelho 1–70, cargas 0–1000, notas ≤ 500.
- `body_fat_device_pct` sem `body_fat_device_source` → 400.
- Pelo menos um campo além de `measured_on` → senão 400 `{ error: 'empty' }`.
- O servidor calcula `body_fat_navy_pct` com o perfil atual (R3).
- 201 → `{ measurement: BodyMeasurement, navy_status: NavyStatus }`.

### `PUT /api/measurements/:id`
- Mesmo body e regras do POST; recalcula a Marinha com o perfil atual (FR-013).
- 200 → `{ measurement, navy_status }`; 404 se não for do usuário.

### `DELETE /api/measurements/:id`
- 204; 404 se não existir.

### Removido
- `POST /api/checkins` e `GET /api/checkins` (a web é a única cliente; muda no mesmo PR).
- A recalibração automática que o `POST /api/checkins` disparava.

## Recalibração da dieta

### `POST /api/nutrition/phase/recalibration/preview`
- Sem body. Não grava nada.
- 200 → `RecalibrationEvaluation` (ver data-model):
  - `{ status: 'indisponivel', missing }`
  - `{ status: 'intervalo-curto', availableOn: '2026-11-22' }`
  - `{ status: 'faltam-pesagens', at: ['inicio'] }`
  - `{ status: 'proposta', action, before, after, reason, metrics }`

### `POST /api/nutrition/phase/recalibration`
- Sem body. Recalcula (mesma avaliação do preview).
- `proposta` → grava a calibração, atualiza `base_targets` se `after ≠ before`; 200 → `{ calibration: DietCalibration }`.
- Qualquer outro status → 409 `{ error: status, ...evaluation }`.

## Alterações em rotas existentes

- `GET /api/nutrition/phase`: `missing` continua com `checkinWeight`/`checkinStale`, agora calculados a partir das pesagens (sem pesagem → `checkinWeight`; última com mais de 35 dias → `checkinStale`).
- `POST /api/nutrition/phase`: peso inicial = `trendAt(hoje)` ou última pesagem; % de gordura = `effectiveBodyFat`.

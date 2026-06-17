# Especificação Técnica: Coleta de Dados Apple HealthKit (Backend)

**ID**: 003-health-backend | **Status**: Em Revisão | **Autor**: Gemini CLI
**Contexto**: Fase de Expansão - Helux Health Ingestion

## 1. Visão Geral
Este componente é responsável por receber, validar e persistir amostras de dados brutos (Raw Samples) provenientes do Apple Watch via HealthKit. O objetivo é criar um repositório centralizado de métricas de saúde vinculado ao perfil do usuário para futuras análises de performance e recuperação.

## 2. Arquitetura de Dados (Supabase/PostgreSQL)

Usaremos uma estrutura otimizada para séries temporais.

### Tabela: `health_samples`
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `UUID` | PK - Provido pelo HealthKit (`sampleUUID`) para evitar duplicatas. |
| `user_id` | `UUID` | FK - Referência a `auth.users` do Supabase. |
| `type` | `VARCHAR(50)` | Tipo da métrica (ex: `heart_rate`, `step_count`, `hrv`, `sleep_stage`). |
| `value` | `NUMERIC` | Valor numérico da amostra. |
| `unit` | `VARCHAR(20)` | Unidade (ex: `count`, `bpm`, `ms`, `percent`). |
| `start_at` | `TIMESTAMPTZ` | Timestamp de início da amostra. |
| `end_at` | `TIMESTAMPTZ` | Timestamp de fim da amostra (igual a `start_at` para pontos únicos). |
| `metadata` | `JSONB` | Dados extras (ex: modelo do Watch, versão do OS, zonas de FC). |
| `created_at`| `TIMESTAMPTZ` | Registro de inserção no banco. |

**Índices:**
- `idx_health_samples_user_type_date`: Composto por `user_id`, `type` e `start_at` para queries rápidas de histórico.
- `UNIQUE(id)`: Garante que a mesma amostra do HealthKit nunca seja inserida duas vezes.

## 3. Contratos de API (Fastify)

### Endpoint: `POST /api/health/sync`

Recebe um pacote de dados agregados do app mobile.

**Headers:**
- `Authorization: Bearer <Supabase_JWT>`

**Payload de Entrada (Exemplo):**
```json
{
  "heartRate": [
    {
      "uuid": "E621E1F8-...",
      "value": 72,
      "unit": "bpm",
      "startDate": "2026-06-15T10:00:00Z",
      "endDate": "2026-06-15T10:00:00Z",
      "metadata": { "device": "Watch Series 10" }
    }
  ],
  "steps": [
    {
      "uuid": "B123...",
      "value": 150,
      "unit": "count",
      "startDate": "2026-06-15T10:00:00Z",
      "endDate": "2026-06-15T10:05:00Z"
    }
  ],
  "hrv": []
}
```

**Respostas:**
- `202" Accepted`: Processamento iniciado (idempotência garantida pelo UUID).
- `401 Unauthorized`: Token inválido ou expirado.
- `400 Bad Request`: Payload malformado.

## 4. Lógica de Negócio e Máquina de Estados

1.  **Extração do Contexto:** O backend extrai o `user_id` do JWT do Supabase.
2.  **Deduplicação Nativa:** Tenta inserir as amostras no banco. Se houver conflito no `id` (UUID), o Postgres ignora a linha (`ON CONFLICT (id) DO NOTHING`).
3.  **Normalização:** Converte unidades caso necessário antes da inserção.
4.  **Trigger de Integração:** Após o `INSERT`, um **Database Webhook** do Supabase pode ser configurado para disparar notificações para serviços de IA ou alertas de saúde.

## 5. Critérios de Aceite Técnicos (Gherkin)

**Cenário: Sincronização de batimentos cardíacos com sucesso**
- **Given** um usuário autenticado com ID `user-123`
- **When** o app mobile envia 10 amostras de `heartRate` com UUIDs únicos
- **Then** o banco de dados deve conter exatamente 10 novos registros para `user-123`
- **And** a coluna `type` deve ser `heart_rate`

**Cenário: Tentativa de re-sincronização de dados já existentes**
- **Given** que o UUID `SAMPLE-AAA` já existe no banco
- **When** o backend recebe o mesmo UUID `SAMPLE-AAA` novamente
- **Then** o backend deve retornar sucesso (202)
- **And** o banco de dados NÃO deve criar um registro duplicado

## 6. Diretrizes de Implementação
- **Stack:** Node.js + Fastify + Supabase Client (`@supabase/supabase-js`).
- **Validação:** Usar `zod` para validar o esquema do objeto aggregator.
- **Repository Pattern:** Isolar a lógica de acesso ao Supabase em `packages/health` (novo package) ou dentro de `apps/api/src/services`.

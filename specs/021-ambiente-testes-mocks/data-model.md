# Data Model: Ambiente de Testes e Alternância de Mocks

**Spec**: [021-ambiente-testes-mocks](./spec.md) | **Fase**: Phase 1 (Modelagem de Dados)

---

## 1. Entidades de Configuração e Controle

### `DataSourceMode`
Enumeração que define a fonte de dados em uso:
```typescript
export type DataSourceMode = 'mock' | 'real'
```

### `EnvironmentConfig`
Representa o estado de configuração do ambiente de dados:
```typescript
export interface EnvironmentConfig {
  /** Fonte de dados efetiva atual */
  mode: DataSourceMode
  /** Valor padrão definido em variáveis de ambiente */
  defaultMode: DataSourceMode
  /** Se há uma sobreposição (override) ativa via UI/localStorage */
  hasOverride: boolean
  /** Identificador da persona/cenário de teste atualmente ativo */
  activePersonaId: string
  /** Timestamp da última modificação ou reset do estado de mock */
  lastResetAt: string
}
```

### `TestPersona`
Definição de um perfil/cenário canônico de teste:
```typescript
export interface TestPersona {
  id: string
  name: string
  description: string
  dataset: MockDataset
}
```

---

## 2. Entidade de Dados Canônicos (`MockDataset`)

O `MockDataset` agrega todo o estado de domínio do Helux em um único snapshot estruturado e tipado contra `@helux/types`:

```typescript
import type {
  Profile,
  AdjustedWorkoutPlanView,
  WorkoutSession,
  WorkoutAnalytics,
  TirednessAssessment,
  BodyCheckin,
  GeneticProfile,
} from '@helux/types'

export interface MockDataset {
  /** Perfil do atleta autenticado */
  profile: Profile
  /** Plano de treino atual (visualização com ajustes e variante) */
  latestPlan: AdjustedWorkoutPlanView | null
  /** Histórico recente de sessões de treino concluídas */
  workoutHistory: WorkoutSession[]
  /** Métricas analíticas agregadas de treino */
  workoutAnalytics: WorkoutAnalytics
  /** Avaliação de cansaço/recuperação do dia vigente */
  tirednessToday: TirednessAssessment
  /** Histórico de check-ins corporais */
  bodyCheckins: BodyCheckin[]
  /** Perfil e marcadores genéticos (Genera Nutri + Genera Fit) */
  genetics: GeneticProfile
  /** Exames médicos laboratoriais simulados */
  medicalExams: MockMedicalExamRecord[]
}

export interface MockMedicalExamRecord {
  id: string
  userId: string
  collectedAt: string
  category: 'sangue' | 'hormonal' | 'bioquimico' | 'outros'
  markers: Array<{
    code: string
    name: string
    value: number
    unit: string
    referenceRange: { min: number; max: number }
    status: 'normal' | 'baixo' | 'elevado' | 'critico'
  }>
}
```

---

## 3. Estado em Armazenamento Local (`MockLocalStorageState`)

Estrutura serializada e mantida no `localStorage` sob a chave `helux_mock_state_v1`:

```typescript
export interface MockLocalStorageState {
  version: 1
  personaId: string
  dataset: MockDataset
  updatedAt: string
}
```

### Regras de Transição e Validação:
1. **Inicialização**: Se `localStorage.getItem('helux_mock_state_v1')` for nulo ou inválido, carrega a persona padrão (`standard-athlete`), valida contra o schema e persiste.
2. **Mutação**: Atualizações parciais aplicam shallow/deep merge no `dataset` e atualizam `updatedAt`.
3. **Reset**: Limpa `helux_mock_state_v1` e regrava o `dataset` puro da persona selecionada a partir dos templates imutáveis.
4. **Troca de Persona**: Substitui integralmente o `dataset` pelo snapshot inicial da nova persona e grava `personaId`.

---

## 4. Personas Canônicas Pré-Configuradas

| Persona ID | Nome | Características dos Dados |
|:---|:---|:---|
| `standard-athlete` | **Atleta Padrão** | Treino A agendado para hoje, histórico de 12 treinos, cansaço 'normal', genética completa (`genera.json`), exames normais. |
| `rest-day-athlete` | **Dia de Descanso** | Sem treino agendado hoje, recuperação alta, diretrizes focadas em descanso metabólico. |
| `exhausted-athlete` | **Atleta Fadiga Extrema** | Cansaço 'exausto', HRV baixo, recomendações adaptativas ativadas no treino e nutrição. |
| `zero-state` | **Novo Usuário (Zero-State)** | Sem histórico de treinos, sem exames, onboarding inicial visível para testar telas vazias. |

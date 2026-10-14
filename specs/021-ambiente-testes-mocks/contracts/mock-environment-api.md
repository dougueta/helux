# Contract: Mock Environment & Service Adapters API

**Spec**: [021-ambiente-testes-mocks](../spec.md) | **Fase**: Phase 1 (Contratos de Interface)

---

## 1. Contrato do Provedor de Configuração (`mockEnvironment.ts`)

```typescript
export interface MockEnvironmentAPI {
  /** Retorna a fonte de dados atualmente ativa ('mock' | 'real') */
  getDataSource(): DataSourceMode

  /** Define a fonte de dados (salvando override no localStorage se em dev) */
  setDataSource(mode: DataSourceMode): void

  /** Limpa o override de localStorage e restaura o default do .env */
  clearDataSourceOverride(): void

  /** Verifica se a aplicação está rodando em modo mock */
  isMockActive(): boolean

  /** Retorna a persona atualmente selecionada */
  getActivePersona(): TestPersona

  /** Troca a persona ativa */
  setPersona(personaId: string): void

  /** Restaura os dados da persona ativa para o estado inicial das fixtures */
  resetMockData(): void

  /** Registra listener para mudanças de ambiente ou dados */
  subscribe(callback: (config: EnvironmentConfig) => void): () => void
}
```

---

## 2. Contrato do Repositório de Mock (`mockStore.ts`)

O `mockStore` encapsula a leitura e escrita local dos dados simulados:

```typescript
export interface MockStoreAPI {
  /** Obtém o snapshot atual do dataset em memória/localStorage */
  getDataset(): MockDataset

  /** Atualiza parte do dataset e persiste no localStorage */
  updateDataset(updater: (current: MockDataset) => Partial<MockDataset>): MockDataset

  /** Restaura para as fixtures padrão de fábrica da persona atual */
  reset(): MockDataset

  /** Carrega uma persona específica descartando alterações não salvas */
  loadPersona(personaId: string): MockDataset
}
```

---

## 3. Contrato de Interceptação no `apiFetch` (`api-client.ts`)

```typescript
export interface MockRequestHandler {
  (path: string, options?: RequestInit): Promise<unknown> | null
}

export interface MockRouterAPI {
  /** Tenta despachar a requisição para um handler mockado */
  dispatch(path: string, options?: RequestInit): Promise<unknown> | null
  
  /** Registra uma rota mockada */
  register(routePattern: RegExp | string, handler: MockRequestHandler): void
}
```

### Exemplo de Rotas Mapeadas:
- `GET /workout/latest-plan` → Retorna `store.getDataset().latestPlan`
- `GET /api/workouts/history` → Retorna `{ sessions: store.getDataset().workoutHistory }`
- `GET /api/tiredness-today` → Retorna `store.getDataset().tirednessToday`
- `PUT /api/tiredness-today` → Atualiza `store.updateDataset(...)` e retorna a avaliação atualizada
- `GET /api/workouts/analytics` → Retorna `store.getDataset().workoutAnalytics`
- `GET /api/profile` → Retorna `store.getDataset().profile`

---

## 4. Contrato do Componente `DevBar` (`DevBar.tsx`)

```typescript
export interface DevBarProps {
  /** Se deve ser renderizado colapsado inicialmente (default: false) */
  initialCollapsed?: boolean
  /** Callback opcional quando o modo de dados muda */
  onDataSourceChange?: (newMode: DataSourceMode) => void
}
```

### Eventos Disparados:
- `helux:data-source-change`: Emitido no objeto `window` com `{ detail: { mode: DataSourceMode } }`.
- `helux:mock-reset`: Emitido no objeto `window` com `{ detail: { personaId: string } }`.
- `helux:persona-change`: Emitido no objeto `window` com `{ detail: { personaId: string } }`.

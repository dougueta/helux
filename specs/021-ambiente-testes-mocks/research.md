# Research: Arquitetura de Ambiente de Testes e Alternância de Mocks (Full-Stack Desacoplado)

**Spec**: [021-ambiente-testes-mocks](./spec.md) | **Fase**: Phase 0 (Pesquisa Técnica e Decisões de Design)

---

## R1: Padrão Arquitetural de Interceptação e Alternância no Frontend (`apps/web`)

### Contexto
No `apps/web`, todas as páginas e componentes consomem dados através de serviços (`apps/web/src/services/*.service.ts`), que chamam `apiFetch` (`apps/web/src/services/api-client.ts`), além da autenticação do Supabase (`apps/web/src/lib/supabase-browser.ts`).

### Alternativas Analisadas
1. **MSW (Mock Service Worker)**:
   - *Prós*: Intercepta requisições de rede no nível de Service Worker (`fetch`).
   - *Contras*: Adiciona peso relevante ao bundle, complexidade com Service Worker no Next.js App Router (requisições de Server Components vs Client Components), configuração assíncrona frágil no navegador e potencial interferência com rotas locais.
2. **Adapter / Repository Pattern no `apiFetch` e Services (Recomendado)**:
   - *Prós*: Extremamente leve, zero dependências externas novas, 100% determinístico e síncrono no carregamento, funciona nativamente em Next.js (Client e Server), permite chavear entre `realFetch` e `mockRouteRegistry` em tempo de execução sem latência nem workers.
   - *Implementação*: `apiFetch` consulta o estado do provedor (`isMockMode()`). Se `true`, despacha para um roteador local de handlers mockados (`mockHandlers[path]`); se `false`, executa o `fetch` HTTP padrão.
3. **Mocks duplicados por componente (Hooks ad-hoc)**:
   - *Contras*: Viola DRY, quebra centralização e dificulta persistência e reset global.

### Decisão
Adotar o **Mock Client Adapter** centrado em `api-client.ts` integrado a um `MockRouter` tipado. O `apiFetch` verifica o modo ativo (`getDataSource() === 'mock'`). Se estiver no modo mock, delega para `dispatchMockRequest(path, options)`.

---

## R2: Gerenciamento de Configuração Híbrida (`.env` + Override na UI)

### Contexto
O usuário definiu que a aplicação deve ter um valor padrão via variável de ambiente, mas deve permitir alternância instantânea na UI sem reiniciar servidores.

### Decisão de Design
- **Variável de Ambiente Padrão**: `NEXT_PUBLIC_DATA_SOURCE=mock|real` (default no ambiente de desenvolvimento é configurável; se ausente, default é `real` ou `mock` conforme flag de dev).
- **Storage de Override**: `localStorage.getItem('helux_data_source_override')`.
- **Precedência**:
  1. Se `process.env.NODE_ENV === 'production'`: **sempre `real`** (segurança absoluta, mock desabilitado).
  2. Se existir override explícito no `localStorage` ('mock' ou 'real'): utiliza o valor do `localStorage`.
  3. Caso contrário: utiliza `process.env.NEXT_PUBLIC_DATA_SOURCE || 'mock'` (em desenvolvimento local).
- **Sincronização**: O componente de Dev Bar emite evento customizado (`window.dispatchEvent(new CustomEvent('helux:data-source-change'))`) e força revalidação suave das queries/rotas para reatividade imediata.

---

## R3: Persistência Local e Mecanismo Atômico de Reset

### Contexto
No modo mock, mutações (ex: concluir um treino, atualizar nível de cansaço, registrar exame) devem ser gravadas para permitir testar fluxos sequenciais, preservando alterações após recarregamento (F5), mas com possibilidade de restauração imediata ao estado inicial das fixtures canônicas.

### Decisão de Design
- **Fixtures Canônicas**: Módulos TypeScript puros exportando objetos congelados (`Object.freeze(...)`) das entidades padrão, validados estritamente contra as interfaces de `@helux/types`.
- **Store Local (`MockLocalStore`)**:
  - Armazenamento em chave única de namespace: `helux_mock_state_v1`.
  - Ao inicializar: se a chave não existir no `localStorage`, carrega o clone profundo (`structuredClone`) das fixtures canônicas e grava.
  - Nas mutações: executa a operação (ex: `state.tirednessToday = updated`) e persiste no `localStorage`.
  - **Reset**: Remove a chave do `localStorage`, recarrega as fixtures canônicas em memória e dispara notificação de reset. Tempo de execução < 10ms.

---

## R4: Dev Bar UI (Design System v2 Alinhado)

### Contexto
O Helux utiliza o Design System v2 (`helux-v2.css`). A Dev Bar deve ser elegante, discreta, flutuante ou acoplada ao rodapé em desenvolvimento, sem poluir a experiência visual do atleta.

### Especificação da Dev Bar
- **Visibilidade**: Renderizada apenas quando `process.env.NODE_ENV !== 'production'`.
- **Posição**: Barra flutuante compacta no canto inferior (ou dock colapsável).
- **Controles**:
  1. **Status Pill**: Badge indicativo (`MOCK DATA` em âmbar/verde, `REAL DATA` em ciano/azul).
  2. **Switch Button**: Botão para alternar entre Mock e Real com confirmação.
  3. **Persona Dropdown**: Seletor de cenário pré-configurado:
     - *Atleta Padrão (Intermediário - Dia de Treino)*
     - *Atleta em Dia de Descanso (Rest Day)*
     - *Atleta Exausto / Baixa Recuperação (Alta Fadiga)*
     - *Iniciante / Zero-State (Sem histórico)*
  4. **Reset Button**: Botão para restaurar os dados do cenário selecionado ao padrão de fábrica.

---

## R5: Modo Mock no Backend API Fastify (`apps/api`)

### Contexto
O usuário selecionou a Opção C (Full-Stack Desacoplado). A API também deve suportar modo mock para testes automatizados e isolamento de banco.

### Decisão de Design
- Na API, variável `DATA_SOURCE=mock|real` (ou flag nos plugins Fastify).
- Criação de uma camada de repositório/serviço que pode instanciar `MockSupabaseClient` ou repositórios em memória quando `DATA_SOURCE === 'mock'`.
- Isso permite rodar `pnpm --filter @helux/api test` sem necessidade de banco Supabase rodando localmente nem token do Supabase em CI.

---

## R6: Isolamento de Segurança e Tree-Shaking

### Decisão
- Todos os arquivos da infraestrutura de mock e a Dev Bar ficam sob guardas de compilação:
  ```typescript
  if (process.env.NODE_ENV === 'production') {
    // Retorna implementação vazia / nula garantindo exclusão no build final
  }
  ```
- Nenhuma chave sensível nem fixture de teste é exposta em builds de produção.

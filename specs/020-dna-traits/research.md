# Research: Marcadores Genéticos na Tela DNA

## 1. Onde estão os marcadores

- **Decision**: extrair do `apps/api/data/genetics/genera.json`, seções `fit.{pontos_de_atencao, cuidados_relevantes, curiosidades, achados_adicionais}` e `painel_saude_esportiva.resultados`.
- **Rationale**: é a única fonte de dados genéticos do sistema. Não há tabela de genética no Supabase (`supabase/migrations/` só tem check-ins, planos, mesociclos, perfil de treino e cansaço). O parser atual (`parseGeneraJson`) já lê essas mesmas seções para derivar o resumo, mas descarta as entradas.
- **Alternatives**: criar tabela `genetic_traits` no Supabase — rejeitado (YAGNI; app de usuário único, arquivo já versionado; exigiria migração e importação).

## 2. Forma do contrato

- **Decision**: `GeneticProfileView = GeneticProfile & { traits: GeneticTrait[] }`, devolvido por `GET /genetic-profile`. `GeneticProfile` não muda.
- **Rationale**: `GeneticProfile` entra em `PlanInput` e nos prompts/regras de IA (`packages/ai/src/prompts.ts`, `rules.ts`); mudar seu tipo mexeria no planejamento. Campo aditivo mantém compatibilidade com o web antigo e com o botão de gerar treino (que reenvia o perfil em `POST /workout/generate`; `buildSystemPrompt` só lê os campos do resumo).
- **Alternatives**: rota nova `/genetic-profile/traits` — rejeitada (duas requisições para uma tela; a 012 já espera `traits` no perfil).

## 3. Nível, risco, ordem, chave

- **Decision**: nível por regra textual (FR-005); risco se a seção for `pontos_de_atencao`/`cuidados_relevantes` ou `categoria ∈ {ponto_atencao, cuidado_relevante, lesao}`; ordem: pontos de atenção → cuidados relevantes/lesões → demais na ordem do arquivo (sort estável por prioridade); chave `${snp}:${slug(caracteristica)}` e dedupe por essa chave.
- **Rationale**: o teste não traz número; a categoria e o início da frase são sinais consistentes no arquivo real (21 entradas únicas; COL1A1 e PPARD aparecem com o mesmo SNP para traços diferentes, por isso a chave inclui o traço).
- **Alternatives**: dedupe só por SNP (perde "ligamento cruzado"); nível fixo por seção (perde o "Sem predisposição" das curiosidades).

## 4. Estados da tela

- **Decision**: `loadGeneticProfile()` no servidor devolve `{ status: 'ok', profile } | { status: 'missing' } | { status: 'error' }`: 404 → `missing`; outro status não-ok, JSON inválido ou falha de rede → `error`. `DnaClient` mostra: `missing` → "Perfil genético não carregado"; `ok` sem traits → "Marcadores ainda não disponíveis"; `error` → "Não foi possível carregar seu DNA".
- **Rationale**: hoje 404 e falha viravam `null` e o mesmo texto; o genera malformado gera 500 na API (o parser lança), o que cai em `error` (clarificação 5).

## 5. Fita com muitos genes

- **Decision**: `strandGenes(traits)` = primeiros 4 genes únicos na ordem (risco primeiro).
- **Rationale**: `MarkerStrand` distribui os rótulos numa linha de 18 px; com 21 genes em 320 px eles se sobrepõem. O desenho v2 mostra 4.

## 6. Hook órfão

- **Decision**: remover `apps/web/src/hooks/useGeneticProfile.ts` (sem testes próprios, sem import). Manter `services/genetics.service.ts` (usado por `useWorkoutPlan`).
- **Rationale**: a página DNA é componente de servidor com cache de 1 h; um hook cliente duplicaria o fetch.

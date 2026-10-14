# Quickstart: Guia de Uso do Ambiente de Testes Mock/Real

**Spec**: [021-ambiente-testes-mocks](./spec.md) | **Fase**: Phase 1

---

## 1. Iniciando no Modo Mock

Para desenvolver ou testar o frontend sem subir backend ou banco de dados:

1. Configure seu `.env.local` em `apps/web/` (opcional, pois `mock` é o fallback padrão se ausente):
   ```bash
   NEXT_PUBLIC_DATA_SOURCE=mock
   ```

2. Inicie a aplicação web:
   ```bash
   pnpm --filter @helux/web dev
   ```

3. Abra no navegador em `http://localhost:3000`. Todas as telas funcionarão imediatamente com dados simulados e autenticação fake transparente.

---

## 2. Alternando em Tempo de Execução via Dev Bar

Quando a aplicação estiver rodando em ambiente local (desenvolvimento):

1. Localize a **Dev Bar** no rodapé da tela.
2. Observe o badge indicativo:
   - `[MOCK DATA]` (em cor âmbar/verde): dados locais simulados.
   - `[REAL DATA]` (em cor ciano/azul): conectado à API e Supabase reais.
3. Para alternar, clique no botão **"Alternar para Real"** ou **"Alternar para Mock"**.
4. A página atualizará seu estado com a nova fonte de dados selecionada. O valor fica salvo no `localStorage` do navegador para manter sua escolha nas próximas sessões.

---

## 3. Testando Mutações e Reset de Dados

1. Estando no modo mock, execute qualquer ação de escrita (por exemplo, altere seu nível de cansaço para "Exausto" ou conclua uma sessão de treino).
2. Recarregue a página (F5): a alteração permanecerá visível graças à persistência local (`localStorage`).
3. Para voltar ao estado padrão de fábrica das fixtures:
   - Abra a **Dev Bar** e clique em **"Resetar Dados"**.
   - O estado local será limpo e restaurado instantaneamente.

---

## 4. Testando Diferentes Personas de Teste

Na Dev Bar, utilize o seletor **Persona**:
- **Atleta Padrão**: Treino do dia ativo, histórico consolidado.
- **Dia de Descanso**: Sem treino no dia, foco em recuperação metabólica.
- **Atleta Fadiga Extrema**: Cansaço alto para verificar regras e alertas de recuperação.
- **Novo Usuário**: Estado inicial (zero-state) sem registros para testar primeiras experiências.

---

## 5. Rodando Testes Automatizados com Mocks

Execute os testes unitários e de integração sem conexões externas:

```bash
# Rodar testes do frontend com fixtures
pnpm --filter @helux/web test

# Rodar testes da API
pnpm --filter @helux/api test
```

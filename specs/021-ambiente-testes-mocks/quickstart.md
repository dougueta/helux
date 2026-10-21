# Quickstart: ambiente de testes mock/real

**Spec**: [021-ambiente-testes-mocks](./spec.md) · atualizado na implementação (2026-10-20), conforme a revisão R-A…R-H do plano.

---

## 1. Ligar o modo mock

- **Pelo `.env.local`** de `apps/web/`: `NEXT_PUBLIC_DATA_SOURCE=mock` (sem a variável, o padrão é `real`).
- **Pela Dev Bar**: com `pnpm --filter @helux/web dev`, o selo no canto inferior direito, acima do menu, mostra `Real data` ou `Mock data`. Toque para abrir e use **"Usar dados mockados"**. A escolha fica no cookie `helux-data-source` e vale para o middleware, as páginas de servidor e o navegador. A página recarrega.

Em modo mock não há login, Supabase nem rede. Nem a API precisa estar no ar.

Em produção (`NODE_ENV=production`) o modo é sempre `real`. A Dev Bar e o código de mock nem entram no bundle de cliente (conferido no `.next/static` do build).

## 2. Escritas e reset

Concluir treino, mudar cansaço, editar perfil, salvar check-in, iniciar/encerrar fase, marcar descanso e trocar alimento: tudo grava em `localStorage['helux_mock_state_v1']` e sobrevive ao F5. **"Resetar dados de teste"** na Dev Bar volta para as fixtures da persona.

**Limitação (R-C)**: o que a página monta no servidor usa o dataset **inicial** da persona, porque o servidor não lê o `localStorage`. Isso vale para os check-ins e a sequência da Home, as sessões recentes de Treinos e a tela DNA. O plano de treino e todas as telas que buscam dados no cliente refletem as escritas.

## 3. Personas (seletor na Dev Bar)

| Persona | O que mostra |
|---|---|
| Atleta padrão | Sessão B pendente, 12 treinos no mês, cansaço normal, genética completa, fase de dieta ativa |
| Dia de descanso | Mesociclo sem sessão hoje; nutrição em dia de descanso |
| Fadiga extrema | Cansaço exausto (HRV 34): treino reduzido e card de recuperação na nutrição |
| Novo usuário (zero-state) | Sem plano ("gerando"), histórico, check-ins, perfil, fase e genética |
| Erro de comunicação | Toda leitura responde HTTP 503 |

## 4. Fora desta entrega

- Fixture de exames: entra com a 019, que ainda não tem telas (R-E).
- `apps/mobile`: despriorizado (web-only).
- A API não tem `DATA_SOURCE`: os testes de integração dela já usam `__tests__/helpers/fake-supabase.ts` (R-F).

## 5. Verificação final (T019, 2026-10-20)

- `pnpm test`: web 560, api 181, ai 121, workouts 100, nutrition 76, genetics 34, health 27, types 17, mobile 9, todos verdes. O guard do design system está incluído.
- `pnpm typecheck` 9/9 e `pnpm build` 2/2 verdes.
- **Validação manual pendente (com o usuário)**: abrir o app em mock, passar pelas telas com cada persona, concluir um treino e dar F5, e depois resetar.

# Contrato: Chat do Agente Nutricionista (SSE)

## `GET /api/nutrition/chat?phaseId=<uuid>`
Sem `phaseId` → conversa da fase ativa. `200 { "phase": DietPhase, "messages": NutritionChatMessage[] }` em ordem cronológica. Sem fase → `200 { phase: null, messages: [] }`.

## `POST /api/nutrition/chat`
Body `{ "message": string (1–2000) }`. Exige fase ativa (`409 no-phase` sem ela).

Resposta `200`, `Content-Type: text/event-stream`, eventos:

| Evento | `data` | Quando |
|---|---|---|
| `start` | `{ "userMessageId": string }` | mensagem do usuário gravada |
| `delta` | `{ "text": string }` | cada trecho de texto do modelo |
| `done` | `{ "agentMessageId": string }` | resposta completa gravada |
| `error` | `{ "message": string }` | falha da IA / refusal final; nada do agente é gravado |

Fluxo no servidor:
1. grava a mensagem do usuário (`role: user`, `day` = hoje, `context`);
2. monta o pedido (abaixo) e chama o stream;
3. repassa cada `text_delta` como `delta`;
4. após `finalMessage()`: `stop_reason === "refusal"` → `error` amigável; senão grava a resposta e envia `done`.

## Pedido à Anthropic (`@helux/ai`, `streamNutritionChat`)

```ts
client.beta.messages.stream({
  model: 'claude-opus-5-5',
  max_tokens: 4000,
  output_config: { effort: 'low' },
  betas: ['server-side-fallback-2026-07-01'],
  fallbacks: 'default',
  system: [
    { type: 'text', text: STABLE, cache_control: { type: 'ephemeral' } }, // persona, regras, perfil nutrigenômico, fase
    { type: 'text', text: DAY },                                         // plano do dia, treino do dia, cansaço, data
  ],
  messages: [...last20OfPhase, { role: 'user', content: message }],
})
```

Regras do prompt (`buildNutritionSystemPrompt`):
- especialista em nutrição esportiva com viés genético; responde em pt-BR, claro e motivador;
- **nunca** sugerir item com lactose quando `intoleranciaLactose` (citar alternativa zero lactose/vegetal);
- justificar com o marcador genético e a demanda do treino quando pertinente (FR-009);
- substituições: priorizar alimentos do catálogo; deixar claro que só a troca rápida altera o plano;
- não prescrever medicamentos nem doses fora de faixas seguras gerais; disclaimer em temas clínicos.

O bloco `STABLE` não pode conter data/hora nem nada que mude a cada mensagem (cache por prefixo). Os testes mockam `@anthropic-ai/sdk` (padrão do projeto) — nenhuma chamada real.

## Web
`fetch` com `Authorization` + leitura incremental do corpo (`ReadableStream`), parse de linhas `event:`/`data:`. Durante o stream o botão de enviar fica desabilitado; erro → aviso "O agente não respondeu agora. Tente de novo." e o plano do dia continua disponível.

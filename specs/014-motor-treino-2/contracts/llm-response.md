# Contrato: resposta JSON pedida à IA (mesociclo)

Cada sessão continua com `letter`, `focus`, `exercises[]`. Cada exercício ganha:

- `"phase"`: `"aquecimento"` | `"principal"` | `"volta-calma"` (obrigatório no prompt; tolerado ausente).
- `"supersetGroup"`: opcional, string curta (ex.: `"b1"`), igual nos 2 exercícios consecutivos do principal que formam um biset; no máximo 2 bisets por sessão; os dois com o mesmo número de séries.

Instruções do prompt:
- Aquecimento: 2–4 itens (mobilidade articular do foco da sessão, cardio leve respeitando o limite de intensidade, séries de aproximação), `sets` 1, `reps` descritivo ("5 min", "10 por lado"), `weight` "—". Nomes livres.
- Principal: somente nomes do catálogo (regra existente).
- Volta à calma: 2–4 itens (alongamentos dos músculos trabalhados, cardio leve/caminhada respeitando o limite), mesmo formato do aquecimento. Nomes livres.
- Seção "Progressão de carga calculada — OBRIGATÓRIO" no prompt do usuário quando `loadProgression` não for vazio: lista `nome: carga anterior → carga nova (ação) — motivo`; a IA deve manter preferencialmente esses exercícios e usar exatamente essas cargas. (A API sobrescreve de qualquer forma.)

Tolerância no parser/normalização: fase desconhecida → principal; bisets inválidos descartados; ordem de fases corrigida.

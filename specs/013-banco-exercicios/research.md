# Research — Spec 013

## R1. Onde mora o catálogo de animações

- **Decision**: `packages/types/src/motion.ts` exporta `MOTION_CATALOG` (runtime const) e o tipo `MotionKey`.
- **Rationale**: `apps/web` depende de `@helux/types` mas não de `@helux/ai` (que puxa o SDK da Anthropic). O catálogo precisa ser lido pelos dois lados: pela IA (resolver/medir) e pela web (garantir preset para cada chave).
- **Alternatives**: (a) catálogo em `@helux/ai` e web dependendo de ai — rejeitado (dependência pesada no bundle web); (b) duplicar a lista — viola o princípio IV.

## R2. Como animar padrões de membros inferiores e core

- **Decision**: novo tipo de preset `pose`: duas poses de corpo inteiro (cabeça, ombro, cotovelo, mão, quadril, joelho, tornozelo, ponta do pé) interpoladas linearmente com o mesmo `easeIO`; `mirror` para vista frontal simétrica; `scene` (chão, banco, banco inclinado, assento, barra fixa, polia, nenhum); `implAt` indica onde desenhar o implemento (mão, ombro, quadril, tornozelo).
- **Rationale**: mantém o estilo e o loop atuais (SVG + rAF + triângulo de fase), sem dependências. Presets de braço existentes ficam intactos (testes atuais continuam válidos).
- **Alternatives**: cinemática inversa/esqueleto genérico — excessivo (YAGNI); Lottie/vídeos — dependência externa e fora do DS v2.

## R3. Resolução da animação por exercício

- **Decision**: regras ordenadas `{ when: { pattern?, muscleGroup?, name? (regex) }, motion }`, primeira que casar vence; último recurso `press-flat` (marcado como genérico).
- **Rationale**: o padrão sozinho é amplo demais (isolamento = 33 exercícios de 8 grupos); nome + grupo muscular resolvem sem precisar anotar cada entrada manualmente.
- **Alternatives**: campo `motion` explícito em cada uma das 122 entradas — mais verboso e fácil de esquecer em entradas novas; as regras cobrem as novas automaticamente.

## R4. Métrica de animação genérica/incorreta

- **Decision**: `measureMotionCoverage(bank, resolve)` → `{ total, generic, genericPct, pressFlat, pressFlatPct, maxShare }`. Genérico = resolvido pelo último recurso OU animação cujo `MOTION_CATALOG[key]` não declara o padrão do exercício (para `isolamento`, o grupo muscular). O teste roda a medição com o resolvedor legado (cópia de `motionFor`) → 81/102 (79,4%) e 63/102 (61,8%) — e com o novo, exigindo ≤ 10%, ≤ 12% e maxShare ≤ 20%.
- **Rationale**: "antes/depois" fica executável e permanente, travando regressões.

## R5. Carga articular e articulações sinalizadas

- **Decision**: `stress: { joelho, ombro, lombar }` (0–2) = `PATTERN_STRESS[pattern]` sobrescrito por `STRESS_OVERRIDES[id]`. Articulações sinalizadas por regex nos alertas: joelho (`joelho|patelar|menisco|cruzado`), ombro (`ombro|manguito`), lombar (`lombar|coluna|h[ée]rnia|disco`); se o alerta é articular mas sem região (`tend[ãa]o|tendinite|ligamento|articula|col[áa]geno`) → as três.
- **Rationale**: alertas chegam como texto livre (`pontos_de_atencao` do laudo Genera); o parser de regras genéticas já usa correspondência por palavras (`ligamento`, `ombro`).
- **Alternatives**: estender `GeneticProfile` com articulações estruturadas — exigiria mexer no parser da genética (spec 017 em paralelo); fica como evolução.

## R6. Critério de equivalência entre padrões

- **Decision**: famílias: `agachar ↔ dobrar-quadril`, `empurrar-horizontal ↔ empurrar-vertical`, `puxar-horizontal ↔ puxar-vertical`. Candidato elegível se, para toda articulação sinalizada, `stress(cand) ≤ stress(orig)` e em ao menos uma `stress(cand) < stress(orig)`. Até 2 candidatos, maior compatibilidade primeiro, sem repetir equipamento entre eles. Compatibilidade = regra de equipamento atual + 4 × Σ(stress(orig) − stress(cand)) nas articulações sinalizadas, limitada a 50–99.
- **Rationale**: é critério derivado da genética + biomecânica (nunca lista manual de pares). O original fica com ajuste 0 (preserva o 74 do teste atual).

## R7. Implemento de peso corporal

- **Decision**: `peso-corporal` passa a mapear para o implemento `bodyweight` (não desenha implemento), no lugar de `machine` (que desenhava trilhos de máquina em exercícios de peso corporal).

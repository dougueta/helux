# Contrato — `buildVariants(exerciseName, geneticProfile): Variant[]` (`@helux/ai`)

Assinatura inalterada. Comportamento:

1. Exercício fora do banco → `[]`.
2. Original (`rec: true`) + 1 variante por equipamento distinto do mesmo padrão (como hoje).
3. Articulações sinalizadas = regex nos `alertas` (joelho / ombro / lombar; alerta articular sem região = todas).
4. Compatibilidade = regra de equipamento atual + `4 × Σ (stress(orig) − stress(cand))` nas articulações sinalizadas; faixa 50–99. Original: ajuste 0.
5. Se há articulação sinalizada e o padrão tem família (`agachar↔dobrar-quadril`, `empurrar-horizontal↔empurrar-vertical`, `puxar-horizontal↔puxar-vertical`): até 2 equivalentes do padrão irmão com `stress ≤ original` em todas as sinalizadas e `<` em ao menos uma; maior compatibilidade primeiro; equipamentos distintos entre si. Marcados `crossPattern: true`; `why` cita o padrão de origem e a articulação.
6. Lista ordenada por `match` desc; `betterFit` na maior não-recomendada se `match > rec.match`.
7. `motion` = `resolveMotion(entry)`; `implement`: barra→barbell, halteres→dumbbell, maquina-cabo→cable, peso-corporal→bodyweight.

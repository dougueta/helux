# UI Contracts: Melhorias pós primeiro uso (026)

Nenhum endpoint novo ou alterado. Os contratos abaixo são de componentes e rotas da web.

## `Stepper` (`apps/web/src/components/ui/Stepper.tsx`)

```ts
Stepper({
  value: number
  unit: string
  step: number
  min?: number            // padrão 0 (igual a hoje)
  max?: number            // NOVO: kg 500, reps 100
  decimals?: number       // NOVO: kg 2, reps 0; padrão 2
  onChange: (value: number) => void
  label: string
  disabled?: boolean
  error?: boolean
})
```

- O valor central é um campo de texto com `inputMode="decimal"` (quando `decimals > 0`) ou `"numeric"`, e com `aria-label={label}`.
- Fora de edição, mostra `formatNumber(value)` (vírgula decimal, até 2 casas).
- Durante a edição, cada texto válido chama `onChange` com o valor normalizado (se ele mudou), para que concluir a série sem sair do campo salve o valor digitado (revisão do PR #20). Blur e Enter só encerram a edição e mostram o valor normalizado. Com entrada vazia ou inválida, `onChange` não é chamado e o campo volta a mostrar `value` ao sair. Escape restaura o valor de antes da edição.
- Ao focar, o rascunho começa com o número cru (sem separador de milhar nem arredondamento); focar e sair sem mudar o texto não chama `onChange`. Se `value` muda de fora durante a edição, o rascunho passa a mostrar o novo valor.
- "−" chama `onChange(max(min, roundTo(value − step, decimals)))`. "+" chama `onChange(min(max, roundTo(value + step, decimals)))`. Os botões encerram o rascunho aberto.
- O campo fica fora da região `aria-live`; só as mudanças dos botões são anunciadas.
- Os botões mantêm os rótulos `diminuir {label}` / `aumentar {label}` (testes atuais continuam válidos).

`CurrentSet` passa `decimals={2} max={500}` para kg e `decimals={0} max={100}` para reps.

## `ExerciseSheet` (`apps/web/src/components/workout/ExerciseSheet.tsx`)

- `onApply` passa a ser **opcional**. Sem ele (modo só leitura), a aba Variantes lista as variantes sem o botão de troca. Todo o resto (demonstração, passos, músculos, cadência) fica igual.

## `PlanExerciseList` (`apps/web/src/components/workout/PlanExerciseList.tsx`)

```ts
PlanExerciseList({
  exercises: PlannedExercise[]
  onSelect?: (index: number) => void   // NOVO: linhas viram botões "ver execução de {nome}"
})
```

- As linhas principais passam a mostrar o descanso: `descanso 90s` ou `sem descanso antes do par`, via `restSecondsAfterSet({ exercises, exerciseIndex, hasPendingSets: all true })`.
- Sem `onSelect`, a lista se comporta como hoje (não tocável).

## Rota `/treinos/proximo`

- `page.tsx` (server): exige sessão (`redirect('/login')`) e busca `/workout/latest-plan` como `/treinos/page.tsx`.
- `ProximoTreinoClient`:
  - Cabeçalho: botão voltar, `WeekBadge`, "Treino {letra} — {foco}" e a contagem de exercícios principais (como na aba Treinos).
  - `TirednessSelector` não entra (é só leitura). Se `today.changes` existir, mostra a lista de ajustes aplicados, só como texto.
  - `PlanExerciseList` com `onSelect`, que abre `ExerciseSheet` sem `onApply`.
  - Rodapé fixo:
    - sem sessão ativa: "Iniciar treino", que usa `useTirednessFlow(...).openStart()` como a Home;
    - com sessão ativa: "Continuar treino" → `/workout`.
  - Sem `today`: `router.replace('/treinos')`.

## Pontos de entrada

- **Home** (`HomeClient`): botão secundário "Ver treino" (`Link` para `/treinos/proximo`) logo abaixo de "Iniciar treino", visível sempre que `today` existir.
- **Treinos** (`TreinosClient`): link "Ver treino completo" no `SectionHeader` do treino atual. A `PlanExerciseList` da aba ganha `onSelect`, que abre a mesma `ExerciseSheet` só leitura.

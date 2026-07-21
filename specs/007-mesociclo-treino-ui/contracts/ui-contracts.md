# UI Component Contracts: Visibilidade do Mesociclo na Home

Contratos de props dos componentes novos — permitem construir e testar cada um isoladamente com dados mockados, antes da integração final em `HomeClient.tsx` (que depende do endpoint real de `006-mesociclo-treino-backend`).

## `UpcomingSessionsList`

```tsx
interface UpcomingSessionsListProps {
  sessions: Array<{ letter: string; focus: string }>
}

export function UpcomingSessionsList(props: UpcomingSessionsListProps): JSX.Element | null
```

- Retorna `null` (não renderiza nada) quando `sessions.length === 0`.
- Renderiza cada item como um `Chip` (não-accent) com o texto `"Treino {letter} — {focus}"`.
- Layout horizontal com scroll interno (`overflow-x: auto`) contido — nunca causa scroll horizontal na página inteira.
- Sem qualquer renderização de data.

## `RecoveryAdjustedBadge`

```tsx
interface RecoveryAdjustedBadgeProps {
  reason?: string
}

export function RecoveryAdjustedBadge(props: RecoveryAdjustedBadgeProps): JSX.Element | null
```

- Retorna `null` quando `reason` é `undefined` (o chamador só passa `reason` quando `today.adjusted === true`).
- Renderiza um `Chip` com `accent` + ícone + texto curto (ex.: `"⚡ Ajustado pelo recovery de hoje"`); `reason` fica disponível via `title`/tooltip, não precisa aparecer no texto visível do badge.

## `MesocycleProgress`

```tsx
interface MesocycleProgressProps {
  completed: number
  total: number
}

export function MesocycleProgress(props: MesocycleProgressProps): JSX.Element
```

- Renderiza `total` "dots" (mesmo padrão visual do card "Semana" existente em `HomeClient.tsx`), preenchendo os primeiros `completed`.
- Exibe também o texto `"{completed} de {total} treinos concluídos"` para acessibilidade (não depender só de cor).
- `total === 0` é tratado pelo chamador (`HomeClient.tsx` só renderiza este componente quando `progress !== null`, e `progress.total` nunca é 0 por construção — ver `data-model.md` de `006-mesociclo-treino-backend`).

## Integração em `HomeClient.tsx`

```tsx
{plan.today ? (
  <>
    {/* card de hoje existente, agora com: */}
    {plan.today.adjusted && <RecoveryAdjustedBadge reason={plan.today.adjustmentReason} />}
  </>
) : (
  <EmptyMesocycleState status={plan.status} />
)}

{plan.upcoming.length > 0 && <UpcomingSessionsList sessions={plan.upcoming} />}
{plan.progress && <MesocycleProgress completed={plan.progress.completed} total={plan.progress.total} />}
```

`EmptyMesocycleState` não é um componente novo separado nesta spec — é a variação de texto já descrita em `data-model.md` (§ Estados de tela), implementada inline em `HomeClient.tsx` como o card vazio já existente hoje.

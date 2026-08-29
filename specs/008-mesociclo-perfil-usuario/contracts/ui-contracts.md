# UI Component Contracts: Personalização do Mesociclo por Perfil do Usuário e Cansaço Manual

Contratos de props dos componentes novos — permitem construir e testar cada um isoladamente com dados mockados, antes da integração final.

## `ProfileForm` (`apps/web/src/app/perfil/page.tsx` + componente)

```tsx
interface ProfileFormProps {
  initial: UserTrainingProfile | null
  saving: boolean
  onSave: (input: UserTrainingProfileInput) => Promise<void>
}

export function ProfileForm(props: ProfileFormProps): JSX.Element
```

- Campos: `goal` (textarea curta), `level` (select com as 3 opções), `trainingTime` (input texto), `timeOff` (input texto, opcional), `currentInjury` (textarea, opcional).
- Todos os campos podem ficar vazios ao salvar (FR-011) — nenhuma validação de obrigatoriedade.
- Mesmo padrão visual/estrutural de `CheckinForm.tsx` (labels, botão salvar, estado `saving` desabilita o botão).
- Quando `initial === null` (usuário nunca preencheu), formulário renderiza vazio — não é um estado de erro.

## `TirednessToggle` (renderizado em `HomeClient.tsx`)

```tsx
interface TirednessToggleProps {
  active: boolean
  onToggle: () => Promise<void>
}

export function TirednessToggle(props: TirednessToggleProps): JSX.Element
```

- Quando `active === false`: renderiza um botão/chip "Hoje estou muito cansado" — ao tocar, chama `onToggle` (equivale a `POST /api/tiredness-today`).
- Quando `active === true`: renderiza um `Chip` com `accent` indicando o estado ativo (ex.: "Cansaço sinalizado hoje") com uma ação de desfazer visível — ao tocar, chama `onToggle` (equivale a `DELETE /api/tiredness-today`), satisfazendo FR-008a.
- Mesmo padrão visual de `RecoveryAdjustedBadge` (`007-mesociclo-treino-ui`) para o estado ativo, mas sempre interativo (nunca `null`) — ao contrário do badge de recovery, que só é informativo.

## Integração em `HomeClient.tsx`

```tsx
{plan.today && (
  <>
    {plan.today.adjusted && <RecoveryAdjustedBadge reason={plan.today.adjustmentReason} />}
    <TirednessToggle active={tiredness.active} onToggle={tiredness.toggle} />
  </>
)}
```

`TirednessToggle` é renderizado independentemente de `plan.today.adjusted` — é uma ação do usuário, não um indicativo derivado do plano (diferente do `RecoveryAdjustedBadge`, que só aparece quando o ajuste já foi aplicado).

## Ícone de acesso ao perfil (cabeçalho da Home)

Não é um componente novo isolado — reaproveita o primitivo `Icon` já existente em `apps/web/src/components/ui/`, renderizado como um `Link` para `/perfil` no cabeçalho de `HomeClient.tsx`, ao lado do indicador de streak (`🔥 N sem`).

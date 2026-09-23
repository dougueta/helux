# Contratos de UI: Salvar o Treino ao Concluir

A API HTTP não muda (`POST /api/workouts/sessions`, mesmo corpo). Contratos internos de `apps/web`:

## `useFinishWorkout(finish: () => Promise<void>)` — `apps/web/src/hooks/useFinishWorkout.ts`

```ts
type FinishStatus = 'idle' | 'saving' | 'saved' | 'error'

function useFinishWorkout(finish: () => Promise<void>): {
  status: FinishStatus
  submit: () => Promise<void>   // no-op se status for 'saving' ou 'saved'
  reset: () => void             // 'error' → 'idle'; no-op em 'saving'/'saved'
}
```

- `submit()` nunca rejeita: falha de `finish` vira `status = 'error'`.
- Duas chamadas de `submit()` no mesmo tick disparam `finish` uma única vez.

## `WorkoutDoneScreen` — `apps/web/src/components/workout/WorkoutDoneScreen.tsx`

```ts
props: {
  status: 'saving' | 'saved' | 'error'
  totalDone: number
  elapsed: number
  onGoHome: () => void          // só oferecido em 'saved' ("Voltar ao início")
  onRetry: () => void           // só em 'error' ("Tentar novamente")
  onBackToWorkout: () => void   // só em 'error' ("Voltar ao treino")
}
```

| status | Título | Texto | Ações |
|---|---|---|---|
| saving | "Salvando treino…" | "Estamos registrando suas cargas." | nenhuma |
| saved | "Treino concluído" | "Mandou bem! O Helux registrou suas cargas e vai recalibrar o próximo treino." + séries/minutos | "Voltar ao início" |
| error | "Não foi possível salvar" | "Seu treino continua guardado neste aparelho. Verifique a conexão e tente de novo." | "Tentar novamente", "Voltar ao treino" |

A frase "registrou suas cargas" só aparece em `saved`.

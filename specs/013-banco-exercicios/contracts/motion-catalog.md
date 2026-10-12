# Contrato — Catálogo de animações (`@helux/types`)

```ts
export const MOTION_CATALOG: Record<MotionKey, { patterns: string[]; muscleGroups?: string[] }>
export type MotionKey = keyof typeof MOTION_CATALOG
export const GENERIC_MOTION: MotionKey = 'press-flat'
```

Chaves e cobertura:

| Chave | Padrões | Grupos (isolamento) |
|---|---|---|
| press-flat, press-incline, push-up | empurrar-horizontal | |
| press-overhead | empurrar-vertical | |
| squat, lunge, leg-press | agachar | |
| hinge, hip-thrust | dobrar-quadril | |
| row, upright-row | puxar-horizontal | |
| pull-vertical | puxar-vertical | |
| plank, crunch, leg-raise, rollout, cable-rotation | core | |
| curl | isolamento | biceps |
| pushdown, ext-lying, ext-overhead, dip | isolamento | triceps |
| fly | isolamento | peito |
| raise-lateral, raise-front | isolamento | ombro |
| shrug | isolamento | costas |
| leg-ext, hip-abduction | isolamento | quadriceps, gluteo |
| leg-curl | isolamento | posterior |
| calf-raise | isolamento | panturrilha |

Garantias:
- `apps/web` — todo `MotionKey` tem preset no `ExerciseDemo` (teste); chave desconhecida → `GENERIC_MOTION`.
- `@helux/ai` — `resolveMotion(entry)` sempre devolve um `MotionKey`.

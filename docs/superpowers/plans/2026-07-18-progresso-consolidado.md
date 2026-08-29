# Progresso Consolidado Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidar as telas `/recovery` (recovery + analytics) e `/history` (histórico de treinos) em uma única tela "Progresso", reaproveitando todos os hooks de dados existentes, seguindo a estrutura do handoff de design: grid 2×2 de stats → card de volume semanal (número + delta + bar chart) → recordes pessoais → histórico.

**Architecture:** A tela consolidada permanece na rota `/recovery` (nenhuma mudança em `NavBar.tsx`, nenhum redirect necessário — a aba "Progresso" já aponta para lá e nada mais no app referencia `/progresso`). A rota continua renderizando `RecoveryCard` (métricas de saúde diária: HRV/FC/calorias/sono/recuperação cardio) — seção que o mock de design omite, mas que é funcionalidade real em produção e não pode ser descartada — seguida pelas quatro seções novas no formato do design: `StatGrid` 2×2, card de `BarChart` de volume semanal com badge de delta calculado, lista de `PersonalRecordRow`, e lista de `SessionHistoryRow`. Isso substitui a antiga linha de stats de 3 colunas e o `VolumeChart` SVG inline. As rotas `/history` e `/history/[id]` ficam intocadas — continuam válidas para link direto e são "donas" de outro plano paralelo (Treinos v1-light) que decidirá o futuro delas. Os cinco novos componentes de apresentação (mais dois utilitários puros) são construídos de baixo para cima com testes próprios antes da tarefa final de integração na página.

**Tech Stack:** Next.js 14 (App Router), TypeScript strict, React 18, Vitest + `@testing-library/react` + `@testing-library/user-event`, `@helux/types` (tipos compartilhados via workspace).

## Global Constraints

- TypeScript strict em todos os arquivos novos/modificados.
- Testes com Vitest (`vitest`, não `jest`); arquivos em `apps/web/src/__tests__/...` espelhando o caminho do arquivo fonte; rodar via `cd apps/web && npx vitest run <path>`.
- Componentes client precisam de `'use client'` na primeira linha (apenas onde já existir — componentes de apresentação puros como os desta tela não precisam da diretiva, apenas a página `page.tsx` que já é `'use client'`).
- Estilo inline com CSS custom properties (`var(--surface-1)`, `var(--accent)`, etc. — ver `apps/web/src/app/globals.css`), não usar classes Tailwind customizadas (`bg-helux-*`, `text-helux-*`, `border-helux-*`) para novo código visual. `var(--font-jetbrains-mono)` é o token real de fonte monoespaçada usado no app (o `var(--mono)` do handoff de design não existe em `globals.css` e é traduzido para esse token real). Tokens do handoff sem equivalente real (`--accent-ink`, `--r-pill`) só são usados se uma tarefa explicitamente precisar deles — nenhuma tarefa deste plano precisa.
- Sem emojis em copy de UI (o prefixo `⚠️` do banner de dados antigos é removido no restyle da Task 8, mantendo o texto).
- **Pré-condição de dependência:** este plano assume que `apps/web/src/components/ui/icons.tsx`, `Ring.tsx`, `MatchBadge.tsx`, `Chip.tsx`, `Label.tsx` já existem, criados pelo plano companheiro `docs/superpowers/plans/2026-07-18-design-system-foundation.md`. Em `2026-07-18` esse arquivo ainda não existe neste repositório (verificado via busca) — **antes de iniciar a Task 1, confirme que `apps/web/src/components/ui/icons.tsx` existe; se não existir, execute o plano `design-system-foundation` primeiro.** Não recrie esses primitivos aqui (YAGNI).
- NÃO tocar em `HomeClient.tsx`, `DnaClient.tsx`, `apps/web/src/app/workout/page.tsx`, nem em nada sob `apps/web/src/components/workout/` — pertencem a outros planos em paralelo.
- NÃO apagar nem quebrar as rotas `apps/web/src/app/history/page.tsx` e `apps/web/src/app/history/[id]/page.tsx` — permanecem inalteradas neste plano.
- Roteamento: a tela consolidada fica em `/recovery`. `apps/web/src/components/layout/NavBar.tsx` já aponta a aba "Progresso" para `/recovery` — nenhuma modificação necessária nesse arquivo (apenas uma verificação na Task 9).

---

## File Map

**Novos:**
- `apps/web/src/lib/weekly-volume.ts`
- `apps/web/src/__tests__/lib/weekly-volume.test.ts`
- `apps/web/src/lib/format-relative-date.ts`
- `apps/web/src/__tests__/lib/format-relative-date.test.ts`
- `apps/web/src/components/progress/BarChart.tsx`
- `apps/web/src/__tests__/components/progress/BarChart.test.tsx`
- `apps/web/src/components/progress/StatGrid.tsx`
- `apps/web/src/__tests__/components/progress/StatGrid.test.tsx`
- `apps/web/src/components/progress/PersonalRecordRow.tsx`
- `apps/web/src/__tests__/components/progress/PersonalRecordRow.test.tsx`
- `apps/web/src/components/progress/SessionHistoryRow.tsx`
- `apps/web/src/__tests__/components/progress/SessionHistoryRow.test.tsx`
- `apps/web/src/__tests__/components/ui/icons.test.tsx`

**Modificados:**
- `apps/web/src/components/ui/icons.tsx` (adicionar ícones `trophy` e `arrowUp`)
- `apps/web/src/components/recovery/RecoveryCard.tsx` (restyle para padrão inline-style)
- `apps/web/src/__tests__/components/recovery/RecoveryCard.test.tsx` (verificado/realinhado com o novo markup)
- `apps/web/src/app/recovery/page.tsx` (reescrita completa — integra todos os componentes novos)

**Não tocados (verificados, sem mudança):**
- `apps/web/src/app/history/page.tsx`
- `apps/web/src/app/history/[id]/page.tsx`
- `apps/web/src/components/layout/NavBar.tsx`

---

### Task 1: Estender ícones compartilhados com `trophy` e `arrowUp`

**Files:**
- Modify: `apps/web/src/components/ui/icons.tsx`
- Test: `apps/web/src/__tests__/components/ui/icons.test.tsx`

**Interfaces:**
- Consumes: `Icon`, `ICONS`, `type IconName` já exportados por `apps/web/src/components/ui/icons.tsx` (criado pelo plano `design-system-foundation`), com o formato `Icon({ name: IconName, size?, stroke?, sw?, style? })` e `ICONS: Record<IconName, string>`.
- Produces: `ICONS.trophy` e `ICONS.arrowUp` (path data), e os literais de tipo `'trophy' | 'arrowUp'` adicionados a `IconName` — consumidos pela Task 6 (`PersonalRecordRow`, ícone `trophy`) e pela Task 9 (badge de delta do volume semanal, ícone `arrowUp`).

- [ ] **Step 1: Escrever o teste que falha**

Criar `apps/web/src/__tests__/components/ui/icons.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Icon, ICONS } from '@/components/ui/icons'

describe('icons: trophy and arrowUp', () => {
  it('includes a trophy path in the ICONS map', () => {
    expect(ICONS.trophy).toBe(
      'M7 5h10v3a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 17h4M9 20h6'
    )
  })

  it('includes an arrowUp path in the ICONS map', () => {
    expect(ICONS.arrowUp).toBe('M12 19V5M6 11l6-6 6 6')
  })

  it('renders the trophy icon as an svg path', () => {
    const { container } = render(<Icon name="trophy" size={18} stroke="var(--accent)" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.trophy)
  })

  it('renders the arrowUp icon as an svg path', () => {
    const { container } = render(<Icon name="arrowUp" size={13} stroke="var(--accent)" />)
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('d', ICONS.arrowUp)
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/icons.test.tsx`
Expected: FAIL — `ICONS.trophy` é `undefined` (chave não existe ainda).

- [ ] **Step 3: Adicionar as duas chaves ao arquivo existente**

Abrir `apps/web/src/components/ui/icons.tsx`. Localizar a declaração de tipo `IconName` (união de literais de string) e adicionar, ao final da união, estas duas linhas:

```ts
  | 'trophy'
  | 'arrowUp'
```

Localizar o objeto literal `ICONS` (`Record<IconName, string>`) e adicionar, antes do fechamento `}` do objeto, estas duas propriedades:

```ts
  trophy: 'M7 5h10v3a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 14h6M10 17h4M9 20h6',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
```

Não altere nenhuma outra chave existente do objeto — apenas insira essas duas linhas.

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `cd apps/web && npx vitest run src/__tests__/components/ui/icons.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/ui/icons.tsx apps/web/src/__tests__/components/ui/icons.test.tsx
git commit -m "feat(web): add trophy and arrowUp icons for Progresso screen"
```

---

### Task 2: Utilitário `weekly-volume` (label de semana + delta)

**Files:**
- Create: `apps/web/src/lib/weekly-volume.ts`
- Test: `apps/web/src/__tests__/lib/weekly-volume.test.ts`

**Interfaces:**
- Consumes: `WeeklyVolume { weekStart: string; tonnage: number; sessions: number }` de `@helux/types`.
- Produces: `getWeekLabel(dateStr: string): string` e `computeWeekDelta(weeks: WeeklyVolume[]): number | null` — consumidos pela Task 3 (dados do `BarChart`, via mapeamento feito na Task 9) e pela Task 9 (badge de delta acima do gráfico).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/__tests__/lib/weekly-volume.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getWeekLabel, computeWeekDelta } from '@/lib/weekly-volume'
import type { WeeklyVolume } from '@helux/types'

describe('getWeekLabel', () => {
  it('formats an ISO date into an "S<week>" label', () => {
    expect(getWeekLabel('2026-01-05')).toBe('S2')
  })
})

describe('computeWeekDelta', () => {
  it('returns null when fewer than 2 weeks of data exist', () => {
    const weeks: WeeklyVolume[] = [{ weekStart: '2026-07-13', tonnage: 1000, sessions: 3 }]
    expect(computeWeekDelta(weeks)).toBeNull()
  })

  it('returns null when the previous week has zero tonnage (avoids NaN/Infinity)', () => {
    const weeks: WeeklyVolume[] = [
      { weekStart: '2026-07-06', tonnage: 0, sessions: 0 },
      { weekStart: '2026-07-13', tonnage: 500, sessions: 2 },
    ]
    expect(computeWeekDelta(weeks)).toBeNull()
  })

  it('computes a rounded positive percentage delta between the last two weeks', () => {
    const weeks: WeeklyVolume[] = [
      { weekStart: '2026-07-06', tonnage: 1000, sessions: 3 },
      { weekStart: '2026-07-13', tonnage: 1250, sessions: 3 },
    ]
    expect(computeWeekDelta(weeks)).toBe(25)
  })

  it('computes a negative delta when volume drops', () => {
    const weeks: WeeklyVolume[] = [
      { weekStart: '2026-07-06', tonnage: 1000, sessions: 3 },
      { weekStart: '2026-07-13', tonnage: 800, sessions: 3 },
    ]
    expect(computeWeekDelta(weeks)).toBe(-20)
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `cd apps/web && npx vitest run src/__tests__/lib/weekly-volume.test.ts`
Expected: FAIL com "Failed to resolve import "@/lib/weekly-volume"" ou similar (módulo não existe).

- [ ] **Step 3: Implementar**

Criar `apps/web/src/lib/weekly-volume.ts`:

```ts
import type { WeeklyVolume } from '@helux/types'

// Ported from the old apps/web/src/app/recovery/page.tsx getWeekNum() helper.
export function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(
    ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7
  )
  return `S${weekNum}`
}

export function computeWeekDelta(weeks: WeeklyVolume[]): number | null {
  if (weeks.length < 2) return null
  const last = weeks[weeks.length - 1].tonnage
  const prev = weeks[weeks.length - 2].tonnage
  if (prev === 0) return null
  return Math.round(((last - prev) / prev) * 100)
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `cd apps/web && npx vitest run src/__tests__/lib/weekly-volume.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/weekly-volume.ts apps/web/src/__tests__/lib/weekly-volume.test.ts
git commit -m "feat(web): add weekly-volume label and delta helpers"
```

---

### Task 3: Componente `BarChart`

**Files:**
- Create: `apps/web/src/components/progress/BarChart.tsx`
- Test: `apps/web/src/__tests__/components/progress/BarChart.test.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores (componente puro de apresentação).
- Produces: `BarChart({ data: BarChartPoint[], max?: number, height?: number })` e `interface BarChartPoint { label: string; value: number }` — consumidos pela Task 9 (alimentado por `analytics.weeklyVolume` mapeado via `getWeekLabel`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/__tests__/components/progress/BarChart.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarChart } from '@/components/progress/BarChart'

describe('BarChart', () => {
  it('renders one bar per data point with its label', () => {
    const { getByText, getAllByTestId } = render(
      <BarChart data={[{ label: 'S27', value: 800 }, { label: 'S28', value: 1000 }]} />
    )
    expect(getByText('S27')).toBeInTheDocument()
    expect(getByText('S28')).toBeInTheDocument()
    expect(getAllByTestId('bar')).toHaveLength(2)
  })

  it('highlights only the last bar as the current week', () => {
    const { getAllByTestId } = render(
      <BarChart data={[{ label: 'S27', value: 800 }, { label: 'S28', value: 1000 }]} />
    )
    const bars = getAllByTestId('bar')
    expect(bars[1]).toHaveStyle({ background: 'var(--accent)' })
    expect(bars[0]).toHaveStyle({ background: 'var(--surface-3)' })
  })

  it('renders nothing for empty data without crashing', () => {
    const { container } = render(<BarChart data={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('gives every bar at least a 6% height floor even for a zero value', () => {
    const { getAllByTestId } = render(
      <BarChart data={[{ label: 'S27', value: 0 }, { label: 'S28', value: 1000 }]} />
    )
    const bars = getAllByTestId('bar')
    expect(bars[0]).toHaveStyle({ height: '6%' })
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/BarChart.test.tsx`
Expected: FAIL — módulo `@/components/progress/BarChart` não existe.

- [ ] **Step 3: Implementar**

Criar `apps/web/src/components/progress/BarChart.tsx`:

```tsx
export interface BarChartPoint {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartPoint[]
  max?: number
  height?: number
}

// Ported from the design handoff's BarChart primitive (helux-components.jsx).
// Deviation from the handoff: the middle "bar wrapper" div is given flex: 1
// here (the handoff's version omits it), because a percentage `height` only
// resolves against a wrapper that itself has a resolved (non-auto) height —
// without flex: 1 the wrapper's height stays auto and every bar collapses to 0.
export function BarChart({ data, max, height = 120 }: BarChartProps) {
  if (data.length === 0) return null

  const top = max ?? Math.max(...data.map(d => d.value), 1) * 1.12

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height }}>
      {data.map((d, i) => {
        const barHeight = Math.max(6, (d.value / top) * 100)
        const isLast = i === data.length - 1
        return (
          <div
            key={`${d.label}-${i}`}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}
          >
            <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div
                data-testid="bar"
                style={{
                  width: '100%',
                  maxWidth: 26,
                  borderRadius: '6px 6px 3px 3px',
                  background: isLast ? 'var(--accent)' : 'var(--surface-3)',
                  boxShadow: isLast ? '0 0 14px var(--accent-glow)' : 'none',
                  height: `${barHeight}%`,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-jetbrains-mono)' }}>
              {d.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/BarChart.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/progress/BarChart.tsx apps/web/src/__tests__/components/progress/BarChart.test.tsx
git commit -m "feat(web): add BarChart component for weekly volume"
```

---

### Task 4: Componente `StatGrid`

**Files:**
- Create: `apps/web/src/components/progress/StatGrid.tsx`
- Test: `apps/web/src/__tests__/components/progress/StatGrid.test.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores (componente puro de apresentação).
- Produces: `StatGrid({ stats: StatGridItem[] })` e `interface StatGridItem { value: string | number; label: string; sub: string }` — consumidos pela Task 9 (grid 2×2 alimentado por `analytics.thisWeekSessions`, `totalSessions`, `currentStreakWeeks` e `recovery.hrv`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/__tests__/components/progress/StatGrid.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatGrid } from '@/components/progress/StatGrid'

const stats = [
  { value: 3, label: 'esta semana', sub: 'treinos' },
  { value: 42, label: 'no total', sub: 'treinos' },
  { value: 6, label: 'sequência', sub: 'semanas ativas' },
  { value: 58, label: 'HRV', sub: 'recuperação' },
]

describe('StatGrid', () => {
  it('renders all 4 stat values and labels', () => {
    render(<StatGrid stats={stats} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('esta semana')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('no total')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('sequência')).toBeInTheDocument()
    expect(screen.getByText('58')).toBeInTheDocument()
    expect(screen.getByText('HRV')).toBeInTheDocument()
  })

  it('renders every sub label', () => {
    render(<StatGrid stats={stats} />)
    expect(screen.getAllByText('treinos')).toHaveLength(2)
    expect(screen.getByText('semanas ativas')).toBeInTheDocument()
    expect(screen.getByText('recuperação')).toBeInTheDocument()
  })

  it('renders a dash placeholder value as-is (e.g. missing HRV reading)', () => {
    render(<StatGrid stats={[{ value: '—', label: 'HRV', sub: 'sem dados' }]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/StatGrid.test.tsx`
Expected: FAIL — módulo `@/components/progress/StatGrid` não existe.

- [ ] **Step 3: Implementar**

Criar `apps/web/src/components/progress/StatGrid.tsx`:

```tsx
export interface StatGridItem {
  value: string | number
  label: string
  sub: string
}

interface StatGridProps {
  stats: StatGridItem[]
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
      {stats.map((s, i) => (
        <div
          key={`${s.label}-${i}`}
          style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 14 }}
        >
          <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: '-0.03em', fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
            {s.value}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: 'var(--text)' }}>{s.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/StatGrid.test.tsx`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/progress/StatGrid.tsx apps/web/src/__tests__/components/progress/StatGrid.test.tsx
git commit -m "feat(web): add StatGrid component for the 2x2 Progresso stats"
```

---

### Task 5: Utilitário `format-relative-date`

**Files:**
- Create: `apps/web/src/lib/format-relative-date.ts`
- Test: `apps/web/src/__tests__/lib/format-relative-date.test.ts`

**Interfaces:**
- Consumes: nenhuma dependência de outras tasks.
- Produces: `formatRelativeWhen(dateStr: string, now?: Date): string` — consumido pela Task 6 (`PersonalRecordRow`, campo "when" derivado de `PersonalRecord.achievedAt`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/__tests__/lib/format-relative-date.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatRelativeWhen } from '@/lib/format-relative-date'

const NOW = new Date('2026-07-18T12:00:00Z')

describe('formatRelativeWhen', () => {
  it('returns "esta semana" for a date within the last 7 days', () => {
    expect(formatRelativeWhen('2026-07-15', NOW)).toBe('esta semana')
  })

  it('returns "semana passada" for a date 7-13 days ago', () => {
    expect(formatRelativeWhen('2026-07-10', NOW)).toBe('semana passada')
  })

  it('returns "há N semanas" for a date several weeks ago', () => {
    expect(formatRelativeWhen('2026-06-20', NOW)).toBe('há 4 semanas')
  })

  it('returns "há N meses" for a date months ago', () => {
    expect(formatRelativeWhen('2026-03-01', NOW)).toBe('há 4 meses')
  })

  it('treats a future date as "esta semana" without crashing', () => {
    expect(formatRelativeWhen('2026-07-25', NOW)).toBe('esta semana')
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `cd apps/web && npx vitest run src/__tests__/lib/format-relative-date.test.ts`
Expected: FAIL — módulo `@/lib/format-relative-date` não existe.

- [ ] **Step 3: Implementar**

Criar `apps/web/src/lib/format-relative-date.ts`:

```ts
export function formatRelativeWhen(dateStr: string, now: Date = new Date()): string {
  const then = new Date(dateStr)
  const diffDays = Math.floor((now.getTime() - then.getTime()) / 86400000)

  if (diffDays < 7) return 'esta semana'
  if (diffDays < 14) return 'semana passada'

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `há ${diffWeeks} semanas`

  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths <= 1) return 'há 1 mês'
  return `há ${diffMonths} meses`
}
```

Nota: uma data futura (ou "hoje") produz `diffDays <= 0`, que cai no primeiro `if` (`< 7`) e retorna `'esta semana'` — sem NaN, sem string negativa.

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `cd apps/web && npx vitest run src/__tests__/lib/format-relative-date.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/format-relative-date.ts apps/web/src/__tests__/lib/format-relative-date.test.ts
git commit -m "feat(web): add relative date formatter for personal records"
```

---

### Task 6: Componente `PersonalRecordRow`

**Files:**
- Create: `apps/web/src/components/progress/PersonalRecordRow.tsx`
- Test: `apps/web/src/__tests__/components/progress/PersonalRecordRow.test.tsx`

**Interfaces:**
- Consumes: `Icon` de `@/components/ui/icons` (Task 1, nome `'trophy'`); `formatRelativeWhen` de `@/lib/format-relative-date` (Task 5); `PersonalRecord { exerciseName, maxWeight, reps, achievedAt }` de `@helux/types`.
- Produces: `PersonalRecordRow({ record: PersonalRecord })` — consumido pela Task 9 (lista de `analytics.personalRecords`).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/__tests__/components/progress/PersonalRecordRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonalRecordRow } from '@/components/progress/PersonalRecordRow'
import type { PersonalRecord } from '@helux/types'

describe('PersonalRecordRow', () => {
  it('renders the exercise name, weight x reps, and a relative "when" label', () => {
    const record: PersonalRecord = {
      exerciseName: 'Supino Reto',
      maxWeight: 90,
      reps: 5,
      achievedAt: new Date().toISOString().split('T')[0],
    }
    render(<PersonalRecordRow record={record} />)
    expect(screen.getByText('Supino Reto')).toBeInTheDocument()
    expect(screen.getByText('90kg × 5')).toBeInTheDocument()
    expect(screen.getByText('esta semana')).toBeInTheDocument()
  })

  it('renders the trophy icon', () => {
    const record: PersonalRecord = { exerciseName: 'Agachamento', maxWeight: 120, reps: 3, achievedAt: '2026-01-01' }
    const { container } = render(<PersonalRecordRow record={record} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/PersonalRecordRow.test.tsx`
Expected: FAIL — módulo `@/components/progress/PersonalRecordRow` não existe.

- [ ] **Step 3: Implementar**

Criar `apps/web/src/components/progress/PersonalRecordRow.tsx`:

```tsx
import type { PersonalRecord } from '@helux/types'
import { Icon } from '@/components/ui/icons'
import { formatRelativeWhen } from '@/lib/format-relative-date'

interface PersonalRecordRowProps {
  record: PersonalRecord
}

// Note: the design handoff's mock PR row shows an optional delta badge
// (e.g. "+5kg") and dims the trophy icon when `r.up` is false. Our real
// `PersonalRecord` type has no prior value to diff against — a stored PR is,
// by definition, the current best — so there is no "not up" state to
// represent and no delta to compute without fabricating data. The trophy is
// always rendered in the accent color and no delta badge is shown.
export function PersonalRecordRow({ record }: PersonalRecordRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: '13px 15px',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--surface-2)',
          border: '1px solid var(--hairline)',
        }}
      >
        <Icon name="trophy" size={18} stroke="var(--accent)" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text)' }}>{record.exerciseName}</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}>
          {formatRelativeWhen(record.achievedAt)}
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
        {record.maxWeight}kg × {record.reps}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/PersonalRecordRow.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/progress/PersonalRecordRow.tsx apps/web/src/__tests__/components/progress/PersonalRecordRow.test.tsx
git commit -m "feat(web): add PersonalRecordRow component"
```

---

### Task 7: Componente `SessionHistoryRow`

**Files:**
- Create: `apps/web/src/components/progress/SessionHistoryRow.tsx`
- Test: `apps/web/src/__tests__/components/progress/SessionHistoryRow.test.tsx`

**Interfaces:**
- Consumes: `WorkoutSessionRow { id, date, duration_s, exercises: Array<{ name, sets: Array<{ reps, weight, effort }> }>, created_at }` exportado por `apps/web/src/hooks/useWorkoutHistory.ts`.
- Produces: `SessionHistoryRow({ session: WorkoutSessionRow })` — consumido pela Task 9 (lista de `sessions` de `useWorkoutHistory()`), linkando para `/history/${session.id}` (rota `apps/web/src/app/history/[id]/page.tsx`, não modificada).

- [ ] **Step 1: Escrever os testes que falham**

Criar `apps/web/src/__tests__/components/progress/SessionHistoryRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionHistoryRow } from '@/components/progress/SessionHistoryRow'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

const session: WorkoutSessionRow = {
  id: 'abc-123',
  date: '2026-07-15',
  duration_s: 3600,
  created_at: '2026-07-15T10:00:00Z',
  exercises: [
    { name: 'Agachamento', sets: [{ reps: 8, weight: 80, effort: 8 }, { reps: 8, weight: 80, effort: 8 }] },
    { name: 'Leg Press', sets: [{ reps: 10, weight: 120, effort: 7 }] },
  ],
}

describe('SessionHistoryRow', () => {
  it('renders the exercise names and total set count', () => {
    render(<SessionHistoryRow session={session} />)
    expect(screen.getByText(/Agachamento, Leg Press/)).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument() // total sets across all exercises
  })

  it('renders the duration in minutes', () => {
    render(<SessionHistoryRow session={session} />)
    expect(screen.getByText('60')).toBeInTheDocument()
  })

  it('renders the total tonnage (sum of reps * weight across all sets)', () => {
    render(<SessionHistoryRow session={session} />)
    // (8*80)+(8*80)+(10*120) = 640+640+1200 = 2480
    expect(screen.getByText('2480kg')).toBeInTheDocument()
  })

  it('links to the session detail route', () => {
    render(<SessionHistoryRow session={session} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/history/abc-123')
  })

  it('truncates to 3 exercise names and shows a "+N" suffix for more', () => {
    const bigSession: WorkoutSessionRow = {
      ...session,
      exercises: [
        ...session.exercises,
        { name: 'Cadeira Extensora', sets: [{ reps: 12, weight: 40, effort: 6 }] },
        { name: 'Panturrilha', sets: [{ reps: 15, weight: 30, effort: 6 }] },
      ],
    }
    render(<SessionHistoryRow session={bigSession} />)
    expect(screen.getByText(/Agachamento, Leg Press, Cadeira Extensora \+1/)).toBeInTheDocument()
  })

  it('omits the duration segment when duration_s is null', () => {
    const { container } = render(<SessionHistoryRow session={{ ...session, duration_s: null }} />)
    expect(container.textContent).not.toMatch(/min/)
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que falham**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/SessionHistoryRow.test.tsx`
Expected: FAIL — módulo `@/components/progress/SessionHistoryRow` não existe.

- [ ] **Step 3: Implementar**

Criar `apps/web/src/components/progress/SessionHistoryRow.tsx`:

```tsx
import Link from 'next/link'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

interface SessionHistoryRowProps {
  session: WorkoutSessionRow
}

function formatDateBadge(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    .toUpperCase()
    .replace('.', '')
}

// h.name in the design mock has no real equivalent: WorkoutSessionRow has no
// workout-name field, only a list of exercises. This mirrors the truncation
// logic already used by the pre-consolidation apps/web/src/app/history/page.tsx
// (first 3 exercise names + "+N").
export function SessionHistoryRow({ session }: SessionHistoryRowProps) {
  const totalSets = session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const totalVolume = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((setSum, set) => setSum + set.reps * set.weight, 0),
    0
  )
  const durationMin = session.duration_s != null ? Math.round(session.duration_s / 60) : null
  const exerciseNames = session.exercises.slice(0, 3).map(e => e.name).join(', ')
  const extra = session.exercises.length > 3 ? ` +${session.exercises.length - 3}` : ''

  return (
    <Link href={`/history/${session.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--r-card)',
          padding: '13px 15px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-faint)',
            width: 38,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {formatDateBadge(session.date)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {exerciseNames}
            {extra}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{totalSets}</span> séries
            {durationMin != null && (
              <>
                {' '}
                · <span style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>{durationMin}</span> min
              </>
            )}
          </div>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--text-dim)', fontFamily: 'var(--font-jetbrains-mono)' }}>
          {totalVolume}kg
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

Run: `cd apps/web && npx vitest run src/__tests__/components/progress/SessionHistoryRow.test.tsx`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/progress/SessionHistoryRow.tsx apps/web/src/__tests__/components/progress/SessionHistoryRow.test.tsx
git commit -m "feat(web): add SessionHistoryRow component"
```

---

### Task 8: Restyle de `RecoveryCard`

**Files:**
- Modify: `apps/web/src/components/recovery/RecoveryCard.tsx`
- Modify: `apps/web/src/__tests__/components/recovery/RecoveryCard.test.tsx`

**Interfaces:**
- Consumes: `RecoveryData { date, hrv?, restingHR?, activeCalories, sleepHours?, cardioRecovery?, source }` de `@helux/types`.
- Produces: `RecoveryCard({ data: RecoveryData | null, isStale: boolean })` — assinatura **inalterada**, consumido pela Task 9 exatamente como já era consumido pela página antiga.

**Decisão:** restylizar o componente no lugar (não fundir seu markup na página) — mantém a fronteira de responsabilidade única do componente, preserva a cobertura de teste existente, e é a menor mudança possível (YAGNI) já que nenhuma outra tela depende do formato antigo.

- [ ] **Step 1: Ler o teste atual e confirmar que ele passa antes da mudança**

Run: `cd apps/web && npx vitest run src/__tests__/components/recovery/RecoveryCard.test.tsx`
Expected: PASS (3 testes, contra o componente com classes Tailwind `bg-helux-*`).

- [ ] **Step 2: Atualizar o arquivo de teste**

As asserções atuais já buscam apenas por **texto** (`/58/`, `/dados antigos/i`, `/shortcut/i`), não por classes CSS — então continuam válidas após o restyle. Reescrever o arquivo mesmo assim para deixar explícito que foi revisado contra o novo markup e remover a suposição implícita do emoji `⚠️` do texto do banner:

Substituir `apps/web/src/__tests__/components/recovery/RecoveryCard.test.tsx` por:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import type { RecoveryData } from '@helux/types'

const mockData: RecoveryData = {
  date: new Date().toISOString().split('T')[0],
  hrv: 58,
  restingHR: 52,
  activeCalories: 420,
  sleepHours: 7.5,
  cardioRecovery: 28,
  source: 'healthkit',
}

describe('RecoveryCard', () => {
  it('renders 5 metric tiles', () => {
    render(<RecoveryCard data={mockData} isStale={false} />)
    expect(screen.getByText(/58/)).toBeInTheDocument() // HRV
    expect(screen.getByText(/52/)).toBeInTheDocument() // HR
    expect(screen.getByText(/420/)).toBeInTheDocument() // Calories
    expect(screen.getByText(/7\.5/)).toBeInTheDocument() // Sleep
    expect(screen.getByText(/28/)).toBeInTheDocument() // Cardio Recovery
  })

  it('shows staleness badge when isStale', () => {
    render(<RecoveryCard data={mockData} isStale={true} />)
    expect(screen.getByText(/dados antigos/i)).toBeInTheDocument()
  })

  it('does not show the staleness badge when data is fresh', () => {
    render(<RecoveryCard data={mockData} isStale={false} />)
    expect(screen.queryByText(/dados antigos/i)).not.toBeInTheDocument()
  })

  it('renders empty-state guidance when no data', () => {
    render(<RecoveryCard data={null} isStale={false} />)
    expect(screen.getByText(/shortcut/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar o teste e confirmar que ainda passa (baseline antes do restyle de implementação)**

Run: `cd apps/web && npx vitest run src/__tests__/components/recovery/RecoveryCard.test.tsx`
Expected: PASS (4 testes) — o teste novo (`does not show...`) já passa contra o componente antigo, pois o componente antigo também só renderiza o banner condicionalmente.

- [ ] **Step 4: Restylizar o componente**

Substituir `apps/web/src/components/recovery/RecoveryCard.tsx` por:

```tsx
import type { RecoveryData } from '@helux/types'

interface RecoveryCardProps {
  data: RecoveryData | null
  isStale: boolean
}

interface MetricTileProps {
  label: string
  value: number | undefined
  unit: string
  accent?: boolean
}

function MetricTile({ label, value, unit, accent = false }: MetricTileProps) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', margin: 0 }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 22,
          fontWeight: 700,
          color: accent ? 'var(--accent)' : 'var(--text)',
          margin: 0,
        }}
      >
        {value != null ? value : '—'}
      </p>
      <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>
        {unit}
      </p>
    </div>
  )
}

export function RecoveryCard({ data, isStale }: RecoveryCardProps) {
  if (!data) {
    return (
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text)', fontSize: 16, margin: '0 0 8px' }}>Sem dados de recovery</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
          Execute o{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-jetbrains-mono)' }}>Shortcut</span> no
          iPhone para sincronizar os dados do Apple Watch.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isStale && (
        <div
          style={{
            background: 'rgba(245,183,62,0.14)',
            border: '1px solid rgba(245,183,62,0.34)',
            borderRadius: 'var(--r-sm)',
            padding: '8px 14px',
          }}
        >
          <p style={{ color: 'var(--warn)', fontSize: 13, margin: 0 }}>Dados antigos — sincronize novamente</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricTile label="HRV" value={data.hrv} unit="ms" accent />
        <MetricTile label="FC Repouso" value={data.restingHR} unit="bpm" />
        <MetricTile label="Calorias" value={data.activeCalories} unit="kcal" />
        <MetricTile
          label="Sono"
          value={data.sleepHours != null ? Math.round(data.sleepHours * 10) / 10 : undefined}
          unit="horas"
        />
        <MetricTile label="Recup. Cardio" value={data.cardioRecovery} unit="bpm" />
      </div>
      <p style={{ color: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)', textAlign: 'right', margin: 0 }}>
        Atualizado: {new Date(data.date).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `cd apps/web && npx vitest run src/__tests__/components/recovery/RecoveryCard.test.tsx`
Expected: PASS (4 testes).

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/recovery/RecoveryCard.tsx apps/web/src/__tests__/components/recovery/RecoveryCard.test.tsx
git commit -m "refactor(web): restyle RecoveryCard to the inline-style CSS-variable pattern"
```

---

### Task 9: Integrar tudo em `/recovery` (wiring final)

**Files:**
- Modify: `apps/web/src/app/recovery/page.tsx`
- Verify (no changes expected): `apps/web/src/components/layout/NavBar.tsx`

**Interfaces:**
- Consumes: `useRecovery()` → `{ data, loading, hasData, isStale }`; `useWorkoutAnalytics()` → `{ data, loading }`; `useWorkoutHistory()` → `{ sessions, total, loading, error }`; `RecoveryCard` (Task 8); `StatGrid`/`StatGridItem` (Task 4); `BarChart`/`BarChartPoint` (Task 3); `PersonalRecordRow` (Task 6); `SessionHistoryRow` (Task 7); `getWeekLabel`/`computeWeekDelta` (Task 2); `Icon` de `@/components/ui/icons` (Task 1, ícone `arrowUp`); `Label` de `@/components/ui/Label` (primitivo do plano `design-system-foundation`).
- Produces: página final em `/recovery` — não é consumida por nenhuma task futura deste plano (é o último passo).

Não existe convenção de teste de página (`page.tsx`) neste repo — nenhum outro arquivo em `apps/web/src/app/**/page.tsx` tem teste dedicado. A verificação desta task é: (a) a suíte completa de testes continua verde, incluindo todos os testes das Tasks 1–8; (b) `tsc --noEmit` sem erros.

- [ ] **Step 1: Rodar a suíte completa antes da mudança (baseline)**

Run: `cd apps/web && npx vitest run`
Expected: PASS em todos os testes existentes, incluindo os das Tasks 1–8.

- [ ] **Step 2: Reescrever a página**

Substituir `apps/web/src/app/recovery/page.tsx` por:

```tsx
'use client'

import { RecoveryCard } from '@/components/recovery/RecoveryCard'
import { StatGrid, type StatGridItem } from '@/components/progress/StatGrid'
import { BarChart, type BarChartPoint } from '@/components/progress/BarChart'
import { PersonalRecordRow } from '@/components/progress/PersonalRecordRow'
import { SessionHistoryRow } from '@/components/progress/SessionHistoryRow'
import { Icon } from '@/components/ui/icons'
import { Label } from '@/components/ui/Label'
import { useRecovery } from '@/hooks/useRecovery'
import { useWorkoutAnalytics } from '@/hooks/useWorkoutAnalytics'
import { useWorkoutHistory } from '@/hooks/useWorkoutHistory'
import { getWeekLabel, computeWeekDelta } from '@/lib/weekly-volume'

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ h = 96 }: { h?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', height: h }}
    />
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', margin: '20px 0 12px' }}>
      {title}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RecoveryPage() {
  const { data: recovery, loading: recoveryLoading, isStale } = useRecovery()
  const { data: analytics, loading: analyticsLoading } = useWorkoutAnalytics()
  const { sessions, loading: historyLoading, error: historyError } = useWorkoutHistory()

  const stats: StatGridItem[] = analytics
    ? [
        { value: analytics.thisWeekSessions, label: 'esta semana', sub: 'treinos' },
        { value: analytics.totalSessions, label: 'no total', sub: 'treinos' },
        { value: analytics.currentStreakWeeks, label: 'sequência', sub: 'semanas ativas' },
        { value: recovery?.hrv ?? '—', label: 'HRV', sub: isStale ? 'dados antigos' : 'recuperação' },
      ]
    : []

  const volumePoints: BarChartPoint[] = analytics
    ? analytics.weeklyVolume.map(w => ({ label: getWeekLabel(w.weekStart), value: w.tonnage }))
    : []

  const lastWeekTonnage =
    analytics && analytics.weeklyVolume.length > 0
      ? analytics.weeklyVolume[analytics.weeklyVolume.length - 1].tonnage
      : 0

  const weekDelta = analytics ? computeWeekDelta(analytics.weeklyVolume) : null

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
      <header style={{ marginBottom: 20 }}>
        <Label>Sua evolução</Label>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
          Progresso
        </h1>
      </header>

      {/*
        Recovery / daily health metrics — kept from the pre-consolidation page.
        The design handoff's ScreenProgress mock omits this section entirely
        (its mock data is workout-only), but HRV/resting-HR/calories/sleep/
        cardio-recovery are real, live functionality that must not be dropped.
        Preserved here as its own section above the design's 4-part structure.
      */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <Label>Saúde diária</Label>
        </div>
        {recoveryLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : (
          <RecoveryCard data={recovery} isStale={isStale} />
        )}
      </div>

      {analyticsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} h={72} />
            ))}
          </div>
          <Skeleton h={160} />
          <Skeleton h={220} />
        </div>
      ) : !analytics || analytics.totalSessions === 0 ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
            Nenhum treino registrado ainda.
            <br />
            Conclua seu primeiro treino para ver a evolução.
          </p>
        </div>
      ) : (
        <>
          <StatGrid stats={stats} />

          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 16, marginBottom: 12 }}>
            <Label>Volume semanal</Label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '6px 0 16px' }}>
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
                {lastWeekTonnage}kg
              </span>
              {weekDelta !== null && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 13,
                    fontWeight: 600,
                    color: weekDelta >= 0 ? 'var(--accent)' : 'var(--danger)',
                  }}
                >
                  <Icon
                    name="arrowUp"
                    size={13}
                    stroke={weekDelta >= 0 ? 'var(--accent)' : 'var(--danger)'}
                    style={weekDelta < 0 ? { transform: 'rotate(180deg)' } : undefined}
                  />
                  {weekDelta >= 0 ? '+' : ''}
                  {weekDelta}%
                </span>
              )}
            </div>
            <BarChart data={volumePoints} height={120} />
          </div>

          <SectionHead title="Recordes pessoais" />
          {analytics.personalRecords.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Nenhum recorde ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {analytics.personalRecords.map(pr => (
                <PersonalRecordRow key={pr.exerciseName} record={pr} />
              ))}
            </div>
          )}

          <SectionHead title="Histórico" />
          {historyError && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{historyError}</p>}
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} h={64} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>Nenhum treino no histórico ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map(session => (
                <SessionHistoryRow key={session.id} session={session} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar `NavBar.tsx` (sem alteração esperada)**

Abrir `apps/web/src/components/layout/NavBar.tsx` e confirmar que o array `tabs` ainda contém:

```ts
{ href: '/recovery', label: 'Progresso', icon: 'chart' as const },
```

Isso já é o caso hoje — nenhuma edição é necessária neste arquivo, pois a rota consolidada permanece em `/recovery`.

- [ ] **Step 4: Rodar a suíte completa e o typecheck**

Run: `cd apps/web && npx vitest run`
Expected: PASS em todos os testes (incluindo Tasks 1–8 e qualquer teste pré-existente não relacionado, como `useRecovery.test.ts`, `useWorkoutAnalytics.test.ts`, `useWorkoutHistory.test.ts`, `WorkoutCard.test.tsx`, etc.).

Run: `cd apps/web && npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Smoke check manual (opcional, não bloqueante)**

Run: `cd apps/web && npm run dev`, abrir `http://localhost:3000/recovery` no navegador e confirmar visualmente: header "Progresso" → seção "Saúde diária" (RecoveryCard) → grid 2×2 de stats → card de volume semanal com número + delta + barras → "Recordes pessoais" → "Histórico" com links para `/history/[id]` funcionando.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/recovery/page.tsx
git commit -m "feat(web): consolidate Progresso screen at /recovery per design handoff"
```

---

## Self-Review

**1. Cobertura do spec:**
- Grid 2×2 de stats → Task 4 (`StatGrid`) + Task 9 (wiring com `thisWeekSessions`, `totalSessions`, `currentStreakWeeks`, `hrv`). ✅
- Card de volume semanal (número + delta + bar chart) → Task 2 (`computeWeekDelta`/`getWeekLabel`) + Task 3 (`BarChart`) + Task 9 (número + badge + gráfico). ✅
- Recordes pessoais (lift, valor mono, delta) → Task 6 (`PersonalRecordRow`); delta omitido por decisão documentada (sem dado histórico de PR anterior). ✅
- Histórico (treino, data, séries, duração, volume) → Task 7 (`SessionHistoryRow`) + Task 9. ✅
- Extensão de ícones `trophy`/`arrowUp` → Task 1. ✅
- Restyle/fold de `RecoveryCard` com decisão justificada e teste atualizado → Task 8. ✅
- Decisão sobre `/history/page.tsx` (ficar como está, justificado) → Global Constraints + Architecture. ✅
- Decisão de roteamento (`/recovery`, justificada) → Architecture. ✅
- Remoção da linha de stats de 3 colunas e do `VolumeChart` SVG antigo → Task 9 (página inteira reescrita, nenhum resquício do código antigo). ✅
- Verificação de `NavBar.tsx` → Task 9, Step 3. ✅
- Edge case de <2 semanas de dados no delta (sem NaN) → testado explicitamente na Task 2. ✅

**2. Varredura de placeholders:** nenhum "TBD"/"implementar depois"/"adicionar tratamento apropriado" encontrado; todo step de código tem o código completo; a única incerteza documentada (arquivo `ui/icons.tsx` de um plano paralelo) é tratada como pré-condição explícita com passos concretos de adição, não como placeholder.

**3. Consistência de tipos:** `StatGridItem`, `BarChartPoint`, `PersonalRecordRowProps`/`record: PersonalRecord`, `SessionHistoryRowProps`/`session: WorkoutSessionRow`, `getWeekLabel`/`computeWeekDelta` — todos os nomes e assinaturas usados na Task 9 (wiring) batem exatamente com os `export` das Tasks 1–8. `Icon`/`ICONS`/`IconName` da Task 1 batem com o uso em `PersonalRecordRow` (Task 6, `name="trophy"`) e na página (Task 9, `name="arrowUp"`).

---

Plan complete and saved to `docs/superpowers/plans/2026-07-18-progresso-consolidado.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**

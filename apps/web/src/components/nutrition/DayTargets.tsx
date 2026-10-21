import type { DayPlan } from '@helux/types'
import { Tag } from '@/components/ui/Tag'

const liters = (ml: number) => `${(ml / 1000).toFixed(1).replace('.', ',')} L de água`

/** Metas do dia, água e badges genéticos (spec 018, US1). */
export function DayTargets({ plan }: { plan: DayPlan }) {
  const { targets } = plan
  return (
    <section className="hx-card" style={{ padding: 16, marginTop: 20 }}>
      <p className="t-caption dim">{plan.dayType === 'treino' ? 'Dia de treino' : 'Dia de descanso'}</p>
      <p style={{ marginTop: 4 }}>
        <span className="n-lg">{targets.kcal}</span> <span className="t-secondary">kcal hoje</span>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginTop: 12 }}>
        {[
          ['Proteína', targets.proteinG],
          ['Carboidrato', targets.carbsG],
          ['Gordura', targets.fatG],
        ].map(([label, grams]) => (
          <div key={label}>
            <p className="t-caption dim">{label}</p>
            <p className="n-sm" style={{ color: 'var(--text)' }}>{`${grams} g`}</p>
          </div>
        ))}
      </div>
      <p className="t-secondary" style={{ marginTop: 12 }}>
        {liters(plan.waterMl)}
      </p>
      {plan.genetics.badges.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {plan.genetics.badges.map(b => (
            <Tag key={b}>{b}</Tag>
          ))}
        </div>
      )}
    </section>
  )
}

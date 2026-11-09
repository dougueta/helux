'use client'

import Link from 'next/link'
import { COMPLEMENTARY_CATEGORIES, type ComplementaryRoutinesView } from '@helux/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Icon } from '@/components/ui/icons'
import { useRoutines } from '@/hooks/useRoutines'

export function DailyRoutinesSection({
  initialView,
}: {
  initialView?: ComplementaryRoutinesView | null
}) {
  const { view } = useRoutines(initialView)
  if (!view?.routines || !view?.progress) return null

  return (
    <section style={{ marginTop: 24 }} aria-label="rotinas do dia">
      <SectionHeader
        title="Rotinas do dia"
        action={
          <Link href="/treinos?aba=rotinas" className="t-secondary" style={{ color: 'var(--text)' }}>
            Ver todas
          </Link>
        }
      />
      <div className="hx-card" style={{ marginTop: 10, overflow: 'hidden' }}>
        {COMPLEMENTARY_CATEGORIES.map((category, idx) => {
          const routine = view.routines[category]
          const prog = view.progress[category]
          if (!routine || !prog) return null

          return (
            <Link
              key={category}
              href={`/treinos/rotina/${category}`}
              className="hx-row-btn"
              style={idx > 0 ? { borderTop: '1px solid var(--hairline)' } : undefined}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="t-body-m">{routine.title}</span>
                  {prog.doneToday && (
                    <span className="hx-tag" style={{ color: 'var(--accent)' }}>
                      Feito hoje
                    </span>
                  )}
                </div>
                <span className="t-secondary">{routine.subtitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span className="n-sm dim">
                  {prog.completedThisWeek}/{prog.targetPerWeek} sem.
                </span>
                <span className="dim">
                  <Icon name="chev" size={18} />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

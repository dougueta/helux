'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  COMPLEMENTARY_CATEGORIES,
  type CategoryPreference,
  type ComplementaryCategory,
  type ComplementaryRoutinesView,
} from '@helux/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Banner } from '@/components/ui/Banner'
import { useRoutines } from '@/hooks/useRoutines'
import { RoutinePreferencesSheet } from './RoutinePreferencesSheet'

export function RoutinesTab({
  initialView,
}: {
  initialView?: ComplementaryRoutinesView | null
}) {
  const { view, loading, error, savePreferences, removeLog } = useRoutines(initialView)
  const [editingCategory, setEditingCategory] = useState<ComplementaryCategory | null>(null)

  if (loading && !view) {
    return <p className="t-secondary" style={{ marginTop: 24 }}>Carregando rotinas complementares...</p>
  }

  if (error && !view) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="err" title="Não foi possível carregar as rotinas">
          {error}
        </Banner>
      </div>
    )
  }

  if (!view?.routines || !view?.progress) return null

  const handleSaveCategoryPref = async (category: ComplementaryCategory, pref: CategoryPreference) => {
    await savePreferences({
      ...view.preferences,
      [category]: pref,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)', marginTop: 'var(--s-5)' }}>
      <p className="t-secondary">
        Rotinas rápidas e independentes da fila da academia — faça em qualquer turno do dia sem pular nem sobrescrever seu treino de força.
      </p>

      {COMPLEMENTARY_CATEGORIES.map(category => {
        const routine = view.routines[category]
        const prog = view.progress[category]
        if (!routine || !prog) return null

        return (
          <section
            key={category}
            className="hx-card"
            style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 className="t-heading">{routine.title}</h2>
                  {prog.doneToday && (
                    <span className="hx-tag" style={{ color: 'var(--accent)' }}>
                      Feito hoje
                    </span>
                  )}
                </div>
                <p className="t-caption" style={{ marginTop: 4 }}>{routine.subtitle}</p>
              </div>
              <span className="hx-tag hx-tag--outline">
                {prog.completedThisWeek}/{prog.targetPerWeek} na semana
              </span>
            </div>

            <p className="t-secondary">{routine.purpose}</p>

            {routine.legDayWarning && (
              <Banner kind="warn" title="Atenção ao treino de pernas">
                {routine.legDayWarning}
              </Banner>
            )}

            {routine.items.length > 0 && (
              <div className="hx-plain" style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {routine.items.slice(0, 4).map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span className="t-body">{item.name}</span>
                    <span className="n-sm dim">
                      {item.seconds ? `${item.seconds}s` : item.reps}
                    </span>
                  </div>
                ))}
                {routine.items.length > 4 && (
                  <span className="t-caption">+{routine.items.length - 4} movimentos</span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Link
                href={`/treinos/rotina/${category}`}
                className="hx-btn hx-btn--primary"
                style={{ flex: 1 }}
              >
                Iniciar
              </Link>
              <button
                type="button"
                className="hx-btn hx-btn--secondary"
                aria-label={`Ajustar ${routine.title}`}
                onClick={() => setEditingCategory(category)}
              >
                Ajustar
              </button>
            </div>
          </section>
        )
      })}

      {editingCategory && view.routines[editingCategory] && (
        <RoutinePreferencesSheet
          open={true}
          category={editingCategory}
          routine={view.routines[editingCategory]}
          initialPref={view.preferences[editingCategory]}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategoryPref}
        />
      )}

      {view.recentLogs.length > 0 && (
        <section className="hx-plain" style={{ paddingTop: 16 }}>
          <SectionHeader title="Execuções recentes" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {view.recentLogs.slice(0, 6).map(log => {
              const title = view.routines[log.category]?.title ?? log.category
              return (
                <div
                  key={log.id}
                  className="hx-card"
                  style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
                >
                  <div>
                    <div className="t-body-m">{title}</div>
                    <div className="t-caption">
                      {log.performed_on} · {log.duration_minutes} min
                      {log.notes ? ` · ${log.notes}` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="hx-btn hx-btn--ghost"
                    aria-label={`Apagar registro de ${title}`}
                    onClick={() => void removeLog(log.id)}
                  >
                    Apagar
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

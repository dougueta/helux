'use client'

import { useState } from 'react'
import type { Meal, MealItem } from '@helux/types'
import { Tag } from '@/components/ui/Tag'

const FRACTION: Record<string, string> = { '0.5': '½' }

/** "½", "1", "1½", "2"… */
export function formatPortions(portions: number): string {
  const whole = Math.floor(portions)
  const half = portions - whole === 0.5
  if (whole === 0) return FRACTION['0.5']
  return half ? `${whole}½` : String(whole)
}

function itemAmount(item: MealItem): string {
  return item.portions === 1 ? item.household : `${formatPortions(item.portions)} × ${item.household}`
}

/** Refeição do plano do dia com troca rápida e justificativa genética (spec 018, US1). */
export function MealCard({ meal, onSwap }: { meal: Meal; onSwap: (item: MealItem) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="hx-card" style={{ padding: 16, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <h3 className="t-section">{meal.title}</h3>
        <span className="t-secondary">{meal.timing.label}</span>
        {meal.timing.highlight && <Tag kind="warn">Agora</Tag>}
      </div>

      <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
        {meal.items.map(item => (
          <li key={item.foodId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="t-body" style={{ display: 'block' }}>
                {item.name}
              </span>
              <span className="t-caption dim">{itemAmount(item)}</span>
            </span>
            <button type="button" className="hx-btn hx-btn--ghost" aria-label={`trocar ${item.name}`} onClick={() => onSwap(item)}>
              Trocar
            </button>
          </li>
        ))}
      </ul>

      <p className="t-caption dim" style={{ marginTop: 8 }}>
        {`${meal.totals.kcal} kcal · P ${meal.totals.proteinG} g · C ${meal.totals.carbsG} g · G ${meal.totals.fatG} g`}
      </p>

      {meal.geneticTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {meal.geneticTags.map(t => (
            <Tag key={t} kind="outline">
              {t}
            </Tag>
          ))}
        </div>
      )}

      {meal.rationale.length > 0 && (
        <>
          <button type="button" className="hx-btn hx-btn--ghost" style={{ marginTop: 8 }} aria-expanded={open} onClick={() => setOpen(o => !o)}>
            Por que esses alimentos?
          </button>
          {open && (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {meal.rationale.map(r => (
                <li key={r} className="t-secondary" style={{ marginTop: 4 }}>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  )
}

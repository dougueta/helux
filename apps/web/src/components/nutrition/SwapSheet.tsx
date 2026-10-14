'use client'

import { useEffect, useState } from 'react'
import type { MealItem } from '@helux/types'
import { Sheet } from '@/components/ui/Sheet'
import { Skeleton } from '@/components/ui/Skeleton'
import { getSwapOptions, type SwapOption } from '@/services/nutrition.service'
import { formatPortions } from './MealCard'

/** Troca rápida (FR-010): alternativas do catálogo com a mesma função e as mesmas restrições. */
export function SwapSheet({
  mealId,
  item,
  onClose,
  onPick,
}: {
  mealId: string
  item: MealItem | null
  onClose: () => void
  onPick: (toFoodId: string) => void
}) {
  const [options, setOptions] = useState<SwapOption[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!item) return
    setOptions(null)
    setError(false)
    getSwapOptions(mealId, item.foodId).then(setOptions, () => setError(true))
  }, [mealId, item])

  return (
    <Sheet open={item !== null} onClose={onClose} label={item ? `trocar ${item.name}` : 'trocar alimento'}>
      <h2 className="t-section" style={{ padding: '8px 16px 0' }}>
        {item ? `Trocar ${item.name}` : 'Trocar'}
      </h2>
      <div style={{ padding: 16 }}>
        {error && <p className="t-secondary">Não foi possível carregar as opções. Tente de novo.</p>}
        {!error && !options && <Skeleton h={120} />}
        {options && options.length === 0 && <p className="t-secondary">Nenhuma alternativa equivalente no catálogo.</p>}
        {options?.map(o => (
          <button
            key={o.food.id}
            type="button"
            className="hx-row-btn"
            style={{ width: '100%' }}
            onClick={() => onPick(o.food.id)}
          >
            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <span className="t-body-m" style={{ display: 'block' }}>
                {o.food.name}
              </span>
              <span className="t-caption dim">
                {`${o.portions === 1 ? o.food.portion.household : `${formatPortions(o.portions)} × ${o.food.portion.household}`} · ${Math.round(o.macros.kcal)} kcal · P ${Math.round(o.macros.proteinG)} g`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

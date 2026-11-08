'use client'

import { useEffect, useState } from 'react'
import { centralPhase, loadDemo, type ResolvedDemo, type ResolvedItem } from '@helux/exercises'
import type { Variant } from '@helux/types'
import { Icon } from '@/components/ui/icons'
import { DemoUnavailable } from './DemoUnavailable'
import { ExerciseDemo } from './ExerciseDemo'

/**
 * Demonstração de um item do plano conforme `demoState` (028, contracts/ui.md):
 * `nova` carrega o catálogo sob demanda, `legada` usa a animação salva no plano,
 * `indisponivel` nunca mostra outra animação.
 */
export function ItemDemo({
  resolved,
  variant,
  notes,
  playing,
  nonce,
  size,
}: {
  resolved: ResolvedItem
  /** variante ativa, de onde vem a animação salva (estado `legada`) */
  variant?: Variant
  notes?: string | null
  playing: boolean
  nonce?: string | number
  size: 'thumb' | 'stage'
}) {
  const id = resolved.demoState === 'nova' ? resolved.id : null
  const [loaded, setLoaded] = useState<{ id: string; demo: ResolvedDemo | null } | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    void loadDemo(id).then(demo => {
      if (alive) setLoaded({ id, demo })
    })
    return () => {
      alive = false
    }
  }, [id])

  if (id) {
    if (!loaded || loaded.id !== id) return null
    if (loaded.demo) {
      return (
        <ExerciseDemo
          demo={loaded.demo}
          playing={playing}
          nonce={nonce}
          phase={size === 'thumb' ? centralPhase(loaded.demo) : undefined}
          label={`demonstração de ${resolved.name}`}
        />
      )
    }
  } else if (resolved.demoState === 'legada' && variant?.motion) {
    return <ExerciseDemo motion={variant.motion} implement={variant.implement} playing={playing} nonce={nonce} />
  }

  if (size === 'thumb') {
    return (
      <span data-demo-unavailable-icon style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-faint)' }}>
        <Icon name="dumbbell" size={22} />
      </span>
    )
  }
  return <DemoUnavailable name={resolved.name} notes={notes} />
}

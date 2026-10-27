'use client'

import { useEffect, useState } from 'react'
import type { Goal } from '@helux/types'
import { CycleSummary } from '@/components/cycle/CycleSummary'
import { getCycleAnalysis, type CycleAnalysisView } from '@/services/cycle.service'
import { upsertProfile } from '@/services/profile.service'

const declinedKey = (id: string) => `helux:goal-suggestion-declined:${id}`

function declined(id: string): boolean {
  try {
    return localStorage.getItem(declinedKey(id)) === '1'
  } catch {
    return false
  }
}

/** Busca e mostra o resumo do ciclo anterior (spec 024); some quando não há análise. */
export function CycleSummaryCard({ mesocycleId }: { mesocycleId: string }) {
  const [view, setView] = useState<CycleAnalysisView | null>(null)
  const [hideSuggestion, setHideSuggestion] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setHideSuggestion(declined(mesocycleId))
    void getCycleAnalysis(mesocycleId).then(v => {
      if (alive) setView(v)
    })
    return () => {
      alive = false
    }
  }, [mesocycleId])

  if (!view) return null

  async function accept(goal: Goal) {
    try {
      await upsertProfile({ goalPrimary: goal })
      setHideSuggestion(true)
      setNotice('Objetivo atualizado. O próximo ciclo já segue o novo objetivo.')
    } catch {
      setNotice('Não foi possível mudar o objetivo agora.')
    }
  }

  function decline() {
    try {
      localStorage.setItem(declinedKey(mesocycleId), '1')
    } catch {
      // Só lembra a escolha neste aparelho.
    }
    setHideSuggestion(true)
  }

  return (
    <>
      <CycleSummary summary={view.summary} changes={view.changes} {...(hideSuggestion ? {} : { onAcceptGoal: accept, onDeclineGoal: decline })} />
      {notice && (
        <p className="t-secondary" role="status" style={{ marginTop: 8 }}>
          {notice}
        </p>
      )}
    </>
  )
}

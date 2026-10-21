'use client'

import { useState } from 'react'
import type { SessionChange, WorkoutAdjustmentProposal } from '@helux/types'
import { Button } from '@/components/ui/Button'

const KIND_LABEL: Record<SessionChange['kind'], string> = {
  trocado: 'trocado',
  alterado: 'alterado',
  removido: 'removido',
  adicionado: 'adicionado',
}

const STATUS_LABEL: Partial<Record<WorkoutAdjustmentProposal['status'], string>> = {
  aceita: 'Mudanças aplicadas ao treino.',
  recusada: 'Treino mantido como estava.',
  obsoleta: 'O treino mudou depois desta proposta; peça um novo ajuste.',
}

/** Proposta de ajuste do treino (spec 022, FR-009/FR-011): antes → depois e confirmação explícita. */
export function ProposalCard({
  proposal,
  onResolve,
}: {
  proposal: WorkoutAdjustmentProposal
  onResolve: (action: 'accept' | 'reject') => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const resolved = STATUS_LABEL[proposal.status]

  async function resolve(action: 'accept' | 'reject') {
    setBusy(true)
    try {
      await onResolve(action)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="hx-card" style={{ padding: 16, marginTop: 12 }} aria-label="proposta de ajuste do treino">
      <p className="t-caption dim">{proposal.kind === 'adaptacao-restricao' ? 'Adaptação às novas restrições' : 'Ajuste proposto pelo Agente de Treino'}</p>
      <p className="t-body" style={{ marginTop: 6 }}>
        {proposal.reason}
      </p>
      <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gap: 8 }}>
        {proposal.changes.map((c, i) => (
          <li key={i} className="t-secondary" style={{ borderTop: '1px solid var(--hairline)', paddingTop: 8 }}>
            <span className="t-caption dim">
              Sessão {c.letter} · {KIND_LABEL[c.kind]}
            </span>
            <span style={{ display: 'block', color: 'var(--text)' }}>
              {c.before ?? '—'} → {c.after ?? '—'}
            </span>
          </li>
        ))}
      </ul>
      {resolved ? (
        <p className="t-secondary" style={{ marginTop: 12 }}>
          {resolved}
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <Button kind="primary" onClick={() => resolve('accept')} disabled={busy}>
            Aplicar mudanças
          </Button>
          <Button kind="ghost" onClick={() => resolve('reject')} disabled={busy}>
            Manter como está
          </Button>
        </div>
      )}
    </section>
  )
}

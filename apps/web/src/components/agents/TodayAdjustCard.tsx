'use client'

import { useState, type CSSProperties } from 'react'
import type { WorkoutAdjustmentProposal } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { ApiError } from '@/services/api-client'
import { requestAdjustment, resolveProposal } from '@/services/agents.service'
import { ProposalCard } from './ProposalCard'

const textInput: CSSProperties = { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 15, resize: 'vertical' }

/** Mensagem amigável para as falhas conhecidas das operações de IA. */
export function agentErrorMessage(e: unknown): string {
  const code = e instanceof ApiError ? e.code : undefined
  if (code === 'budget-exceeded') return 'O teto mensal de IA foi atingido. Aumente o teto no Perfil Integrado ou aguarde o próximo mês; seu treino atual continua valendo.'
  if (code === 'constraints-unsatisfiable') return 'Não deu para montar um ajuste que respeite todas as suas restrições. Tente pedir de outro jeito.'
  if (code === 'no-pending-session') return 'Não há sessão pendente para ajustar.'
  if (code === 'refusal') return 'A IA não pôde responder a este pedido.'
  return 'O serviço de IA não respondeu. Seu treino atual continua valendo.'
}

/** "Ajustar treino de hoje" em linguagem natural (spec 022, FR-009, SC-004). */
export function TodayAdjustCard({ onApplied }: { onApplied: () => void }) {
  const [request, setRequest] = useState('')
  const [busy, setBusy] = useState(false)
  const [proposal, setProposal] = useState<WorkoutAdjustmentProposal | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function ask() {
    if (!request.trim()) return
    setBusy(true)
    setError(null)
    try {
      setProposal(await requestAdjustment(request.trim()))
    } catch (e) {
      setError(agentErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  async function resolve(action: 'accept' | 'reject') {
    if (!proposal) return
    try {
      await resolveProposal(proposal.id, action)
      setProposal({ ...proposal, status: action === 'accept' ? 'aceita' : 'recusada' })
      if (action === 'accept') onApplied()
    } catch (e) {
      const obsolete = e instanceof ApiError && e.code === 'obsolete'
      setProposal(obsolete ? { ...proposal, status: 'obsoleta' } : proposal)
      if (!obsolete) setError(agentErrorMessage(e))
    }
  }

  return (
    <section className="hx-card" style={{ padding: 16, marginTop: 16 }}>
      <div className="hx-field">
        <label htmlFor="today-adjust">O que mudou hoje?</label>
        <div className="hx-input" style={{ height: 'auto', padding: '10px 14px' }}>
          <textarea
            id="today-adjust"
            rows={2}
            maxLength={500}
            value={request}
            placeholder="ex.: hoje só tenho 30 minutos e estou num hotel com halteres leves"
            onChange={e => setRequest(e.target.value)}
            style={textInput}
          />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Button kind="secondary" block loading={busy} onClick={ask}>
          Pedir ajuste
        </Button>
      </div>
      {error && (
        <div style={{ marginTop: 10 }}>
          <Banner kind="warn" title="Ajuste indisponível">
            {error}
          </Banner>
        </div>
      )}
      {proposal && <ProposalCard proposal={proposal} onResolve={resolve} />}
    </section>
  )
}

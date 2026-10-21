'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import type { AgentKey, Channel, SharedGuidance } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAgentChat, type ChatCard } from '@/hooks/useAgentChat'
import { AGENT_LABEL, SOURCE_LABEL } from '@/lib/agentSources'
import { deleteFact, resolveGuidance, resolveProposal } from '@/services/agents.service'
import { ProposalCard } from './ProposalCard'

const textInput: CSSProperties = { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 15, resize: 'none' }
const bubble = (mine: boolean): CSSProperties => ({
  maxWidth: '88%',
  alignSelf: mine ? 'flex-end' : 'flex-start',
  background: mine ? 'var(--surface-3)' : 'var(--surface-1)',
  borderRadius: 'var(--r-md)',
  padding: '10px 14px',
  whiteSpace: 'pre-wrap',
})

function GuidanceCard({ initial }: { initial: SharedGuidance }) {
  const [g, setG] = useState(initial)
  const [conflict, setConflict] = useState<string | null>(null)
  async function act(action: 'accept' | 'reject') {
    const r = await resolveGuidance(g.id, action)
    setG(r)
    if (r.conflict) setConflict(r.conflict.text)
  }
  return (
    <section className="hx-card" aria-label="orientação proposta" style={{ padding: 14 }}>
      <p className="t-caption dim">
        {g.kind === 'restricao-seguranca' ? 'Restrição de segurança proposta' : 'Recomendação proposta'}
        {g.durationDays ? ` · ${g.durationDays} dias` : ''}
      </p>
      <p className="t-body" style={{ marginTop: 4 }}>
        {g.text}
      </p>
      <p className="t-secondary">{g.reason}</p>
      {g.status === 'pendente' ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <Button kind="secondary" onClick={() => act('accept')}>
            Aceitar
          </Button>
          <Button kind="ghost" onClick={() => act('reject')}>
            Recusar
          </Button>
        </div>
      ) : (
        <p className="t-caption" style={{ marginTop: 8 }}>
          {g.status === 'ativa' ? 'Aceita: ativa para todos os especialistas.' : 'Recusada.'}
        </p>
      )}
      {conflict && (
        <p className="t-caption" style={{ marginTop: 6, color: 'var(--warn)' }}>
          Conflita com a restrição de segurança “{conflict}”, que prevalece enquanto as duas estiverem ativas.
        </p>
      )}
    </section>
  )
}

function Card({ card, onHandoff }: { card: ChatCard; onHandoff?: (to: AgentKey) => void }) {
  const [removed, setRemoved] = useState(false)
  if (card.kind === 'fact') {
    return removed ? null : (
      <p className="t-caption dim">
        Anotei: {card.fact.text} ·{' '}
        <button type="button" className="hx-plain t-caption" onClick={() => deleteFact(card.fact.id).then(() => setRemoved(true))}>
          apagar
        </button>
      </p>
    )
  }
  if (card.kind === 'guidance') return <GuidanceCard initial={card.guidance} />
  if (card.kind === 'adjustment') return <AdjustmentCard initial={card.proposal} />
  return (
    <div className="hx-card" style={{ padding: 12 }}>
      <p className="t-secondary">{card.reason}</p>
      <div style={{ marginTop: 8 }}>
        <Button kind="secondary" onClick={() => onHandoff?.(card.to)}>
          Continuar com {AGENT_LABEL[card.to]}
        </Button>
      </div>
    </div>
  )
}

function AdjustmentCard({ initial }: { initial: Parameters<typeof ProposalCard>[0]['proposal'] }) {
  const [p, setP] = useState(initial)
  return (
    <ProposalCard
      proposal={p}
      onResolve={async action => {
        await resolveProposal(p.id, action)
        setP({ ...p, status: action === 'accept' ? 'aceita' : 'recusada' })
      }}
    />
  )
}

/**
 * Chat com um especialista ou com a Equipe Helux (spec 022, US3–US5):
 * resposta progressiva, quem respondeu, cartões de relato, orientação,
 * ajuste e encaminhamento, fontes usadas e "nova conversa".
 */
export function AgentChat({ channel, onHandoff, placeholder }: { channel: Channel; onHandoff?: (to: AgentKey) => void; placeholder?: string }) {
  const { messages, cards, live, loading, sending, error, budgetWarning, send, newConversation } = useAgentChat(channel)
  const [draft, setDraft] = useState('')

  async function submit() {
    const text = draft
    setDraft('')
    await send(text)
  }

  if (loading) return <Skeleton h={200} style={{ marginTop: 16 }} />

  return (
    <section style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="conversa">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button kind="ghost" onClick={newConversation} disabled={sending}>
          Nova conversa
        </Button>
      </div>

      {messages.length === 0 && !live && <p className="t-secondary">Pergunte o que quiser: os especialistas usam o seu Perfil Integrado.</p>}

      {messages.map(m => (
        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {m.role === 'agent' && m.agent && <span className="t-caption dim">{AGENT_LABEL[m.agent]}</span>}
          {m.content && (
            <div className="t-body" style={bubble(m.role === 'user')}>
              {m.content}
            </div>
          )}
          {(cards[m.id] ?? []).map((c, i) => (
            <Card key={i} card={c} onHandoff={onHandoff} />
          ))}
          {m.role === 'agent' && m.sourcesUsed && m.sourcesUsed.ativa.length > 0 && (
            <span className="t-caption dim">Fontes: {m.sourcesUsed.ativa.map(s => SOURCE_LABEL[s]).join(', ')}</span>
          )}
        </div>
      ))}

      {live && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} aria-live="polite">
          <span className="t-caption dim">{live.agent ? `${AGENT_LABEL[live.agent]} está respondendo…` : 'Encaminhando para o especialista…'}</span>
          {live.text && (
            <div className="t-body" style={bubble(false)}>
              {live.text}
            </div>
          )}
          {live.cards.map((c, i) => (
            <Card key={i} card={c} onHandoff={onHandoff} />
          ))}
        </div>
      )}

      {budgetWarning !== null && budgetWarning < 100 && (
        <p className="t-caption" style={{ color: 'var(--warn)' }}>
          Você já usou {budgetWarning}% do teto mensal de IA.
        </p>
      )}

      {error && (
        <Banner
          kind={error.code === 'budget-exceeded' ? 'warn' : 'err'}
          title={error.code === 'budget-exceeded' ? 'Teto mensal de IA atingido' : 'Não foi possível responder'}
          action={
            error.code === 'budget-exceeded' ? (
              <Link href="/perfil/integrado" className="t-secondary" style={{ color: 'var(--text)' }}>
                Aumentar o teto
              </Link>
            ) : undefined
          }
        >
          {error.code === 'budget-exceeded' ? 'Os chats ficam pausados até o próximo mês; seu treino continua valendo.' : error.message}
        </Banner>
      )}

      <div className="hx-field">
        <label htmlFor={`chat-${channel}`} className="t-caption dim">
          Mensagem
        </label>
        <div className="hx-input" style={{ height: 'auto', padding: '10px 14px', alignItems: 'flex-end', gap: 8 }}>
          <textarea
            id={`chat-${channel}`}
            rows={2}
            maxLength={2000}
            value={draft}
            placeholder={placeholder ?? 'Escreva sua pergunta'}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              }
            }}
            style={textInput}
          />
          <Button kind="primary" onClick={submit} disabled={sending || !draft.trim()}>
            Enviar
          </Button>
        </div>
      </div>
    </section>
  )
}

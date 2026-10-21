'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentKey, AgentMessage, Channel, ConversationFact, SharedGuidance, WorkoutAdjustmentProposal } from '@helux/types'
import { ApiError } from '@/services/api-client'
import { getConversation, startNewConversation, streamChat, type ChatEvent } from '@/services/agents.service'

/** Cartões que acompanham uma resposta: relato, orientação, ajuste ou encaminhamento. */
export type ChatCard =
  | { kind: 'fact'; fact: ConversationFact }
  | { kind: 'guidance'; guidance: SharedGuidance }
  | { kind: 'adjustment'; proposal: WorkoutAdjustmentProposal }
  | { kind: 'handoff'; to: AgentKey; reason: string }

export interface ChatError {
  message: string
  code?: string
}

function cardFrom(e: ChatEvent): ChatCard[] {
  if (e.event === 'fact') return [{ kind: 'fact', fact: e.data.fact }]
  if (e.event === 'handoff') return [{ kind: 'handoff', to: e.data.to, reason: e.data.reason }]
  if (e.event === 'proposal') {
    return [
      ...(e.data.guidance ? [{ kind: 'guidance' as const, guidance: e.data.guidance }] : []),
      ...(e.data.adjustment ? [{ kind: 'adjustment' as const, proposal: e.data.adjustment }] : []),
    ]
  }
  return []
}

/**
 * Conversa com um especialista ou com a Equipe Helux (spec 022, FR-022/023a):
 * histórico, resposta em streaming, cartões e "nova conversa".
 */
export function useAgentChat(channel: Channel) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [cards, setCards] = useState<Record<string, ChatCard[]>>({})
  const [live, setLive] = useState<{ text: string; agent: AgentKey | null; cards: ChatCard[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ChatError | null>(null)
  const [budgetWarning, setBudgetWarning] = useState<number | null>(null)
  const sending = live !== null
  const liveRef = useRef(live)
  liveRef.current = live

  useEffect(() => {
    let alive = true
    setLoading(true)
    getConversation(channel).then(
      r => alive && (setMessages(r.messages), setLoading(false)),
      () => alive && (setError({ message: 'Não foi possível carregar a conversa.' }), setLoading(false)),
    )
    return () => {
      alive = false
    }
  }, [channel])

  const send = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || liveRef.current) return
      setError(null)
      setMessages(m => [...m, { id: `local-${Date.now()}`, role: 'user', agent: null, content: message, sourcesUsed: null, createdAt: new Date().toISOString() }])
      let current = { text: '', agent: channel === 'equipe' ? null : (channel as AgentKey), cards: [] as ChatCard[] }
      setLive(current)
      const update = (next: typeof current) => {
        current = next
        setLive(next)
      }
      // Ao terminar, a resposta (ou o que veio antes do erro) vira mensagem com seus cartões.
      const settle = (id: string, sourcesUsed: AgentMessage['sourcesUsed']) => {
        if (current.text || current.cards.length > 0) {
          setMessages(m => [...m, { id, role: 'agent', agent: current.agent ?? 'treino', content: current.text, sourcesUsed, createdAt: new Date().toISOString() }])
          setCards(c => ({ ...c, [id]: current.cards }))
        }
        setLive(null)
      }
      try {
        await streamChat(channel, message, e => {
          if (e.event === 'start' && e.data.budgetWarning) setBudgetWarning(e.data.budgetWarning.pct)
          else if (e.event === 'routed') update({ ...current, agent: e.data.agent })
          else if (e.event === 'delta') update({ ...current, text: current.text + e.data.text })
          else if (e.event === 'done') {
            update({ ...current, agent: e.data.agent ?? current.agent })
            settle(e.data.agentMessageId, e.data.sourcesUsed)
          } else if (e.event === 'error') {
            setError({ message: e.data.message, code: e.data.code })
            settle(`partial-${Date.now()}`, null)
          } else update({ ...current, cards: [...current.cards, ...cardFrom(e)] })
        })
        if (liveRef.current) settle(`partial-${Date.now()}`, null)
      } catch (err) {
        setError({ message: err instanceof Error ? err.message : 'Falha ao enviar.', code: err instanceof ApiError ? err.code : undefined })
        setLive(null)
      }
    },
    [channel],
  )

  const newConversation = useCallback(async () => {
    await startNewConversation(channel)
    setMessages([])
    setCards({})
    setError(null)
  }, [channel])

  return { messages, cards, live, loading, sending, error, budgetWarning, send, newConversation }
}

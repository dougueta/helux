'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { SOURCE_KEYS, type ConversationFact, type SharedGuidance, type SourceKey } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tag } from '@/components/ui/Tag'
import { AGENT_LABEL, SOURCE_LABEL } from '@/lib/agentSources'
import {
  deleteFact,
  getIntegratedProfile,
  removeGuidance,
  setBudgetCap,
  setSourceEnabled,
  updateFact,
  type IntegratedProfileResponse,
} from '@/services/agents.service'

const STATUS_WORD = { ativa: 'ativa', vazia: 'sem dados', desativada: 'desativada' } as const
const textInput: CSSProperties = { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 15 }
const usd = (n: number) => `US$ ${n.toFixed(2).replace('.', ',')}`
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

function FactRow({ fact, n, onSave, onDelete }: { fact: ConversationFact; n: number; onSave: (text: string) => void; onDelete: () => void }) {
  const [text, setText] = useState(fact.text)
  return (
    <li style={{ padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
      <p className="t-caption dim">
        {fact.category} · {AGENT_LABEL[fact.originAgent]} · {fmtDate(fact.createdAt)}
      </p>
      <div className="hx-input" style={{ marginTop: 6 }}>
        <input aria-label={`relato ${n}`} value={text} maxLength={280} onChange={e => setText(e.target.value)} style={textInput} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Button kind="ghost" aria-label={`salvar relato ${n}`} disabled={text.trim().length < 3 || text === fact.text} onClick={() => onSave(text.trim())}>
          Salvar
        </Button>
        <Button kind="ghost" aria-label={`remover relato ${n}`} onClick={onDelete}>
          Remover
        </Button>
      </div>
    </li>
  )
}

/** Perfil Integrado (spec 022, US2): o que os agentes sabem, liga/desliga, relatos, restrições e teto de IA. */
export function IntegratedProfileView() {
  const [data, setData] = useState<IntegratedProfileResponse | null>(null)
  const [error, setError] = useState(false)
  const [cap, setCap] = useState('')

  const load = useCallback(async () => {
    try {
      const p = await getIntegratedProfile()
      setData(p)
      setCap(String(p.budget.capUsd))
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function act(fn: () => Promise<unknown>) {
    await fn()
    await load()
  }

  if (error) {
    return (
      <div style={{ marginTop: 20 }}>
        <Banner kind="err" title="Não foi possível carregar o Perfil Integrado">
          Tente de novo em instantes.
        </Banner>
      </div>
    )
  }
  if (!data) return <Skeleton h={320} style={{ marginTop: 20 }} />

  const facts = (data.sources.relatos.status === 'ativa' ? (data.sources.relatos.data as ConversationFact[]) : []) ?? []
  const guidance = (data.sources.restricoes.status === 'ativa' ? (data.sources.restricoes.data as SharedGuidance[]) : []) ?? []
  const { budget } = data

  return (
    <>
      <section className="hx-card" style={{ padding: 16, marginTop: 20 }}>
        <p className="t-caption dim">Consumo de IA neste mês</p>
        <p style={{ marginTop: 4 }}>
          <span className="n-sm" style={{ color: 'var(--text)' }}>
            {usd(budget.spentUsd)} de {usd(budget.capUsd)}
          </span>
        </p>
        {budget.pct >= 80 && (
          <p className="t-secondary" style={{ marginTop: 6, color: 'var(--warn)' }}>
            {budget.pct}% do teto{budget.pct >= 100 ? ': chats e gerações por IA estão pausados até o próximo mês ou até você aumentar o teto.' : '.'}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 12 }}>
          <div className="hx-field" style={{ flex: 1 }}>
            <label htmlFor="budget-cap">Teto mensal (US$)</label>
            <div className="hx-input">
              <input id="budget-cap" inputMode="decimal" value={cap} onChange={e => setCap(e.target.value)} style={textInput} />
            </div>
          </div>
          <Button kind="secondary" disabled={!(Number(cap.replace(',', '.')) >= 1)} onClick={() => act(() => setBudgetCap(Number(cap.replace(',', '.'))))}>
            Salvar teto
          </Button>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <SectionHeader
          title="O que os agentes consideram"
          action={
            <Link href="/perfil/preferencias" className="t-secondary" style={{ color: 'var(--text)' }}>
              Preferências
            </Link>
          }
        />
        <ul aria-label="fontes" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {SOURCE_KEYS.map((key: SourceKey) => {
            const s = data.sources[key]
            const off = s.status === 'desativada'
            return (
              <li key={key} style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="t-body-m" style={{ flex: 1 }}>
                    {SOURCE_LABEL[key]}
                  </span>
                  <Tag kind={s.status === 'ativa' ? 'default' : 'outline'}>{STATUS_WORD[s.status]}</Tag>
                  <Button kind="ghost" aria-label={`${off ? 'ativar' : 'desativar'} ${SOURCE_LABEL[key]}`} onClick={() => act(() => setSourceEnabled(key, off))}>
                    {off ? 'Ativar' : 'Desativar'}
                  </Button>
                </div>
                {s.updatedAt && <p className="t-caption dim">Atualizado em {fmtDate(s.updatedAt)}{s.stale ? ' · desatualizado' : ''}</p>}
                {s.status === 'ativa' && s.summary && (
                  <p className="t-secondary" style={{ marginTop: 4, whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.summary}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      {facts.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <SectionHeader title="Relatos nas conversas" />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {facts.map((f, i) => (
              <FactRow key={f.id} fact={f} n={i + 1} onSave={text => act(() => updateFact(f.id, text))} onDelete={() => act(() => deleteFact(f.id))} />
            ))}
          </ul>
        </section>
      )}

      {guidance.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <SectionHeader title="Restrições e recomendações ativas" />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {guidance.map(g => (
              <li key={g.id} style={{ padding: '10px 0', borderTop: '1px solid var(--hairline)' }}>
                <p className="t-caption dim">
                  {g.kind === 'restricao-seguranca' ? 'Restrição de segurança' : 'Recomendação'} · {AGENT_LABEL[g.originAgent]}
                  {g.expiresAt ? ` · até ${fmtDate(g.expiresAt)}` : ''}
                </p>
                <p className="t-body">{g.text}</p>
                <p className="t-secondary">{g.reason}</p>
                <Button kind="ghost" aria-label={`remover ${g.kind === 'restricao-seguranca' ? 'restrição' : 'recomendação'} ${g.text}`} onClick={() => act(() => removeGuidance(g.id))}>
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

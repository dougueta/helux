'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import type { ConditionStatus, Region, SharedGuidance, Side } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { resolveGuidance } from '@/services/agents.service'
import {
  createCondition,
  deleteCondition,
  describeRules,
  endFlare,
  getConditions,
  regionLabel,
  startFlare,
  type CatalogConditionView,
  type ConditionView,
} from '@/services/conditions.service'

const OTHER = 'outra'
const ALL_REGIONS: Region[] = ['joelho', 'ombro', 'lombar', 'quadril', 'tornozelo', 'cotovelo', 'punho', 'sistemica']
const FLARE_REGIONS: Region[] = ['joelho', 'tornozelo', 'ombro', 'cotovelo', 'punho', 'quadril']
const STATUS: { value: ConditionStatus; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'controlada', label: 'Controlada' },
  { value: 'resolvida', label: 'Resolvida' },
]
const SELECT: CSSProperties = { display: 'block', width: '100%', marginTop: 6, padding: '10px 12px', borderRadius: 12, border: '1px solid var(--hairline)', background: 'var(--surface-2)', color: 'var(--text)' }
const fmt = (iso: string) => iso.slice(5, 10).split('-').reverse().join('/')

function labelOf(c: ConditionView, catalog: CatalogConditionView[]): string {
  return catalog.find(k => k.key === c.catalogKey)?.label ?? c.customLabel ?? 'Condição'
}

/**
 * Condições de saúde e cirurgias (spec 024, US2): catálogo com regras fixas,
 * "outra" com regras propostas pela Medicina para aceitar, e crise de gota.
 */
export function ConditionsEditor({ onChange }: { onChange?: () => void } = {}) {
  const [conditions, setConditions] = useState<ConditionView[]>([])
  const [catalog, setCatalog] = useState<CatalogConditionView[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [proposals, setProposals] = useState<SharedGuidance[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [flareRegion, setFlareRegion] = useState<Record<string, Region>>({})

  const [key, setKey] = useState<string>('')
  const [customLabel, setCustomLabel] = useState('')
  const [region, setRegion] = useState<Region>('joelho')
  const [side, setSide] = useState<Side | ''>('')
  const [count, setCount] = useState('1')
  const [status, setStatus] = useState<ConditionStatus>('controlada')

  async function reload() {
    try {
      const data = await getConditions()
      setConditions(data.conditions)
      setCatalog(data.catalog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as condições.')
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const entry = catalog.find(c => c.key === key)
  const regions = entry ? entry.regions : ALL_REGIONS

  function chooseCondition(next: string) {
    setKey(next)
    const e = catalog.find(c => c.key === next)
    if (e) setRegion(e.regions[0])
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await reload()
      onChange?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  async function add() {
    if (!key || (key === OTHER && customLabel.trim().length < 2)) return
    await run(async () => {
      const base = { region, ...(side ? { side } : {}), count: Math.max(1, Number(count) || 1), status }
      const res = await createCondition(key === OTHER ? { customLabel: customLabel.trim(), ...base } : { catalogKey: key, ...base })
      setProposals(res.proposedGuidance ?? [])
      setNotice(res.notice ?? null)
      setKey('')
      setCustomLabel('')
      setSide('')
      setCount('1')
    })
  }

  async function decide(id: string, action: 'accept' | 'reject') {
    await run(async () => {
      await resolveGuidance(id, action)
      setProposals(p => p.filter(g => g.id !== id))
    })
  }

  return (
    <div>
      {error && <Banner kind="err" title={error} />}

      <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'grid', gap: 12 }}>
        {conditions.length === 0 && <li className="t-secondary">Nenhuma condição registrada.</li>}
        {conditions.map(c => {
          const name = labelOf(c, catalog)
          const where = [c.region !== 'sistemica' ? regionLabel(c.region) : null, c.side].filter(Boolean).join(' ')
          return (
            <li key={c.id} className="hx-card" aria-label={name} style={{ padding: 14 }}>
              <p className="t-body-m">
                {name}
                {where ? ` · ${where}` : ''}
                {c.count > 1 ? ` · ${c.count}×` : ''}
              </p>
              <p className="t-secondary">
                {STATUS.find(s => s.value === c.status)?.label}
                {c.flare ? ` · crise no ${regionLabel(c.flare.region)} até ${fmt(c.flare.until)}` : ''}
              </p>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {describeRules(c.rules).map(r => (
                  <li key={r} className="t-secondary">
                    {r}
                  </li>
                ))}
              </ul>
              {c.catalogKey === 'gota' && (
                <div style={{ marginTop: 10 }}>
                  {c.flare ? (
                    <Button kind="secondary" onClick={() => void run(() => endFlare(c.id))} loading={busy}>
                      A crise acabou
                    </Button>
                  ) : (
                    <>
                      <label className="t-secondary">
                        Onde é a crise?
                        <select style={SELECT} value={flareRegion[c.id] ?? 'joelho'} onChange={e => setFlareRegion(s => ({ ...s, [c.id]: e.target.value as Region }))}>
                          {FLARE_REGIONS.map(r => (
                            <option key={r} value={r}>
                              {regionLabel(r)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div style={{ marginTop: 8 }}>
                        <Button kind="secondary" onClick={() => void run(() => startFlare(c.id, flareRegion[c.id] ?? 'joelho'))} loading={busy}>
                          Marcar crise
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <Button kind="ghost" onClick={() => void run(() => deleteCondition(c.id))}>
                  Remover
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      {notice && (
        <div style={{ marginTop: 12 }}>
          <Banner kind="warn" title={notice} />
        </div>
      )}

      {proposals.length > 0 && (
        <div role="group" aria-label="Regras propostas" className="hx-card" style={{ marginTop: 16, padding: 14 }}>
          <p className="t-body-m">Regras propostas pela Medicina Esportiva</p>
          <p className="t-secondary">Elas só passam a valer se você aceitar.</p>
          {proposals.map(g => (
            <div key={g.id} style={{ marginTop: 10 }}>
              <p className="t-body">{g.text}</p>
              <p className="t-secondary">{g.reason}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Button kind="secondary" onClick={() => void decide(g.id, 'accept')}>
                  Aceitar
                </Button>
                <Button kind="ghost" onClick={() => void decide(g.id, 'reject')}>
                  Recusar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="hx-card" style={{ marginTop: 20, padding: 14 }}>
        <p className="t-body-m">Adicionar condição ou cirurgia</p>
        <label className="t-secondary" style={{ display: 'block', marginTop: 10 }}>
          Condição
          <select style={SELECT} value={key} onChange={e => chooseCondition(e.target.value)}>
            <option value="">Escolha…</option>
            {catalog.map(c => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
            <option value={OTHER}>Outra (descrever)</option>
          </select>
        </label>
        {key === OTHER && (
          <label className="t-secondary" style={{ display: 'block', marginTop: 10 }}>
            Qual condição?
            <input className="hx-input" style={{ display: 'block', width: '100%', marginTop: 6 }} value={customLabel} maxLength={120} onChange={e => setCustomLabel(e.target.value)} />
          </label>
        )}
        <label className="t-secondary" style={{ display: 'block', marginTop: 10 }}>
          Região
          <select style={SELECT} value={region} onChange={e => setRegion(e.target.value as Region)}>
            {regions.map(r => (
              <option key={r} value={r}>
                {regionLabel(r)}
              </option>
            ))}
          </select>
        </label>
        <label className="t-secondary" style={{ display: 'block', marginTop: 10 }}>
          Lado
          <select style={SELECT} value={side} onChange={e => setSide(e.target.value as Side | '')}>
            <option value="">Não se aplica</option>
            <option value="esquerdo">Esquerdo</option>
            <option value="direito">Direito</option>
            <option value="ambos">Ambos</option>
          </select>
        </label>
        <label className="t-secondary" style={{ display: 'block', marginTop: 10 }}>
          Quantas vezes (ex.: cirurgias)
          <input className="hx-input" style={{ display: 'block', width: 96, marginTop: 6 }} type="number" min={1} max={20} value={count} onChange={e => setCount(e.target.value)} />
        </label>
        <div style={{ marginTop: 12 }}>
          <Segmented label="Estado" options={STATUS} value={status} onChange={setStatus} />
        </div>
        <div style={{ marginTop: 12 }}>
          <Button kind="primary" block onClick={() => void add()} loading={busy} disabled={!key}>
            Adicionar
          </Button>
        </div>
      </section>
    </div>
  )
}

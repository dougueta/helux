'use client'

import { useEffect, useState } from 'react'
import { getDataSource, getPersonaId, setDataSource, setPersonaId, type DataSourceMode } from '@/lib/data-source'
import { PERSONAS } from '@/mocks/fixtures/personas'
import { getBrowserMock, resetBrowserMock } from '@/mocks/runtime'

export interface DevBarProps {
  /** Começa só com o selo do modo (padrão: aberta). */
  initialCollapsed?: boolean
  onDataSourceChange?: (mode: DataSourceMode) => void
}

const LABEL: Record<DataSourceMode, string> = { mock: 'Mock data', real: 'Real data' }

/** Há formulário com alterações não salvas (`data-dirty="true"`)? Então confirma antes. */
function confirmLeave(): boolean {
  if (!document.querySelector('form[data-dirty="true"]')) return true
  return window.confirm('Há alterações não salvas. Trocar os dados agora descarta o que foi preenchido.')
}

/**
 * Dev Bar (spec 021, US3–US5): modo dos dados, persona de teste e reset.
 * Só existe fora de produção (montada condicionalmente no layout).
 */
export function DevBar({ initialCollapsed = false, onDataSourceChange }: DevBarProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [mode, setMode] = useState<DataSourceMode>('real')
  const [persona, setPersona] = useState('standard-athlete')
  const [corrupted, setCorrupted] = useState(false)

  useEffect(() => {
    const current = getDataSource()
    setMode(current)
    setPersona(getPersonaId())
    if (current === 'mock') setCorrupted(getBrowserMock().store.wasCorrupted())
  }, [])

  function toggle() {
    if (!confirmLeave()) return
    const next: DataSourceMode = mode === 'mock' ? 'real' : 'mock'
    setDataSource(next)
    setMode(next)
    onDataSourceChange?.(next)
    window.location.reload()
  }

  function reset() {
    getBrowserMock().store.reset()
    resetBrowserMock()
    window.dispatchEvent(new CustomEvent('helux:mock-reset', { detail: { personaId: persona } }))
    window.location.reload()
  }

  function changePersona(id: string) {
    if (!confirmLeave()) return
    setPersonaId(id)
    setPersona(id)
    getBrowserMock().store.loadPersona(id)
    resetBrowserMock()
    window.dispatchEvent(new CustomEvent('helux:persona-change', { detail: { personaId: id } }))
    window.location.reload()
  }

  const badge = (
    <span className="t-caption" style={{ fontFamily: 'var(--mono)', color: mode === 'mock' ? 'var(--warn)' : 'var(--text-dim)' }}>
      {LABEL[mode]}
    </span>
  )

  return (
    <aside
      aria-label="Dev Bar"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 'calc(76px + var(--safe-b))',
        zIndex: 'var(--z-nav)',
        maxWidth: 'calc(100% - 24px)',
        background: 'var(--surface-2)',
        border: `1px solid ${mode === 'mock' ? 'var(--warn-line)' : 'var(--hairline-2)'}`,
        borderRadius: collapsed ? 'var(--r-pill)' : 'var(--r-md)',
        padding: collapsed ? '6px 12px' : 12,
      }}
    >
      {collapsed ? (
        <button type="button" aria-label="Abrir a Dev Bar" onClick={() => setCollapsed(false)} style={{ all: 'unset', cursor: 'pointer' }}>
          {badge}
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 8, minWidth: 220 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            {badge}
            <button
              type="button"
              aria-label="Recolher a Dev Bar"
              className="t-caption dim"
              onClick={() => setCollapsed(true)}
              style={{ all: 'unset', cursor: 'pointer' }}
            >
              recolher
            </button>
          </div>

          {corrupted && (
            <p role="status" className="t-caption" style={{ color: 'var(--warn)' }}>
              Dados de teste corrompidos: voltamos para as fixtures da persona.
            </p>
          )}

          <button type="button" className="hx-btn hx-btn--secondary" onClick={toggle}>
            {mode === 'mock' ? 'Usar dados reais' : 'Usar dados mockados'}
          </button>

          {mode === 'mock' && (
            <>
              <label className="hx-field">
                <span className="t-caption dim">Persona</span>
                <span className="hx-input">
                  <select
                    aria-label="Persona"
                    value={persona}
                    onChange={e => changePersona(e.target.value)}
                    style={{ all: 'unset', flex: 1, fontFamily: 'var(--font)', cursor: 'pointer' }}
                  >
                    {PERSONAS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <button type="button" className="hx-btn hx-btn--ghost" onClick={reset}>
                Resetar dados de teste
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  )
}

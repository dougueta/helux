'use client'

import { useState } from 'react'
import type { PlannedExercise } from '@helux/types'
import { Icon } from '@/components/ui/icons'
import { MatchBadge } from '@/components/ui/MatchBadge'
import { Chip } from '@/components/ui/Chip'
import { ExerciseDemo } from './ExerciseDemo'
import { MuscleMap } from './MuscleMap'

export function ExerciseSheet({
  exercise,
  currentVariantId,
  onApply,
  onClose,
}: {
  exercise: PlannedExercise
  currentVariantId?: string
  onApply: (variantId: string) => void
  onClose: () => void
}) {
  const variants = exercise.variants ?? []
  const recVariant = variants.find((v) => v.rec) ?? variants[0]
  const activeId = currentVariantId ?? recVariant?.id

  const [selectedId, setSelectedId] = useState(activeId)
  const [tab, setTab] = useState<'execucao' | 'variantes'>('execucao')
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? recVariant
  const cues = exercise.cues ?? []
  const muscles = exercise.muscles ?? { primary: [], secondary: [] }
  const changed = !!selectedVariant && selectedVariant.id !== activeId

  function selectVariant(id: string) {
    setSelectedId(id)
    setNonce((n) => n + 1)
  }

  function handleApply() {
    if (!selectedVariant) return
    onApply(selectedVariant.id)
    onClose()
  }

  return (
    <div
      data-testid="sheet-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(4,6,4,.62)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          background: 'var(--bg)',
          border: '1px solid var(--hairline-2)',
          borderBottom: 'none',
          borderRadius: '26px 26px 0 0',
          boxShadow: '0 -20px 50px -12px rgba(0,0,0,.6)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--surface-3)', margin: '10px auto 4px' }} />

        <div style={{ padding: '0 18px', overflowY: 'auto' }}>
          <div
            style={{
              position: 'relative',
              height: 220,
              borderRadius: 18,
              overflow: 'hidden',
              background: 'radial-gradient(130% 110% at 50% 0%, #14180f 0%, #0a0d09 60%, #070906 100%)',
              border: '1px solid var(--hairline)',
              marginTop: 8,
            }}
          >
            <ExerciseDemo motion={selectedVariant?.motion ?? 'press-flat'} implement={selectedVariant?.implement} playing={playing} nonce={nonce} />

            <span
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-dim)',
                background: 'rgba(10,12,10,.6)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-pill)',
                padding: '5px 10px',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
              demonstração
            </span>

            {exercise.tempo && (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  color: 'var(--text-dim)',
                  background: 'rgba(10,12,10,.6)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-pill)',
                  padding: '5px 10px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {exercise.tempo}
              </span>
            )}

            <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'pausar' : 'reproduzir'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'rgba(20,24,18,.72)',
                  border: '1px solid var(--hairline-2)',
                  borderRadius: 'var(--r-pill)',
                  padding: '9px 16px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon name={playing ? 'pause' : 'play'} size={14} stroke="var(--text)" />
              </button>
              <button
                onClick={() => setNonce((n) => n + 1)}
                aria-label="repetir animação"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  background: 'rgba(20,24,18,.72)',
                  border: '1px solid var(--hairline-2)',
                  borderRadius: 'var(--r-pill)',
                  padding: '9px 16px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Repetir
              </button>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0, flex: 1, fontFamily: 'var(--font-space-grotesk)' }}>
                {selectedVariant?.name ?? exercise.name}
              </h2>
              {selectedVariant && <MatchBadge value={selectedVariant.match} />}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {exercise.muscle && <Chip>{exercise.muscle}</Chip>}
              {selectedVariant && <Chip>{selectedVariant.equip}</Chip>}
              {selectedVariant && <Chip>{selectedVariant.level}</Chip>}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 4,
              margin: '18px 0 4px',
              padding: 4,
              background: 'var(--surface-1)',
              border: '1px solid var(--hairline)',
              borderRadius: 13,
            }}
          >
            <button
              onClick={() => setTab('execucao')}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                border: 'none',
                background: tab === 'execucao' ? 'var(--surface-3)' : 'transparent',
                color: tab === 'execucao' ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              Execução
            </button>
            <button
              onClick={() => setTab('variantes')}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: 600,
                border: 'none',
                background: tab === 'variantes' ? 'var(--surface-3)' : 'transparent',
                color: tab === 'variantes' ? 'var(--text)' : 'var(--text-dim)',
              }}
            >
              Variantes ({variants.length})
            </button>
          </div>

          {tab === 'execucao' ? (
            <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cues.map((cue, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, lineHeight: 1.45, color: 'var(--text-dim)' }}>
                    <span
                      style={{
                        flexShrink: 0,
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--accent)',
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-line)',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{cue}</span>
                  </div>
                ))}
              </div>

              <div>
                <p
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '.03em',
                    margin: '0 0 10px',
                  }}
                >
                  Músculos trabalhados
                </p>
                <MuscleMap primary={muscles.primary} secondary={muscles.secondary} />
              </div>

              {exercise.notes && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12.5,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-line)',
                    borderRadius: 12,
                    padding: '9px 13px',
                  }}
                >
                  <Icon name="dna" size={14} stroke="var(--accent)" />
                  {exercise.notes}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 4px' }}>
                Troque para uma variante com melhor fit genético sem perder as séries já registradas.
              </p>
              {variants.map((v) => {
                const on = v.id === selectedId
                return (
                  <button
                    key={v.id}
                    onClick={() => selectVariant(v.id)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      width: '100%',
                      textAlign: 'left',
                      alignItems: 'flex-start',
                      background: on ? 'linear-gradient(120deg,var(--accent-soft),var(--surface-1) 60%)' : 'var(--surface-1)',
                      border: `1px solid ${on ? 'var(--accent-line)' : 'var(--hairline)'}`,
                      borderRadius: 16,
                      padding: 14,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: `2px solid ${on ? 'transparent' : 'var(--hairline-2)'}`,
                        background: on ? 'var(--accent)' : 'transparent',
                        marginTop: 2,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v.name}</span>
                        {v.rec && <Chip>Recomendado</Chip>}
                        {v.betterFit && <Chip accent>fit maior</Chip>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <Chip>{v.equip}</Chip>
                        <Chip>{v.level}</Chip>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: 0 }}>{v.why}</p>
                    </div>
                    <MatchBadge value={v.match} size="sm" />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 18px 24px', borderTop: '1px solid var(--hairline)', background: 'var(--bg)' }}>
          {changed ? (
            <button
              onClick={handleApply}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 'var(--r-pill)',
                background: 'var(--accent)',
                border: 'none',
                color: 'var(--accent-ink)',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--font-space-grotesk)',
                cursor: 'pointer',
              }}
            >
              Usar esta variante
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 'var(--r-pill)',
                background: 'transparent',
                border: '1px solid var(--hairline-2)',
                color: 'var(--text-dim)',
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--font-space-grotesk)',
                cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

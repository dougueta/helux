'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'
import { MiniStep } from '@/components/ui/MiniStep'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkoutPage() {
  const router = useRouter()
  const {
    session,
    loaded,
    isActive,
    setExercise,
    toggleSetDone,
    updateSet,
    addSet,
    finishWorkout,
  } = useActiveWorkout()

  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [showDone, setShowDone] = useState(false)

  const restActive = restLeft > 0

  // Redirect away if no active session
  useEffect(() => {
    if (loaded && !isActive) router.replace('/')
  }, [loaded, isActive, router])

  // Rest timer countdown
  useEffect(() => {
    if (restLeft <= 0) return
    const t = setInterval(() => {
      setRestLeft(l => {
        if (l <= 1) {
          clearInterval(t)
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restLeft > 0])

  if (!session) return null

  const currentIdx = session.currentExerciseIndex
  const currentEx = session.planExercises[currentIdx]
  const currentSets = session.exerciseStates[currentIdx] ?? []

  const totalSets = session.exerciseStates.reduce((acc, sets) => acc + sets.length, 0)
  const totalDone = session.exerciseStates.reduce(
    (acc, sets) => acc + sets.filter(s => s.done).length,
    0
  )
  const elapsed = Math.round(
    (Date.now() - new Date(session.startedAt).getTime()) / 60000
  )

  function handleToggleSet(ei: number, si: number) {
    const wasUndone = !session!.exerciseStates[ei][si].done
    toggleSetDone(ei, si)
    if (wasUndone) {
      const restSecs = 90
      setRestLeft(restSecs)
      setRestTotal(restSecs)
    } else {
      setRestLeft(0)
    }
  }

  function handleNext() {
    if (currentIdx < session!.planExercises.length - 1) {
      setExercise(currentIdx + 1)
      setRestLeft(0)
    } else {
      setShowDone(true)
    }
  }

  async function handleSaveAndExit() {
    await finishWorkout()
    router.replace('/')
  }

  function handleClose() {
    router.replace('/')
  }

  // -------------------------------------------------------------------------
  // Done screen
  // -------------------------------------------------------------------------
  if (showDone) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '32px 24px',
          zIndex: 50,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <Ring value={100} size={120} sw={8}>
          <Icon name="check" size={48} stroke="var(--accent)" sw={2.4} />
        </Ring>
        <h2
          style={{
            fontSize: 25,
            fontWeight: 700,
            color: 'var(--text)',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Treino concluído
        </h2>
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-dim)',
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Mandou bem! O Helux registrou suas cargas e vai recalibrar o próximo treino.
        </p>
        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
          {[
            { v: totalDone, k: 'séries' },
            { v: elapsed, k: 'minutos' },
          ].map(({ v, k }) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-jetbrains-mono)',
                  color: 'var(--accent)',
                }}
              >
                {v}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>{k}</div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSaveAndExit}
          style={{
            width: '100%',
            maxWidth: 360,
            height: 52,
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent)',
            border: 'none',
            color: 'var(--accent-ink)',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'var(--font-space-grotesk)',
            cursor: 'pointer',
            marginTop: 8,
            boxShadow: '0 8px 24px -8px var(--accent-glow)',
          }}
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Active workout screen
  // -------------------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 430,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '48px 16px 12px',
          gap: 8,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={handleClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <Icon name="close" size={18} stroke="var(--text-dim)" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            {session.planExercises[0]?.name.split(' ').slice(0, 2).join(' ') ?? 'Treino'}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-faint)',
              fontFamily: 'var(--font-jetbrains-mono)',
            }}
          >
            {totalDone}/{totalSets} séries
          </div>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="timer" size={18} stroke="var(--text-dim)" />
        </div>
      </div>

      {/* Progress segments */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '8px 16px',
          background: 'var(--bg)',
        }}
      >
        {session.planExercises.map((_, i) => {
          const sets = session.exerciseStates[i] ?? []
          const done = sets.filter(s => s.done).length
          const total = sets.length
          const isCur = i === currentIdx
          const pct = total ? done / total : 0
          return (
            <button
              key={i}
              onClick={() => setExercise(i)}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: 'var(--surface-3)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                overflow: 'hidden',
                outline: isCur ? '1px solid var(--accent)' : 'none',
                outlineOffset: 2,
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct * 100}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </button>
          )
        })}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {currentEx && (
          <>
            {/* Exercise header */}
            <div style={{ padding: '20px 16px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text-dim)',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-pill)',
                    padding: '3px 10px',
                    letterSpacing: '0.04em',
                  }}
                >
                  Musculação
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--r-pill)',
                    padding: '3px 10px',
                    letterSpacing: '0.04em',
                  }}
                >
                  96 fit
                </span>
              </div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: '0 0 6px',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              >
                {currentEx.name}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 10px' }}>
                {currentEx.sets} × {currentEx.reps} reps · descanso 90s
              </p>
              {currentEx.notes && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--r-pill)',
                    padding: '3px 10px',
                  }}
                >
                  <Icon name="dna" size={12} stroke="var(--accent)" sw={1.8} />
                  {currentEx.notes}
                </span>
              )}
            </div>

            {/* Sets table */}
            <div>
              {/* Header row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px 1fr 1fr 1fr 38px',
                  gap: 4,
                  padding: '8px 16px 4px',
                  borderBottom: '1px solid var(--hairline)',
                }}
              >
                {['SÉRIE', 'ANTERIOR', 'KG', 'REPS', ''].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 11,
                      color: 'var(--text-faint)',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textAlign: i === 0 || i === 4 ? 'center' : 'right',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Set rows */}
              {currentSets.map((s, si) => (
                <div
                  key={si}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 1fr 1fr 38px',
                    gap: 4,
                    padding: '6px 16px',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--hairline)',
                    background: s.done ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: 13,
                      color: s.done ? 'var(--accent)' : 'var(--text-faint)',
                      textAlign: 'center',
                    }}
                  >
                    {si + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-jetbrains-mono)',
                      fontSize: 12,
                      color: 'var(--text-faint)',
                      textAlign: 'right',
                    }}
                  >
                    —
                  </span>
                  <MiniStep
                    value={s.weight}
                    step={2.5}
                    onChange={v => updateSet(currentIdx, si, 'weight', v)}
                    done={s.done}
                  />
                  <MiniStep
                    value={s.reps}
                    step={1}
                    onChange={v => updateSet(currentIdx, si, 'reps', v)}
                    done={s.done}
                  />
                  <button
                    onClick={() => handleToggleSet(currentIdx, si)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: s.done ? 'var(--accent)' : 'var(--surface-2)',
                      border: `1px solid ${s.done ? 'var(--accent)' : 'var(--hairline)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon
                      name="check"
                      size={15}
                      stroke={s.done ? 'var(--accent-ink)' : 'var(--text-faint)'}
                      sw={2.4}
                    />
                  </button>
                </div>
              ))}

              {/* Add set button */}
              <button
                onClick={() => addSet(currentIdx)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid var(--hairline)',
                  color: 'var(--text-dim)',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                <Icon name="plus" size={14} stroke="var(--text-dim)" sw={2.2} />
                Adicionar série
              </button>
            </div>
          </>
        )}
      </div>

      {/* Rest timer banner */}
      {restActive && (
        <div
          style={{
            position: 'sticky',
            bottom: 72,
            left: 0,
            right: 0,
            background: 'var(--surface-1)',
            borderTop: '1px solid var(--accent-line)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: 3, background: 'var(--accent-soft)' }}>
            <div
              style={{
                height: '100%',
                background: 'var(--accent)',
                width: `${((restTotal - restLeft) / restTotal) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 16px',
            }}
          >
            <Icon name="timer" size={18} stroke="var(--accent)" />
            <span
              style={{
                fontFamily: 'var(--font-jetbrains-mono)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--accent)',
                flex: 1,
              }}
            >
              {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>descanso</span>
            <button
              onClick={() => {
                setRestLeft(l => l + 15)
                setRestTotal(t => Math.max(t, restLeft + 15))
              }}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--hairline)',
                color: 'var(--text-dim)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              +15s
            </button>
            <button
              onClick={() => setRestLeft(0)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--hairline)',
                color: 'var(--text-dim)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Pular
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px 32px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--hairline)',
          display: 'flex',
          gap: 8,
        }}
      >
        {currentIdx > 0 && (
          <button
            onClick={() => setExercise(currentIdx - 1)}
            style={{
              width: 48,
              height: 52,
              borderRadius: 'var(--r-pill)',
              background: 'transparent',
              border: '1px solid var(--hairline-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <Icon
              name="chevron"
              size={20}
              stroke="var(--text-dim)"
              style={{ transform: 'rotate(180deg)' }}
            />
          </button>
        )}
        <button
          onClick={handleNext}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 'var(--r-pill)',
            background: 'var(--accent)',
            border: 'none',
            color: 'var(--accent-ink)',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'var(--font-space-grotesk)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 8px 24px -8px var(--accent-glow)',
          }}
        >
          {currentIdx < session.planExercises.length - 1 ? (
            <>
              <span>Próximo exercício</span>
              <Icon name="chevron" size={18} stroke="var(--accent-ink)" />
            </>
          ) : (
            <>
              <span>Finalizar treino</span>
              <Icon name="check" size={18} stroke="var(--accent-ink)" sw={2.4} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

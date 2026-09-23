'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'
import { ExerciseSheet } from '@/components/workout/ExerciseSheet'
import { FinishWorkoutConfirmDialog } from '@/components/workout/FinishWorkoutConfirmDialog'
import { WorkoutDoneScreen } from '@/components/workout/WorkoutDoneScreen'
import { useFinishWorkout } from '@/hooks/useFinishWorkout'
import { recommendedVariant, resolveExerciseDisplay } from '@/lib/exerciseDisplay'
import { Icon } from '@/components/ui/icons'
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
    selectVariant,
    getSkippedExercises,
    finishWorkout,
  } = useActiveWorkout()

  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false)
  // Frozen when the workout is finished: the session is cleared after a successful save,
  // but the done screen must stay up (with its summary) until the user leaves.
  const [finishSummary, setFinishSummary] = useState<{ totalDone: number; elapsed: number } | null>(null)
  const { status: finishStatus, submit: submitFinish, reset: resetFinish } = useFinishWorkout(finishWorkout)

  const restActive = restLeft > 0

  // Redirect away if no active session (but never away from the done screen)
  useEffect(() => {
    if (loaded && !isActive && !finishSummary) router.replace('/')
  }, [loaded, isActive, finishSummary, router])

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

  // -------------------------------------------------------------------------
  // Done screen (saving / saved / error)
  // -------------------------------------------------------------------------
  if (finishSummary) {
    return (
      <WorkoutDoneScreen
        status={finishStatus === 'idle' ? 'saving' : finishStatus}
        totalDone={finishSummary.totalDone}
        elapsed={finishSummary.elapsed}
        onGoHome={() => router.replace('/')}
        onRetry={() => { void submitFinish() }}
        onBackToWorkout={() => {
          resetFinish()
          setFinishSummary(null)
        }}
      />
    )
  }

  if (!session) return null

  const currentIdx = session.currentExerciseIndex
  const currentEx = session.planExercises[currentIdx]
  const currentSets = session.exerciseStates[currentIdx] ?? []

  const variants = currentEx?.variants ?? []
  const recVariant = currentEx ? recommendedVariant(currentEx) : undefined
  const currentVariantId = session.variantByExerciseIndex?.[currentIdx]
  const selectedVariant = variants.find(v => v.id === currentVariantId) ?? recVariant
  const betterFitAvailable = variants.some(v => v.betterFit)
  const display = currentEx ? resolveExerciseDisplay(currentEx, currentVariantId) : null

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
    } else if (getSkippedExercises().length > 0) {
      setFinishConfirmOpen(true)
    } else {
      startFinish()
    }
  }

  // Spec 016: the workout is saved when it is finished, not when leaving the done screen.
  function startFinish() {
    setFinishSummary({ totalDone, elapsed })
    void submitFinish()
  }

  function handleConfirmFinish() {
    setFinishConfirmOpen(false)
    startFinish()
  }

  function handleClose() {
    router.replace('/')
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
            {display?.title.split(' ').slice(0, 2).join(' ') ?? 'Treino'}
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
                {display?.fit !== undefined && (
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
                    {display.fit} fit
                  </span>
                )}
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
                {display?.title}
              </h2>
              {display?.plannedName && (
                <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 4px' }}>
                  variante de {display.plannedName}
                </p>
              )}
              <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 10px' }}>
                {currentEx.sets} × {currentEx.reps} reps · descanso 90s
              </p>
              {display?.tip && (
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
                  {display.tip}
                </span>
              )}

              {variants.length > 0 && selectedVariant && (
                <>
                  <button
                    onClick={() => setSheetOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 13,
                      width: '100%',
                      textAlign: 'left',
                      marginTop: 16,
                      padding: '10px 14px 10px 10px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 16,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'relative',
                        width: 72,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: 11,
                        overflow: 'hidden',
                        background: 'radial-gradient(120% 120% at 50% 0%, var(--surface-2), #0c0f0c)',
                        border: '1px solid var(--hairline)',
                      }}
                    >
                      <ExerciseDemo
                        motion={selectedVariant.motion}
                        implement={selectedVariant.implement}
                        playing={true}
                        nonce={`${currentIdx}:${selectedVariant.id}`}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: 5,
                          bottom: 5,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Icon name="play" size={11} stroke="var(--accent-ink)" />
                      </span>
                    </span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ver execução</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                        técnica · músculos · {variants.length} variantes
                      </span>
                    </span>
                    <Icon name="chevron" size={18} stroke="var(--text-faint)" />
                  </button>

                  {display?.plannedName && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginTop: 10,
                        padding: '9px 13px',
                        background: 'var(--accent-soft)',
                        border: '1px solid var(--accent-line)',
                        borderRadius: 12,
                        fontSize: 12.5,
                        color: 'var(--accent)',
                      }}
                    >
                      <Icon name="swap" size={14} stroke="var(--accent)" />
                      <span style={{ flex: 1 }}>
                        Variante ativa <b>{selectedVariant.name} · {selectedVariant.equip}</b>
                      </span>
                      {recVariant && (
                        <button
                          onClick={() => selectVariant(currentIdx, recVariant.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent)',
                            fontSize: 12.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          Voltar à recomendada
                        </button>
                      )}
                    </div>
                  )}

                  {!display?.plannedName && betterFitAvailable && (
                    <button
                      onClick={() => setSheetOpen(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        marginTop: 10,
                        padding: '9px 13px',
                        background: 'var(--surface-2)',
                        border: '1px dashed var(--hairline-2)',
                        borderRadius: 12,
                        fontSize: 12.5,
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Icon name="bolt" size={14} stroke="var(--accent)" />
                      <span style={{ flex: 1 }}>
                        Variante com <b>fit maior</b> disponível
                      </span>
                      <Icon name="chevron" size={15} stroke="var(--text-faint)" />
                    </button>
                  )}
                </>
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

      {sheetOpen && currentEx && (
        <ExerciseSheet
          exercise={currentEx}
          currentVariantId={currentVariantId}
          onApply={(variantId) => selectVariant(currentIdx, variantId)}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {finishConfirmOpen && (
        <FinishWorkoutConfirmDialog
          skippedNames={getSkippedExercises().map(e => e.name)}
          onConfirm={handleConfirmFinish}
          onCancel={() => setFinishConfirmOpen(false)}
        />
      )}
    </div>
  )
}

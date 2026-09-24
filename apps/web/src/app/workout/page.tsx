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
import { Button, IconButton } from '@/components/ui/Button'
import { CurrentSet } from '@/components/ui/CurrentSet'
import { Fit } from '@/components/ui/Fit'
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { SetRow } from '@/components/ui/SetRow'
import { Tag } from '@/components/ui/Tag'
import { Tips } from '@/components/ui/Tips'
import { WorkoutProgress } from '@/components/ui/WorkoutProgress'

const REST_SECS = 90

function mmss(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

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
  // Estado de UI local da v2 (research V5): série em edição e a do ✓ animado.
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null)
  const [poppedSetIndex, setPoppedSetIndex] = useState<number | null>(null)
  // Frozen when the workout is finished: the session is cleared after a successful save,
  // but the done screen must stay up (with its summary) until the user leaves.
  const [finishSummary, setFinishSummary] = useState<{
    totalDone: number
    totalSets: number
    volumeKg: number
    exerciseCount: number
    elapsed: number
  } | null>(null)
  const { status: finishStatus, submit: submitFinish, reset: resetFinish } = useFinishWorkout(finishWorkout)

  const restActive = restLeft > 0
  const currentExerciseIndex = session?.currentExerciseIndex

  // Redirect away if no active session (but never away from the done screen)
  useEffect(() => {
    if (loaded && !isActive && !finishSummary) router.replace('/')
  }, [loaded, isActive, finishSummary, router])

  // Ao trocar de exercício, a série atual volta a ser a primeira não concluída.
  useEffect(() => {
    setEditingSetIndex(null)
    setPoppedSetIndex(null)
  }, [currentExerciseIndex])

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
        totalSets={finishSummary.totalSets}
        volumeKg={finishSummary.volumeKg}
        exerciseCount={finishSummary.exerciseCount}
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
  const display = currentEx ? resolveExerciseDisplay(currentEx, currentVariantId) : null

  const totalSets = session.exerciseStates.reduce((acc, sets) => acc + sets.length, 0)
  const totalDone = session.exerciseStates.reduce(
    (acc, sets) => acc + sets.filter(s => s.done).length,
    0
  )
  // Volume da conclusão (research V10): Σ kg × reps das séries feitas.
  const volumeKg = session.exerciseStates.reduce(
    (acc, sets) => acc + sets.filter(s => s.done).reduce((a, s) => a + s.weight * s.reps, 0),
    0
  )
  const elapsed = Math.round(
    (Date.now() - new Date(session.startedAt).getTime()) / 60000
  )

  function handleToggleSet(ei: number, si: number) {
    const wasUndone = !session!.exerciseStates[ei][si].done
    toggleSetDone(ei, si)
    if (wasUndone) {
      // FR-013: o ✓ anima, a linha fica compacta, o traço acende, o contador sobe e o descanso começa.
      setPoppedSetIndex(si)
      setEditingSetIndex(null)
      setRestLeft(REST_SECS)
      setRestTotal(REST_SECS)
    } else {
      setPoppedSetIndex(null)
      setRestLeft(0)
    }
  }

  function handlePickExercise(i: number) {
    setExercise(i)
    setRestLeft(0)
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
    setFinishSummary({
      totalDone,
      totalSets,
      volumeKg,
      exerciseCount: session!.planExercises.length,
      elapsed,
    })
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
  // Active workout screen (FR-011, handoff 5.2)
  // -------------------------------------------------------------------------
  const firstPending = currentSets.findIndex(s => !s.done)
  const curSet = editingSetIndex ?? (firstPending >= 0 ? firstPending : null)
  const isLast = currentIdx === session.planExercises.length - 1
  const shortTitle = display?.title.split(' ').slice(0, 2).join(' ') ?? 'Treino'
  const betterFit = variants
    .filter(v => v.betterFit)
    .reduce<number | undefined>((best, v) => (best === undefined || v.match > best ? v.match : best), undefined)

  return (
    <div style={{ maxWidth: 'var(--col)', margin: '0 auto', paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
      <ScreenHeader
        left={<IconButton icon="close" label="encerrar treino" onClick={handleClose} />}
        title={shortTitle}
        sub={`${totalDone}/${totalSets} séries`}
        right={
          <span className="hx-icbtn hx-icbtn--bare" aria-hidden="true">
            <Icon name="timer" size={22} />
          </span>
        }
      />
      <div style={{ padding: '4px 16px 0' }}>
        <WorkoutProgress
          groups={session.exerciseStates.map(sets => sets.length)}
          done={session.exerciseStates.map(sets => sets.filter(s => s.done).length)}
          current={currentIdx}
          onPick={handlePickExercise}
        />
      </div>

      {currentEx && display && (
        <div style={{ padding: '0 16px', marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Tag>Musculação</Tag>
            {display.fit !== undefined && <Fit value={display.fit} />}
          </div>
          <h1 className="t-title" style={{ marginTop: 12 }}>
            {display.title}
          </h1>
          {display.plannedName && (
            <p className="t-secondary" style={{ marginTop: 4 }}>
              variante de {display.plannedName}
            </p>
          )}
          <p className="t-body dim" style={{ marginTop: 6 }}>
            <span className="n-sm" style={{ fontSize: 15, color: 'var(--text)' }}>
              {currentEx.sets} × {String(currentEx.reps).replace('-', '–')}
            </span>{' '}
            reps, descanso{' '}
            <span className="n-sm" style={{ fontSize: 15, color: 'var(--text)' }}>
              {REST_SECS}s
            </span>
          </p>

          {display.tip && (
            <section style={{ marginTop: 22 }} aria-label="dicas de execução">
              <Tips text={display.tip} />
            </section>
          )}

          {variants.length > 0 && selectedVariant && (
            <div className="hx-card" style={{ marginTop: 20, overflow: 'hidden' }}>
              <button type="button" className="hx-row-btn" style={{ background: 'none' }} onClick={() => setSheetOpen(true)}>
                <span className="hx-stage" style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, display: 'block' }}>
                  <ExerciseDemo
                    motion={selectedVariant.motion}
                    implement={selectedVariant.implement}
                    playing={false}
                    nonce={`${currentIdx}:${selectedVariant.id}`}
                  />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="t-body-m" style={{ display: 'block' }}>
                    Ver execução
                  </span>
                  <span className="t-secondary">Técnica, músculos e {variants.length} variantes</span>
                </span>
                <span className="dim">
                  <Icon name="chev" size={20} />
                </span>
              </button>

              {display.plannedName ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 52,
                    padding: '6px 12px',
                    borderTop: '1px solid var(--hairline)',
                  }}
                >
                  <span style={{ width: 52, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
                    <Icon name="swap" size={20} />
                  </span>
                  <span className="t-secondary" style={{ flex: 1, minWidth: 0, color: 'var(--text)' }}>
                    Variante ativa: {selectedVariant.equip}
                  </span>
                  {recVariant && (
                    <Button
                      kind="ghost"
                      style={{ minHeight: 40, padding: '0 12px', fontSize: 14 }}
                      onClick={() => selectVariant(currentIdx, recVariant.id)}
                    >
                      Voltar à recomendada
                    </Button>
                  )}
                </div>
              ) : (
                betterFit !== undefined && (
                  <button
                    type="button"
                    className="hx-row-btn"
                    style={{ background: 'none', borderTop: '1px solid var(--hairline)', minHeight: 52 }}
                    onClick={() => setSheetOpen(true)}
                  >
                    <span style={{ width: 52, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
                      <Icon name="swap" size={20} />
                    </span>
                    <span className="t-secondary" style={{ flex: 1, minWidth: 0, color: 'var(--text)' }}>
                      Variante com fit maior disponível
                    </span>
                    <Fit value={betterFit} />
                    <span className="dim">
                      <Icon name="chev" size={20} />
                    </span>
                  </button>
                )
              )}
            </div>
          )}

          <section style={{ marginTop: 28 }}>
            <SectionHeader title="Séries" aside="kg × reps" />
            <div className="hx-sets">
              {currentSets.map((s, si) =>
                si === curSet ? (
                  <CurrentSet
                    key={si}
                    no={si + 1}
                    total={currentSets.length}
                    prev={null}
                    weight={s.weight}
                    reps={s.reps}
                    done={s.done}
                    pop={poppedSetIndex === si}
                    onWeight={v => updateSet(currentIdx, si, 'weight', v)}
                    onReps={v => updateSet(currentIdx, si, 'reps', v)}
                    onDone={() => handleToggleSet(currentIdx, si)}
                  />
                ) : (
                  <SetRow
                    key={si}
                    no={si + 1}
                    prev={null}
                    weight={s.weight}
                    reps={s.reps}
                    done={s.done}
                    pop={poppedSetIndex === si}
                    onToggle={() => handleToggleSet(currentIdx, si)}
                    onEdit={() => setEditingSetIndex(si)}
                  />
                ),
              )}
            </div>
            <Button kind="ghost" block icon="plus" style={{ marginTop: 6 }} onClick={() => addSet(currentIdx)}>
              Adicionar série
            </Button>
          </section>
        </div>
      )}

      {/* espaço para o rodapé fixo */}
      <div style={{ height: restActive ? 220 : 140 }} />

      <div className="hx-dock">
        <div className="hx-cta-dock">
          {restActive && (
            <div
              className="hx-focus"
              role="timer"
              aria-label="descanso"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 10px 10px 12px',
                marginBottom: 10,
                animation: 'hx-up var(--dur-3) var(--ease-out)',
              }}
            >
              <Ring size={48} stroke={3} value={restTotal ? restLeft / restTotal : 0}>
                <span style={{ color: 'var(--accent)', display: 'grid' }}>
                  <Icon name="timer" size={20} />
                </span>
              </Ring>
              <div style={{ flex: 1 }}>
                <div className="t-caption">Descanso</div>
                <div className="n-lg">{mmss(restLeft)}</div>
              </div>
              <Button
                kind="secondary"
                style={{ padding: '0 14px' }}
                onClick={() => {
                  setRestLeft(l => l + 15)
                  setRestTotal(t => Math.max(t, restLeft + 15))
                }}
              >
                +15s
              </Button>
              <Button kind="ghost" style={{ padding: '0 12px' }} onClick={() => setRestLeft(0)}>
                Pular
              </Button>
            </div>
          )}
          <Button
            kind={restActive ? 'secondary' : 'primary'}
            size="lg"
            block
            iconRight={isLast ? 'check' : 'chev'}
            onClick={handleNext}
          >
            {isLast ? 'Finalizar treino' : 'Próximo exercício'}
          </Button>
        </div>
      </div>

      {currentEx && (
        <ExerciseSheet
          key={currentIdx}
          open={sheetOpen}
          exercise={currentEx}
          currentVariantId={currentVariantId}
          onApply={variantId => selectVariant(currentIdx, variantId)}
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CARDIO_BANK, type ComplementaryCategory, type ComplementaryRoutine } from '@helux/types'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'
import { Banner } from '@/components/ui/Banner'
import { Segmented } from '@/components/ui/Segmented'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Icon } from '@/components/ui/icons'
import { useActiveRoutine } from '@/hooks/useActiveRoutine'
import { useRestTimer } from '@/hooks/useRestTimer'
import { getRoutines } from '@/services/routines.service'

const EFFORT_OPTIONS: { value: string; label: string; score: number }[] = [
  { value: 'facil', label: 'Fácil', score: 4 },
  { value: 'moderado', label: 'Moderado', score: 6 },
  { value: 'dificil', label: 'Difícil', score: 8 },
  { value: 'limite', label: 'No limite', score: 10 },
]

function formatMMSS(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function RoutineExecutionClient({
  category,
  initialRoutine,
}: {
  category: ComplementaryCategory
  initialRoutine?: ComplementaryRoutine | null
}) {
  const router = useRouter()
  const {
    activeRoutine,
    loaded,
    startRoutine,
    toggleSet,
    setCurrentItemIndex,
    setCardioModality,
    setCardioMinutes,
    setEffort,
    discardRoutine,
    finishRoutine,
  } = useActiveRoutine()

  const restTimer = useRestTimer()
  const [routine, setRoutine] = useState<ComplementaryRoutine | null>(initialRoutine ?? null)
  const [loadingRoutine, setLoadingRoutine] = useState(!initialRoutine)
  const [side, setSide] = useState<'esquerdo' | 'direito'>('esquerdo')
  const [countdownLeft, setCountdownLeft] = useState<number>(30)
  const [countdownRunning, setCountdownRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (initialRoutine) {
      setRoutine(initialRoutine)
      setLoadingRoutine(false)
      return
    }
    let mounted = true
    getRoutines()
      .then(view => {
        if (!mounted) return
        setRoutine(view.routines[category] ?? null)
      })
      .finally(() => {
        if (mounted) setLoadingRoutine(false)
      })
    return () => {
      mounted = false
    }
  }, [category, initialRoutine])

  useEffect(() => {
    if (!loaded || !routine) return
    if (!activeRoutine || activeRoutine.routine.category !== category) {
      startRoutine(routine)
    }
  }, [loaded, routine, activeRoutine, category, startRoutine])

  const currentRoutine = activeRoutine?.routine.category === category ? activeRoutine.routine : routine
  const currentIdx = activeRoutine?.routine.category === category ? activeRoutine.currentItemIndex : 0
  const currentItem = currentRoutine?.items[currentIdx]

  useEffect(() => {
    setSide('esquerdo')
    setCountdownRunning(false)
    if (currentItem?.seconds) {
      setCountdownLeft(currentItem.seconds)
    }
  }, [currentIdx, currentItem?.id, currentItem?.seconds])

  useEffect(() => {
    if (!countdownRunning) return
    const id = setInterval(() => {
      setCountdownLeft(prev => {
        if (prev <= 1) {
          setCountdownRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [countdownRunning])

  if (loadingRoutine || !currentRoutine) {
    return (
      <main className="hx-page" style={{ paddingTop: 24 }}>
        <p className="t-secondary">Carregando rotina complementar...</p>
      </main>
    )
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      await finishRoutine(notes)
      router.push('/treinos?aba=rotinas')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    discardRoutine()
    router.push('/treinos?aba=rotinas')
  }

  const selectedEffortKey =
    EFFORT_OPTIONS.find(o => o.score === (activeRoutine?.effort ?? 6))?.value ?? 'moderado'

  if (category === 'cardio') {
    const cardioItem = currentRoutine.items[0]
    const allowedIds = cardioItem?.cardio?.allowedModalities ?? ['bike']
    const selectedModalityId = activeRoutine?.selectedModality ?? cardioItem?.cardio?.modality ?? 'bike'
    const selectedEntry = CARDIO_BANK.find(c => c.id === selectedModalityId) ?? CARDIO_BANK[0]
    const cardioMinutes = activeRoutine?.cardioMinutes ?? currentRoutine.estimatedMinutes
    const zone = cardioItem?.cardio?.zone ?? 'leve'

    return (
      <main className="hx-page" style={{ paddingBottom: 112 }}>
        <ScreenHeader
          title={currentRoutine.title}
          sub={`Zona ${zone} · ${cardioMinutes} min`}
          left={
            <button type="button" className="hx-icbtn" aria-label="Voltar" onClick={handleBack}>
              <Icon name="back" size={20} />
            </button>
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', marginTop: 'var(--s-3)' }}>
          {currentRoutine.legDayWarning && (
            <Banner kind="warn" title="Treino de pernas hoje">
              {currentRoutine.legDayWarning}
            </Banner>
          )}

          <div className="hx-stage" style={{ height: 180, display: 'grid', placeItems: 'center' }}>
            <ExerciseDemo motion={selectedEntry.motion} playing={true} />
          </div>

          <section className="hx-card" style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <div>
              <h2 className="t-heading">{selectedEntry.name}</h2>
              <p className="t-secondary" style={{ marginTop: 4 }}>{currentRoutine.purpose}</p>
            </div>

            <div>
              <p className="t-caption" style={{ marginBottom: 6 }}>Modalidade compatível</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allowedIds.map(id => {
                  const entry = CARDIO_BANK.find(c => c.id === id)
                  if (!entry) return null
                  const active = id === selectedModalityId
                  return (
                    <button
                      key={id}
                      type="button"
                      className={active ? 'hx-btn hx-btn--primary' : 'hx-btn hx-btn--secondary'}
                      style={{ minHeight: 36, padding: '0 14px', fontSize: 13 }}
                      aria-pressed={active}
                      onClick={() => setCardioModality(id)}
                    >
                      {entry.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="t-caption" style={{ marginBottom: 6 }}>Duração realizada (minutos)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  className="hx-btn hx-btn--secondary"
                  aria-label="Diminuir 5 minutos"
                  onClick={() => setCardioMinutes(Math.max(5, cardioMinutes - 5))}
                >
                  −5
                </button>
                <span className="n-lg">{cardioMinutes} min</span>
                <button
                  type="button"
                  className="hx-btn hx-btn--secondary"
                  aria-label="Aumentar 5 minutos"
                  onClick={() => setCardioMinutes(Math.min(120, cardioMinutes + 5))}
                >
                  +5
                </button>
              </div>
            </div>

            <div>
              <p className="t-caption" style={{ marginBottom: 6 }}>Esforço percebido</p>
              <Segmented
                label="Esforço percebido"
                options={EFFORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                value={selectedEffortKey}
                onChange={val => {
                  const found = EFFORT_OPTIONS.find(o => o.value === val)
                  if (found) setEffort(found.score)
                }}
              />
            </div>

            <div>
              <p className="t-caption" style={{ marginBottom: 6 }}>Como executar e manter a zona</p>
              <ol className="hx-steps">
                {[...selectedEntry.cues, selectedEntry.zoneGuidance[zone]].map((cue, idx) => (
                  <li key={idx}>{cue}</li>
                ))}
              </ol>
            </div>
          </section>

          <button
            type="button"
            className="hx-btn hx-btn--primary hx-btn--lg hx-btn--block"
            disabled={saving}
            onClick={handleFinish}
          >
            Concluir cardio
          </button>
        </div>
      </main>
    )
  }

  if (category === 'alongamento-mobilidade' && currentItem) {
    const isLast = currentIdx >= currentRoutine.items.length - 1
    return (
      <main className="hx-page" style={{ paddingBottom: 112 }}>
        <ScreenHeader
          title={currentRoutine.title}
          sub={`Movimento ${currentIdx + 1} de ${currentRoutine.items.length}`}
          left={
            <button type="button" className="hx-icbtn" aria-label="Voltar" onClick={handleBack}>
              <Icon name="back" size={20} />
            </button>
          }
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', marginTop: 'var(--s-3)' }}>
          <div className="hx-stage" style={{ height: 180, display: 'grid', placeItems: 'center' }}>
            <ExerciseDemo motion={currentItem.motion} playing={true} />
          </div>

          <section className="hx-card" style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <h2 className="t-heading">{currentItem.name}</h2>
              <span className="hx-tag">
                {currentItem.seconds ? `${currentItem.seconds}s` : currentItem.reps}
              </span>
            </div>

            {currentItem.unilateral && (
              <div>
                <p className="t-caption" style={{ marginBottom: 6 }}>Execução unilateral — cumpra os dois lados</p>
                <Segmented
                  label="Lado do movimento"
                  options={[
                    { value: 'esquerdo', label: 'Lado esquerdo' },
                    { value: 'direito', label: 'Lado direito' },
                  ]}
                  value={side}
                  onChange={v => {
                    setSide(v)
                    if (currentItem.seconds) {
                      setCountdownLeft(currentItem.seconds)
                      setCountdownRunning(false)
                    }
                  }}
                />
              </div>
            )}

            {currentItem.mode === 'tempo' && currentItem.seconds && (
              <div className="hx-focus" style={{ padding: 'var(--s-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="n-xl">{formatMMSS(countdownLeft)}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="hx-btn hx-btn--secondary"
                    onClick={() => setCountdownRunning(r => !r)}
                  >
                    {countdownRunning ? 'Pausar timer' : 'Iniciar timer'}
                  </button>
                  <button
                    type="button"
                    className="hx-btn hx-btn--ghost"
                    onClick={() => {
                      setCountdownRunning(false)
                      setCountdownLeft(currentItem.seconds ?? 30)
                    }}
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="t-caption" style={{ marginBottom: 6 }}>Como executar</p>
              <ol className="hx-steps">
                {currentItem.cues.map((cue, i) => (
                  <li key={i}>{cue}</li>
                ))}
              </ol>
            </div>
          </section>

          <div style={{ display: 'flex', gap: 8 }}>
            {currentIdx > 0 && (
              <button
                type="button"
                className="hx-btn hx-btn--secondary"
                onClick={() => setCurrentItemIndex(currentIdx - 1)}
              >
                Anterior
              </button>
            )}
            {!isLast ? (
              <button
                type="button"
                className="hx-btn hx-btn--primary hx-btn--lg hx-btn--block"
                onClick={() => {
                  toggleSet(currentIdx, 0)
                  setCurrentItemIndex(currentIdx + 1)
                }}
              >
                Concluir movimento
              </button>
            ) : (
              <button
                type="button"
                className="hx-btn hx-btn--primary hx-btn--lg hx-btn--block"
                disabled={saving}
                onClick={() => {
                  toggleSet(currentIdx, 0)
                  void handleFinish()
                }}
              >
                Concluir rotina
              </button>
            )}
          </div>
        </div>
      </main>
    )
  }

  // Core / Abdominal
  return (
    <main className="hx-page" style={{ paddingBottom: 112 }}>
      <ScreenHeader
        title={currentRoutine.title}
        sub={currentRoutine.subtitle}
        left={
          <button type="button" className="hx-icbtn" aria-label="Voltar" onClick={handleBack}>
            <Icon name="back" size={20} />
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', marginTop: 'var(--s-3)' }}>
        <p className="t-secondary">{currentRoutine.purpose}</p>

        {restTimer.isActive && (
          <div className="hx-focus" style={{ padding: 'var(--s-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="t-caption">Descanso entre séries</span>
              <div className="n-lg">{formatMMSS(restTimer.secondsLeft)}</div>
            </div>
            <button type="button" className="hx-btn hx-btn--secondary" onClick={() => restTimer.reset()}>
              Pular descanso
            </button>
          </div>
        )}

        {currentRoutine.items.map((item, itemIdx) => {
          const sets = activeRoutine?.completedSets[itemIdx] ?? Array.from({ length: item.sets }, () => false)
          const targetLabel = item.seconds ? `${item.seconds}s isometria` : item.reps ?? '12 reps'
          return (
            <section
              key={item.id}
              className="hx-card"
              style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <h2 className="t-section">{item.name}</h2>
                  <p className="t-caption" style={{ marginTop: 2 }}>
                    {item.sets} séries · {targetLabel}{item.unilateral ? ' · unilateral' : ''}
                  </p>
                </div>
                <div className="hx-stage" style={{ width: 64, height: 64, flexShrink: 0 }}>
                  <ExerciseDemo motion={item.motion} playing={true} />
                </div>
              </div>

              <div className="hx-sets">
                {sets.map((done, setIdx) => (
                  <div
                    key={setIdx}
                    className={done ? 'hx-set is-done' : 'hx-set'}
                  >
                    <span className="hx-set-no">{setIdx + 1}</span>
                    <span className="t-body">{targetLabel}</span>
                    <span className="hx-set-prev">{item.restSeconds}s desc.</span>
                    <button
                      type="button"
                      className={done ? 'hx-chk is-on' : 'hx-chk'}
                      aria-label={`Série ${setIdx + 1} de ${item.name}`}
                      aria-pressed={done}
                      onClick={() => {
                        toggleSet(itemIdx, setIdx)
                        if (!done && item.restSeconds > 0) {
                          restTimer.start(item.restSeconds)
                        }
                      }}
                    >
                      <Icon name="check" size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <ol className="hx-steps">
                {item.cues.map((cue, cIdx) => (
                  <li key={cIdx}>{cue}</li>
                ))}
              </ol>
            </section>
          )
        })}

        <section className="hx-card" style={{ padding: 'var(--s-4)' }}>
          <p className="t-caption" style={{ marginBottom: 6 }}>Esforço percebido (opcional)</p>
          <Segmented
            label="Esforço percebido"
            options={EFFORT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            value={selectedEffortKey}
            onChange={val => {
              const found = EFFORT_OPTIONS.find(o => o.value === val)
              if (found) setEffort(found.score)
            }}
          />
        </section>

        <button
          type="button"
          className="hx-btn hx-btn--primary hx-btn--lg hx-btn--block"
          disabled={saving}
          onClick={handleFinish}
        >
          Concluir rotina
        </button>
      </div>
    </main>
  )
}

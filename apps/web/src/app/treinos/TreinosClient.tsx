// apps/web/src/app/treinos/TreinosClient.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { HistoryRow } from '@/components/ui/HistoryRow'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { PlanExerciseList } from '@/components/workout/PlanExerciseList'
import { PlanRationale } from '@/components/agents/PlanRationale'
import { SessionEditSheet } from '@/components/agents/SessionEditSheet'
import { TodayAdjustCard } from '@/components/agents/TodayAdjustCard'
import { AgentChat } from '@/components/agents/AgentChat'
import { sessionDateLabel, summarizeSession } from '@/lib/sessionSummary'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'
import type { AdjustedWorkoutPlanView } from '@helux/types'
import { PlanGenerationState } from '@/components/workout/PlanGenerationState'
import { isMainExercise } from '@helux/workouts'

interface TreinosClientProps {
  plan: AdjustedWorkoutPlanView | null
  recentSessions: WorkoutSessionRow[]
}

/** Treinos (FR-023): o treino atual em lista plana, gerar plano e os recentes. */
export function TreinosClient({ plan: initialPlan, recentSessions }: TreinosClientProps) {
  const router = useRouter()
  const { startWorkout } = useActiveWorkout()
  const { plan, generating, generationError, generatePlan, repeatWeek, refetch } = useWorkoutPlan()
  const [editing, setEditing] = useState<number | null>(null)
  const [coachOpen, setCoachOpen] = useState(false)
  const currentPlan = plan ?? initialPlan
  const today = currentPlan?.today
  // Sessão pendente no mesociclo = número de concluídas (spec 022, edição manual).
  const sessionIndex = currentPlan?.progress?.completed ?? 0

  function handleStart() {
    if (!today) return
    startWorkout(today.exercises)
    router.push('/workout')
  }

  return (
    <div className="hx-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 120 }}>
      <p className="t-secondary" style={{ marginTop: 20 }}>
        Seu treino atual
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Treinos
      </h1>

      {today ? (
        <section style={{ marginTop: 24 }}>
          <SectionHeader
            title={today.focus ? `Treino ${today.letter} — ${today.focus}` : `Treino ${today.letter}`}
            aside={`${today.exercises.filter(isMainExercise).length} exercícios`}
          />
          <PlanExerciseList exercises={today.exercises} />
          <div style={{ marginTop: 16 }}>
            <Button kind="primary" size="lg" block iconRight="play" onClick={handleStart}>
              Iniciar treino
            </Button>
          </div>
          <div style={{ marginTop: 8 }}>
            <Button kind="ghost" block loading={generating} onClick={generatePlan}>
              Gerar novo plano
            </Button>
          </div>
        </section>
      ) : null}

      {today && (
        <>
          <section style={{ marginTop: 24 }}>
            <SectionHeader title="Ajustar o treino de hoje" />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="editar exercícios">
              {today.exercises.map((e, i) =>
                isMainExercise(e) ? (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid var(--hairline)' }}>
                    <span className="t-body" style={{ flex: 1 }}>
                      {e.name}
                    </span>
                    <Button kind="ghost" aria-label={`editar ${e.name}`} onClick={() => setEditing(i)}>
                      Editar
                    </Button>
                  </li>
                ) : null,
              )}
            </ul>
            <TodayAdjustCard onApplied={() => void refetch()} />
          </section>
          {editing !== null && today.exercises[editing] && (
            <SessionEditSheet
              open
              sessionIndex={sessionIndex}
              exerciseIndex={editing}
              exercise={today.exercises[editing]}
              onClose={() => setEditing(null)}
              onSaved={() => {
                setEditing(null)
                void refetch()
              }}
            />
          )}
          {currentPlan?.rationaleDecisions && <PlanRationale decisions={currentPlan.rationaleDecisions} sourcesUsed={currentPlan.sourcesUsed} />}
        </>
      )}

      {!today && currentPlan?.status ? (
        <section className="hx-focus" style={{ marginTop: 24, padding: 20 }}>
          <PlanGenerationState plan={currentPlan} busy={generating} onRetry={() => void generatePlan()} onRepeatWeek={() => void repeatWeek()} />
        </section>
      ) : !today ? (
        <section className="hx-focus" style={{ marginTop: 24, padding: 20 }}>
          <h2 className="t-heading">Nenhum plano gerado ainda</h2>
          <p className="t-secondary" style={{ marginTop: 6 }}>
            Gere seu primeiro plano a partir do seu DNA e do seu último check-in.
          </p>
          <div style={{ marginTop: 16 }}>
            <Button kind="primary" size="lg" block loading={generating} onClick={generatePlan}>
              Gerar meu plano
            </Button>
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: 28 }}>
        <SectionHeader title="Falar com o treinador" />
        {coachOpen ? (
          <AgentChat channel="treino" onHandoff={to => router.push(`/equipe?agente=${to}`)} placeholder="Ex.: posso trocar o supino por algo com halteres?" />
        ) : (
          <Button kind="secondary" block onClick={() => setCoachOpen(true)}>
            Abrir conversa com o Agente de Treino
          </Button>
        )}
      </section>

      {generationError && (
        <div style={{ marginTop: 12 }}>
          <Banner kind="err" title="Não foi possível gerar o plano">
            {generationError}
          </Banner>
        </div>
      )}

      {recentSessions.length > 0 && (
        <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
          <SectionHeader
            title="Treinos recentes"
            action={
              <Link href="/history" className="t-secondary" style={{ color: 'var(--text)' }}>
                Ver histórico
              </Link>
            }
          />
          {recentSessions.slice(0, 3).map(session => {
            const s = summarizeSession(session)
            return (
              <HistoryRow
                key={session.id}
                href={`/history/${session.id}`}
                name={s.name}
                date={sessionDateLabel(session.date)}
                sets={s.sets}
                durationMin={s.durationMin}
                volumeT={s.volumeT}
              />
            )
          })}
        </section>
      )}
    </div>
  )
}

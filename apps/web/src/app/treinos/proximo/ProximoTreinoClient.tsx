'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdjustedWorkoutPlanView } from '@helux/types'
import { isMainExercise } from '@helux/workouts'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'
import { useTirednessFlow } from '@/hooks/useTirednessFlow'
import { Banner } from '@/components/ui/Banner'
import { Button, IconButton } from '@/components/ui/Button'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { AdjustmentChangesList } from '@/components/workout/AdjustmentChangesList'
import { ExerciseSheet } from '@/components/workout/ExerciseSheet'
import { PlanExerciseList } from '@/components/workout/PlanExerciseList'
import { TirednessDialog } from '@/components/workout/TirednessDialog'
import { WeekBadge } from '@/components/workout/WeekBadge'

/**
 * Preview do próximo treino (spec 026, US2): o treino de hoje completo, só
 * leitura. Não cria sessão nem pede check-in; "Iniciar treino" segue o fluxo da Home.
 */
export function ProximoTreinoClient({ plan: initialPlan, from }: { plan: AdjustedWorkoutPlanView | null; from?: string }) {
  const router = useRouter()
  const { isActive, startWorkout } = useActiveWorkout()
  const { plan, loading, refetch } = useWorkoutPlan()
  const currentPlan = plan ?? initialPlan
  const today = currentPlan?.today
  const [viewing, setViewing] = useState<number | null>(null)
  // Destino explícito: aberto por link direto não há histórico do app para voltar (revisão do PR #20).
  const backHref = from === 'home' ? '/' : '/treinos'

  const tiredness = useTirednessFlow({
    today: today ?? undefined,
    refetch,
    onStart: (exercises) => {
      startWorkout(exercises, { deload: currentPlan?.week?.deload })
      router.push('/workout')
    },
  })

  // Sem próximo treino (sem plano, gerando, ciclo concluído): a aba Treinos já trata esses estados.
  useEffect(() => {
    if (!loading && !today) router.replace('/treinos')
  }, [loading, today, router])

  if (!today) return null

  const viewed = viewing !== null ? today.exercises[viewing] : undefined
  const changes = today.changes ?? []

  return (
    <div className="hx-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 120 }}>
      <ScreenHeader
        left={<IconButton icon="back" label="voltar" bare onClick={() => router.push(backHref)} />}
        title="Próximo treino"
      />

      <section style={{ marginTop: 12 }}>
        <WeekBadge week={currentPlan?.week} kind={currentPlan?.kind} />
        <SectionHeader
          title={today.focus ? `Treino ${today.letter} — ${today.focus}` : `Treino ${today.letter}`}
          aside={`${today.exercises.filter(isMainExercise).length} exercícios`}
        />
        {(today.adjustmentReason || changes.length > 0) && (
          <div style={{ marginBottom: 12 }}>
            {today.adjustmentReason && <p className="t-secondary">{today.adjustmentReason}</p>}
            {changes.length > 0 && <AdjustmentChangesList changes={changes} />}
          </div>
        )}
        <PlanExerciseList exercises={today.exercises} onSelect={setViewing} />
      </section>

      <div style={{ marginTop: 20 }}>
        {isActive ? (
          <>
            <Banner kind="warn" title="Treino em andamento">
              Continue de onde parou; as séries feitas estão salvas.
            </Banner>
            <div style={{ marginTop: 12 }}>
              <Button kind="primary" size="lg" block iconRight="play" onClick={() => router.push('/workout')}>
                Continuar treino
              </Button>
            </div>
          </>
        ) : (
          <Button kind="primary" size="lg" block iconRight="play" onClick={() => tiredness.openStart()}>
            Iniciar treino
          </Button>
        )}
      </div>

      {viewed && <ExerciseSheet open exercise={viewed} onClose={() => setViewing(null)} />}

      <TirednessDialog
        open={tiredness.open}
        mode={tiredness.mode}
        step={tiredness.step}
        candidate={tiredness.candidate}
        automaticLevel={tiredness.assessment.automaticLevel}
        changes={tiredness.changes}
        changesBase={tiredness.changesBase}
        saving={tiredness.saving}
        error={tiredness.error}
        onSelectCandidate={tiredness.selectCandidate}
        onContinue={() => { void tiredness.continueQuestion() }}
        onConfirmConflict={() => { void tiredness.confirmConflict() }}
        onDeclineConflict={tiredness.declineConflict}
        onConfirmChanges={() => { void tiredness.confirmChanges() }}
        onCancelChanges={tiredness.cancelChanges}
        onClose={tiredness.close}
      />
    </div>
  )
}

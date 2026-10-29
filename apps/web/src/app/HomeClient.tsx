'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdjustedWorkoutPlanView, BodyCheckin, PlannedExercise } from '@helux/types'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'
import { useTirednessFlow } from '@/hooks/useTirednessFlow'
import { CheckinCard } from '@/components/checkin/CheckinCard'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { CycleProgress, type CycleState } from '@/components/ui/CycleProgress'
import { Fit } from '@/components/ui/Fit'
import { Icon, HelixMark } from '@/components/ui/icons'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { TirednessSelector } from '@/components/workout/TirednessSelector'
import { TirednessDialog } from '@/components/workout/TirednessDialog'
import { PlanGenerationState } from '@/components/workout/PlanGenerationState'
import { FlareNotice } from '@/components/conditions/FlareNotice'
import { CycleSummaryCard } from '@/components/cycle/CycleSummaryCard'
import { WeekBadge } from '@/components/workout/WeekBadge'
import { resolveExerciseDisplay } from '@/lib/exerciseDisplay'
import { todayHighlight } from '@/lib/todayHighlight'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface HomeClientProps {
  plan: AdjustedWorkoutPlanView | null
  firstName: string
  checkins: BodyCheckin[]
  analytics: { thisWeekSessions: number; currentStreakWeeks: number } | null
}

function todayLabel() {
  return new Date()
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
    .replace(/^\w/, c => c.toUpperCase())
}

/**
 * Sessões do ciclo para o `CycleProgress`: as anteriores à de hoje (concluídas),
 * a de hoje e as próximas. A API manda a letra de hoje e das próximas; as
 * anteriores seguem a sequência de letras do mesociclo (A, B, C…).
 */
function cycleSessions(plan: AdjustedWorkoutPlanView): { label: string; state: CycleState }[] {
  const { today, upcoming, progress } = plan
  if (!today || !progress) return []
  // Spec 024: no mesociclo semanal, os pontos mostram só a semana atual (as letras se repetem a cada semana).
  if (plan.week) {
    const perWeek = Math.round(progress.total / plan.week.total)
    const ahead = upcoming.filter(s => s.week === plan.week!.current)
    const doneThisWeek = Math.max(0, perWeek - 1 - ahead.length)
    return [
      ...Array.from({ length: doneThisWeek }, (_, i) => ({ label: String.fromCharCode(65 + i), state: 'done' as const })),
      { label: today.letter, state: 'current' as const },
      ...ahead.map(s => ({ label: s.letter, state: 'todo' as const })),
    ]
  }
  const before = Math.max(0, progress.total - 1 - upcoming.length)
  const base = today.letter.charCodeAt(0) - before
  return [
    ...Array.from({ length: before }, (_, i) => ({ label: String.fromCharCode(base + i), state: 'done' as const })),
    { label: today.letter, state: 'current' as const },
    ...upcoming.map(s => ({ label: s.letter, state: 'todo' as const })),
  ]
}

function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="carregando treino">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton w={150} h={14} />
        <Skeleton w={80} h={12} />
      </div>
      <Skeleton w="85%" h={24} style={{ marginTop: 16 }} />
      <Skeleton w={90} h={14} style={{ marginTop: 12 }} />
      <Skeleton w="60%" h={12} style={{ marginTop: 18 }} />
      <Skeleton w="70%" h={12} style={{ marginTop: 8 }} />
      <Skeleton h={52} r={999} style={{ marginTop: 36 }} />
      <Skeleton h={56} r={999} style={{ marginTop: 16 }} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeClient({ plan: initialPlan, firstName, checkins, analytics }: HomeClientProps) {
  const router = useRouter()
  const { startWorkout } = useActiveWorkout()
  const { plan, loading, generating, generationError, generatePlan, repeatWeek, refetch } = useWorkoutPlan()
  const currentPlan: AdjustedWorkoutPlanView | null = plan ?? initialPlan
  const today = currentPlan?.today

  // Spec 011: nível de cansaço com resumo das mudanças antes de aplicar; o
  // fluxo chama refetch() depois de salvar (TD-006) e só então inicia o treino.
  const tiredness = useTirednessFlow({
    today: today ?? undefined,
    refetch,
    onStart: (exercises) => {
      startWorkout(exercises)
      router.push('/workout')
    },
  })

  function handleStart() {
    if (!today) return
    tiredness.openStart()
  }

  const exercises: PlannedExercise[] = today?.exercises ?? []
  // Spec 014: o destaque é o treino principal (aquecimento/volta à calma só são indicados).
  const { first, next, more, count, hasExtraPhases } = todayHighlight(exercises)
  const firstFit = first ? resolveExerciseDisplay(first, undefined).fit : undefined
  const streak = analytics?.currentStreakWeeks ?? 0
  const sessions = currentPlan ? cycleSessions(currentPlan) : []

  return (
    <div className="hx-page" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 120 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 18, letterSpacing: '-.02em' }}>
          <HelixMark />
          helux
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {streak > 0 && (
            <span
              role="img"
              aria-label={`sequência de ${streak} ${streak === 1 ? 'semana' : 'semanas'}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 12px' }}
            >
              <span style={{ color: 'var(--warn)', display: 'grid' }}>
                <Icon name="flame" size={18} />
              </span>
              <span className="n-sm" style={{ fontWeight: 600 }}>
                {streak}
              </span>
              <span className="t-caption">sem</span>
            </span>
          )}
          <Link href="/perfil" className="hx-icbtn" aria-label="Perfil de treino">
            <Icon name="user" size={22} />
          </Link>
        </span>
      </header>

      <p className="t-secondary" style={{ marginTop: 8 }}>
        {todayLabel()}
      </p>
      <h1 className="t-display" style={{ marginTop: 4 }}>
        Bom treino, {firstName}
      </h1>

      <section className="hx-focus" style={{ marginTop: 20, padding: 20 }} aria-label="treino de hoje">
        {!currentPlan && loading ? (
          <HomeSkeleton />
        ) : today ? (
          <>
            <WeekBadge week={currentPlan?.week} kind={currentPlan?.kind} />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginTop: currentPlan?.week ? 8 : 0 }}>
              <span className="t-secondary" style={{ color: 'var(--text)' }}>
                {today.focus ? `Treino ${today.letter} — ${today.focus}` : `Treino ${today.letter}`}
              </span>
              <span className="t-caption" style={{ whiteSpace: 'nowrap' }}>
                <span className="n-sm" style={{ color: 'var(--text)' }}>
                  {count}
                </span>{' '}
                exercícios
              </span>
            </div>
            <h2 className="t-heading" style={{ marginTop: 14, fontSize: 24, lineHeight: '28px' }}>
              {first?.name ?? 'Treino personalizado'}
            </h2>
            {hasExtraPhases && (
              <p className="t-caption" style={{ marginTop: 6 }}>
                Inclui aquecimento e volta à calma
              </p>
            )}
            {firstFit !== undefined && (
              <div style={{ marginTop: 10 }}>
                <Fit value={firstFit} size="md" />
              </div>
            )}
            {next.length > 0 && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '6px 12px' }}>
                <span className="t-caption" style={{ paddingTop: 2 }}>
                  Depois
                </span>
                <div className="t-secondary" style={{ color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {next.map((e, i) => (
                    <span key={i}>{e.name}</span>
                  ))}
                  {more > 0 && <span className="dim">e mais {more}</span>}
                </div>
              </div>
            )}
            <div style={{ height: 1, background: 'var(--hairline)', margin: '18px -20px' }} />
            <TirednessSelector
              assessment={tiredness.assessment}
              changes={today.changes ?? []}
              reason={today.adjustmentReason}
              onChoose={(level) => {
                void tiredness.chooseFromHome(level)
              }}
              disabled={tiredness.saving}
              error={tiredness.open ? null : tiredness.error}
            />
            <div style={{ marginTop: 16 }}>
              <Button kind="primary" size="lg" block iconRight="play" onClick={handleStart}>
                Iniciar treino
              </Button>
            </div>
            {/* Spec 026: ver o treino completo sem iniciar a sessão nem fazer check-in. */}
            <div style={{ marginTop: 8 }}>
              <Link href="/treinos/proximo?de=home" className="hx-btn hx-btn--ghost hx-btn--block">
                Ver treino
              </Link>
            </div>
          </>
        ) : currentPlan?.status ? (
          <PlanGenerationState plan={currentPlan} busy={generating} onRetry={() => void generatePlan()} onRepeatWeek={() => void repeatWeek()} />
        ) : (
          <>
            <h2 className="t-heading">Nenhum plano gerado ainda</h2>
            <p className="t-secondary" style={{ marginTop: 6 }}>
              Gere seu primeiro plano a partir do seu DNA e do seu último check-in.
            </p>
            <div style={{ marginTop: 16 }}>
              <Button kind="primary" size="lg" block loading={generating} onClick={generatePlan}>
                Gerar meu plano
              </Button>
            </div>
          </>
        )}
      </section>

      {generationError && (
        <div style={{ marginTop: 12 }}>
          <Banner kind="err" title="Não foi possível gerar o plano">
            {generationError}
          </Banner>
        </div>
      )}

      {/* Spec 024: crise de gota além do prazo → procurar o médico. */}
      <FlareNotice onChange={() => void refetch()} />
      {/* Spec 024: no começo de um ciclo novo, o resumo do anterior e o que mudou. */}
      {currentPlan?.mesocycleId && currentPlan.progress?.completed === 0 && <CycleSummaryCard mesocycleId={currentPlan.mesocycleId} />}

      {/* Spec 022: chat com a Equipe Helux (treino, medicina esportiva, nutrição genética). */}
      <div className="hx-card" style={{ marginTop: 16, overflow: 'hidden' }}>
        <Link href="/equipe" className="hx-row-btn">
          <span style={{ width: 40, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>
            <Icon name="heart" size={22} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className="t-body-m" style={{ display: 'block' }}>
              Falar com a Equipe Helux
            </span>
            <span className="t-secondary">Treino, medicina esportiva e nutrição genética</span>
          </span>
          <span className="dim">
            <Icon name="chev" size={20} />
          </span>
        </Link>
      </div>

      {sessions.length > 0 && currentPlan?.progress && (
        <section style={{ marginTop: 28 }}>
          <SectionHeader
            title="Ciclo atual"
            action={
              <span className="t-secondary" style={{ whiteSpace: 'nowrap' }}>
                <span className="n-sm" style={{ color: 'var(--text)' }}>
                  {currentPlan.progress.completed}
                </span>{' '}
                de {currentPlan.progress.total} treinos concluídos
              </span>
            }
          />
          <CycleProgress sessions={sessions} />
        </section>
      )}

      {checkins.length > 0 ? (
        <CheckinCard checkins={checkins}>
          <Button kind="secondary" onClick={() => router.push('/checkin')}>
            Novo check-in
          </Button>
          {today && (
            <Button kind="ghost" loading={generating} onClick={generatePlan}>
              Gerar novo plano
            </Button>
          )}
        </CheckinCard>
      ) : (
        <section className="hx-plain" style={{ marginTop: 28, paddingTop: 20 }}>
          <SectionHeader title="Check-in" />
          <p className="t-secondary">Registre peso e cargas do mês para o Helux ajustar seu plano.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <Button kind="secondary" onClick={() => router.push('/checkin')}>
              Fazer check-in
            </Button>
            {today && (
              <Button kind="ghost" loading={generating} onClick={generatePlan}>
                Gerar novo plano
              </Button>
            )}
          </div>
        </section>
      )}

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

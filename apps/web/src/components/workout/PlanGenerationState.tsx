'use client'

import Link from 'next/link'
import type { AdjustedWorkoutPlanView, GenerationErrorCode } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'

const FAILURE: Record<GenerationErrorCode, string> = {
  'budget-exceeded': 'O teto mensal de IA foi atingido. Aumente o teto no Perfil Integrado ou espere o mês virar.',
  'constraints-unsatisfiable': 'Não deu para montar um plano que respeite todas as suas restrições. Revise as condições e preferências.',
  'incomplete-response': 'A IA não terminou de montar o plano. Tente de novo.',
  refusal: 'A IA não conseguiu montar este plano.',
  unknown: 'Algo deu errado ao montar o plano.',
}

/**
 * Estados da geração do mesociclo (spec 024, FR-031): gerando, falhou (com nova
 * tentativa e repetição da última semana) e onboarding pendente.
 */
export function PlanGenerationState({
  plan,
  onRetry,
  onRepeatWeek,
  busy,
}: {
  plan: AdjustedWorkoutPlanView | null
  onRetry: () => void
  onRepeatWeek: () => void
  busy?: boolean
}) {
  if (plan?.status === 'generating') {
    return (
      <div role="status">
        <h2 className="t-heading">Preparando seu próximo ciclo</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          O treinador está analisando o ciclo e montando as próximas semanas. Leva de 1 a 3 minutos.
        </p>
      </div>
    )
  }
  if (plan?.status === 'generation-failed') {
    const code = plan.generation?.errorCode ?? 'unknown'
    return (
      <div>
        <Banner kind="err" title="Não foi possível gerar o próximo ciclo">
          {FAILURE[code]}
        </Banner>
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <Button kind="primary" block loading={busy} onClick={onRetry}>
            Tentar de novo
          </Button>
          <Button kind="ghost" block onClick={onRepeatWeek}>
            Repetir a última semana
          </Button>
        </div>
      </div>
    )
  }
  if (plan?.status === 'onboarding-required') {
    return (
      <div>
        <h2 className="t-heading">Vamos montar seu treino</h2>
        <p className="t-secondary" style={{ marginTop: 6 }}>
          Antes do próximo ciclo, conte seu objetivo, sua saúde e sua rotina. Leva uns 5 minutos.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/onboarding" className="hx-btn hx-btn--primary hx-btn--block">
            Começar
          </Link>
        </div>
      </div>
    )
  }
  return null
}

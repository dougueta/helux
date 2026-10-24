import type { AdjustedWorkoutPlanView, SessionKind } from '@helux/types'
import { Tag } from '@/components/ui/Tag'

const KIND_LABEL: Record<SessionKind, string> = { forca: 'Força', cardio: 'Cardio', mobilidade: 'Mobilidade' }

/** "Semana X de N", deload e tipo do dia (spec 024, US3). Planos antigos não têm semana. */
export function WeekBadge({ week, kind }: { week?: AdjustedWorkoutPlanView['week']; kind?: SessionKind }) {
  if (!week) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      <span className="t-secondary">
        Semana {week.current} de {week.total}
      </span>
      {kind && <Tag>{KIND_LABEL[kind]}</Tag>}
      {week.deload && <Tag>Deload · semana mais leve para recuperar</Tag>}
    </div>
  )
}

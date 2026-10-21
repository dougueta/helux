import type { CalibrationAction, DietCalibration } from '@helux/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Tag } from '@/components/ui/Tag'

const ACTION_LABEL: Record<CalibrationAction, string> = {
  inicial: 'Inicial',
  aumentar: 'Aumentar',
  manter: 'Manter',
  reduzir: 'Reduzir',
  'intervalo-curto': 'Intervalo curto',
}

/** Histórico de recalibrações da fase, mais recentes primeiro (FR-015). */
export function CalibrationList({ calibrations }: { calibrations: DietCalibration[] }) {
  if (calibrations.length === 0) return null
  return (
    <section style={{ marginTop: 28 }}>
      <SectionHeader title="Recalibrações" />
      <ul aria-label="Recalibrações" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {calibrations.map(c => (
          <li key={c.id} style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Tag kind={c.action === 'reduzir' || c.action === 'aumentar' ? 'default' : 'outline'}>{ACTION_LABEL[c.action]}</Tag>
              <span className="n-sm" style={{ color: 'var(--text)' }}>
                {c.before ? `${c.before.kcal} → ${c.after.kcal} kcal` : `${c.after.kcal} kcal`}
              </span>
              <span className="t-caption dim" style={{ marginLeft: 'auto' }}>
                {new Date(c.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            <p className="t-secondary" style={{ marginTop: 6 }}>
              {c.reason}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

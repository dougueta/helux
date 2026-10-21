import type { RecoveryAdjustment } from '@helux/types'
import { Icon } from '@/components/ui/icons'

const liters = (ml: number) => `+${(ml / 1000).toFixed(1).replace('.', ',')} L de água`

/** Ajuste nutricional de recuperação no topo da seção Hoje (spec 018, US3). */
export function RecoveryCard({ recovery }: { recovery: RecoveryAdjustment }) {
  return (
    <section className="hx-banner hx-banner--warn" style={{ marginTop: 20 }} aria-labelledby="recovery-title">
      <Icon name="alert" size={20} />
      <div>
        <h2 id="recovery-title" className="t-body" style={{ margin: 0 }}>
          <b>Ajuste Nutricional de Recuperação</b>
        </h2>
        <p className="t-caption dim" style={{ marginTop: 2 }}>
          {`Você marcou ${recovery.level} hoje · ${liters(recovery.extraWaterMl)}`}
        </p>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          {recovery.notes.map(n => (
            <li key={n} className="t-secondary">
              {n}
            </li>
          ))}
        </ul>
        {recovery.note && (
          <p className="t-secondary" style={{ marginTop: 8, color: 'var(--text)' }}>
            {recovery.note}
          </p>
        )}
      </div>
    </section>
  )
}

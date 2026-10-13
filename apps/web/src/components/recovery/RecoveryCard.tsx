import type { RecoveryData } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Icon, type IconName } from '@/components/ui/icons'
import { formatNumber } from '@/lib/format'

interface RecoveryCardProps {
  data: RecoveryData | null
  isStale: boolean
}

/** 7,5 h → "7h30". */
function formatSleep(hours: number): string {
  const total = Math.round(hours * 60)
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`
}

/**
 * "Recovery de hoje" (handoff 5.5): um `.hx-card` por métrica, número em `.n-lg`,
 * atenuado quando os dados estão antigos. Métrica sem leitura fica oculta (FR-024).
 */
export function RecoveryCard({ data, isStale }: RecoveryCardProps) {
  if (!data) {
    return (
      <div className="hx-card" style={{ padding: 20 }}>
        <p className="t-body-m">Sem dados de recovery</p>
        <p className="t-secondary" style={{ marginTop: 4 }}>
          Execute o Shortcut no iPhone para sincronizar os dados do Apple Watch.
        </p>
      </div>
    )
  }

  const metrics: [string, IconName, string | null, string][] = [
    ['HRV', 'wave', data.hrv != null ? formatNumber(data.hrv) : null, 'ms'],
    ['FC de repouso', 'heart', data.restingHR != null ? formatNumber(data.restingHR) : null, 'bpm'],
    ['Sono', 'moon', data.sleepHours != null ? formatSleep(data.sleepHours) : null, ''],
    ['Calorias', 'flame', data.activeCalories != null ? formatNumber(data.activeCalories) : null, 'kcal'],
    ['Recuperação cardíaca', 'heart', data.cardioRecovery != null ? formatNumber(data.cardioRecovery) : null, 'bpm'],
  ]
  const shown = metrics.filter(([, , v]) => v != null)

  return (
    <div>
      {isStale && (
        <div style={{ marginBottom: 10 }}>
          <Banner kind="warn" title="Dados antigos — sincronize novamente">
            Última leitura em {new Date(`${data.date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}.
            Execute o Shortcut no iPhone para atualizar.
          </Banner>
        </div>
      )}
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8, margin: 0 }}>
        {shown.map(([label, icon, value, unit], i) => (
          <div
            key={label}
            className="hx-card"
            style={{
              padding: '12px 14px',
              gridColumn: i === shown.length - 1 && shown.length % 2 === 1 ? '1 / -1' : undefined,
            }}
          >
            <dt className="t-caption" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Icon name={icon} size={14} />
              {label}
            </dt>
            <dd className={isStale ? 'n-lg dim' : 'n-lg'} style={{ margin: '6px 0 0', fontSize: 24 }}>
              {value}
              {unit && <span className="u">{unit}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

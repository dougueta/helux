'use client'

import Link from 'next/link'
import type { WeeklyBalance } from '@helux/types'
import {
  effortClassificationLabelPt,
  formatTonnageValuePt,
  formatWeightValuePt,
} from '@helux/workouts'

function formatSignedDelta(delta: number | null, unit = '', decimals = 1): string | null {
  if (delta === null || Number.isNaN(delta)) return null
  if (delta === 0) return `Estável vs. sem. ant.`
  const sign = delta > 0 ? '+' : ''
  const formatted =
    decimals === 0
      ? `${sign}${Math.round(delta)}`
      : `${sign}${delta.toFixed(decimals).replace('.', ',')}`
  return `${formatted}${unit ? ` ${unit}` : ''} vs. sem. ant.`
}

function formatActiveDurationPt(minutes: number): string {
  if (minutes <= 0) return '0 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export interface WeeklyBalanceCardProps {
  balance: WeeklyBalance
  isCurrentWeek?: boolean
}

export function WeeklyBalanceCard({ balance, isCurrentWeek = false }: WeeklyBalanceCardProps) {
  const gymRatio = Math.min(1, balance.gymDays / Math.max(1, balance.targetGymDays))
  const effortLabel = effortClassificationLabelPt(balance.effortClassification)
  const effortDeltaText = formatSignedDelta(balance.deltas.avgEffortDelta, '', 1)
  const weightDeltaText = formatSignedDelta(balance.deltas.avgWeightKgDelta, 'kg', 1)
  const tonnageDeltaText =
    balance.deltas.tonnageKgDelta != null
      ? `${balance.deltas.tonnageKgDelta >= 0 ? '+' : '-'}${formatTonnageValuePt(
          Math.abs(balance.deltas.tonnageKgDelta),
        )} vs. sem. ant.`
      : null

  return (
    <section
      className="hx-focus"
      style={{ marginTop: 16, padding: 20 }}
      aria-label={`Saldo da semana ${balance.label}`}
    >
      {/* Cabeçalho do Saldo da Semana */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p className="t-caption" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Saldo da semana {isCurrentWeek ? '· Atual' : ''}
          </p>
          <h2 className="t-heading" style={{ marginTop: 2 }}>
            {balance.label}
          </h2>
        </div>
        <span
          className="hx-tag"
          style={{
            background: balance.gymDays >= balance.targetGymDays ? 'var(--accent-soft)' : 'var(--surface-3)',
            color: balance.gymDays >= balance.targetGymDays ? 'var(--accent)' : 'var(--text)',
          }}
        >
          <span className="n-sm">{balance.activeDays}</span>{' '}
          {balance.activeDays === 1 ? 'dia ativo' : 'dias ativos'}
        </span>
      </div>

      {/* Grade 2x2 de métricas principais */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          marginTop: 16,
        }}
      >
        {/* 1. Assiduidade (Academia + Rotinas) */}
        <div
          className="hx-card"
          style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <span className="t-caption">Assiduidade</span>
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="n-lg" style={{ color: 'var(--accent)' }}>
                {balance.gymDays}/{balance.targetGymDays}
              </span>
              <span className="t-caption">academia</span>
            </div>
            <div
              aria-hidden="true"
              style={{
                height: 4,
                borderRadius: 2,
                background: 'var(--surface-3)',
                marginTop: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.round(gymRatio * 100)}%`,
                  height: '100%',
                  background: 'var(--accent)',
                  transition: 'width var(--dur-3) var(--ease-out)',
                }}
              />
            </div>
          </div>
          <p className="t-caption" style={{ marginTop: 8 }}>
            {balance.complementaryCount > 0 ? (
              <span style={{ color: 'var(--success)' }}>
                +{balance.complementaryCount}{' '}
                {balance.complementaryCount === 1 ? 'rotina feita' : 'rotinas feitas'}
              </span>
            ) : (
              'Nenhuma rotina complementar'
            )}
          </p>
        </div>

        {/* 2. Saldo de Esforço */}
        <div
          className="hx-card"
          style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <span className="t-caption">Esforço médio</span>
          <div style={{ marginTop: 8 }}>
            {balance.avgEffort != null ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span className="t-heading" style={{ color: 'var(--text)' }}>
                  {effortLabel}
                </span>
                <span className="n-md" style={{ color: 'var(--text-dim)' }}>
                  {formatWeightValuePt(balance.avgEffort)}
                  <span className="u">/10</span>
                </span>
              </div>
            ) : (
              <span className="t-body-m" style={{ color: 'var(--text-dim)' }}>
                Sem registro
              </span>
            )}
          </div>
          <p className="t-caption" style={{ marginTop: 8 }}>
            {effortDeltaText ?? 'Média das séries e RPE'}
          </p>
        </div>

        {/* 3. Saldo de Peso Corporal */}
        <div
          className="hx-card"
          style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <span className="t-caption">Peso na semana</span>
          <div style={{ marginTop: 8 }}>
            {balance.avgWeightKg != null ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="n-lg">{formatWeightValuePt(balance.avgWeightKg)}</span>
                <span className="u">kg</span>
              </div>
            ) : (
              <span className="t-body-m" style={{ color: 'var(--text-dim)' }}>
                Sem pesagem
              </span>
            )}
          </div>
          <div className="t-caption" style={{ marginTop: 8 }}>
            {weightDeltaText ? (
              <span style={{ color: 'var(--text)' }}>{weightDeltaText}</span>
            ) : balance.avgWeightKg != null ? (
              <span>
                {balance.weightEntriesCount}{' '}
                {balance.weightEntriesCount === 1 ? 'pesagem na semana' : 'pesagens na semana'}
              </span>
            ) : isCurrentWeek ? (
              <Link href="/checkin/peso" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                Registrar peso →
              </Link>
            ) : (
              <span>Sem registro no período</span>
            )}
          </div>
        </div>

        {/* 4. Carga & Tempo Ativo */}
        <div
          className="hx-card"
          style={{ padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
        >
          <span className="t-caption">Volume & tempo</span>
          <div style={{ marginTop: 8 }}>
            <span className="n-lg">{formatTonnageValuePt(balance.tonnageKg)}</span>
            <p className="t-caption" style={{ marginTop: 4, color: 'var(--text)' }}>
              <span className="n-sm">{balance.totalSets} séries</span> ·{' '}
              <span className="n-sm">{formatActiveDurationPt(balance.activeMinutes)}</span>
            </p>
          </div>
          <p className="t-caption" style={{ marginTop: 8 }}>
            {tonnageDeltaText ?? 'Academia + rotinas'}
          </p>
        </div>
      </div>
    </section>
  )
}

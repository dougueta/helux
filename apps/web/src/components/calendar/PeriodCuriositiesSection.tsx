'use client'

import { useState } from 'react'
import type { CuriosityCategory, CuriosityScope, PeriodCuriosity } from '@helux/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Icon, type IconName } from '@/components/ui/icons'

const CATEGORY_META: Record<CuriosityCategory, { badge: string; icon: IconName }> = {
  tonelagem: { badge: 'Tonelagem', icon: 'dumbbell' },
  forca: { badge: 'Força & PR', icon: 'trophy' },
  habito: { badge: 'Consistência', icon: 'flame' },
  esforco: { badge: 'Foco de treino', icon: 'bolt' },
  tempo: { badge: 'Tempo ativo', icon: 'timer' },
}

export interface PeriodCuriositiesSectionProps {
  weekCuriosities: PeriodCuriosity[]
  monthCuriosities: PeriodCuriosity[]
  weekLabel: string
  monthLabel: string
}

export function PeriodCuriositiesSection({
  weekCuriosities,
  monthCuriosities,
  weekLabel,
  monthLabel,
}: PeriodCuriositiesSectionProps) {
  const [scope, setScope] = useState<CuriosityScope>('semana')
  const items = scope === 'semana' ? weekCuriosities : monthCuriosities
  const periodSubtitle = scope === 'semana' ? `Semana · ${weekLabel}` : `Mês · ${monthLabel}`

  return (
    <section style={{ marginTop: 24 }} aria-label="Curiosidades do período">
      <SectionHeader title="Curiosidades" aside={periodSubtitle} />

      <div style={{ marginTop: 10 }}>
        <Segmented
          label="Recorte das curiosidades"
          options={[
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mês' },
          ]}
          value={scope}
          onChange={setScope}
        />
      </div>

      {items.length === 0 ? (
        <div className="hx-card" style={{ marginTop: 12, padding: 18 }}>
          <p className="t-body-m">Nenhuma atividade registrada neste período</p>
          <p className="t-secondary" style={{ marginTop: 4 }}>
            Conclua um treino de academia ou uma rotina complementar para desbloquear comparativos de tonelagem, recordes e hábitos.
          </p>
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {items.map(item => {
            const meta = CATEGORY_META[item.category] ?? CATEGORY_META.tonelagem
            return (
              <article
                key={`${item.scope}-${item.id}`}
                className="hx-card"
                style={{
                  padding: '14px 16px',
                  display: 'grid',
                  gridTemplateColumns: '40px minmax(0, 1fr)',
                  gap: 12,
                  alignItems: 'start',
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--r-sm)',
                    background: 'var(--surface-2)',
                    color: 'var(--accent)',
                    boxShadow: 'inset 0 0 0 1px var(--hairline-2)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon name={meta.icon} size={20} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="t-caption">{item.title}</span>
                    <span className="hx-tag">{meta.badge}</span>
                  </div>
                  <p className="n-lg" style={{ color: 'var(--accent)', marginTop: 4 }}>
                    {item.highlight}
                  </p>
                  <p className="t-secondary" style={{ color: 'var(--text)', marginTop: 4 }}>
                    {item.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

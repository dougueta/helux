'use client'

import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Helix } from '@/components/ui/Helix'
import { formatNumber } from '@/lib/format'

export type WorkoutDoneStatus = 'saving' | 'saved' | 'error'

/** Largura do traço para a fita ocupar a coluna (cerca de 340 px) com qualquer número de séries. */
function rungWidth(n: number) {
  return Math.max(3, Math.min(10, Math.floor(340 / Math.max(1, n)) - 3))
}

/**
 * Treino concluído (FR-020, handoff 5.6, research V10). O salvamento é da
 * spec 016 (`useFinishWorkout`); aqui só muda a apresentação dos três estados.
 * Recordes ficam ocultos enquanto não houver dado (FR-024).
 */
export function WorkoutDoneScreen({
  status,
  totalDone,
  totalSets,
  volumeKg,
  exerciseCount,
  elapsed,
  onGoHome,
  onRetry,
  onBackToWorkout,
}: {
  status: WorkoutDoneStatus
  totalDone: number
  totalSets: number
  volumeKg: number
  exerciseCount: number
  elapsed: number
  onGoHome: () => void
  onRetry: () => void
  onBackToWorkout: () => void
}) {
  const summary: [string, string, string][] = [
    ['Volume', formatNumber(volumeKg), 'kg'],
    ['Séries', `${totalDone}/${totalSets}`, ''],
    ['Duração', formatNumber(elapsed), 'min'],
  ]

  return (
    <div className="hx-page" style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))', paddingBottom: 220 }}>
      <div role="img" aria-label={`${totalDone} de ${totalSets} séries`} style={{ display: 'flex', alignItems: 'center', height: 40 }}>
        <Helix
          value={totalSets ? (100 * totalDone) / totalSets : 0}
          n={Math.max(1, totalSets)}
          h={40}
          w={rungWidth(totalSets)}
          gap={3}
          on="var(--accent)"
          sequential
        />
      </div>
      <h1 className="t-display" style={{ marginTop: 28 }}>
        Treino concluído
      </h1>
      <p className="t-body dim" style={{ marginTop: 6 }}>
        {exerciseCount} {exerciseCount === 1 ? 'exercício' : 'exercícios'}, {elapsed} min
      </p>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
          gap: '20px 16px',
          margin: '28px 0 0',
          paddingTop: 20,
          borderTop: '1px solid var(--hairline)',
        }}
      >
        {summary.map(([label, value, unit]) => (
          <div key={label}>
            <dt className="t-caption">{label}</dt>
            <dd className="n-lg" style={{ margin: '4px 0 0' }}>
              {value}
              {unit && <span className="u">{unit}</span>}
            </dd>
          </div>
        ))}
      </dl>

      <div className="hx-dock">
        <div className="hx-cta-dock">
          {status === 'error' ? (
            <>
              <div style={{ marginBottom: 10 }}>
                <Banner kind="err" title="Não foi possível salvar">
                  O treino continua guardado neste aparelho e não será perdido. Verifique a conexão e tente de novo.
                </Banner>
              </div>
              <Button kind="primary" size="lg" block icon="sync" onClick={onRetry}>
                Tentar de novo
              </Button>
              <div style={{ marginTop: 4 }}>
                <Button kind="ghost" block onClick={onBackToWorkout}>
                  Voltar ao treino
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button kind="primary" size="lg" block loading={status === 'saving'} onClick={onGoHome}>
                Voltar para Hoje
              </Button>
              <p className="t-caption" role="status" style={{ textAlign: 'center', marginTop: 10 }}>
                {status === 'saving'
                  ? 'Salvando treino…'
                  : 'O Helux registrou suas cargas e vai recalibrar o próximo treino.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

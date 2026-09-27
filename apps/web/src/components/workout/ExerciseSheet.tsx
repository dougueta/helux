'use client'

import { useState } from 'react'
import type { PlannedExercise } from '@helux/types'
import { Button, IconButton } from '@/components/ui/Button'
import { Fit } from '@/components/ui/Fit'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Steps } from '@/components/ui/Steps'
import { Tag } from '@/components/ui/Tag'
import { Tips } from '@/components/ui/Tips'
import { recommendedVariant, resolveExerciseDisplay } from '@/lib/exerciseDisplay'
import { ExerciseDemo } from './ExerciseDemo'
import { MuscleMap } from './MuscleMap'

type Tab = 'execucao' | 'variantes'

const WARN_PREFIX = /^erro comum:\s*/i

/** Passos a partir das orientações do plano; a última "Erro comum: …" vira o passo âmbar. */
function toSteps(cues: string[]) {
  return cues.map(c => (WARN_PREFIX.test(c) ? { text: c.replace(WARN_PREFIX, ''), warn: true } : { text: c }))
}

/** "2 · 0 · 1" → "2·0·1" (cadência compacta do palco). */
function compactTempo(tempo: string) {
  return tempo.replace(/\s*·\s*/g, '·')
}

/** Folha de execução (FR-015, handoff 5.3) sobre `ui/Sheet`. Reflete a variante ativa (spec 010). */
export function ExerciseSheet({
  open,
  exercise,
  currentVariantId,
  onApply,
  onClose,
}: {
  open: boolean
  exercise: PlannedExercise
  currentVariantId?: string
  onApply: (variantId: string) => void
  onClose: () => void
}) {
  const variants = exercise.variants ?? []
  const recVariant = recommendedVariant(exercise)
  const active = variants.find(v => v.id === currentVariantId) ?? recVariant
  const display = resolveExerciseDisplay(exercise, active?.id)
  const cues = display.showPlannedCues ? exercise.cues ?? [] : []
  const muscles = exercise.muscles ?? { primary: [], secondary: [] }

  const [tab, setTab] = useState<Tab>('execucao')
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)

  function handleSwap(id: string) {
    onApply(id)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label="Execução do exercício"
      footer={
        <Button kind="secondary" size="lg" block onClick={onClose}>
          Fechar
        </Button>
      }
    >
      <div className="hx-stage" style={{ height: 216 }}>
        <div style={{ position: 'absolute', inset: '8px 60px' }}>
          <ExerciseDemo
            motion={active?.motion ?? 'press-flat'}
            implement={active?.implement}
            playing={playing}
            nonce={`${active?.id}:${nonce}`}
          />
        </div>
        {exercise.tempo && (
          <div style={{ position: 'absolute', top: 12, right: 12, textAlign: 'right' }}>
            <div className="n-md">{compactTempo(exercise.tempo)}</div>
            <div className="t-caption">cadência</div>
          </div>
        )}
        <div style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 6 }}>
          <IconButton
            icon={playing ? 'pause' : 'play'}
            label={playing ? 'pausar demonstração' : 'reproduzir demonstração'}
            iconSize={18}
            onClick={() => setPlaying(p => !p)}
          />
          <Button
            kind="secondary"
            icon="repeat"
            style={{ padding: '0 14px', fontSize: 14 }}
            onClick={() => {
              setNonce(n => n + 1)
              setPlaying(true)
            }}
          >
            Repetir
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginTop: 18 }}>
        <h2 className="t-heading">{display.title}</h2>
        {display.fit !== undefined && (
          <span style={{ paddingTop: 4, flexShrink: 0 }}>
            <Fit value={display.fit} />
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {exercise.muscle && <Tag>{exercise.muscle}</Tag>}
        {active && <Tag>{active.equip}</Tag>}
        {active && <Tag>{active.level}</Tag>}
      </div>

      <div style={{ marginTop: 20 }}>
        <Segmented
          tabs
          label="conteúdo"
          options={[
            { value: 'execucao', label: 'Execução' },
            { value: 'variantes', label: `Variantes (${variants.length})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'execucao' ? (
        <div role="tabpanel" aria-label="Execução">
          {cues.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Steps items={toSteps(cues)} />
            </div>
          )}
          {display.tip && (
            <div style={{ marginTop: 20 }}>
              <Tips text={display.tip} />
            </div>
          )}
          <h3 className="t-section" style={{ marginTop: 28 }}>
            Músculos trabalhados
          </h3>
          <div style={{ marginTop: 12 }}>
            <MuscleMap primary={muscles.primary} secondary={muscles.secondary} />
          </div>
        </div>
      ) : (
        <div role="tabpanel" aria-label="Variantes" style={{ marginTop: 12 }}>
          {variants.map((v, i) => {
            const isCurrent = v.id === active?.id
            const better = active ? v.match > active.match : false
            return (
              <div
                key={v.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  gap: '6px 12px',
                  padding: '14px 0',
                  borderTop: i ? '1px solid var(--hairline)' : 0,
                  alignItems: 'center',
                }}
              >
                <div className="t-body-m">{v.name}</div>
                <Fit value={v.match} />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag>{v.equip}</Tag>
                  <Tag>{v.level}</Tag>
                  {v.crossPattern && <Tag>Equivalente</Tag>}
                  {v.rec && !isCurrent && <Tag>Recomendado</Tag>}
                  {isCurrent && <Tag kind="outline">Atual</Tag>}
                </div>
                {!isCurrent && (
                  <Button
                    kind={better ? 'secondary' : 'ghost'}
                    aria-label={`Trocar para ${v.name}`}
                    style={{ minHeight: 40, padding: '0 14px', fontSize: 14 }}
                    onClick={() => handleSwap(v.id)}
                  >
                    Trocar
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}

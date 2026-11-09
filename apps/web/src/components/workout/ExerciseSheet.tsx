'use client'

import { useState } from 'react'
import { findStrengthExercise, type Guidance } from '@helux/exercises'
import type { PlannedExercise } from '@helux/types'
import { Button, IconButton } from '@/components/ui/Button'
import { Fit } from '@/components/ui/Fit'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Steps } from '@/components/ui/Steps'
import { Tag } from '@/components/ui/Tag'
import { Tips } from '@/components/ui/Tips'
import { activeVariant, resolveExerciseDisplay, type ActiveVariant } from '@/lib/exerciseDisplay'
import { ItemDemo } from './ItemDemo'
import { MuscleMap } from './MuscleMap'

type Tab = 'execucao' | 'variantes'

const WARN_PREFIX = /^erro comum:\s*/i

/** Passos a partir das orientações do plano; a última "Erro comum: …" vira o passo âmbar. */
function toSteps(cues: string[]) {
  return cues.map(c => (WARN_PREFIX.test(c) ? { text: c.replace(WARN_PREFIX, ''), warn: true } : { text: c }))
}

/** Posição inicial e passos numerados, com o erro comum por último, em âmbar. */
function guidanceSteps(g: Guidance) {
  return [
    ...g.setup.map(text => ({ text })),
    ...g.steps.map(text => ({ text })),
    ...(g.commonError ? [{ text: g.commonError, warn: true }] : []),
  ]
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
  /** Sem `onApply` a folha é só leitura (spec 026, preview): variantes sem "Trocar". */
  onApply?: (variantId: string) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>('execucao')
  const [playing, setPlaying] = useState(true)
  const [nonce, setNonce] = useState(0)
  // 028 (FR-010): variante aberta pelo "Ver", sem alterar o treino.
  const [previewId, setPreviewId] = useState<string | null>(null)

  const active = activeVariant(exercise, currentVariantId)
  // A variante ativa fora da lista continua visível como atual (FR-035).
  const variants: ActiveVariant[] = active?.offList ? [active, ...(exercise.variants ?? [])] : exercise.variants ?? []
  const preview = previewId ? variants.find(v => v.id === previewId) : undefined
  const shown = preview ?? active
  const display = resolveExerciseDisplay(exercise, shown?.id)
  const resolved = display.resolved
  // A variante usa as próprias dicas (FR-011); o planejado, as do plano.
  const cues = display.showPlannedCues
    ? exercise.cues ?? []
    : resolved.id
      ? findStrengthExercise(resolved.id)?.cues ?? []
      : []
  const muscles = resolved.muscles ?? { primary: [], secondary: [] }
  // 028: cardio e item sem músculos dispensam o mapa; item sem demonstração não tem controles de reprodução.
  const isCardio = Boolean(exercise.cardio) || resolved.kind === 'cardio'
  const hasDemo = resolved.demoState !== 'indisponivel'
  // 028 (T051): item aprovado usa a orientação do catálogo; pendente segue com as dicas do plano.
  const guidance = resolved.guidance
  const steps = guidance ? guidanceSteps(guidance) : toSteps(cues)

  function openPreview(id: string) {
    setPreviewId(id)
    setPlaying(true)
  }

  function backToVariants() {
    setPreviewId(null)
    setTab('variantes')
  }

  function handleSwap(id: string) {
    onApply?.(id)
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
          <ItemDemo
            resolved={resolved}
            variant={shown}
            notes={exercise.notes}
            playing={playing}
            nonce={`${shown?.id ?? resolved.id}:${nonce}`}
            size="stage"
          />
        </div>
        {resolved.tempo && (
          <div style={{ position: 'absolute', top: 12, right: 12, textAlign: 'right' }}>
            <div className="n-md">{compactTempo(resolved.tempo)}</div>
            <div className="t-caption">cadência</div>
          </div>
        )}
        {hasDemo && (
          <div style={{ position: 'absolute', left: 8, top: 8, display: 'flex', gap: 6 }}>
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
        )}
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
        {exercise.muscle && !display.plannedName && <Tag>{exercise.muscle}</Tag>}
        {(shown?.equip || resolved.gearLabel) && <Tag>{shown?.equip || resolved.gearLabel}</Tag>}
        {shown?.level && <Tag>{shown.level}</Tag>}
        {shown?.crossPattern && <Tag>Equivalente</Tag>}
      </div>

      {preview && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button kind="ghost" icon="back" style={{ minHeight: 40, padding: '0 12px', fontSize: 14 }} onClick={backToVariants}>
            Voltar às variantes
          </Button>
          {onApply && preview.id !== active?.id && (
            <Button kind="secondary" style={{ minHeight: 40, padding: '0 14px', fontSize: 14 }} onClick={() => handleSwap(preview.id)}>
              Trocar
            </Button>
          )}
        </div>
      )}

      {exercise.cardio && (
        <p className="t-secondary" style={{ marginTop: 8 }}>
          Zona {exercise.cardio.zone} · {exercise.cardio.minutes} min
        </p>
      )}

      {variants.length > 0 && !preview && (
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
      )}

      {tab === 'execucao' || preview ? (
        <div role="tabpanel" aria-label="Execução">
          {steps.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <Steps items={steps} />
            </div>
          )}
          {guidance?.context && (
            <p className="t-secondary" style={{ marginTop: 12 }}>
              {guidance.context}
            </p>
          )}
          {display.tip && (
            <div style={{ marginTop: 20 }}>
              <Tips text={display.tip} />
            </div>
          )}
          {!isCardio && muscles.primary.length > 0 && (
            <>
              <h3 className="t-section" style={{ marginTop: 28 }}>
                Músculos trabalhados
              </h3>
              <div style={{ marginTop: 12 }}>
                <MuscleMap primary={muscles.primary} secondary={muscles.secondary} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div role="tabpanel" aria-label="Variantes" style={{ marginTop: 12 }}>
          {variants.map((v, i) => {
            const isCurrent = v.id === active?.id
            const better = active && !active.offList ? v.match > active.match : false
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
                {v.offList ? <span /> : <Fit value={v.match} />}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Tag>{v.equip}</Tag>
                  <Tag>{v.level}</Tag>
                  {v.crossPattern && <Tag>Equivalente</Tag>}
                  {v.rec && !isCurrent && <Tag>Recomendado</Tag>}
                  {isCurrent && <Tag kind="outline">Atual</Tag>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    kind="ghost"
                    aria-label={`Ver execução de ${v.name}`}
                    style={{ minHeight: 40, padding: '0 12px', fontSize: 14 }}
                    onClick={() => openPreview(v.id)}
                  >
                    Ver
                  </Button>
                  {!isCurrent && onApply && (
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
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}

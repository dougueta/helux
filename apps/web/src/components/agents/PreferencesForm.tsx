'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { Equipment, TrainingLocation, TrainingPreferences, TrainingPreferencesInput, TrainingStyle, WorkoutAdjustmentProposal } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Tag } from '@/components/ui/Tag'
import { clearCachedPlan } from '@/hooks/useWorkoutPlan'
import { resolveProposal, savePreferences, type CatalogExercise } from '@/services/agents.service'
import { ProposalCard } from './ProposalCard'

const DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const EQUIPMENT: { value: Equipment; label: string }[] = [
  { value: 'barra', label: 'Barra' },
  { value: 'halteres', label: 'Halteres' },
  { value: 'maquina-cabo', label: 'Máquina e cabo' },
  { value: 'peso-corporal', label: 'Peso corporal' },
]
const LOCATIONS: { value: TrainingLocation; label: string }[] = [
  { value: 'academia', label: 'Academia' },
  { value: 'casa', label: 'Casa' },
  { value: 'ao-ar-livre', label: 'Ao ar livre' },
  { value: 'hotel', label: 'Hotel' },
]
const STYLES: { value: TrainingStyle; label: string }[] = [
  { value: 'hipertrofia-classica', label: 'Hipertrofia' },
  { value: 'forca', label: 'Força' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'circuito', label: 'Circuito' },
  { value: 'misto', label: 'Misto' },
]
const GROUPS: { value: string; label: string }[] = [
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'ombro', label: 'Ombro' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'quadriceps', label: 'Quadríceps' },
  { value: 'posterior', label: 'Posterior de coxa' },
  { value: 'gluteo', label: 'Glúteos' },
  { value: 'panturrilha', label: 'Panturrilha' },
  { value: 'core', label: 'Core' },
]

const textInput: CSSProperties = { flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--text)', font: 'inherit', fontSize: 15 }
const wrap: CSSProperties = { flexWrap: 'wrap' }

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v])

/** Grupo de botões com várias escolhas (`.hx-seg` com `aria-pressed`). */
function MultiToggle<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void }) {
  return (
    <div className="hx-seg" role="group" aria-label={label} style={wrap}>
      {options.map(o => (
        <button key={String(o.value)} type="button" aria-pressed={value.includes(o.value)} onClick={() => onChange(toggle(value, o.value))}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Preferências de treino (spec 022, FR-005, SC-003): rígidas e suaves num formulário só. */
export function PreferencesForm({ initial, catalog }: { initial: TrainingPreferences; catalog: CatalogExercise[] }) {
  const [p, setP] = useState<TrainingPreferencesInput>(() => {
    const { updatedAt: _u, ...rest } = initial
    return rest
  })
  const [minutes, setMinutes] = useState(initial.maxSessionMinutes ? String(initial.maxSessionMinutes) : '')
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [outcome, setOutcome] = useState<{ appliesFrom: string; proposal: WorkoutAdjustmentProposal | null; budgetBlocked?: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const byId = useMemo(() => new Map(catalog.map(e => [e.id, e])), [catalog])
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return catalog.filter(e => e.name.toLowerCase().includes(q)).slice(0, 8)
  }, [catalog, query])

  const set = <K extends keyof TrainingPreferencesInput>(k: K, v: TrainingPreferencesInput[K]) => setP(prev => ({ ...prev, [k]: v }))

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const n = Number(minutes)
      const result = await savePreferences({ ...p, maxSessionMinutes: minutes.trim() && Number.isFinite(n) ? n : null, freeInstructions: p.freeInstructions?.trim() || null })
      setOutcome(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar')
    } finally {
      setSaving(false)
    }
  }

  async function resolve(action: 'accept' | 'reject') {
    if (!outcome?.proposal) return
    await resolveProposal(outcome.proposal.id, action)
    if (action === 'accept') clearCachedPlan()
    setOutcome({ ...outcome, proposal: { ...outcome.proposal, status: action === 'accept' ? 'aceita' : 'recusada' } })
  }

  const chosen = (ids: string[], kind: 'favoriteExercises' | 'exercisesToAvoid', label: string) =>
    ids.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }} aria-label={label}>
        {ids.map(id => (
          <button key={id} type="button" className="hx-plain" onClick={() => set(kind, p[kind].filter(x => x !== id))} aria-label={`remover ${byId.get(id)?.name ?? id}`}>
            <Tag kind={kind === 'exercisesToAvoid' ? 'warn' : 'default'}>{byId.get(id)?.name ?? id} ×</Tag>
          </button>
        ))}
      </div>
    )

  return (
    <div style={{ display: 'grid', gap: 22, marginTop: 20 }}>
      <div className="hx-field">
        <span className="t-secondary">Dias disponíveis</span>
        <MultiToggle label="dias disponíveis" options={DAYS.map((d, i) => ({ value: i, label: d }))} value={p.availableDays} onChange={v => set('availableDays', [...v].sort())} />
      </div>

      <div className="hx-field">
        <label htmlFor="pref-minutes">Duração máxima por sessão (min)</label>
        <div className="hx-input">
          <input id="pref-minutes" type="number" inputMode="numeric" min={15} max={180} value={minutes} onChange={e => setMinutes(e.target.value)} style={textInput} />
        </div>
        <span className="hx-field-help">Restrição rígida: o treino nunca passa disso.</span>
      </div>

      <div className="hx-field">
        <span className="t-secondary">Local</span>
        <Segmented label="local" options={LOCATIONS} value={p.location} onChange={v => set('location', v)} />
      </div>

      <div className="hx-field">
        <span className="t-secondary">Equipamentos disponíveis</span>
        <MultiToggle label="equipamentos disponíveis" options={EQUIPMENT} value={p.availableEquipment} onChange={v => set('availableEquipment', v)} />
        <span className="hx-field-help">Nenhum marcado = todos. Restrição rígida.</span>
      </div>

      <div className="hx-field">
        <label htmlFor="pref-search">Buscar exercício</label>
        <div className="hx-input">
          <input id="pref-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="ex.: agachamento" style={textInput} />
        </div>
        {matches.length > 0 && (
          <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
            {matches.map(e => (
              <li key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid var(--hairline)' }}>
                <span className="t-body" style={{ flex: 1 }}>
                  {e.name}
                </span>
                <Button kind="ghost" aria-label={`favorito ${e.name}`} onClick={() => setP(prev => ({ ...prev, favoriteExercises: toggle(prev.favoriteExercises, e.id), exercisesToAvoid: prev.exercisesToAvoid.filter(x => x !== e.id) }))}>
                  Favorito
                </Button>
                <Button kind="ghost" aria-label={`evitar ${e.name}`} onClick={() => setP(prev => ({ ...prev, exercisesToAvoid: toggle(prev.exercisesToAvoid, e.id), favoriteExercises: prev.favoriteExercises.filter(x => x !== e.id) }))}>
                  Evitar
                </Button>
              </li>
            ))}
          </ul>
        )}
        {chosen(p.favoriteExercises, 'favoriteExercises', 'favoritos')}
        {chosen(p.exercisesToAvoid, 'exercisesToAvoid', 'a evitar')}
      </div>

      <div className="hx-field">
        <span className="t-secondary">Grupos prioritários</span>
        <MultiToggle label="grupos prioritários" options={GROUPS} value={p.priorityMuscleGroups} onChange={v => set('priorityMuscleGroups', v)} />
      </div>

      <div className="hx-field">
        <span className="t-secondary">Estilo de treino</span>
        <Segmented label="estilo de treino" options={STYLES} value={p.trainingStyle} onChange={v => set('trainingStyle', v)} />
      </div>

      <div className="hx-field">
        <label htmlFor="pref-free">Instruções para o Agente de Treino</label>
        <div className="hx-input" style={{ height: 'auto', padding: '10px 14px' }}>
          <textarea id="pref-free" rows={3} maxLength={1000} value={p.freeInstructions ?? ''} onChange={e => set('freeInstructions', e.target.value)} style={{ ...textInput, resize: 'vertical' }} />
        </div>
      </div>

      {error && (
        <Banner kind="err" title="Não foi possível salvar">
          {error}
        </Banner>
      )}
      {outcome && outcome.appliesFrom === 'proximo-mesociclo' && !outcome.proposal && (
        <Banner kind="warn" title="Preferências salvas">
          Valem a partir do próximo mesociclo; o mesociclo atual continua como está.
        </Banner>
      )}
      {outcome?.budgetBlocked && (
        <Banner kind="warn" title="Preferências salvas">
          O teto mensal de IA foi atingido: a adaptação das sessões pendentes fica para quando o teto liberar.
        </Banner>
      )}
      {outcome?.proposal && <ProposalCard proposal={outcome.proposal} onResolve={resolve} />}

      <Button kind="primary" block onClick={save} disabled={saving}>
        Salvar preferências
      </Button>
    </div>
  )
}

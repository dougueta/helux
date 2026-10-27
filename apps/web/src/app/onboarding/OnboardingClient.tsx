'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { CARDIO_BANK, EQUIPMENT, GOALS, type Equipment, type Goal, type TrainingLocation } from '@helux/types'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConditionsEditor } from '@/components/conditions/ConditionsEditor'
import { clearCachedPlan } from '@/hooks/useWorkoutPlan'
import { completeOnboarding, getOnboarding, saveOnboardingStep, type OnboardingState, type OnboardingStepInput } from '@/services/onboarding.service'

// Spec 024 (US1): objetivo → experiência → saúde → rotina → cardio → revisão.

const GOAL_LABEL: Record<Goal, string> = {
  condicionamento: 'Condicionamento',
  hipertrofia: 'Hipertrofia',
  forca: 'Força',
  emagrecimento: 'Emagrecimento',
  corrida: 'Corrida',
}
const LEVELS = [
  { value: 'iniciante' as const, label: 'Iniciante' },
  { value: 'intermediario' as const, label: 'Intermediário' },
  { value: 'avancado' as const, label: 'Avançado' },
]
const DAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const EQUIP_LABEL: Record<Equipment, string> = { barra: 'Barra', halteres: 'Halteres', 'maquina-cabo': 'Máquinas e cabos', 'peso-corporal': 'Peso do corpo' }
const LOCATIONS: { value: TrainingLocation; label: string }[] = [
  { value: 'academia', label: 'Academia' },
  { value: 'casa', label: 'Casa' },
  { value: 'ao-ar-livre', label: 'Ao ar livre' },
  { value: 'hotel', label: 'Hotel' },
]
const TITLES = ['Seu objetivo', 'Sua experiência', 'Sua saúde', 'Sua rotina', 'Seu cardio', 'Revisão']
const TOTAL = TITLES.length
const INPUT: CSSProperties = { display: 'block', width: '100%', marginTop: 6 }
const CHECK_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }

export function OnboardingClient() {
  const router = useRouter()
  const [state, setState] = useState<OnboardingState | null>(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Respostas em edição (pré-preenchidas com o que já existe).
  const [goal, setGoal] = useState<Goal | null>(null)
  const [secondary, setSecondary] = useState<Goal | ''>('')
  const [target, setTarget] = useState('')
  const [level, setLevel] = useState<'iniciante' | 'intermediario' | 'avancado' | null>(null)
  const [trainingTime, setTrainingTime] = useState('')
  const [timeOff, setTimeOff] = useState('')
  const [days, setDays] = useState<number[]>([])
  const [minutes, setMinutes] = useState('60')
  const [location, setLocation] = useState<TrainingLocation | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [likes, setLikes] = useState<string[]>([])
  const [avoid, setAvoid] = useState<string[]>([])

  function apply(s: OnboardingState) {
    setState(s)
    const p = s.profile
    setGoal(p?.goalPrimary ?? null)
    setSecondary(p?.goalSecondary ?? '')
    setTarget(p?.goalTarget ?? '')
    setLevel(p?.level ?? null)
    setTrainingTime(p?.trainingTime ?? '')
    setTimeOff(p?.timeOff ?? '')
    setDays(s.preferences.availableDays)
    setMinutes(String(s.preferences.maxSessionMinutes ?? 60))
    setLocation(s.preferences.location)
    setEquipment(s.preferences.availableEquipment)
    setLikes(p?.cardioLikes ?? [])
    setAvoid(p?.cardioAvoid ?? [])
  }

  useEffect(() => {
    getOnboarding()
      .then(s => {
        apply(s)
        setStep(Math.min(Math.max(s.step ?? 1, 1), TOTAL))
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Não foi possível carregar o onboarding.'))
  }, [])

  function payloadFor(current: number): OnboardingStepInput {
    const next = current + 1
    if (current === 1 && goal) return { step: next, goal: { primary: goal, secondary: secondary || null, target: target.trim() || null } }
    if (current === 2 && level) return { step: next, experience: { level, trainingTime, timeOff } }
    if (current === 4) return { step: next, availability: { availableDays: days, maxSessionMinutes: Number(minutes) || null, location, availableEquipment: equipment } }
    if (current === 5) return { step: next, cardio: { likes, avoid } }
    return { step: next }
  }

  async function next() {
    setBusy(true)
    setError(null)
    try {
      const saved = await saveOnboardingStep(payloadFor(step))
      setState(saved)
      setStep(s => Math.min(s + 1, TOTAL))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setBusy(false)
    }
  }

  async function finish() {
    setBusy(true)
    setError(null)
    try {
      await completeOnboarding()
      clearCachedPlan()
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível concluir.')
    } finally {
      setBusy(false)
    }
  }

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter(v => v !== value) : [...list, value])

  if (!state && !error) return <Skeleton h={240} style={{ marginTop: 24 }} />

  const canContinue = (step !== 1 || !!goal) && (step !== 2 || !!level) && (step !== 4 || days.length > 0)

  return (
    <div style={{ marginTop: 16 }}>
      <p className="t-secondary">
        Passo {step} de {TOTAL}
      </p>
      <h2 className="t-heading" style={{ marginTop: 4 }}>
        {TITLES[step - 1]}
      </h2>

      {step === 1 && (
        <div style={{ marginTop: 12 }}>
          {state?.suggestions.goalText && <p className="t-secondary">Você escreveu antes: “{state.suggestions.goalText}”.</p>}
          <div style={{ marginTop: 12 }}>
            <Segmented label="Objetivo principal" options={GOALS.map(g => ({ value: g, label: GOAL_LABEL[g] }))} value={goal} onChange={setGoal} />
          </div>
          <label className="t-secondary" style={{ display: 'block', marginTop: 12 }}>
            Objetivo secundário (opcional)
            <select className="hx-input" style={INPUT} value={secondary} onChange={e => setSecondary(e.target.value as Goal | '')}>
              <option value="">Nenhum</option>
              {GOALS.filter(g => g !== goal).map(g => (
                <option key={g} value={g}>
                  {GOAL_LABEL[g]}
                </option>
              ))}
            </select>
          </label>
          <label className="t-secondary" style={{ display: 'block', marginTop: 12 }}>
            Meta que dá para medir (opcional)
            <input className="hx-input" style={INPUT} maxLength={140} value={target} onChange={e => setTarget(e.target.value)} placeholder="ex.: correr 5 km sem dor" />
          </label>
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: 12 }}>
          <Segmented label="Nível de experiência" options={LEVELS} value={level} onChange={setLevel} />
          <label className="t-secondary" style={{ display: 'block', marginTop: 12 }}>
            Há quanto tempo treina
            <input className="hx-input" style={INPUT} value={trainingTime} onChange={e => setTrainingTime(e.target.value)} />
          </label>
          <label className="t-secondary" style={{ display: 'block', marginTop: 12 }}>
            Tempo parado
            <input className="hx-input" style={INPUT} value={timeOff} onChange={e => setTimeOff(e.target.value)} placeholder="ex.: 8 meses" />
          </label>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 12 }}>
          <p className="t-secondary">Registre condições de saúde e cirurgias. Cada uma vira regras que o app confere em todo treino.</p>
          {state?.suggestions.injuryText && <p className="t-secondary" style={{ marginTop: 8 }}>Você escreveu antes: “{state.suggestions.injuryText}”.</p>}
          <ConditionsEditor />
        </div>
      )}

      {step === 4 && (
        <div style={{ marginTop: 12 }}>
          <p className="t-body-m">Dias disponíveis</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {DAYS.map((d, i) => (
              <label key={d} style={CHECK_ROW}>
                <input type="checkbox" checked={days.includes(i)} onChange={() => setDays(toggle(days, i).sort())} /> {d}
              </label>
            ))}
          </div>
          <label className="t-secondary" style={{ display: 'block', marginTop: 12 }}>
            Minutos por treino
            <input className="hx-input" style={{ ...INPUT, width: 96 }} type="number" min={15} max={180} value={minutes} onChange={e => setMinutes(e.target.value)} />
          </label>
          <div style={{ marginTop: 12 }}>
            <Segmented label="Onde treina" options={LOCATIONS} value={location} onChange={setLocation} />
          </div>
          <p className="t-body-m" style={{ marginTop: 12 }}>
            Equipamentos
          </p>
          {EQUIPMENT.map(e => (
            <label key={e} style={CHECK_ROW}>
              <input type="checkbox" checked={equipment.includes(e)} onChange={() => setEquipment(toggle(equipment, e))} /> {EQUIP_LABEL[e]}
            </label>
          ))}
        </div>
      )}

      {step === 5 && (
        <div style={{ marginTop: 12 }}>
          <p className="t-secondary">O cardio respeita as suas condições: com joelho operado ou artrose, só entram opções sem impacto.</p>
          {CARDIO_BANK.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
              <span className="t-body" style={{ flex: 1 }}>
                {c.name}
              </span>
              <label style={CHECK_ROW}>
                <input type="checkbox" aria-label={`Gosto: ${c.name}`} checked={likes.includes(c.id)} onChange={() => { setLikes(toggle(likes, c.id)); setAvoid(avoid.filter(a => a !== c.id)) }} /> gosto
              </label>
              <label style={CHECK_ROW}>
                <input type="checkbox" aria-label={`Evitar: ${c.name}`} checked={avoid.includes(c.id)} onChange={() => { setAvoid(toggle(avoid, c.id)); setLikes(likes.filter(l => l !== c.id)) }} /> evitar
              </label>
            </div>
          ))}
        </div>
      )}

      {step === 6 && (
        <div style={{ marginTop: 12 }}>
          <p className="t-body">Objetivo: {state?.profile?.goalPrimary ? GOAL_LABEL[state.profile.goalPrimary] : '—'}</p>
          <p className="t-body">Nível: {LEVELS.find(l => l.value === state?.profile?.level)?.label ?? '—'}</p>
          <p className="t-body">Dias: {state?.preferences.availableDays.map(d => DAYS[d]).join(', ') || '—'}</p>
          <p className="t-body">Condições registradas: {state?.conditions.length ?? 0}</p>
          <p className="t-secondary" style={{ marginTop: 8 }}>
            Ao concluir, o próximo ciclo de treino é montado com essas respostas. Você pode mudar tudo depois no Perfil.
          </p>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12 }}>
          <Banner kind="err" title={error} />
        </div>
      )}

      <div style={{ marginTop: 20, display: 'grid', gap: 8 }}>
        {step < TOTAL ? (
          <Button kind="primary" block onClick={() => void next()} loading={busy} disabled={!canContinue}>
            Continuar
          </Button>
        ) : (
          <Button kind="primary" block onClick={() => void finish()} loading={busy}>
            Concluir
          </Button>
        )}
        {step > 1 && (
          <Button kind="ghost" block onClick={() => setStep(s => s - 1)}>
            Voltar
          </Button>
        )}
      </div>
    </div>
  )
}

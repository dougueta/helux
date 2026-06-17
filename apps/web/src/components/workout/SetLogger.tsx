'use client'

import { useState } from 'react'

interface SetLoggerProps {
  setNumber: number
  targetReps: string
  targetWeight: string
  onLog: (set: { reps: number; weight: number; effort: number }) => void
}

export function SetLogger({ setNumber, targetReps, targetWeight, onLog }: SetLoggerProps) {
  const [reps, setReps] = useState(targetReps.split('-')[0] ?? '')
  const [weight, setWeight] = useState(targetWeight.replace(/[^0-9.]/g, ''))
  const [effort, setEffort] = useState('8')

  function handleSubmit() {
    onLog({ reps: Number(reps), weight: Number(weight), effort: Number(effort) })
  }

  return (
    <div className="bg-helux-surface rounded-2xl border border-helux-border p-4 space-y-4">
      <p className="text-helux-muted text-sm font-mono">
        Série {setNumber} · alvo {targetReps} reps · {targetWeight}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="reps" className="text-xs text-helux-muted uppercase tracking-wider">Reps</label>
          <input
            id="reps"
            type="number"
            value={reps}
            onChange={e => setReps(e.target.value)}
            className="bg-helux-dark border border-helux-border rounded-lg px-3 py-2 text-center font-mono text-white text-lg focus:border-helux-accent outline-none min-h-[44px]"
            min={1}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="weight" className="text-xs text-helux-muted uppercase tracking-wider">Peso (kg)</label>
          <input
            id="weight"
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="bg-helux-dark border border-helux-border rounded-lg px-3 py-2 text-center font-mono text-white text-lg focus:border-helux-accent outline-none min-h-[44px]"
            min={0}
            step={2.5}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="effort" className="text-xs text-helux-muted uppercase tracking-wider">Esforço (1-10)</label>
          <input
            id="effort"
            type="number"
            value={effort}
            onChange={e => setEffort(e.target.value)}
            className="bg-helux-dark border border-helux-border rounded-lg px-3 py-2 text-center font-mono text-white text-lg focus:border-helux-accent outline-none min-h-[44px]"
            min={1}
            max={10}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-helux-accent text-helux-dark font-sans font-semibold py-4 rounded-xl text-base active:scale-95 transition-transform min-h-[56px]"
      >
        Confirmar Série
      </button>
    </div>
  )
}

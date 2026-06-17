'use client'

interface RestTimerProps {
  secondsLeft: number
  isActive: boolean
  onSkip: () => void
}

export function RestTimer({ secondsLeft, isActive, onSkip }: RestTimerProps) {
  if (!isActive) return null

  const minutes = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60

  return (
    <div className="bg-helux-surface rounded-2xl border border-helux-accent/30 p-6 text-center space-y-4">
      <p className="text-helux-muted text-sm font-sans uppercase tracking-wider">Descanso</p>
      <p className="font-mono text-5xl text-helux-accent font-bold">
        {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </p>
      <button
        onClick={onSkip}
        className="text-helux-muted text-sm underline underline-offset-2 min-h-[44px] px-4"
      >
        Pular Descanso
      </button>
    </div>
  )
}

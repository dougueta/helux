'use client'

import { useState } from 'react'

interface TraitCardProps {
  name: string
  summary: string
  detail: string
  level: 'low' | 'medium' | 'high'
}

const levelColors = {
  low: 'text-blue-400 bg-blue-900/20 border-blue-800/40',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/40',
  high: 'text-helux-accent bg-helux-accent/10 border-helux-accent/30',
}

const levelLabels = { low: 'Baixo', medium: 'Médio', high: 'Alto' }

export function TraitCard({ name, summary, detail, level }: TraitCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-helux-surface border border-helux-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 text-left flex items-start justify-between gap-3 min-h-[56px]"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-sans font-medium text-white text-sm">{name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${levelColors[level]}`}>
              {levelLabels[level]}
            </span>
          </div>
          <p className="text-helux-muted text-sm">{summary}</p>
        </div>
        <span className={`text-helux-muted transition-transform ${open ? 'rotate-180' : ''} shrink-0 mt-0.5`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-helux-border pt-3">
          <p className="text-white/80 text-sm leading-relaxed">{detail}</p>
        </div>
      )}
    </div>
  )
}

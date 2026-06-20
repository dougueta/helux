import type { ReactNode } from 'react'

interface ShellProps {
  children: ReactNode
  className?: string
}

export function Shell({ children, className = '' }: ShellProps) {
  return (
    <div className={`max-w-lg mx-auto px-4 pt-12 pb-24 ${className}`}>
      {children}
    </div>
  )
}

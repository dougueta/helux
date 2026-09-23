import type { CSSProperties, ReactNode } from 'react'
import { pageContainer } from '@/components/ui/layout'

interface ShellProps {
  children: ReactNode
  style?: CSSProperties
}

export function Shell({ children, style }: ShellProps) {
  return (
    <div style={{ ...pageContainer, paddingTop: 48, paddingBottom: 96, ...style }}>
      {children}
    </div>
  )
}

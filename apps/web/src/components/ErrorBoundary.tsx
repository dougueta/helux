'use client'

import { Component, ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Card
            padding={24}
            style={{ maxWidth: 384, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
          >
            <p style={{ color: 'var(--text)', fontWeight: 500 }}>Algo deu errado</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: '20px' }}>{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              style={{ color: 'var(--accent)', fontSize: 14, lineHeight: '20px', textDecoration: 'underline' }}
            >
              Tentar novamente
            </button>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}

'use client'

import { Component, ReactNode } from 'react'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

/** Tela de erro (FR-023): `Banner err` + "Tentar de novo". */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hx-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Banner kind="err" title="Algo deu errado">
            {this.state.message}
          </Banner>
          <div style={{ marginTop: 16 }}>
            <Button kind="secondary" block icon="sync" onClick={() => this.setState({ hasError: false, message: '' })}>
              Tentar de novo
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

'use client'

import { Component, ReactNode } from 'react'

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
        <div className="min-h-screen bg-helux-dark flex items-center justify-center p-6">
          <div className="bg-helux-surface border border-helux-border rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <p className="text-white font-sans font-medium">Algo deu errado</p>
            <p className="text-helux-muted text-sm">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="text-helux-accent text-sm underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

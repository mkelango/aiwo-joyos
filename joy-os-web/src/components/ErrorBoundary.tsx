import { Component, type ErrorInfo, type ReactNode } from 'react'

// A calm failure state: no stack traces, no personal data, one way back (Architecture p22).
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Joy OS screen error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="eyebrow text-ink-3">Something went wrong</p>
        <h1 className="mt-3 text-[2rem] font-light text-ink">This screen could not open. <em>Nothing</em> you saved is lost.</h1>
        <p className="mt-3 max-w-md text-[17px] text-ink-2">Your Ledger and answers are kept on this device and sync when the screen is back.</p>
        <div className="mt-6 flex gap-3">
          <button className="btn-daybreak" onClick={() => { this.setState({ error: null }); window.location.assign('/app') }}>Back to Today</button>
          <button className="h-14 rounded-full border border-line-strong px-6 text-ink" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    )
  }
}

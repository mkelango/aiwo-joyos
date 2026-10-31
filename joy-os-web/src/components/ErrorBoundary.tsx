import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useDict } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'

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
    return <Fallback onReset={() => this.setState({ error: null })} />
  }
}

function Fallback({ onReset }: { onReset: () => void }) {
  const t = useDict(SHARED)
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow text-ink-3">{t('errEyebrow')}</p>
      <h1 className="mt-3 break-words text-[2rem] font-light text-ink">{t('errPre')}<em>{t('errEm')}</em>{t('errPost')}</h1>
      <p className="mt-3 max-w-md text-[17px] text-ink-2">{t('errBody')}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button className="btn-daybreak" onClick={() => { onReset(); window.location.assign('/app') }}>{t('backToToday')}</button>
        <button className="h-14 rounded-full border border-line-strong px-6 text-ink" onClick={() => window.location.reload()}>{t('tryAgain')}</button>
      </div>
    </div>
  )
}

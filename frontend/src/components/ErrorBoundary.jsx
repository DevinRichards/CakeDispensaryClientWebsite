import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
          <span className="material-symbols-outlined text-error/60 block mb-4" style={{ fontSize: 64 }}>error</span>
          <h1 className="text-4xl font-headline font-black mb-4">Something went wrong</h1>
          <p className="text-on-surface-variant font-body mb-8 max-w-md">
            An unexpected error occurred. Please refresh the page or contact us if the problem persists.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary justify-center"
            >
              REFRESH PAGE
            </button>
            <a href="/" className="btn-outline justify-center">GO HOME</a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

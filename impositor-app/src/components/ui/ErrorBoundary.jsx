import { Component, ReactNode } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null, errorInfo: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  reset = () => {
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    const { children, fallback } = this.props

    if (this.state.error) {
      if (fallback) {
        return fallback(this.state.error, this.reset)
      }
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-50 p-6 text-red-800">
          <h2 className="text-xl font-bold mb-2">⚠️ Error en la aplicación</h2>
          <pre className="mb-4 text-xs text-red-600 bg-red-100 p-4 rounded overflow-auto max-w-[90vw] max-h-[60vh] whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            onClick={this.reset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Recargar aplicación
          </button>
          {this.state.errorInfo && (
            <details className="mt-4 text-xs text-red-500 max-w-[90vw]">
              <summary>Ver stack trace</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary

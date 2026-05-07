import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { crashed: false }
  }

  static getDerivedStateFromError() {
    return { crashed: true }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.crashed) return this.props.children

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', textAlign: 'center',
        background: 'var(--bg)', color: 'var(--tx)',
        fontFamily: "'Raleway', sans-serif",
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--gd)"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 24 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Something went wrong</h2>
        <p style={{ fontSize: 14, color: 'var(--tm)', marginBottom: 32, maxWidth: 340, lineHeight: 1.7 }}>
          A page failed to load. This is usually a temporary network issue.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--gd)', color: '#fff', border: 'none',
            padding: '12px 32px', borderRadius: 8, fontSize: 12,
            fontFamily: "'Raleway', sans-serif", fontWeight: 700,
            letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer',
          }}>
          Reload Page
        </button>
      </div>
    )
  }
}

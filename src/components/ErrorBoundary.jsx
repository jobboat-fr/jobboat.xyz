import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    this.setState({ errorInfo: info });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      const errMsg = error?.message || String(error || 'Unknown error');
      const stack = errorInfo?.componentStack || '';

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--jb-bg, #0f172a)',
          color: 'var(--jb-text, #e2e8f0)',
          fontFamily: 'var(--jb-font-body, system-ui, sans-serif)',
          padding: '2rem',
        }}>
          <div style={{
            maxWidth: 560,
            textAlign: 'center',
            background: 'rgba(30,41,59,0.7)',
            borderRadius: 16,
            padding: '3rem 2rem',
            border: '1px solid rgba(148,163,184,0.1)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 8 }}>
              Une erreur est survenue
            </h1>
            <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
              L'application a rencontre un probleme inattendu. Tes donnees sont en securite.
            </p>

            {/* Always show the error message so we can diagnose */}
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              textAlign: 'left',
              fontSize: '0.8rem',
              color: '#fca5a5',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
              maxHeight: showDetails ? 300 : 60,
              overflow: 'auto',
              transition: 'max-height 0.3s',
            }}>
              <strong>Erreur:</strong> {errMsg}
              {showDetails && stack && (
                <pre style={{ marginTop: 8, fontSize: '0.7rem', opacity: 0.7, whiteSpace: 'pre-wrap' }}>
                  {stack}
                </pre>
              )}
            </div>

            {stack && (
              <button
                onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))}
                style={{
                  background: 'none', border: 'none', color: 'rgba(148,163,184,0.6)',
                  fontSize: '0.75rem', cursor: 'pointer', marginBottom: 16, textDecoration: 'underline',
                }}
              >
                {showDetails ? 'Masquer les details' : 'Voir les details techniques'}
              </button>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  background: 'var(--jb-accent, #2d6aa0)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Reessayer
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Recharger la page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  background: 'transparent',
                  color: 'var(--jb-text-muted, #94a3b8)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retour a l'accueil
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

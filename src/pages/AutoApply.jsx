import { Component } from 'react';
import DiscoveryApplyHub from '../components/jobs/DiscoveryApplyHub';

class AutoApplyBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AutoApply ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || String(this.state.error || 'Unknown');
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 className="font-display" style={{ fontWeight: 700, marginBottom: 12 }}>
            Erreur de chargement
          </h2>
          <p className="text-secondary" style={{ marginBottom: 8 }}>
            La page Decouverte & Candidature n'a pas pu se charger.
          </p>
          <pre style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: 12, fontSize: '0.75rem', color: '#fca5a5',
            fontFamily: 'monospace', textAlign: 'left', wordBreak: 'break-word',
            marginBottom: 16, maxWidth: 500, margin: '0 auto 16px',
          }}>
            {msg}
          </pre>
          <button
            className="btn btn--primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AutoApply() {
  return (
    <AutoApplyBoundary>
      <DiscoveryApplyHub />
    </AutoApplyBoundary>
  );
}

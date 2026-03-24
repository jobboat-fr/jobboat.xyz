import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

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
      <div style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ fontSize: '5rem', fontWeight: 800, opacity: 0.15, lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600, margin: '16px 0 8px' }}>
          Page introuvable
        </h1>
        <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
          Cette page n'existe pas ou a ete deplacee. Retourne au tableau de bord pour continuer.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'var(--jb-accent, #2d6aa0)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Tableau de bord
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent', color: 'var(--jb-text-muted, #94a3b8)',
              border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8,
              padding: '10px 24px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Page precedente
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiBase } from '../services/apiClient';
import './admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // The password field IS the admin bypass token. We verify it against the
    // backend (which compares timing-safe against ADMIN_BYPASS_TOKEN env var)
    // by hitting a protected admin endpoint with x-admin-token header.
    // No frontend env vars required.
    const candidate = password.trim();
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/dashboard`, {
        method: 'GET',
        headers: { 'x-admin-token': candidate },
      });
      if (res.ok) {
        localStorage.setItem('admin_access_token', candidate);
        localStorage.setItem('admin_access_time', Date.now().toString());
        localStorage.setItem('admin_user_label', username || 'admin');
        navigate('/admin');
      } else {
        setError('Identifiants invalides. Accès refusé.');
        setPassword('');
      }
    } catch (err) {
      setError('Erreur réseau. Vérifie ta connexion.');
    }
    setLoading(false);
  }

  return (
    <div className="admin-login-page">
      <div className="stars-bg" />
      <div className="page-bg" />

      <div className="admin-login-container fade-in-up">
        <div className="glass-card admin-login-card">
          {/* Lock icon */}
          <div className="admin-login-lock">
            <LockSVG />
          </div>

          <h1 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em' }}>
            Acces Administrateur
          </h1>
          <p className="text-secondary" style={{ textAlign: 'center', fontSize: 'var(--jb-text-sm)', marginTop: 4 }}>
            Zone Restreinte -- Personnel Autorise Uniquement
          </p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div>
              <label className="label">Nom d'utilisateur</label>
              <input
                className="input"
                type="text"
                placeholder="Entrez le nom d'utilisateur admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <input
                className={`input ${error ? 'input--error' : ''}`}
                type="password"
                placeholder="Entrez le mot de passe admin"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {error && <p style={{ color: 'var(--jb-danger)', fontSize: 'var(--jb-text-sm)' }}>{error}</p>}

            <button
              type="submit"
              className="btn btn--primary btn--lg btn--full"
              disabled={loading}
            >
              {loading ? 'Authentification...' : 'Acceder au Centre de Commande'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 'var(--jb-space-6)' }}>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => navigate('/')}
            >
              Retour a la plateforme
            </button>
          </div>
        </div>

        <p className="text-muted" style={{ textAlign: 'center', fontSize: 'var(--jb-text-xs)', marginTop: 'var(--jb-space-6)' }}>
          Toutes les tentatives d'acces sont enregistrees et surveillees.
        </p>
      </div>
    </div>
  );
}

function LockSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

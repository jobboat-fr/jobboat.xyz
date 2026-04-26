import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import './publicstats.css';

const RAILWAY_BACKEND = 'https://jobboatv1-production-cb89.up.railway.app';

function resolveApiBase() {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return RAILWAY_BACKEND;
  }
  return '';
}

const PLATFORM_LABELS = {
  indeed: 'Indeed',
  linkedin: 'LinkedIn',
  wttj: 'Welcome to the Jungle',
  hellowork: 'HelloWork',
  apec: 'APEC',
  monster: 'Monster',
  cadremploi: 'Cadremploi',
  francetravail: 'France Travail',
  glassdoor: 'Glassdoor',
  generic: 'Autres sites',
};

export default function PublicStats() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    const base = resolveApiBase();
    fetch(`${base}/api/v2/stats/public`)
      .then(r => r.json())
      .then(data => {
        if (data && data.success) {
          setState({ loading: false, data, error: null });
        } else {
          setState({ loading: false, data: null, error: data?.error || 'Données indisponibles' });
        }
      })
      .catch(err => setState({ loading: false, data: null, error: err.message }));
  }, []);

  const { loading, data, error } = state;
  const overall = data?.overall || {};
  const rows = data?.per_platform || [];
  const hasData = (overall.total_attempts || 0) > 0;

  return (
    <div className="jb-stats-root">
      <SEOHead />

      <header className="jb-stats-header">
        <Link to="/" className="jb-stats-home">← JobBoat</Link>
        <h1>Statistiques publiques</h1>
        <p className="jb-stats-subtitle">
          Précision mesurée en temps réel. Aucun chiffre marketing — que du mesuré.
        </p>
        <p className="jb-stats-period">
          Fenêtre&nbsp;: {data?.period_days || 30} derniers jours
          {data?.updated_at && <> · Mis à jour {new Date(data.updated_at).toLocaleString('fr-FR')}</>}
        </p>
      </header>

      {loading && <div className="jb-stats-loading">Chargement…</div>}

      {!loading && error && (
        <div className="jb-stats-empty">
          <p>Les statistiques ne sont pas encore disponibles.</p>
          <p className="jb-stats-hint">{error}</p>
        </div>
      )}

      {!loading && !error && !hasData && (
        <div className="jb-stats-empty">
          <p><strong>Sois parmi les premiers à faire remonter un chiffre.</strong></p>
          <p className="jb-stats-hint">
            JobBoat vient d'ouvrir sa bêta. Les premières candidatures envoyées via l'extension Chrome
            apparaîtront ici dès qu'elles seront mesurées — aucun chiffre inventé, que du réel.
          </p>
          <p className="jb-stats-hint" style={{ marginTop: '1.5rem' }}>
            <Link to="/auth" className="jb-stats-cta">
              Rejoindre la bêta →
            </Link>
          </p>
        </div>
      )}

      {!loading && !error && hasData && (
        <>
          <section className="jb-stats-kpis">
            <div className="jb-stats-kpi">
              <div className="jb-stats-kpi-value">
                {overall.success_rate_pct !== null && overall.success_rate_pct !== undefined
                  ? `${overall.success_rate_pct}%`
                  : '—'}
              </div>
              <div className="jb-stats-kpi-label">Taux de remplissage réussi</div>
              <div className="jb-stats-kpi-sub">
                (≥ 3 champs remplis automatiquement)
              </div>
            </div>
            <div className="jb-stats-kpi">
              <div className="jb-stats-kpi-value">{(overall.total_attempts || 0).toLocaleString('fr-FR')}</div>
              <div className="jb-stats-kpi-label">Candidatures assistées</div>
            </div>
            <div className="jb-stats-kpi">
              <div className="jb-stats-kpi-value">
                {overall.avg_duration_ms
                  ? `${(overall.avg_duration_ms / 1000).toFixed(1)}s`
                  : '—'}
              </div>
              <div className="jb-stats-kpi-label">Durée moyenne</div>
            </div>
            <div className="jb-stats-kpi">
              <div className="jb-stats-kpi-value">{overall.platforms_covered || 0}</div>
              <div className="jb-stats-kpi-label">Plateformes couvertes</div>
            </div>
          </section>

          <section className="jb-stats-table-wrap">
            <h2>Détail par plateforme</h2>
            <table className="jb-stats-table">
              <thead>
                <tr>
                  <th>Plateforme</th>
                  <th className="jb-num">Tentatives</th>
                  <th className="jb-num">Réussies</th>
                  <th className="jb-num">Taux</th>
                  <th className="jb-num">Champs remplis (moy.)</th>
                  <th className="jb-num">Durée (ms)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.platform}>
                    <td>
                      <strong>{PLATFORM_LABELS[r.platform] || r.platform}</strong>
                    </td>
                    <td className="jb-num">{(r.total_attempts || 0).toLocaleString('fr-FR')}</td>
                    <td className="jb-num">{(r.successful_attempts || 0).toLocaleString('fr-FR')}</td>
                    <td className="jb-num">
                      <span className={`jb-stats-rate ${r.success_rate_pct >= 80 ? 'ok' : r.success_rate_pct >= 50 ? 'mid' : 'low'}`}>
                        {r.success_rate_pct !== null ? `${r.success_rate_pct}%` : '—'}
                      </span>
                    </td>
                    <td className="jb-num">{r.avg_fields_filled ?? '—'}</td>
                    <td className="jb-num">{r.avg_duration_ms ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <footer className="jb-stats-footer">
        <p>
          Ces chiffres sont collectés en direct depuis notre extension Chrome.
          Chaque tentative de remplissage est enregistrée&nbsp;:
          réussite ou échec, sans filtre. Nous préférons la vérité au marketing.
        </p>
        <p>
          <Link to="/pricing">Essayer JobBoat Pro</Link> · <Link to="/">Retour accueil</Link>
        </p>
      </footer>
    </div>
  );
}

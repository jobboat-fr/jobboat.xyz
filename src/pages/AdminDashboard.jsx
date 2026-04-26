import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { adminApi } from '../services/adminApiClient';
import './admin.css';

const VIEWS = [
  { id: 'overview', label: "Vue d'ensemble" },
  { id: 'security', label: 'Sécurité' },
  { id: 'services', label: 'Santé des services' },
  { id: 'skills', label: 'Compétences de coaching' },
  { id: 'auto-apply', label: 'Candidature auto' },
  { id: 'tokenomics', label: 'Tokenomique' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  async function fetchSnapshot() {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.dashboard();
      const s = data.snapshot || data;
      setSnapshot(s);
      setLastUpdated(s.generatedAt || new Date().toISOString());
    } catch (err) {
      setError(err.message || 'Échec du chargement du tableau de bord');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSnapshot(); }, []);

  const securityRows = snapshot?.security || [];
  const serviceRows = snapshot?.services || [];
  const skillMetrics = snapshot?.skills || null;
  const autoApplyMetrics = snapshot?.autoApply || null;
  const tokenomics = snapshot?.tokenomics || null;
  const highlights = snapshot?.highlights || [];

  const confidenceTrend = useMemo(() => {
    if (!skillMetrics?.confidenceTrend?.length) return [];
    return skillMetrics.confidenceTrend.map(e => ({
      index: e.index,
      confidence: Number((e.confidence ?? 0).toFixed(2)),
    }));
  }, [skillMetrics]);

  const topPersonas = useMemo(() => {
    if (!skillMetrics?.adaptive?.topPersonas?.length) return [];
    return skillMetrics.adaptive.topPersonas.map(p => ({
      name: p.persona,
      sessions: p.sessions,
      avgSkill: p.avgSkill !== null ? Number(p.avgSkill.toFixed(2)) : null,
    }));
  }, [skillMetrics]);

  const serviceSummary = useMemo(() => {
    if (!serviceRows.length) return { healthy: 0, degraded: 0, down: 0 };
    return serviceRows.reduce((acc, svc) => {
      if (svc.status === 'healthy') acc.healthy++;
      else if (svc.status === 'down') acc.down++;
      else acc.degraded++;
      return acc;
    }, { healthy: 0, degraded: 0, down: 0 });
  }, [serviceRows]);

  const fmt = (v, fb = '0') => (v == null || Number.isNaN(v)) ? fb : v.toLocaleString();

  function handleLogout() {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_access_time');
    navigate('/admin/login');
  }

  // ─── Render sections ───

  function renderOverview() {
    return (
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Vue d'ensemble du Centre de contrôle</h2>
        <div className="admin-overview-grid">
          <StatCard label="Sessions totales" value={fmt(skillMetrics?.totals?.sessions || 0)} sub="Sessions de coaching enregistrées" />
          <StatCard label="Utilisateurs uniques" value={fmt(skillMetrics?.totals?.users || 0)} sub="Engagés dans l'écosystème" />
          <StatCard label="Succès candidature auto" value={autoApplyMetrics?.totals?.successRate != null ? `${autoApplyMetrics.totals.successRate.toFixed(1)}%` : 'n/a'} sub="Soumis vs acceptés" />
          <StatCard label="Services en ligne" value={`${serviceSummary.healthy}/${serviceRows.length}`} sub="En bonne santé / total surveillé" />
        </div>
        {highlights.length > 0 && (
          <div className="glass-card" style={{ marginTop: 'var(--jb-space-6)' }}>
            <h3 className="font-display" style={{ fontWeight: 600, marginBottom: 12 }}>Alertes et points forts</h3>
            <div className="admin-highlights-list">
              {highlights.map((h, i) => (
                <div key={h.title || h.label || `hl-${i}`} className={`admin-highlight admin-highlight--${h.severity || 'info'}`}>
                  <span className="admin-highlight-title">{h.title}</span>
                  <span className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)' }}>{h.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderSecurity() {
    return (
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Sécurité et clés API</h2>
        <div className="admin-table-wrap glass-card">
          <table className="admin-table">
            <thead>
              <tr><th>Fournisseur</th><th>Statut</th><th>Santé</th><th>Configuré</th></tr>
            </thead>
            <tbody>
              {securityRows.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.label}</td>
                  <td><span className={`badge badge--${p.status === 'active' ? 'success' : 'danger'}`}>{p.status === 'active' ? 'Actif' : p.status}</span></td>
                  <td>{p.health}</td>
                  <td>{p.configured ? 'Oui' : 'Non'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-actions-row">
          <button className="btn btn--primary" onClick={() => navigate('/admin/api-keys')}>Gérer les clés API</button>
          <button className="btn btn--secondary" onClick={() => navigate('/admin/logs')}>Consulter les journaux</button>
          <button className="btn btn--secondary" onClick={() => navigate('/admin/recruiter')}>Recruteur (Matching)</button>
        </div>
      </div>
    );
  }

  function renderServices() {
    return (
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Santé des services et télémétrie</h2>
        <p className="section-subtitle">Suivi du temps de fonctionnement, de la latence et des métriques de repli.</p>
        <div className="admin-table-wrap glass-card">
          <table className="admin-table">
            <thead>
              <tr><th>Service</th><th>Statut</th><th>Temps de fonctionnement</th><th>Latence p95</th><th>Note</th></tr>
            </thead>
            <tbody>
              {serviceRows.map(s => (
                <tr key={s.job}>
                  <td style={{ fontWeight: 600 }}>{s.job}</td>
                  <td><span className={`badge badge--${s.status === 'healthy' ? 'success' : s.status === 'down' ? 'danger' : 'warning'}`}>{s.status === 'healthy' ? 'En bonne santé' : s.status === 'down' ? 'Hors service' : 'Dégradé'}</span></td>
                  <td>{s.uptime != null ? `${(s.uptime * 100).toFixed(2)}%` : 'n/a'}</td>
                  <td>{s.latencyMs != null ? `${s.latencyMs}ms` : 'n/a'}</td>
                  <td className="text-secondary">{s.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderSkills() {
    return (
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Salle de coaching -- Intelligence des compétences</h2>
        <div className="admin-overview-grid">
          <StatCard label="Compétence moyenne EWMA" value={skillMetrics?.adaptive?.avgSkill != null ? Number(skillMetrics.adaptive.avgSkill).toFixed(2) : 'n/a'} />
          <StatCard label="Difficulté latente moyenne" value={skillMetrics?.adaptive?.avgLatent != null ? Number(skillMetrics.adaptive.avgLatent).toFixed(2) : 'n/a'} />
          <StatCard label="Événements de calibration" value={fmt(skillMetrics?.adaptive?.calibrationEvents || 0)} />
          <StatCard label="Sessions (total / 7j)" value={`${fmt(skillMetrics?.totals?.sessions || 0)} / ${fmt(skillMetrics?.totals?.activeLast7d || 0)}`} />
        </div>

        <div className="glass-card" style={{ marginTop: 'var(--jb-space-6)', padding: 'var(--jb-space-6)' }}>
          <h3 className="font-display" style={{ fontWeight: 600, marginBottom: 16 }}>Tendance de confiance (Dernières réponses)</h3>
          {confidenceTrend.length ? (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={confidenceTrend}>
                  <defs>
                    <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2d6aa0" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#2d6aa0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} domain={[0, 1]} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="confidence" stroke="#2d6aa0" fill="url(#confGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted">Aucune donnée de confiance pour le moment.</p>
          )}
        </div>

        {topPersonas.length > 0 && (
          <div className="admin-table-wrap glass-card" style={{ marginTop: 'var(--jb-space-6)' }}>
            <table className="admin-table">
              <thead>
                <tr><th>Persona</th><th>Sessions</th><th>Compétence moyenne</th></tr>
              </thead>
              <tbody>
                {topPersonas.map(p => (
                  <tr key={p.name}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{fmt(p.sessions)}</td>
                    <td>{p.avgSkill != null ? p.avgSkill.toFixed(2) : 'n/a'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderAutoApply() {
    return (
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Performance de candidature automatique</h2>
        <div className="admin-overview-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatCard label="Candidatures totales" value={fmt(autoApplyMetrics?.totals?.applications || 0)} />
          <StatCard label="Taux de succès" value={autoApplyMetrics?.totals?.successRate != null ? `${autoApplyMetrics.totals.successRate.toFixed(1)}%` : 'n/a'} />
        </div>

        <div className="admin-two-col" style={{ marginTop: 'var(--jb-space-6)' }}>
          <div className="admin-table-wrap glass-card">
            <h3 className="font-display" style={{ fontWeight: 600, marginBottom: 12 }}>Par statut</h3>
            <table className="admin-table">
              <thead><tr><th>Statut</th><th>Nombre</th></tr></thead>
              <tbody>
                {(autoApplyMetrics?.byStatus || []).map(e => (
                  <tr key={e.status}><td>{e.status}</td><td>{fmt(e.count)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-table-wrap glass-card">
            <h3 className="font-display" style={{ fontWeight: 600, marginBottom: 12 }}>Par canal</h3>
            <table className="admin-table">
              <thead><tr><th>Canal</th><th>Nombre</th></tr></thead>
              <tbody>
                {(autoApplyMetrics?.byChannel || []).map(e => (
                  <tr key={e.channel}><td>{e.channel}</td><td>{fmt(e.count)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderTokenomics() {
    return (
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Tokenomique et trésorerie</h2>
        <div className="admin-overview-grid">
          <StatCard label="Total émis" value={`${fmt(tokenomics?.totals?.minted || 0)} BOAT`} />
          <StatCard label="Total dépensé" value={`${fmt(tokenomics?.totals?.spent || 0)} BOAT`} />
          <StatCard label="Offre en circulation" value={`${fmt(tokenomics?.totals?.circulating || 0)} BOAT`} />
          <StatCard label="Valeur fiduciaire" value={`EUR ${fmt(tokenomics?.fiatValue || 0)}`} />
        </div>

        {tokenomics?.packages?.length > 0 && (
          <div className="admin-table-wrap glass-card" style={{ marginTop: 'var(--jb-space-6)' }}>
            <h3 className="font-display" style={{ fontWeight: 600, marginBottom: 12 }}>Forfaits de jetons</h3>
            <table className="admin-table">
              <thead><tr><th>Nom</th><th>Jetons</th><th>Bonus</th><th>Total</th><th>Prix</th></tr></thead>
              <tbody>
                {tokenomics.packages.map(pkg => (
                  <tr key={pkg.id}>
                    <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                    <td>{fmt(pkg.tokens)}</td>
                    <td>{fmt(pkg.bonus_tokens)}</td>
                    <td>{fmt(pkg.total_tokens)}</td>
                    <td>EUR {pkg.price_euros?.toFixed?.(2) ?? pkg.price_euros}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderContent() {
    if (loading) return <div className="admin-loading pulse text-muted">Chargement des données admin...</div>;
    if (error) return (
      <div className="admin-section">
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--jb-space-8)' }}>
          <p style={{ color: 'var(--jb-danger)' }}>{error}</p>
          <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={fetchSnapshot}>Réessayer</button>
        </div>
      </div>
    );
    if (!snapshot) return <div className="admin-section"><p className="text-muted">Aucune donnée disponible.</p></div>;

    switch (activeView) {
      case 'security': return renderSecurity();
      case 'services': return renderServices();
      case 'skills': return renderSkills();
      case 'auto-apply': return renderAutoApply();
      case 'tokenomics': return renderTokenomics();
      default: return renderOverview();
    }
  }

  return (
    <div className="admin-page">
      <div className="page-bg" />

      {/* Header */}
      <header className="admin-header glass-card">
        <div className="admin-header-left">
          <h1 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Centre de commande JobBoat
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--jb-text-xs)' }}>
            Télémetrie en direct et contrôles exécutifs
            {lastUpdated && <span> -- Dernière mise à jour {new Date(lastUpdated).toLocaleTimeString()}</span>}
          </p>
        </div>
        <div className="admin-header-right">
          <button className="btn btn--secondary btn--sm" onClick={() => navigate('/')}>
            Plateforme
          </button>
          <button className="btn btn--primary btn--sm" onClick={fetchSnapshot} disabled={loading}>
            {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
          <button className="btn btn--danger btn--sm" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* View nav */}
      <nav className="admin-views-nav">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={`btn ${activeView === v.id ? 'btn--primary' : 'btn--ghost'} btn--sm`}
            onClick={() => setActiveView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {renderContent()}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="glass-card admin-stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value text-accent">{value}</span>
      {sub && <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>{sub}</span>}
    </div>
  );
}

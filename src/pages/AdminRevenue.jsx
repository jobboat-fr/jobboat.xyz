import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://jobboatv1-production-cb89.up.railway.app';

function getAdminToken() {
  try { return localStorage.getItem('jb_admin_token') || ''; } catch { return ''; }
}

function MetricCard({ label, value, sub, color = '#2d6aa0' }) {
  return (
    <div style={{
      background: '#111827', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12,
      padding: '20px 24px', flex: '1 1 200px',
    }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  async function fetchRevenue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/revenue`, {
        headers: { 'x-admin-token': getAdminToken() },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Revenue fetch failed');
      setData(json);
      setLastRefresh(new Date().toLocaleTimeString('fr-FR'));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => { fetchRevenue(); }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto', color: '#f1f5f9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Revenue Dashboard</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>
            Metriques Stripe en temps reel{lastRefresh ? ` — mis a jour a ${lastRefresh}` : ''}
          </p>
        </div>
        <button
          onClick={fetchRevenue}
          disabled={loading}
          style={{
            background: loading ? '#1e293b' : '#2d6aa0', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 13, fontWeight: 600,
          }}
        >
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 16, marginBottom: 24, color: '#fca5a5', fontSize: 13 }}>
          Erreur: {error}
        </div>
      )}

      {loading && !data && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chargement des donnees Stripe...</div>
      )}

      {data && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <MetricCard label="MRR" value={`${data.mrr} €`} sub="Revenu mensuel recurrent" color="#10b981" />
            <MetricCard label="ARR" value={`${data.arr} €`} sub="Revenu annuel projete" color="#2d6aa0" />
            <MetricCard label="Abonnements actifs" value={data.activeSubscriptions} sub="Stripe status: active" color="#f59e0b" />
            <MetricCard label="En essai" value={data.trialSubscriptions} sub="Stripe status: trialing" color="#8b5cf6" />
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
            <MetricCard label="Annulations (30j)" value={data.canceledThisMonth} sub="Abonnements annules ce mois" color="#ef4444" />
            <MetricCard
              label="Taux conversion essai"
              value={data.trialSubscriptions + data.activeSubscriptions > 0
                ? `${Math.round((data.activeSubscriptions / (data.trialSubscriptions + data.activeSubscriptions)) * 100)}%`
                : 'N/A'}
              sub="Actifs / (Actifs + Essais)"
              color="#06b6d4"
            />
          </div>

          <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.1)', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Repartition par plan</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              {Object.entries(data.planBreakdown || {}).map(([plan, count]) => (
                <div key={plan} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', background: 'rgba(148,163,184,0.04)', borderRadius: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: plan === 'enterprise' ? '#f59e0b' : plan === 'pro' ? '#2d6aa0' : '#64748b' }}>{count}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textTransform: 'capitalize' }}>{plan}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#475569', textAlign: 'right' }}>
            Donnees Stripe en temps reel — genere le {new Date(data.generatedAt).toLocaleString('fr-FR')}
          </div>
        </>
      )}
    </div>
  );
}

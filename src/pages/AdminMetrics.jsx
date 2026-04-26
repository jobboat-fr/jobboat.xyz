import { useState, useEffect, useMemo } from 'react';
import { getApiBase } from '../services/apiClient';
import { getAdminToken } from '../components/AdminProtectedRoute';

function Card({ label, value, sub, color = '#60a5fa', hint }) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid rgba(148,163,184,0.14)',
        borderRadius: 12,
        padding: '18px 22px',
        flex: '1 1 180px',
        minWidth: 180,
      }}
      title={hint || ''}
    >
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DailyBars({ series }) {
  const maxVal = useMemo(() => Math.max(1, ...series.map(d => d.signups)), [series]);
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 140, padding: '8px 4px' }}>
      {series.map((d) => {
        const pctSignups = (d.signups / maxVal) * 100;
        const pctActivated = (d.activated / maxVal) * 100;
        const isToday = d.date === new Date().toISOString().slice(0, 10);
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.signups} signups, ${d.activated} activated`}
            style={{
              flex: 1,
              minWidth: 6,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                background: 'rgba(96, 165, 250, 0.3)',
                height: `${pctSignups}%`,
                minHeight: d.signups ? 3 : 0,
                borderRadius: '2px 2px 0 0',
                position: 'relative',
                border: isToday ? '1px solid #60a5fa' : 'none',
              }}
            >
              <div
                style={{
                  background: '#10b981',
                  height: `${pctActivated && pctSignups ? (pctActivated / pctSignups) * 100 : 0}%`,
                  borderRadius: '2px 2px 0 0',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
}

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return '—';
  }
}

export default function AdminMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  async function fetchMetrics() {
    setLoading(true);
    setError(null);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/admin/cohorts`, {
        headers: { 'x-admin-token': getAdminToken() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'metrics_failed');
      setData(json);
      setLastRefresh(new Date().toLocaleTimeString('fr-FR'));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMetrics();
    const t = setInterval(fetchMetrics, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto', color: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Metrics</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>
            Cohort view of beta performance. Auto-refresh every 60s.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {lastRefresh && (
            <span style={{ color: '#64748b', fontSize: 12 }}>Actualisé à {lastRefresh}</span>
          )}
          <button
            onClick={fetchMetrics}
            disabled={loading}
            style={{
              background: '#1e40af',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: loading ? 'wait' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {loading ? 'Chargement...' : 'Refresh'}
          </button>
          <a
            href="/admin"
            style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}
          >
            ← Admin
          </a>
        </div>
      </div>

      {error && (
        <div style={{ background: '#7f1d1d', color: '#fecaca', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          Erreur: {error}
        </div>
      )}

      {data && (
        <>
          {/* ── KPIs ── */}
          <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <Card
              label="Users totaux"
              value={data.kpis.total_users}
              sub={`+${data.kpis.signups_last_7d} cette semaine`}
              color="#60a5fa"
            />
            <Card
              label="Beta cohort"
              value={data.kpis.beta_users}
              sub="/ 100 places"
              color="#a78bfa"
              hint="Utilisateurs avec is_beta=true. 30 jours illimités."
            />
            <Card
              label="Pro payants"
              value={data.kpis.pro_users}
              sub="Pro / Growth / Enterprise"
              color="#10b981"
            />
            <Card
              label="Candidatures (7j)"
              value={data.kpis.applications_last_7d}
              color="#f59e0b"
            />
            <Card
              label="Autofill events (7j)"
              value={data.kpis.autofill_events_last_7d}
              sub="Extension Chrome"
              color="#ec4899"
            />
          </section>

          {/* ── Activation funnel ── */}
          <section
            style={{
              background: '#0f172a',
              border: '1px solid rgba(148,163,184,0.14)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Activation (30 derniers jours)</h2>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: 'rgba(96,165,250,0.3)', marginRight: 6, borderRadius: 2 }} />
                Signups &nbsp;
                <span style={{ display: 'inline-block', width: 10, height: 10, background: '#10b981', marginLeft: 8, marginRight: 6, borderRadius: 2 }} />
                Activés (≥1 candidature sous 7j)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Signups 30j</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{data.activation.signups_30d}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Activés sous 7j</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{data.activation.activated_within_7d}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>Taux d'activation</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: data.activation.activation_rate_pct >= 30 ? '#10b981' : data.activation.activation_rate_pct >= 15 ? '#f59e0b' : '#ef4444' }}>
                  {data.activation.activation_rate_pct}%
                </div>
              </div>
            </div>
            <DailyBars series={data.daily_series} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#64748b' }}>
              <span>{formatDate(data.daily_series[0]?.date)}</span>
              <span>aujourd'hui →</span>
            </div>
          </section>

          {/* ── Per-user table ── */}
          <section
            style={{
              background: '#0f172a',
              border: '1px solid rgba(148,163,184,0.14)',
              borderRadius: 12,
              padding: 0,
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            <h2 style={{ margin: 0, padding: 16, fontSize: 18, fontWeight: 700, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              20 derniers signups
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#1e293b', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Signup</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Via</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Plan</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>Beta</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Apps</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Coaching</th>
                  </tr>
                </thead>
                <tbody>
                  {data.per_user.map((u) => (
                    <tr key={u.user_id} style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{u.email}</div>
                        {u.name && <div style={{ color: '#64748b', fontSize: 11 }}>{u.name}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{formatDate(u.signed_up)}</td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: 12 }}>{u.auth_provider}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: u.plan === 'free' ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.2)',
                            color: u.plan === 'free' ? '#94a3b8' : '#34d399',
                          }}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {u.is_beta ? '✓' : ''}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: u.apps > 0 ? 700 : 400, color: u.apps > 0 ? '#10b981' : '#64748b' }}>
                        {u.apps}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: u.coaching > 0 ? 700 : 400, color: u.coaching > 0 ? '#60a5fa' : '#64748b' }}>
                        {u.coaching}
                      </td>
                    </tr>
                  ))}
                  {data.per_user.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Aucun signup récent.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Recent autofill telemetry ── */}
          <section
            style={{
              background: '#0f172a',
              border: '1px solid rgba(148,163,184,0.14)',
              borderRadius: 12,
              padding: 0,
              marginBottom: 24,
              overflow: 'hidden',
            }}
          >
            <h2 style={{ margin: 0, padding: 16, fontSize: 18, fontWeight: 700, borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
              Derniers events autofill
            </h2>
            {data.recent_autofill.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Aucun event. Installe l'extension Chrome et remplis un formulaire pour voir apparaître les mesures.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1e293b', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Quand</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Plateforme</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left' }}>Méthode</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Champs</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Durée (ms)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>OK</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_autofill.map((ev, i) => (
                      <tr key={i} style={{ borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{formatDateTime(ev.created_at)}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 500 }}>{ev.platform || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{ev.method || '—'}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{ev.fields_filled}/{ev.fields_found}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{ev.duration_ms}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', color: ev.success ? '#10b981' : '#ef4444' }}>
                          {ev.success ? '✓' : '✗'}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{ev.ai_used ? '🤖' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11, marginTop: 24 }}>
            Source: {getApiBase()}/api/admin/cohorts · Généré {data.generated_at ? new Date(data.generated_at).toLocaleString('fr-FR') : '—'}
          </div>
        </>
      )}
    </div>
  );
}

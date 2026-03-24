import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApiClient';
import './admin.css';

const FILTERS = ['all', 'info', 'warning', 'error'];
const FILTER_LABELS = { all: 'Tous', info: 'Info', warning: 'Avertissement', error: 'Erreur' };

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  async function loadData() {
    await Promise.allSettled([
      adminApi.getLogs().then(d => setLogs(d.logs || [])),
      adminApi.getHealth().then(d => setSystemHealth(d.health || null)),
      adminApi.getQueueStats().then(d => setQueueStats(d.stats || null)),
    ]);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  async function handleToggleMaintenance() {
    try {
      const res = await adminApi.toggleMaintenance(!maintenanceMode);
      setMaintenanceMode(res.maintenanceMode ?? !maintenanceMode);
    } catch { /* ignore */ }
  }

  async function handleClearLogs() {
    if (!window.confirm('Effacer tous les journaux ? Cette action est irréversible.')) return;
    try {
      await adminApi.clearLogs();
      setLogs([]);
    } catch { /* ignore */ }
  }

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  function getHealthColor(val) {
    if (val >= 90) return 'var(--jb-success)';
    if (val >= 70) return 'var(--jb-accent)';
    if (val >= 50) return 'var(--jb-warning)';
    return 'var(--jb-danger)';
  }

  function getLogColor(level) {
    if (level === 'error') return 'var(--jb-danger)';
    if (level === 'warning') return 'var(--jb-warning)';
    return 'var(--jb-accent)';
  }

  return (
    <div className="admin-page">
      <div className="page-bg" />

      <header className="admin-header glass-card">
        <div className="admin-header-left">
          <h1 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700 }}>
            Journaux système & Surveillance
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--jb-text-xs)' }}>
            État, files d'attente et consultation des journaux
          </p>
        </div>
        <div className="admin-header-right">
          <button className="btn btn--secondary btn--sm" onClick={() => navigate('/admin')}>
            Retour au tableau de bord
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--jb-text-xs)', color: 'var(--jb-text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
            Actualisation automatique
          </label>
          <button
            className={`btn btn--sm ${maintenanceMode ? 'btn--danger' : 'btn--secondary'}`}
            onClick={handleToggleMaintenance}
          >
            Maintenance {maintenanceMode ? 'ACTIVÉE' : 'DÉSACTIVÉE'}
          </button>
        </div>
      </header>

      {/* État du système */}
      {systemHealth && (
        <div className="admin-section fade-in-up">
          <h2 className="section-title">État du système</h2>
          <div className="admin-health-grid">
            {Object.entries(systemHealth).map(([key, val]) => (
              <div key={key} className="glass-card admin-health-card">
                <span className="stat-label">{key}</span>
                <div className="admin-health-bar-bg">
                  <div className="admin-health-bar-fill" style={{ width: `${val}%`, background: getHealthColor(val) }} />
                </div>
                <span style={{ fontSize: 'var(--jb-text-xs)', color: getHealthColor(val), fontWeight: 600 }}>
                  {val}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques des files */}
      {queueStats && (
        <div className="admin-section fade-in-up delay-1">
          <h2 className="section-title">Statistiques des files</h2>
          <div className="admin-overview-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="glass-card admin-stat-card">
              <span className="stat-label">En attente</span>
              <span className="stat-value">{queueStats.pending}</span>
            </div>
            <div className="glass-card admin-stat-card">
              <span className="stat-label">En cours</span>
              <span className="stat-value text-accent">{queueStats.processing}</span>
            </div>
            <div className="glass-card admin-stat-card">
              <span className="stat-label">Terminé</span>
              <span className="stat-value" style={{ color: 'var(--jb-success)' }}>{queueStats.completed}</span>
            </div>
            <div className="glass-card admin-stat-card">
              <span className="stat-label">Échoué</span>
              <span className="stat-value" style={{ color: 'var(--jb-danger)' }}>{queueStats.failed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Consultation des journaux */}
      <div className="admin-section fade-in-up delay-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--jb-space-4)' }}>
          <h2 className="section-title">Journaux système</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="admin-log-filters">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`btn btn--sm ${filter === f ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setFilter(f)}
                >
                  {FILTER_LABELS[f] || f}
                </button>
              ))}
            </div>
            <button className="btn btn--danger btn--sm" onClick={handleClearLogs}>Effacer</button>
          </div>
        </div>

        <div className="glass-card admin-log-list">
          {filteredLogs.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--jb-space-8)' }}>
              Aucun journal à afficher.
            </p>
          ) : (
            filteredLogs.map((log, i) => (
              <div key={log.id ?? `${log.timestamp}-${i}`} className="admin-log-entry" style={{ borderLeftColor: getLogColor(log.level) }}>
                <span className="admin-log-time text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                <span className="admin-log-level" style={{ color: getLogColor(log.level) }}>
                  [{log.level?.toUpperCase()}]
                </span>
                <span className="admin-log-message">{log.message}</span>
                {log.details && (
                  <pre className="admin-log-details font-mono">{JSON.stringify(log.details, null, 2)}</pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

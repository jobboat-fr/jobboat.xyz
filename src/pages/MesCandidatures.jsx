import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import DocumentVault from '../components/DocumentVault';
import './mes-candidatures.css';

const STATUS_CONFIG = {
  queued:               { label: 'En file',           color: '#64748b' },
  sent:                 { label: 'Envoyee',           color: '#3b82f6' },
  simulated:            { label: 'Simulee',           color: '#a78bfa' },
  relance_sent:         { label: 'Relancee',          color: '#f59e0b' },
  interview_scheduled:  { label: 'Entretien prevu',   color: '#10b981' },
  interview_confirmed:  { label: 'Entretien confirme', color: '#059669' },
  accepted:             { label: 'Acceptee',          color: '#22c55e' },
  rejected:             { label: 'Refusee',           color: '#ef4444' },
  cancelled:            { label: 'Annulee',           color: '#6b7280' },
  no_response:          { label: 'Sans reponse',      color: '#f97316' },
  archived:             { label: 'Archivee',          color: '#475569' },
  failed:               { label: 'Echec envoi',       color: '#dc2626' },
  permanently_failed:   { label: 'Echec permanent',   color: '#991b1b' },
  skipped:              { label: 'Ignoree',           color: '#94a3b8' },
};

const FILTER_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'active',    label: 'Actives' },
  { key: 'interview', label: 'Entretiens' },
  { key: 'waiting',   label: 'En attente' },
  { key: 'done',      label: 'Terminees' },
];

function filterApps(apps, tab) {
  switch (tab) {
    case 'active':    return apps.filter(a => ['sent', 'relance_sent', 'interview_scheduled', 'interview_confirmed'].includes(a.status));
    case 'interview': return apps.filter(a => ['interview_scheduled', 'interview_confirmed'].includes(a.status));
    case 'waiting':   return apps.filter(a => ['sent', 'relance_sent', 'no_response'].includes(a.status));
    case 'done':      return apps.filter(a => ['accepted', 'rejected', 'cancelled', 'archived'].includes(a.status));
    default:          return apps;
  }
}

export default function MesCandidatures() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState('candidatures'); // 'candidatures' | 'documents'

  useEffect(() => { loadApps(); }, [user]);

  async function loadApps() {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await api.v2Applications(user.email);
      setApps(res.applications || []);
    } catch (e) {
      console.error('[MesCandidatures] Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => filterApps(apps, activeTab), [apps, activeTab]);

  const stats = useMemo(() => {
    const s = { total: apps.length, active: 0, interviews: 0, accepted: 0 };
    for (const a of apps) {
      if (['sent', 'relance_sent', 'interview_scheduled', 'interview_confirmed'].includes(a.status)) s.active++;
      if (['interview_scheduled', 'interview_confirmed'].includes(a.status)) s.interviews++;
      if (a.status === 'accepted') s.accepted++;
    }
    return s;
  }, [apps]);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUpdateStatus(appId, newStatus) {
    setActionLoading(appId);
    try {
      await api.v2UpdateApplication(appId, { status: newStatus });
      showToast(`Statut mis a jour : ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      await loadApps();
      if (selectedApp?.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (e) {
      showToast(`Erreur : ${e.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRelance(appId) {
    setActionLoading(appId);
    try {
      const res = await api.v2RelanceApplication(appId, { user_name: user?.name || user?.email?.split('@')[0] || 'Candidat' });
      if (res.success) {
        showToast(`Relance #${res.relance_count} envoyee${res.simulated ? ' (simulee)' : ''}`);
      } else {
        showToast(res.error || 'Erreur relance', 'error');
      }
      await loadApps();
    } catch (e) {
      showToast(`Erreur : ${e.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel(appId) {
    if (!confirm('Annuler cette candidature ?')) return;
    setActionLoading(appId);
    try {
      await api.v2CancelApplication(appId);
      showToast('Candidature annulee');
      await loadApps();
      setSelectedApp(null);
    } catch (e) {
      showToast(`Erreur : ${e.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleScheduleInterview(appId) {
    const dateStr = prompt('Date de l\'entretien (AAAA-MM-JJ HH:MM) :');
    if (!dateStr) return;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) { showToast('Date invalide', 'error'); return; }
    setActionLoading(appId);
    try {
      await api.v2UpdateApplication(appId, { status: 'interview_scheduled', interview_date: d.toISOString() });
      showToast('Entretien programme !');
      await loadApps();
    } catch (e) {
      showToast(`Erreur : ${e.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddNotes(appId) {
    const notes = prompt('Ajouter une note :');
    if (!notes) return;
    try {
      await api.v2UpdateApplication(appId, { notes });
      showToast('Note ajoutee');
      await loadApps();
    } catch (e) {
      showToast(`Erreur : ${e.message}`, 'error');
    }
  }

  function goToCoaching(app) {
    navigate('/coaching', { state: { applicationContext: { job_title: app.job_title, company: app.company, status: app.status, interview_date: app.interview_date } } });
  }

  const cfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.sent;

  return (
    <div className="mc">
      {/* Toast */}
      {toast && (
        <div className={`mc-toast mc-toast--${toast.type}`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="mc-header">
        <div>
          <h1 className="mc-title">Mes Candidatures</h1>
          <p className="mc-subtitle">Suivi et gestion de toutes tes candidatures</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="mc-view-toggle">
            <button className={`mc-view-btn ${view === 'candidatures' ? 'mc-view-btn--active' : ''}`} onClick={() => setView('candidatures')}>Candidatures</button>
            <button className={`mc-view-btn ${view === 'documents' ? 'mc-view-btn--active' : ''}`} onClick={() => setView('documents')}>Documents</button>
          </div>
          {view === 'candidatures' && (
            <button className="mc-btn mc-btn--primary" onClick={() => navigate('/auto-apply')}>+ Nouvelle candidature</button>
          )}
        </div>
      </div>

      {view === 'documents' ? (
        <DocumentVault />
      ) : (
      <>

      {/* Stats */}
      <div className="mc-stats">
        <div className="mc-stat">
          <span className="mc-stat__value">{stats.total}</span>
          <span className="mc-stat__label">Total</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat__value" style={{ color: '#3b82f6' }}>{stats.active}</span>
          <span className="mc-stat__label">Actives</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat__value" style={{ color: '#10b981' }}>{stats.interviews}</span>
          <span className="mc-stat__label">Entretiens</span>
        </div>
        <div className="mc-stat">
          <span className="mc-stat__value" style={{ color: '#22c55e' }}>{stats.accepted}</span>
          <span className="mc-stat__label">Acceptees</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mc-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            className={`mc-tab ${activeTab === tab.key ? 'mc-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="mc-tab__count">{filterApps(apps, tab.key).length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Application list */}
      {loading ? (
        <div className="mc-loading">Chargement des candidatures...</div>
      ) : filtered.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty__icon">--</div>
          <h3>Aucune candidature {activeTab !== 'all' ? 'dans cette categorie' : ''}</h3>
          <p>Lance ta premiere candidature depuis l'onglet Auto-Apply</p>
          <button className="mc-btn mc-btn--primary" onClick={() => navigate('/auto-apply')} style={{ marginTop: 16 }}>
            Commencer
          </button>
        </div>
      ) : (
        <div className="mc-list">
          {filtered.map(app => {
            const c = cfg(app.status);
            const isSelected = selectedApp?.id === app.id;
            return (
              <div key={app.id} className={`mc-card ${isSelected ? 'mc-card--selected' : ''}`} onClick={() => setSelectedApp(isSelected ? null : app)}>
                <div className="mc-card__main">
                  <div className="mc-card__icon" style={{ background: c.color + '18', color: c.color }}>{c.label.charAt(0)}</div>
                  <div className="mc-card__info">
                    <div className="mc-card__title">{app.job_title || 'Poste non specifie'}</div>
                    <div className="mc-card__company">{app.company || 'Entreprise inconnue'}</div>
                    <div className="mc-card__meta">
                      {app.applied_at && <span>{new Date(app.applied_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {app.channel && <span className="mc-card__channel">{app.channel}</span>}
                      {app.relance_count > 0 && <span className="mc-card__relance">Relance x{app.relance_count}</span>}
                    </div>
                  </div>
                  <div className="mc-card__status" style={{ '--status-color': c.color }}>
                    <span className="mc-card__badge">{c.label}</span>
                  </div>
                </div>

                {/* Expanded actions */}
                {isSelected && (
                  <div className="mc-card__actions" onClick={e => e.stopPropagation()}>
                    {app.interview_date && (
                      <div className="mc-card__interview">
                        Entretien : {new Date(app.interview_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    {app.notes && (
                      <div className="mc-card__notes">{app.notes}</div>
                    )}
                    <div className="mc-card__btns">
                      {['sent', 'relance_sent', 'no_response'].includes(app.status) && (
                        <>
                          <button className="mc-btn mc-btn--sm mc-btn--accent" onClick={() => handleRelance(app.id)} disabled={actionLoading === app.id}>
                            Relancer
                          </button>
                          <button className="mc-btn mc-btn--sm mc-btn--success" onClick={() => handleScheduleInterview(app.id)} disabled={actionLoading === app.id}>
                            Entretien
                          </button>
                          <button className="mc-btn mc-btn--sm" onClick={() => handleUpdateStatus(app.id, 'no_response')} disabled={actionLoading === app.id}>
                            Sans reponse
                          </button>
                        </>
                      )}
                      {['interview_scheduled'].includes(app.status) && (
                        <>
                          <button className="mc-btn mc-btn--sm mc-btn--success" onClick={() => handleUpdateStatus(app.id, 'interview_confirmed')} disabled={actionLoading === app.id}>
                            Confirmer
                          </button>
                          <button className="mc-btn mc-btn--sm mc-btn--coach" onClick={() => goToCoaching(app)}>
                            Preparer avec le coach
                          </button>
                        </>
                      )}
                      {['interview_confirmed'].includes(app.status) && (
                        <>
                          <button className="mc-btn mc-btn--sm mc-btn--success" onClick={() => handleUpdateStatus(app.id, 'accepted')} disabled={actionLoading === app.id}>
                            Acceptee
                          </button>
                          <button className="mc-btn mc-btn--sm mc-btn--danger" onClick={() => handleUpdateStatus(app.id, 'rejected')} disabled={actionLoading === app.id}>
                            Refusee
                          </button>
                          <button className="mc-btn mc-btn--sm mc-btn--coach" onClick={() => goToCoaching(app)}>
                            Preparer avec le coach
                          </button>
                        </>
                      )}
                      <button className="mc-btn mc-btn--sm" onClick={() => handleAddNotes(app.id)}>Note</button>
                      {!['cancelled', 'archived', 'accepted', 'rejected'].includes(app.status) && (
                        <button className="mc-btn mc-btn--sm mc-btn--danger" onClick={() => handleCancel(app.id)} disabled={actionLoading === app.id}>
                          Annuler
                        </button>
                      )}
                      {['accepted', 'rejected', 'cancelled'].includes(app.status) && (
                        <button className="mc-btn mc-btn--sm" onClick={() => handleUpdateStatus(app.id, 'archived')} disabled={actionLoading === app.id}>
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
}

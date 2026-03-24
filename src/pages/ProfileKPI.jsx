import { useEffect, useMemo, useState, useCallback } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { createDimensionTracker } from '../services/ewma';
import { api } from '../services/apiClient';
import ScoreAlgorithmPanel from '../components/ScoreAlgorithmPanel';
import './profilekpi.css';

const DIMS = ['technical', 'communication', 'motivation', 'adaptability', 'leadership', 'cultural_fit'];
const LABELS = {
  technical: 'Technique',
  communication: 'Communication',
  motivation: 'Motivation',
  adaptability: 'Adaptabilite',
  leadership: 'Leadership',
  cultural_fit: 'Adequation Culturelle',
};

export default function ProfileKPI() {
  const { user } = useAuth();
  const [ewmaData, setEwmaData] = useState(null);
  const [history, setHistory] = useState([]);
  const [kpiOverview, setKpiOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAlgo, setShowAlgo] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Primary: load from DB via API
        const [ewmaRes, kpiRes] = await Promise.allSettled([
          api.v2CoachingEwma(),
          api.v2KpiOverview(user?.email || '')
        ]);

        if (ewmaRes.status === 'fulfilled' && ewmaRes.value?.scores) {
          setEwmaData(ewmaRes.value.scores);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem('jobboat_ewma');
          if (saved) {
            try {
              const tracker = createDimensionTracker();
              tracker.fromJSON(JSON.parse(saved));
              setEwmaData(tracker.getAll());
            } catch { /* ignore */ }
          }
        }

        if (kpiRes.status === 'fulfilled' && kpiRes.value) {
          setKpiOverview(kpiRes.value);
          if (Array.isArray(kpiRes.value.ewma_history)) {
            setHistory(kpiRes.value.ewma_history);
          }
        } else {
          // Fallback: load coaching history from localStorage
          const hist = localStorage.getItem('jobboat_coaching_history');
          if (hist) {
            try { setHistory(JSON.parse(hist)); } catch { /* ignore */ }
          }
        }
      } catch (_e) {
        // Last-resort fallback
        const saved = localStorage.getItem('jobboat_ewma');
        if (saved) {
          try {
            const tracker = createDimensionTracker();
            tracker.fromJSON(JSON.parse(saved));
            setEwmaData(tracker.getAll());
          } catch { /* ignore */ }
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.email]);

  // Radar data
  const radarData = useMemo(() => {
    if (!ewmaData) return DIMS.map(d => ({ dimension: LABELS[d], value: 0 }));
    return DIMS.map(d => ({
      dimension: LABELS[d],
      value: Math.round((ewmaData[d]?.value ?? 0) * 100),
    }));
  }, [ewmaData]);

  const overallScore = useMemo(() => {
    if (!ewmaData) return 0;
    const vals = DIMS.map(d => ewmaData[d]?.value ?? 0);
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
  }, [ewmaData]);

  // Progression data from real coaching history only
  const progressionData = useMemo(() => {
    if (history.length > 0) return history;
    return [];
  }, [history]);

  const algoScores = useMemo(() => {
    if (!ewmaData) return {};
    const s = {};
    Object.entries(ewmaData).forEach(([k, v]) => { s[k] = Math.round((v?.value ?? 0) * 100); });
    if (kpiOverview?.login_streak) s.reliability = Math.min(100, (kpiOverview.login_streak || 0) * 12);
    if (kpiOverview?.applications_total) s.motivation_drive = Math.min(100, (kpiOverview.applications_total || 0) * 8);
    if (kpiOverview?.coaching_sessions_total) s.learning_mindset = Math.min(100, (kpiOverview.coaching_sessions_total || 0) * 10);
    return s;
  }, [ewmaData, kpiOverview]);

  return (
    <div className="profile-kpi">
      <div className="profile-kpi__header fade-in-up">
        <div>
          <h2 className="section-title">Profil & Indicateurs</h2>
          <p className="section-subtitle">
            Suivez votre evolution sur toutes les dimensions. Metriques adaptatives basees sur EWMA.
          </p>
        </div>
        <button
          onClick={() => setShowAlgo(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: showAlgo ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#a5b4fc', fontSize: 13, fontWeight: 600, transition: 'all 0.2s' }}
        >
          <span style={{ fontSize: 15 }}>⚡</span>
          {showAlgo ? 'Masquer le calcul' : 'Voir le calcul détaillé'}
        </button>
      </div>

      {/* User Card */}
      <div className="profile-kpi__user-card glass-card fade-in-up delay-1">
        <div className="profile-kpi__avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-kpi__user-info">
          <h3 className="font-display" style={{ fontWeight: 700, fontSize: 'var(--jb-text-xl)' }}>
            {user?.name || 'Navigator'}
          </h3>
          <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)' }}>
            {user?.email || '--'}
          </p>
        </div>
        <div className="profile-kpi__overall">
          <span className="stat-label">Score Global</span>
          <span className="stat-value text-accent" style={{ fontSize: 'var(--jb-text-5xl)' }}>{overallScore}</span>
        </div>
      </div>

      <div className="profile-kpi__grid fade-in-up delay-2">
        {/* Radar Chart */}
        <div className="glass-card profile-kpi__chart-card">
          <h4 className="font-display" style={{ fontWeight: 600, marginBottom: 16 }}>Scoring Multi-Dimensions</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid stroke="rgba(148,163,184,0.12)" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#2d6aa0"
                  fill="rgba(45,106,160,0.15)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progression Chart */}
        <div className="glass-card profile-kpi__chart-card">
          <h4 className="font-display" style={{ fontWeight: 600, marginBottom: 16 }}>Progression du Score</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <AreaChart data={progressionData}>
                <CartesianGrid stroke="rgba(148,163,184,0.08)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={v => v ? String(v).slice(5) : ''}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#2d6aa0"
                  fill="url(#scoreGrad)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2d6aa0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2d6aa0" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Dimension details */}
      <div className="profile-kpi__dims fade-in-up delay-3">
        <h3 className="section-title" style={{ fontSize: 'var(--jb-text-lg)', marginBottom: 'var(--jb-space-4)' }}>
          Repartition des Dimensions
        </h3>
        <div className="profile-kpi__dims-grid">
          {DIMS.map(d => {
            const val = ewmaData ? Math.round((ewmaData[d]?.value ?? 0) * 100) : 0;
            const obs = ewmaData ? (ewmaData[d]?.observations ?? 0) : 0;
            return (
              <div key={d} className="glass-card profile-kpi__dim-card">
                <div className="profile-kpi__dim-header">
                  <span className="profile-kpi__dim-label">{LABELS[d]}</span>
                  <span className="font-mono" style={{ color: 'var(--jb-accent)', fontWeight: 600 }}>{val}</span>
                </div>
                <div className="coaching__ewma-bar">
                  <div className="coaching__ewma-bar-fill" style={{ width: `${val}%` }} />
                </div>
                <span className="text-muted" style={{ fontSize: '0.65rem' }}>{obs} observations</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Algorithm Breakdown Panel */}
      {showAlgo && (
        <div className="fade-in-up" style={{ marginTop: 'var(--jb-space-5)' }}>
          <ScoreAlgorithmPanel
            scores={algoScores}
            isLoading={false}
            context="coaching"
            onClose={() => setShowAlgo(false)}
          />
        </div>
      )}
    </div>
  );
}

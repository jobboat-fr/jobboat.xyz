/**
 * MyReadiness — B2C page where the candidate sees:
 *   - their latest readiness assessment (6-axis score)
 *   - matches addressed to them (shared algorithm transparency)
 *   - a button to (re)run the assessment from their profile
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import ScoreBreakdownBar from '../components/matching/ScoreBreakdownBar';

const LEVEL_COLORS = {
  SENIOR_READY:        '#34d399',
  SEMI_SENIOR_READY:   '#60a5fa',
  JUNIOR_READY:        '#fbbf24',
  ENTRY_LEVEL_READY:   '#fb923c',
  NEEDS_DEVELOPMENT:   '#f87171',
};

const SCORE_AXES = [
  { key: 'technical',  label: 'Technique' },
  { key: 'business',   label: 'Business' },
  { key: 'soft',       label: 'Soft skills' },
  { key: 'experience', label: 'Expérience' },
  { key: 'portfolio',  label: 'Portfolio' },
  { key: 'growth',     label: 'Croissance' },
];

function ScoreAxisBar({ label, score = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{pct.toFixed(0)}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(148,163,184,0.12)', borderRadius: 4, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171',
            transition: 'width 400ms ease',
          }}
        />
      </div>
    </div>
  );
}

export default function MyReadiness() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readiness, setReadiness] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [r, m] = await Promise.all([
        api.v2MatchingMyReadiness(),
        api.v2MatchingMyMatches(),
      ]);
      setReadiness(r?.readiness || null);
      setMatches(m?.matches || []);
    } catch (err) {
      setError(err.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runAssessment() {
    if (running) return;
    setRunning(true);
    setError('');
    try {
      // Pull profile to feed the assessment with real signals.
      const profileRes = await api.v2GetProfile(user?.email || '').catch(() => null);
      const profile = profileRes?.profile || {};
      const candidateData = {
        name: user?.name || user?.email || 'Candidat',
        skills: profile.skills || profile.tags || [],
        yearsExperience: profile.years_experience || 0,
        rolesHeld: profile.roles_held || [],
        companiesWorked: profile.companies_worked || [],
        achievements: profile.achievements || [],
        portfolio: profile.portfolio || [],
        certifications: profile.certifications || [],
      };
      const res = await api.v2MatchingAssess(candidateData);
      if (res?.success === false) throw new Error(res.error || 'assess_failed');
      await load();
    } catch (err) {
      setError(err.message || 'Évaluation impossible.');
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return <div style={{ padding: 32, color: '#94a3b8' }}>Chargement…</div>;
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, color: '#f1f5f9', marginBottom: 4 }}>Mon profil de carrière</h1>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Évaluation IA de votre niveau, opportunités matchées et personas recommandés.
          </p>
        </div>
        <button
          onClick={runAssessment}
          disabled={running}
          style={{
            padding: '10px 18px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: running ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: 14,
            opacity: running ? 0.7 : 1,
          }}
        >
          {running ? 'Évaluation…' : readiness ? 'Réévaluer' : 'Lancer l\u2019évaluation'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#fca5a5', marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!readiness && (
        <div style={{ padding: 24, background: '#0f172a', border: '1px dashed rgba(148,163,184,0.2)', borderRadius: 12, textAlign: 'center', color: '#94a3b8' }}>
          Vous n'avez pas encore d'évaluation. Lancez la première pour découvrir votre niveau et vos matches.
        </div>
      )}

      {readiness && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                Score global
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, color: '#f1f5f9' }}>
                {Number(readiness.overall_score).toFixed(0)}
                <span style={{ fontSize: 18, color: '#64748b', fontWeight: 500 }}> / 100</span>
              </div>
              <div style={{
                marginTop: 8,
                fontSize: 12,
                fontWeight: 600,
                color: LEVEL_COLORS[readiness.readiness_level] || '#94a3b8',
              }}>
                {readiness.readiness_level?.replace(/_/g, ' ')}
              </div>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: 20, gridColumn: 'span 2' }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                Détail par axe
              </div>
              {SCORE_AXES.map((a) => (
                <ScoreAxisBar key={a.key} label={a.label} score={readiness.scores?.[a.key]} />
              ))}
            </div>
          </div>

          {readiness.recommendation && (
            <div style={{ padding: 16, background: '#0f172a', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                Recommandation
              </div>
              <div style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 6 }}>
                {readiness.recommendation.message}
              </div>
              {readiness.recommendation.jobTitles?.length > 0 && (
                <div style={{ fontSize: 13, color: '#cbd5e1' }}>
                  Postes ciblés: {readiness.recommendation.jobTitles.join(', ')}
                </div>
              )}
              {readiness.recommendation.salary_range && (
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                  Fourchette de salaire indicative: {readiness.recommendation.salary_range}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <h2 style={{ fontSize: 18, color: '#f1f5f9', marginBottom: 12, marginTop: 8 }}>
        Opportunités matchées ({matches.length})
      </h2>
      {matches.length === 0 ? (
        <div style={{ padding: 16, color: '#64748b', fontSize: 13 }}>
          Aucune opportunité ne vous a encore été matchée. Les recruteurs partenaires utilisent l'algorithme pour trouver les bons candidats.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {matches.map((m) => (
            <div key={m.id} style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>
                    {m.job_snapshot?.title || 'Poste'} <span style={{ color: '#64748b', fontWeight: 400 }}>· {m.job_snapshot?.company}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Persona: <strong>{m.persona_id}</strong> · Étape: <strong>{m.funnel_stage}</strong>
                  </div>
                </div>
                <span style={{
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: 'rgba(96,165,250,0.15)',
                  color: '#60a5fa',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {Number(m.match_score).toFixed(0)}%
                </span>
              </div>
              <ScoreBreakdownBar score={m.match_score} breakdown={m.score_breakdown} />
              {m.outreach_message && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(148,163,184,0.06)', borderRadius: 8, fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' }}>
                  « {m.outreach_message} »
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={async () => {
                    try { await api.v2MatchingFunnel(m.id, { candidate_response: 'interested', funnel_stage: 'interest' }); load(); } catch {}
                  }}
                  style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  Intéressé
                </button>
                <button
                  onClick={async () => {
                    try { await api.v2MatchingFunnel(m.id, { candidate_response: 'declined', funnel_stage: 'declined' }); load(); } catch {}
                  }}
                  style={{ padding: '6px 12px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                >
                  Pas pour moi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

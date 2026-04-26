/**
 * AdminRecruiter — B2B page where a recruiter (or admin) can:
 *   1. Type a candidate email + paste/build a job spec.
 *   2. Run the matching pipeline (POST /api/v2/matching/match).
 *   3. See the algorithm output (same ScoreBreakdownBar as B2C).
 *   4. Track funnel stages on existing matches.
 *
 * Protected by AdminProtectedRoute for now; future iteration can add a
 * dedicated recruiter role guard once user.role = 'recruiter' is set.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import ScoreBreakdownBar from '../components/matching/ScoreBreakdownBar';

const FUNNEL_NEXT = {
  awareness: 'interest',
  interest: 'consideration',
  consideration: 'decision',
  decision: 'hired',
};

const EMPTY_JOB = { title: '', company: '', requiredSkills: '', yearsExperienceRequired: 2, level: 'JUNIOR_READY', salary: '' };

export default function AdminRecruiter() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const [candidateEmail, setCandidateEmail] = useState('');
  const [jobs, setJobs] = useState([{ ...EMPTY_JOB }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.v2MatchingRecruiterMatches();
      setMatches(res?.matches || []);
    } catch (err) {
      setError(err.message || 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateJob(idx, field, value) {
    setJobs((prev) => prev.map((j, i) => (i === idx ? { ...j, [field]: value } : j)));
  }

  function addJob() {
    setJobs((prev) => [...prev, { ...EMPTY_JOB }]);
  }

  function removeJob(idx) {
    setJobs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runMatch() {
    if (!candidateEmail) {
      setError('Email du candidat requis.');
      return;
    }
    if (jobs.length === 0) {
      setError('Au moins un poste requis.');
      return;
    }
    setRunning(true);
    setError('');
    try {
      const payload = {
        candidateEmail: candidateEmail.toLowerCase().trim(),
        jobs: jobs.map((j, i) => ({
          id: `j${i + 1}`,
          title: j.title,
          company: j.company,
          requiredSkills: String(j.requiredSkills || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          yearsExperienceRequired: Number(j.yearsExperienceRequired) || 0,
          level: j.level,
          salary: j.salary ? Number(j.salary) : undefined,
        })),
      };
      const res = await api.v2MatchingMatch(payload);
      if (res?.success === false) throw new Error(res.error || 'match_failed');
      await load();
    } catch (err) {
      setError(err.message || 'Match impossible.');
    } finally {
      setRunning(false);
    }
  }

  async function advanceFunnel(matchId, currentStage) {
    const next = FUNNEL_NEXT[currentStage];
    if (!next) return;
    try {
      await api.v2MatchingFunnel(matchId, { funnel_stage: next });
      load();
    } catch (err) {
      setError(err.message || 'Update funnel impossible.');
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh', background: '#020617', color: '#f1f5f9' }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Recruteur — Matching</h1>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
        Matchez un candidat à des opportunités. L'algorithme produit le score, le persona optimal et un message d'outreach.
      </p>

      {error && (
        <div style={{ padding: 12, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#fca5a5', marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* RUN MATCH FORM */}
      <div style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Nouveau match</h2>

        <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Email du candidat</label>
        <input
          type="email"
          value={candidateEmail}
          onChange={(e) => setCandidateEmail(e.target.value)}
          placeholder="alex@example.com"
          style={{ width: '100%', maxWidth: 400, padding: '8px 12px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', marginBottom: 16, fontSize: 14 }}
        />

        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Postes à matcher ({jobs.length})</span>
        </div>

        {jobs.map((job, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px 130px 100px 30px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              placeholder="Titre" value={job.title}
              onChange={(e) => updateJob(idx, 'title', e.target.value)}
              style={{ padding: '6px 10px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', fontSize: 13 }}
            />
            <input
              placeholder="Entreprise" value={job.company}
              onChange={(e) => updateJob(idx, 'company', e.target.value)}
              style={{ padding: '6px 10px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', fontSize: 13 }}
            />
            <input
              placeholder="Skills (virgule)" value={job.requiredSkills}
              onChange={(e) => updateJob(idx, 'requiredSkills', e.target.value)}
              style={{ padding: '6px 10px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', fontSize: 13 }}
            />
            <input
              type="number" placeholder="Yrs" value={job.yearsExperienceRequired}
              onChange={(e) => updateJob(idx, 'yearsExperienceRequired', e.target.value)}
              style={{ padding: '6px 10px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', fontSize: 13 }}
            />
            <select
              value={job.level}
              onChange={(e) => updateJob(idx, 'level', e.target.value)}
              style={{ padding: '6px 10px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', fontSize: 13 }}
            >
              <option value="ENTRY_LEVEL">Entry</option>
              <option value="JUNIOR_READY">Junior</option>
              <option value="SEMI_SENIOR_READY">Semi-senior</option>
              <option value="SENIOR_READY">Senior</option>
            </select>
            <input
              type="number" placeholder="Salaire" value={job.salary}
              onChange={(e) => updateJob(idx, 'salary', e.target.value)}
              style={{ padding: '6px 10px', background: '#020617', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6, color: '#f1f5f9', fontSize: 13 }}
            />
            <button
              onClick={() => removeJob(idx)}
              disabled={jobs.length === 1}
              style={{ padding: '4px 8px', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 6, color: '#f87171', cursor: jobs.length === 1 ? 'not-allowed' : 'pointer', fontSize: 14, opacity: jobs.length === 1 ? 0.4 : 1 }}
              title="Supprimer ce poste"
            >×</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={addJob}
            style={{ padding: '8px 14px', background: 'transparent', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
          >+ Ajouter un poste</button>
          <button
            onClick={runMatch}
            disabled={running || !candidateEmail}
            style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: running ? 'wait' : 'pointer', fontWeight: 600, fontSize: 13, opacity: (running || !candidateEmail) ? 0.6 : 1 }}
          >
            {running ? 'Matching…' : 'Lancer le match'}
          </button>
        </div>
      </div>

      {/* MATCHES LIST */}
      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Mes matches récents ({matches.length})</h2>
      {loading ? (
        <div style={{ color: '#94a3b8' }}>Chargement…</div>
      ) : matches.length === 0 ? (
        <div style={{ padding: 16, color: '#64748b', fontSize: 13 }}>Aucun match pour le moment.</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {matches.map((m) => (
            <div key={m.id} style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.14)', borderRadius: 12, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {m.job_snapshot?.title} <span style={{ color: '#64748b', fontWeight: 400 }}>· {m.job_snapshot?.company}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Persona: <strong>{m.persona_id}</strong> · Étape: <strong>{m.funnel_stage}</strong>
                    {m.candidate_response && <> · Réponse: <strong>{m.candidate_response}</strong></>}
                  </div>
                </div>
                <span style={{ padding: '3px 9px', borderRadius: 999, background: 'rgba(96,165,250,0.15)', color: '#60a5fa', fontSize: 11, fontWeight: 600 }}>
                  {Number(m.match_score).toFixed(0)}%
                </span>
              </div>
              <ScoreBreakdownBar score={m.match_score} breakdown={m.score_breakdown} />
              {m.outreach_message && (
                <div style={{ marginTop: 12, padding: 10, background: 'rgba(148,163,184,0.06)', borderRadius: 8, fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' }}>
                  « {m.outreach_message} »
                </div>
              )}
              {FUNNEL_NEXT[m.funnel_stage] && (
                <button
                  onClick={() => advanceFunnel(m.id, m.funnel_stage)}
                  style={{ marginTop: 12, padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >
                  Passer à « {FUNNEL_NEXT[m.funnel_stage]} »
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

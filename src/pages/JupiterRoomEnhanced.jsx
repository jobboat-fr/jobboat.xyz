import { useState, useCallback, useRef } from 'react';
import { api } from '../services/apiClient';
import ConversationEngine from '../components/ConversationEngine';

const LEVELS = [
  { value: 'junior', label: 'Junior (0-2 ans)' },
  { value: 'early',  label: 'Early (2-4 ans)' },
  { value: 'mid',    label: 'Mid (4-7 ans)' },
  { value: 'senior', label: 'Senior (7+ ans)' },
  { value: 'manager',label: 'Manager / Lead' },
];

const SETUP_CHIPS = [
  'Développeur React', 'Product Manager', 'Data Analyst',
  'DevOps Engineer', 'UX Designer', 'Chef de projet'
];

export default function JupiterRoomEnhanced() {
  const [phase, setPhase] = useState('setup'); // setup | interview | feedback
  const [targetRole, setTargetRole] = useState('');
  const [level, setLevel] = useState('mid');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [error, setError] = useState('');

  const historyRef = useRef([]);

  async function handleStart() {
    if (!targetRole.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.v2JupiterSession({ target_role: targetRole.trim(), level });
      if (!res.success) throw new Error(res.error || 'Erreur serveur');
      setSessionId(res.sessionId);
      const greetMsg = { role: 'assistant', content: res.greeting, id: `a-${Date.now()}`, ts: Date.now() };
      setMessages([greetMsg]);
      historyRef.current = [{ role: 'assistant', content: res.greeting }];
      setPhase('interview');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSend = useCallback(async (text) => {
    const userMsg = { role: 'user', content: text, id: `u-${Date.now()}`, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    historyRef.current = [...historyRef.current, { role: 'user', content: text }];
    setLoading(true);

    try {
      const res = await api.v2JupiterMessage({
        session_id: sessionId,
        message: text,
        target_role: targetRole,
        level,
        conversation_history: historyRef.current.slice(-10),
        question_index: questionIndex
      });

      const aiMsg = { role: 'assistant', content: res.response || '…', id: `a-${Date.now()}`, ts: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      historyRef.current = [...historyRef.current, { role: 'assistant', content: res.response }];
      setQuestionIndex(res.question_index || questionIndex + 1);

      if (res.is_complete) {
        await loadFeedback();
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: `Erreur: ${err.message}`, id: `s-${Date.now()}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, targetRole, level, questionIndex]);

  async function loadFeedback() {
    setFeedbackLoading(true);
    setPhase('feedback');
    try {
      const res = await api.v2JupiterFeedback({
        target_role: targetRole,
        conversation_history: historyRef.current,
        level
      });
      if (res.success) setFeedback(res.feedback);
    } catch (_e) {
      setFeedback({ overall: 0.7, summary: 'Évaluation non disponible.' });
    } finally {
      setFeedbackLoading(false);
    }
  }

  function restart() {
    setPhase('setup');
    setMessages([]);
    setSessionId(null);
    setQuestionIndex(0);
    setFeedback(null);
    setError('');
    historyRef.current = [];
  }

  const progress = Math.min(100, Math.round((questionIndex / 6) * 100));

  /* ── SETUP PHASE ── */
  if (phase === 'setup') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              background: 'linear-gradient(135deg, var(--jb-neon-blue,#4f9eff), var(--jb-neon-violet,#8b5cf6))',
              borderRadius: 10, padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em'
            }}>JOBBY MIND</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--jb-text-muted)', background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px' }}>BETA</span>
          </div>
          <h2 className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Jupiter Room</h2>
          <p style={{ color: 'var(--jb-text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Simulateur d'entretien IA avec scoring STAR et rapport personnalisé.
          </p>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--jb-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Poste cible
          </label>
          <input
            className="input"
            placeholder="Ex: Développeur React Senior"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            style={{ width: '100%', marginBottom: 10 }}
            autoFocus
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {SETUP_CHIPS.map(chip => (
              <button key={chip} onClick={() => setTargetRole(chip)} style={{
                padding: '3px 10px', fontSize: '0.76rem', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 99, background: 'transparent', color: 'var(--jb-text-muted)', cursor: 'pointer',
                transition: 'all 0.15s'
              }} onMouseEnter={e => { e.target.style.borderColor = 'var(--jb-neon-blue)'; e.target.style.color = 'white'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = 'var(--jb-text-muted)'; }}>
                {chip}
              </button>
            ))}
          </div>

          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--jb-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Niveau d'expérience
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {LEVELS.map(l => (
              <button key={l.value} onClick={() => setLevel(l.value)} style={{
                padding: '6px 14px', fontSize: '0.82rem', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                border: level === l.value ? '1.5px solid var(--jb-neon-blue)' : '1.5px solid rgba(255,255,255,0.1)',
                background: level === l.value ? 'rgba(79,158,255,0.15)' : 'transparent',
                color: level === l.value ? 'var(--jb-neon-blue)' : 'var(--jb-text-muted)',
                fontWeight: level === l.value ? 600 : 400,
              }}>
                {l.label}
              </button>
            ))}
          </div>

          {error && <p style={{ color: '#f87171', fontSize: '0.82rem', marginBottom: 12 }}>{error}</p>}

          <button
            className="btn btn--primary"
            onClick={handleStart}
            disabled={loading || !targetRole.trim()}
            style={{ width: '100%', fontSize: '0.9rem', padding: '11px 0' }}
          >
            {loading ? 'Connexion au recruteur IA…' : '▶ Démarrer l\'entretien'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--jb-text-muted)', marginTop: 16 }}>
          6 questions · Méthode STAR · Rapport IA personnalisé
        </p>
      </div>
    );
  }

  /* ── FEEDBACK PHASE ── */
  if (phase === 'feedback') {
    const scoreToColor = (s) => s >= 0.75 ? '#22c55e' : s >= 0.5 ? '#f59e0b' : '#f87171';
    const scoreToLabel = (s) => s >= 0.75 ? 'Excellent' : s >= 0.5 ? 'Bien' : 'À améliorer';

    return (
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `conic-gradient(var(--jb-neon-blue) ${Math.round((feedback?.overall || 0.7) * 360)}deg, rgba(255,255,255,0.08) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--jb-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, color: 'var(--jb-neon-blue)' }}>
              {feedbackLoading ? '…' : `${Math.round((feedback?.overall || 0.7) * 100)}%`}
            </div>
          </div>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.4rem', marginBottom: 2 }}>Rapport d'entretien</h2>
            <p style={{ color: 'var(--jb-text-muted)', fontSize: '0.85rem' }}>{targetRole} · {LEVELS.find(l => l.value === level)?.label}</p>
          </div>
        </div>

        {feedbackLoading ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--jb-text-muted)' }}>
            Analyse en cours par Jobby Mind…
          </div>
        ) : feedback ? (
          <>
            {['communication', 'structure', 'content', 'job_fit'].map(key => {
              const score = feedback[key] || 0;
              return (
                <div key={key} className="glass-card" style={{ padding: '14px 18px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>
                      {key === 'job_fit' ? 'Adéquation poste' : key === 'structure' ? 'Structure STAR' : key === 'content' ? 'Contenu / Exemples' : 'Communication'}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: scoreToColor(score) }}>
                      {scoreToLabel(score)} · {Math.round(score * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: scoreToColor(score), width: `${score * 100}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}

            {feedback.summary && (
              <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 12, borderLeft: '3px solid var(--jb-neon-blue)' }}>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--jb-text-secondary)' }}>{feedback.summary}</p>
              </div>
            )}

            {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {feedback.strengths?.length > 0 && (
                  <div className="glass-card" style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: 8 }}>Points forts</div>
                    {feedback.strengths.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--jb-text-secondary)', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #22c55e' }}>{s}</div>
                    ))}
                  </div>
                )}
                {feedback.improvements?.length > 0 && (
                  <div className="glass-card" style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 8 }}>À améliorer</div>
                    {feedback.improvements.slice(0, 3).map((s, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', color: 'var(--jb-text-secondary)', marginBottom: 4, paddingLeft: 8, borderLeft: '2px solid #f59e0b' }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : null}

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn--ghost" onClick={restart} style={{ flex: 1 }}>
            Nouvel entretien
          </button>
          <button className="btn btn--primary" onClick={() => setPhase('interview')} style={{ flex: 1 }}>
            Voir la conversation
          </button>
        </div>
      </div>
    );
  }

  /* ── INTERVIEW PHASE ── */
  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
      {/* Progress bar */}
      <div style={{ padding: '10px 0 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--jb-text-muted)' }}>
            {targetRole} · {LEVELS.find(l => l.value === level)?.label}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--jb-neon-blue)', fontWeight: 600 }}>
            {questionIndex}/6 questions
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, var(--jb-neon-blue), var(--jb-neon-violet,#8b5cf6))',
            width: `${progress}%`, transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* ConversationEngine */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ConversationEngine
          messages={messages}
          onSend={handleSend}
          loading={loading}
          avatarVariant="D"
          avatarName="Recruteur IA"
          placeholder="Répondez à la question de l'entretien…"
          chips={questionIndex === 0 ? ['Permettez-moi de me présenter…', 'J\'ai travaillé sur…'] : []}
          headerSlot={
            <button
              onClick={loadFeedback}
              style={{
                padding: '5px 12px', fontSize: '0.78rem', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: 'var(--jb-text-muted)', cursor: 'pointer'
              }}
            >
              Terminer
            </button>
          }
          style={{ height: '100%', borderRadius: 'var(--jb-radius-lg)' }}
        />
      </div>
    </div>
  );
}

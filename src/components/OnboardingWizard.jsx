import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import './onboarding.css';

const ONBOARDING_KEY = 'jobboat_onboarding_done';

export function needsOnboarding() {
  try { return !localStorage.getItem(ONBOARDING_KEY); } catch { return false; }
}

const QUESTIONS = [
  {
    id: 'gender',
    question: 'Vous êtes ?',
    hint: null,
    type: 'chips',
    options: ['Homme', 'Femme'],
  },
  {
    id: 'targetJob',
    question: 'Quel poste recherchez-vous ?',
    hint: 'Ex : Développeur React, Chef de projet, Data Analyst…',
    type: 'text',
    placeholder: 'Votre poste cible',
  },
  {
    id: 'sector',
    question: 'Dans quel secteur ?',
    hint: null,
    type: 'chips',
    options: [
      'Tech / Informatique', 'Finance', 'Santé', 'Marketing',
      'Commerce', 'Industrie', 'Consulting', 'Autre',
    ],
  },
  {
    id: 'yearsExp',
    question: 'Combien d\'années d\'expérience avez-vous ?',
    hint: null,
    type: 'chips',
    options: ['0-1 an', '2-4 ans', '5-9 ans', '10+ ans'],
  },
  {
    id: 'contracts',
    question: 'Quel type de contrat ?',
    hint: 'Plusieurs choix possibles',
    type: 'multi-chips',
    options: ['CDI', 'CDD', 'Freelance', 'Stage', 'Alternance'],
  },
  {
    id: 'location',
    question: 'Où souhaitez-vous travailler ?',
    hint: null,
    type: 'text',
    placeholder: 'Paris, Lyon, Télétravail…',
  },
];

export default function OnboardingWizard({ onComplete }) {
  const { user, updateEmail } = useAuth();
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const inputRef = useRef(null);

  // Slide in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Focus text input when question changes
  useEffect(() => {
    if (QUESTIONS[qIndex]?.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [qIndex]);

  const q = QUESTIONS[qIndex];
  const totalQ = QUESTIONS.length;
  const progress = Math.round(((qIndex) / totalQ) * 100);
  const isLast = qIndex === totalQ - 1;

  function setAnswer(val) {
    setAnswers(prev => ({ ...prev, [q.id]: val }));
  }

  function toggleMulti(val) {
    setAnswers(prev => {
      const cur = prev[q.id] || [];
      return {
        ...prev,
        [q.id]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val],
      };
    });
  }

  function canAdvance() {
    const val = answers[q.id];
    if (q.type === 'multi-chips') return Array.isArray(val) && val.length > 0;
    return val && String(val).trim().length > 0;
  }

  function advance() {
    if (isLast) { finishOnboarding(); }
    else { setQIndex(i => i + 1); }
  }

  function skip() {
    if (isLast) { finishOnboarding(); }
    else { setQIndex(i => i + 1); }
  }

  async function finishOnboarding() {
    setVisible(false);
    setSaving(true);

    const { gender, targetJob, sector, yearsExp, contracts, location } = answers;
    const genderValue = gender === 'Homme' ? 'male' : gender === 'Femme' ? 'female' : 'unknown';

    try {
      await api.v2SaveProfile({
        email: user?.email,
        name: user?.name,
        gender: genderValue,
        target_job_title: targetJob || '',
        sector: sector || '',
        years_experience: yearsExp === '10+ ans' ? 10 : parseInt(yearsExp) || 0,
        preferred_contracts: Array.isArray(contracts) ? contracts : (contracts ? [contracts] : []),
        preferred_location: location || '',
      });
    } catch (err) {
      console.warn('[Onboarding] Partial save:', err.message);
    }

    try {
      localStorage.setItem('jobboat_profile_prefs', JSON.stringify(answers));
      localStorage.setItem(ONBOARDING_KEY, Date.now().toString());
    } catch { /* ignore */ }

    setSaving(false);
    window.posthog?.capture('onboarding_completed', {
      sector, targetJob, contracts: Array.isArray(contracts) ? contracts.join(',') : contracts,
    });
    onComplete?.();
  }

  function handleDismiss() {
    setVisible(false);
    setTimeout(() => {
      try { localStorage.setItem(ONBOARDING_KEY, Date.now().toString()); } catch { /* ignore */ }
      setDismissed(true);
      onComplete?.();
    }, 400);
  }

  if (dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes onbSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes onbSlideDown {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(100%); opacity: 0; }
        }
        .onb-banner {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 999;
          padding: 0 0 env(safe-area-inset-bottom, 0);
          animation: onbSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .onb-banner--hidden {
          animation: onbSlideDown 0.35s ease forwards;
        }
        .onb-banner__card {
          max-width: 640px;
          margin: 0 auto 0;
          background: var(--jb-glass-strong-bg, rgba(15,23,42,0.97));
          border: 1px solid var(--jb-glass-strong-border, rgba(255,255,255,0.12));
          border-bottom: none;
          border-radius: 18px 18px 0 0;
          padding: 20px 24px 24px;
          backdrop-filter: blur(24px);
          box-shadow: 0 -8px 40px rgba(0,0,0,0.5), var(--jb-neon-glow-sm, 0 0 8px rgba(79,158,255,0.2));
        }
        .onb-progress-bar {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 99px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .onb-progress-bar__fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--jb-neon-blue,#4f9eff), var(--jb-neon-violet,#8b5cf6));
          transition: width 0.4s ease;
        }
        .onb-question {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--jb-text-primary, #f1f5f9);
          margin-bottom: 4px;
        }
        .onb-hint {
          font-size: 0.78rem;
          color: var(--jb-text-muted, #64748b);
          margin-bottom: 14px;
        }
        .onb-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .onb-chip {
          padding: 6px 14px; border-radius: 99px; font-size: 0.82rem; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: transparent; color: var(--jb-text-secondary, #94a3b8);
          transition: all 0.15s;
        }
        .onb-chip--active {
          border-color: var(--jb-neon-blue, #4f9eff);
          background: rgba(79,158,255,0.14);
          color: var(--jb-neon-blue, #4f9eff);
          font-weight: 600;
        }
        .onb-actions { display: flex; align-items: center; gap: 8px; }
        .onb-counter { font-size: 0.72rem; color: var(--jb-text-muted); flex: 1; }
        .onb-dismiss {
          background: none; border: none; color: var(--jb-text-muted);
          font-size: 0.72rem; cursor: pointer; padding: 4px 8px;
          text-decoration: underline; text-underline-offset: 2px;
        }
        .onb-dismiss:hover { color: var(--jb-text-secondary); }
      `}</style>

      <div className={`onb-banner${visible ? '' : ' onb-banner--hidden'}`}>
        <div className="onb-banner__card">
          {/* Progress */}
          <div className="onb-progress-bar">
            <div className="onb-progress-bar__fill" style={{ width: `${progress}%` }} />
          </div>

          {/* Question */}
          <div className="onb-question">{q.question}</div>
          {q.hint && <div className="onb-hint">{q.hint}</div>}

          {/* Input area */}
          {q.type === 'text' && (
            <input
              ref={inputRef}
              className="input"
              value={answers[q.id] || ''}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canAdvance() && advance()}
              placeholder={q.placeholder}
              style={{ width: '100%', marginBottom: 14 }}
            />
          )}

          {(q.type === 'chips' || q.type === 'multi-chips') && (
            <div className="onb-chips">
              {q.options.map(opt => {
                const isMulti = q.type === 'multi-chips';
                const val = answers[q.id];
                const active = isMulti ? (Array.isArray(val) && val.includes(opt)) : val === opt;
                return (
                  <button
                    key={opt}
                    className={`onb-chip${active ? ' onb-chip--active' : ''}`}
                    onClick={() => isMulti ? toggleMulti(opt) : setAnswer(opt)}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="onb-actions">
            <span className="onb-counter">{qIndex + 1} / {totalQ}</span>
            <button className="onb-dismiss" onClick={skip}>Passer</button>
            <button
              className="btn btn--primary btn--sm"
              onClick={advance}
              disabled={!canAdvance() || saving}
              style={{ minWidth: 96 }}
            >
              {saving ? '…' : isLast ? 'Terminer' : 'Suivant →'}
            </button>
            {qIndex === 0 && (
              <button className="onb-dismiss" onClick={handleDismiss}>Plus tard</button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

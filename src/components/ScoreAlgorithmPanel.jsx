import { useState, useEffect } from 'react';

const DIM_META = {
  technical_competence: { label: 'Compétences Techniques', color: '#6366f1', why: 'Principal facteur de sélection. Mesure la maîtrise concrète des outils, langages et frameworks requis.', signals: ['Mots-clés techniques identifiés', 'Certifications déclarées', 'Années d\'expérience par domaine', 'Projets techniques cités'], formula: 'skill_density×0.45 + cert_bonus×0.25 + exp_years×0.30' },
  cognitive_ability: { label: 'Capacité Cognitive', color: '#8b5cf6', why: 'Prédit la capacité à résoudre des problèmes complexes et à s\'adapter rapidement.', signals: ['Complexité des postes occupés', 'Diversité des rôles', 'Niveau académique', 'Progression de carrière'], formula: 'problem_complexity×0.40 + role_diversity×0.30 + education_level×0.30' },
  behavioral_traits: { label: 'Traits Comportementaux', color: '#ec4899', why: 'Indicateur de compatibilité culturelle et de performance long-terme souvent sous-estimé.', signals: ['Verbes d\'action utilisés', 'Style de rédaction', 'Mentions de responsabilités', 'Initiatives citées'], formula: 'action_verb_score×0.35 + responsibility_depth×0.40 + initiative×0.25' },
  emotional_intelligence: { label: 'Intelligence Émotionnelle', color: '#f59e0b', why: 'Corrélé à la rétention, la collaboration et la satisfaction d\'équipe.', signals: ['Mentions de collaboration', 'Gestion d\'équipe', 'Feedback client cité', 'Soft skills explicites'], formula: 'collab_mentions×0.40 + team_mgmt×0.35 + empathy_signals×0.25' },
  cultural_fit: { label: 'Adéquation Culturelle', color: '#10b981', why: 'Prédit l\'alignement avec les valeurs et méthodes de travail de l\'entreprise cible.', signals: ['Types d\'entreprises précédentes', 'Secteurs d\'activité', 'Taille des organisations', 'Valeurs mentionnées'], formula: 'company_type_match×0.45 + sector_alignment×0.35 + values_match×0.20' },
  motivation_drive: { label: 'Motivation & Drive', color: '#ef4444', why: 'Détermine l\'énergie et la persévérance du candidat. Indicateur de performance sous pression.', signals: ['Initiatives personnelles', 'Projets hors emploi', 'Progressions rapides', 'Bénévolat / engagement'], formula: 'initiative_count×0.50 + growth_rate×0.30 + extra_engagement×0.20' },
  potential: { label: 'Potentiel de Croissance', color: '#06b6d4', why: 'Mesure la trajectoire d\'évolution. Crucial pour les recrutements long-terme.', signals: ['Évolution des responsabilités', 'Formations continues', 'Certifications récentes', 'Nouvelles compétences'], formula: 'responsibility_growth×0.45 + learning_rate×0.35 + recent_certs×0.20' },
  reliability: { label: 'Fiabilité', color: '#3b82f6', why: 'Prédit la constance de la performance et la durée de présence dans l\'entreprise.', signals: ['Durée moyenne dans les postes', 'Cohérence du parcours', 'Engagements tenus cités', 'Constance des résultats'], formula: 'tenure_stability×0.45 + career_coherence×0.35 + commitment_signals×0.20' },
  accountability: { label: 'Responsabilité', color: '#84cc16', why: 'Capacité à assumer des résultats et à agir en propriétaire de ses missions.', signals: ['Résultats quantifiés', 'Budgets gérés', 'Décisions prises', 'Impact mesuré'], formula: 'quantified_results×0.50 + budget_ownership×0.25 + decision_scope×0.25' },
  professional_behavior: { label: 'Comportement Pro', color: '#f97316', why: 'Indicateur de maturité professionnelle et de navigation en milieu corporate.', signals: ['Certifications pro', 'Adhésion associations', 'Conférences / présentations', 'Qualité du CV'], formula: 'prof_cert×0.30 + industry_presence×0.30 + cv_quality×0.40' },
  learning_mindset: { label: 'Apprentissage Continu', color: '#a78bfa', why: 'Dans un marché en mutation, la capacité d\'apprentissage prime souvent sur les compétences actuelles.', signals: ['Formations récentes', 'Diversité technologique', 'MOOC / certifications online', 'Évolution technique visible'], formula: 'training_recency×0.40 + tech_diversity×0.30 + cert_volume×0.30' },
  communication: { label: 'Communication', color: '#2dd4bf', why: 'Compétence transversale critique évaluée via la qualité même du CV soumis.', signals: ['Clarté et structure du CV', 'Langues maîtrisées', 'Présentations mentionnées', 'Qualité rédactionnelle'], formula: 'writing_clarity×0.40 + language_count×0.20 + presentation_exp×0.40' },
  team_compatibility: { label: 'Compatibilité Équipe', color: '#fb923c', why: 'Prédit la fluidité d\'intégration dans une équipe et la contribution collective.', signals: ['Projets d\'équipe cités', 'Rôles de facilitation', 'Mentorat cité', 'Mode agile / itératif'], formula: 'team_project_ratio×0.40 + facilitation_role×0.30 + mentoring×0.30' },
  motivation_stability: { label: 'Stabilité Motivationnelle', color: '#818cf8', why: 'Cohérence des choix de carrière — réduit le risque de turnover rapide.', signals: ['Cohérence thématique', 'Justification des transitions', 'Alignement poste cible', 'Durée des engagements'], formula: 'career_coherence×0.50 + transition_logic×0.30 + target_alignment×0.20' },
  practical_constraints: { label: 'Contraintes Pratiques', color: '#94a3b8', why: 'Compatibilité logistique : localisation, disponibilité, type de contrat souhaité.', signals: ['Localisation déclarée', 'Type de contrat cible', 'Disponibilité', 'Mobilité géographique'], formula: 'location_match×0.40 + contract_match×0.35 + availability×0.25' },
};

const DIMS = Object.keys(DIM_META);
const STEPS_CV = ['Lecture du CV…', 'Extraction des signaux…', 'Pondération des facteurs…', 'Calcul EWMA…', 'Normalisation…', 'Génération du rapport…'];
const STEPS_COACHING = ['Analyse de la session…', 'Évaluation des réponses…', 'Détection des patterns…', 'Calcul multi-dimensions…', 'Comparaison baseline…', 'Mise à jour du profil…'];

function AnimatedBar({ value, color, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 60 + delay); return () => clearTimeout(t); }, [value, delay]);
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 4, flex: 1, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 4, transition: 'width 0.85s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 6px ${color}55` }} />
    </div>
  );
}

export default function ScoreAlgorithmPanel({ scores = {}, signals = {}, isLoading = false, context = 'cv', onClose }) {
  const [phase, setPhase] = useState(isLoading ? 'scanning' : 'revealing');
  const [revealed, setRevealed] = useState(isLoading ? [] : DIMS);
  const [stepIdx, setStepIdx] = useState(0);
  const [expanded, setExpanded] = useState(null);

  const STEPS = context === 'cv' ? STEPS_CV : STEPS_COACHING;

  useEffect(() => {
    if (!isLoading) { setPhase('revealing'); setRevealed(DIMS); return; }
    setPhase('scanning'); setRevealed([]); setStepIdx(0);
    let s = 0;
    const si = setInterval(() => { s++; setStepIdx(Math.min(s, STEPS.length - 1)); }, 500);
    const rt = setTimeout(() => {
      clearInterval(si);
      setPhase('revealing');
      DIMS.forEach((d, i) => setTimeout(() => setRevealed(r => [...r, d]), i * 80));
    }, STEPS.length * 500 + 300);
    return () => { clearInterval(si); clearTimeout(rt); };
  }, [isLoading]);

  const getScore = d => { const v = scores[d]; if (v === undefined) return 0; return typeof v === 'number' ? Math.round(v > 1 ? v : v * 100) : 0; };
  const getSignals = d => (signals[d]?.length ? signals[d] : DIM_META[d]?.signals) || [];
  const sc = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
  const overall = DIMS.filter(d => scores[d] !== undefined).length > 0 ? Math.round(DIMS.reduce((a, d) => a + getScore(d), 0) / DIMS.length) : 0;

  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(10,15,28,0.98) 0%,rgba(15,23,42,0.98) 100%)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 22, color: '#e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', fontFamily: 'inherit' }}>
      <style>{`@keyframes jb-scan{0%{left:-40%}100%{left:100%}} @keyframes jb-dot{0%,80%,100%{opacity:.2;transform:scale(0.7)}40%{opacity:1;transform:scale(1.1)}} @keyframes jb-pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 34, borderRadius: 4, background: 'linear-gradient(180deg,#6366f1,#8b5cf6)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>
              Algorithme de Scoring — 15 Dimensions
              {phase === 'scanning' && <span style={{ marginLeft: 6 }}>{[0,1,2].map(i => <span key={i} style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', background: '#6366f1', animation: `jb-dot 1.2s ${i*0.2}s ease-in-out infinite`, marginRight: 2 }} />)}</span>}
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>{context === 'cv' ? 'Analyse pondérée selon les critères de recrutement actuels' : 'Évaluation de session coaching selon les standards professionnels'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {phase === 'revealing' && overall > 0 && (
            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: sc(overall), lineHeight: 1 }}>{overall}</div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>SCORE GLOBAL</div>
            </div>
          )}
          {onClose && <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: '#475569', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>}
        </div>
      </div>

      {/* Scanning animation */}
      {phase === 'scanning' && (
        <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'jb-pulse 1s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, color: '#a5b4fc', fontWeight: 500 }}>{STEPS[stepIdx]}</span>
          </div>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 2, background: 'rgba(99,102,241,0.12)', borderRadius: 2, margin: '5px 0', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '40%', background: 'linear-gradient(90deg,transparent,#6366f1,transparent)', animation: `jb-scan ${1.2 + i * 0.15}s ${i * 0.2}s ease-in-out infinite` }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap' }}>
            {STEPS.map((s, i) => (
              <span key={i} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: i <= stepIdx ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', color: i <= stepIdx ? '#a5b4fc' : '#374151', border: `1px solid ${i <= stepIdx ? 'rgba(99,102,241,0.3)' : 'transparent'}`, transition: 'all 0.3s' }}>
                {i < stepIdx ? '+ ' : ''}{s.replace('…', '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Method banner */}
      {phase === 'revealing' && (
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontSize: 11, color: '#64748b', lineHeight: 1.65 }}>
          <strong style={{ color: '#a5b4fc' }}>Méthode :</strong> Chaque dimension est calculée par pondération de signaux extraits automatiquement. Les scores sont normalisés 0–100 et pondérés par leur importance relative dans les décisions de recrutement réelles. Le score global utilise une <strong style={{ color: '#a5b4fc' }}>moyenne pondérée EWMA</strong> actualisée à chaque interaction. Cliquez sur une dimension pour voir le détail.
        </div>
      )}

      {/* Dimension list */}
      {phase === 'revealing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {DIMS.map((dim, idx) => {
            const m = DIM_META[dim];
            const score = getScore(dim);
            const isVis = revealed.includes(dim);
            const isExp = expanded === dim;
            return (
              <div key={dim} onClick={() => setExpanded(isExp ? null : dim)} style={{ background: isExp ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', borderRadius: 9, border: `1px solid ${isExp ? m.color + '35' : 'rgba(255,255,255,0.05)'}`, padding: isExp ? '13px 15px' : '9px 13px', cursor: 'pointer', opacity: isVis ? 1 : 0, transform: isVis ? 'none' : 'translateY(6px)', transition: `opacity 0.3s ${idx * 0.04}s, transform 0.3s ${idx * 0.04}s, all 0.2s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0, display: 'inline-block', boxShadow: `0 0 5px ${m.color}80` }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', minWidth: 176, flexShrink: 0 }}>{m.label}</span>
                  <AnimatedBar value={isVis ? score : 0} color={m.color} delay={idx * 80} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: sc(score), minWidth: 28, textAlign: 'right' }}>{score}</span>
                  <span style={{ fontSize: 9, color: '#374151', marginLeft: 2, lineHeight: 1 }}>{isExp ? '−' : '+'}</span>
                </div>

                {isExp && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: m.color, marginBottom: 4 }}>Pourquoi ce facteur ?</div>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{m.why}</p>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4b5563', marginBottom: 6 }}>Signaux analysés</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {getSignals(dim).map((s, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: `${m.color}12`, color: m.color, border: `1px solid ${m.color}28` }}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4b5563', marginBottom: 4 }}>Formule de calcul</div>
                      <code style={{ fontSize: 11, background: 'rgba(0,0,0,0.35)', padding: '5px 10px', borderRadius: 6, display: 'block', color: '#a5b4fc', fontFamily: 'monospace' }}>{m.formula}</code>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${score}%`, background: `linear-gradient(90deg,${m.color}50,${m.color})`, borderRadius: 3 }} />
                        {[25, 50, 75].map(t => <div key={t} style={{ position: 'absolute', left: `${t}%`, top: 0, height: '100%', width: 1, background: 'rgba(255,255,255,0.12)' }} />)}
                      </div>
                      <span style={{ fontSize: 11, color: sc(score), fontWeight: 600, whiteSpace: 'nowrap' }}>{score >= 75 ? 'Fort' : score >= 50 ? 'Moyen' : 'A renforcer'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {phase === 'revealing' && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 10, color: '#374151' }}>
            {DIMS.filter(d => scores[d] !== undefined).length} / 15 dimensions évaluées
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['≥75', '#10b981', 'Fort'], ['50–74', '#f59e0b', 'Moyen'], ['<50', '#ef4444', 'À renforcer']].map(([r, c, l]) => (
              <span key={l} style={{ fontSize: 10, color: c, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />{r} = {l}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

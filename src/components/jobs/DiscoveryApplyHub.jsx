import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';
import { DIMENSION_LABELS, DIMENSION_GROUPS } from '../../services/ewma';
import LoadingWithTips from '../LoadingWithTips';
import ScoreAlgorithmPanel from '../ScoreAlgorithmPanel';
import SwipeJobCard from './SwipeJobCard';
import PortalAssistPanel from './PortalAssistPanel';
import DocumentVault from '../DocumentVault';
import './discoveryApplyHub.css';

const DIM_COLORS = {
  technical_competence: 'var(--jb-accent)', cognitive_ability: '#6366f1',
  behavioral_traits: '#8b5cf6', emotional_intelligence: '#ec4899',
  cultural_fit: '#14b8a6', motivation_drive: '#f59e0b',
  potential: '#ef4444', practical_constraints: '#64748b',
  reliability: '#10b981', accountability: '#0ea5e9',
  professional_behavior: '#a855f7', learning_mindset: '#22d3ee',
  team_compatibility: '#e879f9', motivation_stability: '#f97316',
  communication: '#3b82f6',
};

export default function DiscoveryApplyHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // Flow steps: 'loading' -> 'cv' -> 'analysis' -> 'swipe' -> 'summary' -> 'apply'
  const [step, setStep] = useState('loading');

  // CV state
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvData, setCvData] = useState(null);

  // Jobs state
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsMeta, setJobsMeta] = useState(null);

  // Swipe state (replaces list selection)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accepted, setAccepted] = useState([]);

  // Apply state
  const [applyMessage, setApplyMessage] = useState('');
  const [generatingMsg, setGeneratingMsg] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  // Enhanced apply: document picker + custom fields
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [customFields, setCustomFields] = useState({ phone: '', availability: '', salary: '' });

  // Recommendation
  const [recommendation, setRecommendation] = useState(null);

  // Aggregation
  const [aggStatus, setAggStatus] = useState(null);
  const [status, setStatus] = useState('');
  const [showAlgoPanel, setShowAlgoPanel] = useState(false);

  // Portal prompt: "now or later?" for portal-only jobs
  const [portalPromptJob, setPortalPromptJob] = useState(null);
  const [deferredPortals, setDeferredPortals] = useState([]);

  // On mount: check for existing CV, skip upload if found
  useEffect(() => {
    let cancelled = false;

    api.v2AggregationStatus()
      .then(data => { if (!cancelled && data) setAggStatus(data); })
      .catch(() => {});

    if (!user?.email) { setStep('cv'); return; }

    api.v2GetLatestCv(user.email)
      .then(res => {
        if (cancelled) return;
        if (res?.cv) {
          setCvData(res.cv);
          setStep('analysis');
          setStatus('CV existant charge. Lancez la recherche ou importez un nouveau CV.');
        } else {
          setStep('cv');
        }
      })
      .catch(() => { if (!cancelled) setStep('cv'); });

    return () => { cancelled = true; };
  }, [user?.email]);

  // accepted[] replaces selectedIds — populated by swipe

  const dims = cvData?.parsed?.dimensions || cvData?.insights?.dimensions || cvData?.dimensions || {};
  const skills = cvData?.parsed?.skills || cvData?.insights?.skills || cvData?.parsed?.keywords || cvData?.skills || cvData?.insights?.keywords || cvData?.keywords || [];
  const targetTitle = cvData?.parsed?.target_job_title || cvData?.insights?.target_job_title || cvData?.target_job_title || '';

  // ── Step 1: Upload & Parse CV ──
  async function handleCvUpload(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setCvFile(file);
    setCvUploading(true);
    setStatus('');
    try {
      const res = await api.v2UploadCv({ email: user?.email, file });
      setCvData(res);
      setShowAlgoPanel(true);
      setStep('analysis');
    } catch (err) {
      setStatus(`Erreur d'analyse du CV: ${err.message}`);
    } finally {
      setCvUploading(false);
    }
  }

  // ── Step 2: Auto-discover jobs after analysis ──
  async function runDiscovery() {
    setLoadingJobs(true);
    setStatus('');
    setApplyResult(null);
    try {
      // Use smart auto-discovery (CV + profile based)
      const res = await api.v2AutoJobDiscovery({
        email: user?.email,
        considerations: targetTitle || ''
      });

      const nextJobs = Array.isArray(res.jobs) ? res.jobs : [];
      setJobs(nextJobs);
      setJobsMeta({
        source: res.source?.aggregated_jobs_in_pool > 0 ? 'Base JobBoat + France Travail' : 'France Travail',
        strategy: res.strategy || 'auto',
        total: nextJobs.length,
        aggregated: res.source?.aggregated_jobs_in_pool || 0,
      });
      // Store recommendation from backend
      if (res.user_score_summary) {
        setRecommendation(res.user_score_summary);
        // Also store for coaching context
        try { localStorage.setItem('jobboat_matching_context', JSON.stringify(res.user_score_summary)); } catch {}
      }
      setCurrentIndex(0);
      setAccepted([]);
      setDeferredPortals([]);
      setStep('swipe');
      setStatus(`${nextJobs.length} offres trouvees correspondant a ton profil.`);
    } catch (e) {
      setStatus(`Erreur de recherche: ${e.message}`);
    } finally {
      setLoadingJobs(false);
    }
  }

  // ── Swipe handlers ──
  const handleAccept = useCallback((job) => {
    const isPortalOnly = !job.apply_email && job.apply_url;
    if (isPortalOnly) {
      setPortalPromptJob(job);
      return;
    }
    setAccepted(prev => [...prev, job]);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= jobs.length) setTimeout(() => setStep('summary'), 350);
      return next;
    });
  }, [jobs.length]);

  const handleReject = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= jobs.length) setTimeout(() => setStep('summary'), 350);
      return next;
    });
  }, [jobs.length]);

  const handlePortalNow = useCallback((job) => {
    setPortalPromptJob(null);
    // Open the portal in a new tab — the Chrome extension autofill will handle it
    window.open(job.apply_url, '_blank');
    // Still count as accepted so it shows in results
    setAccepted(prev => [...prev, job]);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= jobs.length) setTimeout(() => setStep('summary'), 350);
      return next;
    });
  }, [jobs.length]);

  const handlePortalLater = useCallback((job) => {
    setPortalPromptJob(null);
    setDeferredPortals(prev => [...prev, job]);
    setAccepted(prev => [...prev, job]);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= jobs.length) setTimeout(() => setStep('summary'), 350);
      return next;
    });
  }, [jobs.length]);

  async function generateAiMessage() {
    if (!accepted.length) return;
    setGeneratingMsg(true);
    try {
      const focus = accepted[0];
      const response = await api.v2AiExecute({
        task: 'application_email',
        messages: [
          { role: 'system', content: 'Redige un email de candidature professionnel, concis et percutant en francais.' },
          { role: 'user', content: `Candidat: ${user?.name || 'Candidat'} (${user?.email})\nPoste: ${focus?.title}\nEntreprise: ${focus?.company}\nConstraintes: 120-180 mots, ton professionnel, specifique, pas de blabla.` }
        ]
      });
      setApplyMessage(response?.result?.text || '');
    } catch (e) {
      setStatus(`Generation du message echouee: ${e.message}`);
    } finally {
      setGeneratingMsg(false);
    }
  }

  async function applyToAccepted() {
    if (!accepted.length) return;
    setApplying(true);
    setApplyResult(null);
    setStatus('');
    try {
      const jobPayload = accepted.map(j => ({
        id: j.id, title: j.title, company: j.company,
        apply_email: j.apply_email || null, apply_url: j.apply_url || null,
        company_domain: j.company_domain || null,
      }));
      const profilePayload = {
        email: user?.email, name: user?.name || 'Candidat',
        title: cvData?.target_job_title || '',
        skills: cvData?.skills || [],
      };

      // Phase 1: Prepare — detect channels + generate portal letters
      let prepareResult = null;
      try {
        prepareResult = await api.v2AutoApplyPrepare({
          jobs: jobPayload,
          profile: profilePayload,
        });
      } catch (_e) { /* prepare is optional, continue with apply */ }

      // Phase 2: Apply — send emails for email-channel jobs
      const res = await api.v2AutoApply({
        jobs: jobPayload,
        profile: profilePayload,
        message: applyMessage || '',
        document_ids: selectedDocIds.length > 0 ? selectedDocIds : undefined,
        custom_fields: (customFields.phone || customFields.availability || customFields.salary)
          ? customFields : undefined,
      });

      // Merge results: email results from apply + portal data from prepare
      const emailResults = (res.results || []).filter(r => r.status !== 'portal_pending' && r.status !== 'skipped');
      const portalFromApply = (res.results || []).filter(r => r.status === 'portal_pending');
      const skippedFromApply = (res.results || []).filter(r => r.status === 'skipped');

      // Enrich portal results with letters from prepare
      const portalJobs = portalFromApply.map(p => {
        const prepared = prepareResult?.jobs?.find(j => j.jobId === p.jobId && j.channel === 'portal_assist');
        return {
          ...p,
          letter: prepared?.letter || null,
          clipboard_text: prepared?.clipboard_text || null,
          platformInfo: prepared?.platformInfo || null,
          company_intel: prepared?.company_intel || null,
          title: prepared?.title || p.title || accepted.find(j => j.id === p.jobId)?.title || '',
        };
      });

      // Also add portal_assist jobs from prepare that weren't in apply results
      if (prepareResult?.jobs) {
        for (const pj of prepareResult.jobs) {
          if (pj.channel === 'portal_assist' && !portalJobs.find(p => p.jobId === pj.jobId)) {
            portalJobs.push({
              jobId: pj.jobId,
              title: pj.title || '',
              company: pj.company || '',
              status: 'portal_pending',
              channel: 'portal_assist',
              platform: pj.platform,
              platform_name: pj.platformInfo?.name || pj.platform || 'Portail',
              apply_url: pj.apply_url,
              letter: pj.letter,
              clipboard_text: pj.clipboard_text,
              platformInfo: pj.platformInfo,
              instructions: pj.platformInfo?.instructions || [],
            });
          }
        }
      }

      // Add deferred portal jobs to portal results
      for (const dj of deferredPortals) {
        if (!portalJobs.find(p => p.jobId === dj.id)) {
          portalJobs.push({
            jobId: dj.id, title: dj.title || '', company: dj.company || '',
            status: 'portal_pending', channel: 'portal_assist', platform: dj.platform || '',
            apply_url: dj.apply_url, letter: null, clipboard_text: null,
            platformInfo: null, instructions: [],
          });
        }
      }

      const sent = emailResults.filter(r => r.summary?.sent > 0 || r.status === 'sent').length;
      setApplyResult({
        ...res,
        emailResults,
        portalJobs,
        skippedJobs: skippedFromApply,
        prepareSummary: prepareResult?.summary || null,
      });
      setStep('apply');
      setStatus(
        `${sent} email${sent > 1 ? 's' : ''} envoye${sent > 1 ? 's' : ''} automatiquement` +
        (portalJobs.length > 0 ? `, ${portalJobs.length} portail${portalJobs.length > 1 ? 's' : ''} a completer` : '')
      );
    } catch (e) {
      setStatus(`Erreur auto-apply: ${e.message}`);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="hub">
      {/* Header */}
      <header className="hub__header fade-in-up">
        <div>
          <h2 className="section-title">Decouverte & Candidature</h2>
          {aggStatus && typeof aggStatus === 'object' && (
            <div className="hub__agg-status">
              <span className="glow-dot" />
              <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                {aggStatus.jobs_count ?? 0} offres en base -- {aggStatus.contacts_count ?? 0} contacts
                {aggStatus.last_refresh_at && ` -- Maj: ${new Date(aggStatus.last_refresh_at).toLocaleTimeString('fr-FR')}`}
              </span>
            </div>
          )}
        </div>
        {/* Step indicators */}
        <div className="hub__steps">
          <span className={`hub__step ${step === 'cv' ? 'hub__step--active' : cvData ? 'hub__step--done' : ''}`}>1. CV</span>
          <span className={`hub__step ${step === 'analysis' ? 'hub__step--active' : jobs.length > 0 ? 'hub__step--done' : ''}`}>2. Analyse</span>
          <span className={`hub__step ${step === 'swipe' ? 'hub__step--active' : accepted.length > 0 ? 'hub__step--done' : ''}`}>3. Swipe</span>
          <span className={`hub__step ${step === 'summary' ? 'hub__step--active' : applyResult ? 'hub__step--done' : ''}`}>4. Candidater</span>
        </div>
      </header>

      {status && <div className="glass-card hub__status text-secondary">{status}</div>}

      {/* ───── LOADING: checking existing CV ───── */}
      {step === 'loading' && (
        <LoadingWithTips
          message="Preparation de votre espace..."
          steps={[
            { label: 'Recherche de votre CV', active: true },
            { label: 'Chargement des offres', done: false },
          ]}
        />
      )}

      {/* ───── STEP 1: CV Upload ───── */}
      {step === 'cv' && (
        <section className="hub__section fade-in-up delay-1">
          {/* Guidance message */}
          <div className="glass-card hub__guidance">
            <h3 className="font-display" style={{ fontSize: 'var(--jb-text-lg)', fontWeight: 700, marginBottom: 'var(--jb-space-3)' }}>
              Commence par ton CV
            </h3>
            <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: 'var(--jb-space-4)' }}>
              La decouverte d'offres sera <strong className="text-accent">beaucoup plus pertinente</strong> si tu telecharges ton CV d'abord.
              Notre IA l'analyse sur <strong>15 dimensions</strong> (competences techniques, fiabilite, leadership, communication...)
              et utilise ce profil pour te matcher avec les meilleures offres.
            </p>
            <div className="hub__guidance-options">
              <div className="hub__guidance-option glass-card hover-lift" onClick={() => fileRef.current?.click()}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                <span className="font-display" style={{ fontWeight: 600 }}>J'ai un CV</span>
                <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Telecharge-le, l'IA l'analyse et extrait tes forces</span>
              </div>
              <div className="hub__guidance-option glass-card hover-lift" onClick={() => navigate('/cv-builder')}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                <span className="font-display" style={{ fontWeight: 600 }}>Pas encore de CV</span>
                <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Notre IA CV Builder t'en cree un qui couvre les 15 dimensions</span>
              </div>
              <div className="hub__guidance-option glass-card hover-lift" onClick={() => navigate('/coaching')}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><path d="M9 21h6" /></svg>
                <span className="font-display" style={{ fontWeight: 600 }}>Coaching d'abord</span>
                <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Ameliore tes dimensions avant de chercher -- resultats x10</span>
              </div>
            </div>
          </div>

          {/* Upload zone */}
          <div className="glass-card hub__upload-zone hover-lift" onClick={() => fileRef.current?.click()}>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleCvUpload}
              style={{ display: 'none' }}
            />
            {cvUploading ? (
              <div className="hub__upload-loading">
                <div className="shimmer" style={{ width: 240, height: 20, borderRadius: 10 }} />
                <p className="text-muted">Analyse en cours sur 15 dimensions...</p>
              </div>
            ) : (
              <>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-secondary"><strong className="text-accent">Clique ici</strong> ou glisse ton CV (PDF, DOCX, TXT)</p>
                <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Analyse automatique : competences, mots-cles, scoring 15D</p>
              </>
            )}
          </div>
        </section>
      )}

      {/* ───── STEP 2: Analysis Results ───── */}
      {step === 'analysis' && cvData && (
        <section className="hub__section fade-in-up">
          <div className="glass-card hub__panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--jb-space-3)' }}>
              <div>
                <h3 className="font-display" style={{ fontWeight: 700 }}>Analyse de ton profil</h3>
                {targetTitle && <span className="badge badge--accent" style={{ marginTop: 4 }}>{targetTitle}</span>}
              </div>
              <div className="hub__inline">
                <span className="badge badge--success">CV analyse</span>
                {cvFile && <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>{cvFile.name}</span>}
              </div>
            </div>

            {/* 15D Scores by group */}
            {Object.entries(DIMENSION_GROUPS).map(([groupKey, group]) => (
              <div key={groupKey}>
                <h4 className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', fontWeight: 600, marginBottom: 'var(--jb-space-2)' }}>
                  {group.label}
                </h4>
                <div className="hub__dims-grid">
                  {group.keys.map(d => {
                    const val = dims[d] ?? 0;
                    return (
                      <div key={d} className="hub__dim">
                        <div className="hub__dim-header">
                          <span className="hub__dim-label">{DIMENSION_LABELS[d]}</span>
                          <span className="hub__dim-value font-mono">{val}%</span>
                        </div>
                        <div className="hub__dim-bar">
                          <div className="hub__dim-fill" style={{ width: `${val}%`, background: DIM_COLORS[d] || 'var(--jb-accent)' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Algorithm breakdown panel */}
            {showAlgoPanel && (
              <div style={{ marginTop: 'var(--jb-space-4)' }}>
                <ScoreAlgorithmPanel
                  scores={dims}
                  signals={{ technical_competence: skills.slice(0, 6).map(s => typeof s === 'string' ? s : s?.skill_name || '') }}
                  isLoading={false}
                  context="cv"
                  onClose={() => setShowAlgoPanel(false)}
                />
              </div>
            )}
            {!showAlgoPanel && Object.keys(dims).length > 0 && (
              <button
                onClick={() => setShowAlgoPanel(true)}
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', color: '#a5b4fc', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, marginTop: 8 }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
                Voir le détail du calcul des scores
              </button>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <div>
                <h4 className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', fontWeight: 600, marginBottom: 'var(--jb-space-2)' }}>
                  Competences detectees
                </h4>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {skills.map((s, i) => {
                    const label = typeof s === 'string' ? s : (s?.skill_name || s?.name || String(s));
                    return <span key={i} className="badge badge--accent">{label}</span>;
                  })}
                </div>
              </div>
            )}

            <div className="hub__actions">
              <button className="btn btn--secondary" onClick={() => setStep('cv')}>
                Changer de CV
              </button>
              <button className="btn btn--primary btn-magnetic" onClick={runDiscovery} disabled={loadingJobs}>
                {loadingJobs ? 'Recherche en cours...' : 'Trouver les offres correspondantes'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ───── COACHING RECOMMENDATION ───── */}
      {step === 'swipe' && recommendation?.recommendation === 'coaching' && (
        <section className="hub__section fade-in-up">
          <div className="glass-card hub__coaching-rec" style={{ borderLeft: '4px solid #f59e0b', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <h4 className="font-display" style={{ fontWeight: 600, marginBottom: 4 }}>Recommandation JobBoat</h4>
                <p style={{ fontSize: 'var(--jb-text-sm)', color: 'var(--jb-text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                  Score moyen : {recommendation.avg_match}%. Une session de coaching IA peut ameliorer vos dimensions faibles.
                </p>
                {recommendation.weak_dimensions?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {recommendation.weak_dimensions.map(wd => (
                      <span key={wd.dimension} className="badge badge--accent" style={{ fontSize: 'var(--jb-text-xs)' }}>
                        {wd.dimension.replace(/_/g, ' ')} : {wd.score}%
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn--primary btn--sm" onClick={() => navigate('/coaching', { state: { weakDimensions: recommendation.weak_dimensions, avgMatch: recommendation.avg_match } })}>
                    Commencer le coaching
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setRecommendation(null)}>
                    Continuer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───── STEP 3: Swipe Job Selection ───── */}
      {step === 'swipe' && (
        <section className="hub__section hub__section--centered fade-in-up">
          {jobsMeta && (
            <div style={{ textAlign: 'center', marginBottom: 'var(--jb-space-3)' }}>
              <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                {jobsMeta.total} offres — Source: {jobsMeta.source}
                {jobsMeta.aggregated > 0 && ` (${jobsMeta.aggregated} agregees)`}
              </span>
            </div>
          )}

          {jobs.length === 0 ? (
            <div className="glass-card hub__panel" style={{ textAlign: 'center', padding: 'var(--jb-space-8)' }}>
              <p className="text-muted">Aucune offre trouvee. Essaie avec un autre profil ou relance la recherche.</p>
              <button className="btn btn--secondary btn--sm" onClick={() => setStep('cv')} style={{ marginTop: 'var(--jb-space-3)' }}>
                Retour au CV
              </button>
            </div>
          ) : currentIndex < jobs.length ? (
            <SwipeJobCard
              key={jobs[currentIndex].id}
              job={jobs[currentIndex]}
              index={currentIndex}
              total={jobs.length}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ) : (
            <div className="glass-card" style={{ padding: 'var(--jb-space-6)', textAlign: 'center' }}>
              <p className="text-muted">Chargement du resume...</p>
            </div>
          )}

          {accepted.length > 0 && (
            <div className="hub__accepted-pill">
              <span className="text-accent font-display" style={{ fontWeight: 700 }}>{accepted.length}</span>
              <span className="text-muted"> offre{accepted.length > 1 ? 's' : ''} acceptee{accepted.length > 1 ? 's' : ''}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--jb-space-3)', marginTop: 'var(--jb-space-2)', justifyContent: 'center' }}>
            <button className="btn btn--ghost btn--sm" onClick={() => setStep('analysis')}>
              Retour a l'analyse
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => { setStep('cv'); setCvData(null); setCvFile(null); setJobs([]); }}>
              Nouveau CV
            </button>
          </div>
        </section>
      )}

      {/* ───── PORTAL PROMPT MODAL ───── */}
      {portalPromptJob && (
        <div className="hub__portal-overlay">
          <div className="glass-card hub__portal-prompt">
            <h3 className="font-display" style={{ fontWeight: 700, marginBottom: 'var(--jb-space-3)' }}>
              Candidature via portail
            </h3>
            <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', lineHeight: 1.6, marginBottom: 'var(--jb-space-2)' }}>
              <strong>{portalPromptJob.title}</strong> chez <strong>{portalPromptJob.company}</strong> n'a pas d'email direct.
              Le formulaire doit etre rempli sur le portail.
            </p>
            <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', marginBottom: 'var(--jb-space-4)' }}>
              L'extension Chrome JobBoat remplira automatiquement le formulaire avec votre profil IA.
            </p>
            <div style={{ display: 'flex', gap: 'var(--jb-space-3)', flexDirection: 'column' }}>
              <button className="btn btn--primary btn-magnetic" onClick={() => handlePortalNow(portalPromptJob)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Ouvrir le portail maintenant (autofill IA)
              </button>
              <button className="btn btn--secondary" onClick={() => handlePortalLater(portalPromptJob)}>
                Garder pour la fin de session
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => { setPortalPromptJob(null); handleReject(portalPromptJob); }}>
                Passer cette offre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── STEP 4: Summary + Apply ───── */}
      {step === 'summary' && (
        <section className="hub__section fade-in-up">
          <div className="glass-card hub__panel">
            <h3 className="font-display" style={{ fontWeight: 700, marginBottom: 'var(--jb-space-3)' }}>
              {accepted.length > 0 ? `${accepted.length} offre${accepted.length > 1 ? 's' : ''} selectionnee${accepted.length > 1 ? 's' : ''}` : 'Aucune offre selectionnee'}
            </h3>

            {accepted.length > 0 && (
              <>
                <div className="hub__accepted-list">
                  {accepted.map(job => (
                    <div key={job.id} className="hub__accepted-item glass-card">
                      <div className="hub__job-top">
                        <span className="font-display" style={{ fontWeight: 600, fontSize: 'var(--jb-text-sm)' }}>{job.title}</span>
                        {typeof job.match_score === 'number' && <span className="badge badge--accent">{job.match_score}%</span>}
                      </div>
                      <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>{job.company}</span>
                    </div>
                  ))}
                </div>

                <label className="label" style={{ marginTop: 'var(--jb-space-4)' }}>Message de candidature</label>
                <textarea
                  className="input"
                  rows={4}
                  value={applyMessage}
                  onChange={e => setApplyMessage(e.target.value)}
                  placeholder="Le message IA apparaitra ici. Tu peux le modifier avant d'envoyer."
                />

                {/* Document Picker */}
                <div className="hub__doc-picker" style={{ marginTop: 'var(--jb-space-4)' }}>
                  <button type="button" className="hub__doc-toggle" onClick={() => setShowDocPicker(p => !p)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>Joindre des documents</span>
                    {selectedDocIds.length > 0 && <span className="badge badge--accent" style={{ marginLeft: 6 }}>{selectedDocIds.length}</span>}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', transform: showDocPicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showDocPicker && (
                    <div className="hub__doc-vault fade-in-up" style={{ marginTop: 'var(--jb-space-2)' }}>
                      <DocumentVault selectable compact selectedIds={selectedDocIds} onSelect={setSelectedDocIds} />
                    </div>
                  )}
                </div>

                {/* Custom Fields */}
                <div className="hub__custom-fields" style={{ marginTop: 'var(--jb-space-4)' }}>
                  <div className="hub__fields-grid" style={{ display: 'grid', gap: 'var(--jb-space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div>
                      <label className="label" style={{ fontSize: 'var(--jb-text-xs)' }}>Telephone</label>
                      <input className="input" type="tel" placeholder="+33 6 12 34 56 78"
                        value={customFields.phone} onChange={e => setCustomFields(p => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: 'var(--jb-text-xs)' }}>Disponibilite</label>
                      <input className="input" type="text" placeholder="Immediatement, 1 mois..."
                        value={customFields.availability} onChange={e => setCustomFields(p => ({ ...p, availability: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize: 'var(--jb-text-xs)' }}>Pretentions salariales</label>
                      <input className="input" type="text" placeholder="45-55K EUR"
                        value={customFields.salary} onChange={e => setCustomFields(p => ({ ...p, salary: e.target.value }))} />
                    </div>
                  </div>
                </div>

                {/* Apply actions */}
                <div className="hub__apply-cta">
                  <button className="btn btn--secondary" onClick={generateAiMessage} disabled={generatingMsg}>
                    {generatingMsg ? 'Generation en cours...' : 'Generer un message IA'}
                  </button>
                  <button className="btn btn--primary btn-magnetic hub__apply-btn" onClick={applyToAccepted} disabled={applying}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {applying ? 'Envoi en cours...' : `Envoyer ${accepted.length} candidature${accepted.length > 1 ? 's' : ''}`}
                  </button>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 'var(--jb-space-3)', marginTop: 'var(--jb-space-3)' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => { setStep('swipe'); setCurrentIndex(0); setAccepted([]); }}>
                Re-swiper
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => { setStep('cv'); setCvData(null); setCvFile(null); setJobs([]); setAccepted([]); }}>
                Nouveau CV
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ───── STEP 5: Apply Results (Multi-Channel) ───── */}
      {step === 'apply' && applyResult && (
        <section className="hub__section fade-in-up">
          <div className="glass-card hub__panel">
            <h3 className="font-display" style={{ fontWeight: 700 }}>Resultats des candidatures</h3>

            <PortalAssistPanel
              emailResults={applyResult.emailResults || applyResult.results || []}
              portalJobs={applyResult.portalJobs || []}
              skippedJobs={applyResult.skippedJobs || []}
            />

            <div className="hub__actions" style={{ marginTop: 'var(--jb-space-4)' }}>
              <button className="btn btn--secondary" onClick={() => { setStep('cv'); setCvData(null); setCvFile(null); setJobs([]); setApplyResult(null); setAccepted([]); }}>
                Nouvelle recherche
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

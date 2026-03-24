import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import './dashboard.css';

/* ── Animated number counter ── */
function AnimatedNumber({ value, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (typeof value !== 'number') return;
    const duration = 1200;
    const start = Date.now();
    const from = 0;
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  if (typeof value !== 'number') return <span>--</span>;
  return <span>{prefix}{display}{suffix}</span>;
}

/* ── Progress Ring SVG ── */
function ProgressRing({ radius = 40, stroke = 5, progress = 0, color = 'var(--jb-accent)' }) {
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  return (
    <svg height={radius * 2} width={radius * 2} className="progress-ring">
      <circle
        stroke="var(--jb-bg-surface)"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className="progress-ring__circle"
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        style={{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset,
          '--progress-circumference': circumference,
          '--progress-offset': strokeDashoffset,
        }}
      />
    </svg>
  );
}

/* ── Badges / Achievements ── */
const BADGES = [
  { id: 'first_cv', icon: 'cv', label: 'Premier CV', desc: 'Importez votre premier CV', check: s => s.hasCv },
  { id: 'first_apply', icon: 'rocket', label: 'Premier Pas', desc: 'Envoyez votre premiere candidature', check: s => s.apps > 0 },
  { id: 'coach_starter', icon: 'brain', label: 'Apprenti Coach', desc: 'Completez 3 sessions coaching', check: s => s.sessions >= 3 },
  { id: 'explorer', icon: 'search', label: 'Explorateur', desc: 'Decouvrez 10+ offres d\'emploi', check: s => s.jobs >= 10 },
  { id: 'committed', icon: 'flame', label: 'Engage', desc: '7 jours consecutifs d\'utilisation', check: s => s.streak >= 7 },
  { id: 'pro_scorer', icon: 'star', label: 'Score Pro', desc: 'Atteignez un score global de 70%+', check: s => s.score >= 70 },
  { id: 'mass_apply', icon: 'briefcase', label: 'Candidat Assidu', desc: 'Envoyez 10+ candidatures', check: s => s.apps >= 10 },
  { id: 'master_coach', icon: 'trophy', label: 'Maitre Coach', desc: 'Completez 15 sessions coaching', check: s => s.sessions >= 15 },
];

/* ── Motivational microcopy pool ── */
const TIPS = [
  'Astuce : Personnalisez votre CV pour chaque candidature. Un CV adapte se demarque toujours.',
  'Notre coaching IA s\'adapte a votre profil en temps reel. Plus vous l\'utilisez, plus il devient pertinent.',
  'Les recruteurs passent tres peu de temps sur un CV. Notre IA vous aide a aller a l\'essentiel.',
  'De nombreux postes ne sont jamais publies. JobBoat scrute les meilleures offres pour vous.',
  'Un bon score de matching augmente considerablement vos chances de decrocher un entretien.',
  'Conseil : Ajoutez vos certifications dans votre CV pour ameliorer votre profil.',
  'Les candidatures envoyees tot le matin ont souvent un meilleur taux de reponse.',
  'Notre algorithme analyse plusieurs dimensions de votre profil pour un matching precis.',
];

const MODULES = [
  { label: 'Coaching IA', to: '/coaching', desc: 'Session de coaching adaptatif', icon: 'brain', accent: true, gradient: 'linear-gradient(135deg, #94a3b833, #94a3b811)' },
  { label: 'Auto-Candidature', to: '/auto-apply', desc: 'Decouverte + candidatures automatisees', icon: 'rocket', gradient: 'linear-gradient(135deg, #10b98122, #10b98108)' },
  { label: 'Profil & KPIs', to: '/profile', desc: 'Metriques et progression', icon: 'chart', gradient: 'linear-gradient(135deg, #f59e0b22, #f59e0b08)' },
  { label: 'Constructeur CV', to: '/cv-builder', desc: 'Construis ton CV parfait', icon: 'doc', gradient: 'linear-gradient(135deg, #e879f922, #e879f908)' },
  { label: 'Marketing', to: '/marketing', desc: 'Marque personnelle IA', icon: 'megaphone', gradient: 'linear-gradient(135deg, #ef444422, #ef444408)' },
];

/* SVG icons for badge achievements */
function BadgeIcon({ name, locked }) {
  if (locked) {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
  }
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'cv': return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'rocket': return <svg {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></svg>;
    case 'brain': return <svg {...p}><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><path d="M9 21h6" /></svg>;
    case 'search': return <svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
    case 'flame': return <svg {...p}><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" /></svg>;
    case 'star': return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
    case 'briefcase': return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    case 'trophy': return <svg {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

/* SVG icons for module cards -- no emojis */
function ModuleIcon({ name }) {
  const props = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'brain': return <svg {...props}><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><path d="M9 21h6" /></svg>;
    case 'rocket': return <svg {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></svg>;
    case 'chart': return <svg {...props}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>;
    case 'doc': return <svg {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
    case 'megaphone': return <svg {...props}><path d="M3 11l18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState(null);
  const [applications, setApplications] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState('');

  useEffect(() => {
    setDashLoading(true);
    setDashError('');

    api.health().then(setHealth).catch(() => setHealth({ status: 'offline' }));

    const dataPromise = user?.email
      ? Promise.allSettled([
          api.v2KpiOverview(user.email),
          api.v2ActivitySummary(user.email),
          api.v2Applications(user.email)
        ]).then(([ov, act, apps]) => {
          if (ov.status === 'fulfilled') setOverview(ov.value);
          if (act.status === 'fulfilled') setActivity(act.value);
          if (apps.status === 'fulfilled') setApplications(apps.value?.applications || []);
          const allFailed = [ov, act, apps].every(r => r.status === 'rejected');
          if (allFailed) setDashError('Impossible de charger les donnees. Verifiez votre connexion.');
        })
      : Promise.resolve().then(() => {
          setDashError('Connectez-vous pour voir votre tableau de bord.');
        });

    dataPromise.finally(() => setDashLoading(false));
  }, [user?.email]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon apres-midi' : 'Bonsoir';

  const stats = useMemo(() => ({
    sessions: overview?.coaching_sessions_total ?? 0,
    apps: overview?.applications_total ?? 0,
    jobs: overview?.active_jobs ?? 0,
    score: overview?.overall_score ?? 0,
    hasCv: overview?.cv_ready ?? false,
    streak: overview?.login_streak || activity?.streak_days || 0,
  }), [overview, activity]);

  // Gamification: compute level + XP
  const totalXP = (stats.sessions * 25) + (stats.apps * 40) + (stats.score * 2);
  const level = Math.floor(totalXP / 200) + 1;
  const xpInLevel = totalXP % 200;
  const xpPercent = Math.min((xpInLevel / 200) * 100, 100);

  // Check for CV presence (API + localStorage fallback)
  const hasCv = Boolean(stats.hasCv || localStorage.getItem('jobboat_cv_uploaded') || stats.apps > 0);

  // Detect fresh user (zero activity)
  const isNewUser = (stats.sessions + stats.apps + stats.score) === 0 && !hasCv;

  // Contextual state thresholds
  const isStarter   = !isNewUser && stats.sessions < 5 && stats.apps < 5;
  const isActive    = (stats.sessions >= 5 || stats.apps >= 5) && level < 5;
  const isChampion  = level >= 5 || stats.score >= 70;

  // Badge computation
  const badgeState = { ...stats, hasCv };
  const earnedBadges = BADGES.filter(b => b.check(badgeState));
  const nextBadge = BADGES.find(b => !b.check(badgeState));

  // Daily motivational tip
  const dailyTip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return TIPS[dayOfYear % TIPS.length];
  }, []);

  return (
    <div className="dashboard">
      {/* Loading / Error states */}
      {dashLoading && (
        <div className="dash-loading fade-in-up" style={{ textAlign: 'center', padding: 'var(--jb-space-8) 0' }}>
          <div className="coaching__typing" style={{ justifyContent: 'center', gap: 6 }}>
            <span className="coaching__typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--jb-accent)', animation: 'typingBounce 1.4s ease-in-out infinite' }} />
            <span className="coaching__typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--jb-accent)', animation: 'typingBounce 1.4s ease-in-out infinite 0.2s' }} />
            <span className="coaching__typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--jb-accent)', animation: 'typingBounce 1.4s ease-in-out infinite 0.4s' }} />
          </div>
          <p className="text-muted" style={{ marginTop: 'var(--jb-space-3)', fontSize: 'var(--jb-text-sm)' }}>Chargement du tableau de bord...</p>
        </div>
      )}
      {dashError && !dashLoading && (
        <div className="glass-card fade-in-up" style={{ textAlign: 'center', padding: 'var(--jb-space-6)', margin: 'var(--jb-space-4) 0', borderColor: 'rgba(239,68,68,0.3)' }}>
          <p style={{ color: 'var(--jb-danger, #ef4444)', fontWeight: 500 }}>{dashError}</p>
          <button className="btn btn--secondary btn--sm" style={{ marginTop: 'var(--jb-space-3)' }} onClick={() => window.location.reload()}>Reessayer</button>
        </div>
      )}

      {/* ── Hero Welcome ── */}
      <section className="dash-hero fade-in-up">
        <div className="dash-hero__left">
          <h2 className="dash-hero__greeting font-display gradient-text">
            {greeting}, {user?.name || 'Navigator'}
          </h2>
          <p className="dash-hero__subtitle text-secondary">
            Votre centre de commande. Tous les systemes operationnels.
          </p>

          {/* XP Bar + Level */}
          <div className="dash-hero__xp">
            <div className="dash-hero__level">
              <div className="level-badge">{level}</div>
              <div className="dash-hero__xp-info">
                <span className="dash-hero__xp-label">Niveau {level}</span>
                <span className="dash-hero__xp-detail text-muted">{xpInLevel} / 200 XP</span>
              </div>
            </div>
            <div className="xp-bar" style={{ flex: 1 }}>
              <div className="xp-bar__fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="dash-hero__right">
          <div className="dash-hero__streak glass-card hover-lift">
            <span className="streak-flame">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--jb-warning, #f59e0b)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" /></svg>
            </span>
            <div>
              <div className="stat-value" style={{ fontSize: 'var(--jb-text-2xl)' }}>
                <AnimatedNumber value={stats.streak} />
              </div>
              <div className="stat-label">Jours consecutifs</div>
            </div>
          </div>
          <div className="dash-hero__status">
            <span className={`glow-dot ${health?.ok ? '' : 'glow-dot--warning'}`} />
            <span className="text-secondary" style={{ fontSize: 'var(--jb-text-xs)' }}>
              API {health?.ok ? 'En ligne' : 'Connexion...'}
            </span>
          </div>
        </div>
      </section>

      {/* ── Animated Stats ── */}
      <section className="dash-stats stagger-spring">
        <div className="gravity-card dash-stat-card hover-lift" data-depth="2">
          <div className="dash-stat-card__ring">
            <ProgressRing progress={Math.min(stats.sessions * 10, 100)} color="var(--jb-accent-secondary)" radius={32} stroke={4} />
            <span className="dash-stat-card__ring-value" style={{ fontSize: 'var(--jb-text-sm)' }}>
              <AnimatedNumber value={stats.sessions} />
            </span>
          </div>
          <div>
            <div className="stat-label">Sessions Coaching</div>
            <div className="stat-value" style={{ fontSize: 'var(--jb-text-xl)' }}>
              <AnimatedNumber value={stats.sessions} />
            </div>
          </div>
        </div>

        <div className="gravity-card dash-stat-card hover-lift" data-depth="2">
          <div className="dash-stat-card__ring">
            <ProgressRing progress={Math.min(stats.apps * 8, 100)} color="var(--jb-success)" radius={32} stroke={4} />
            <span className="dash-stat-card__ring-value" style={{ fontSize: 'var(--jb-text-sm)' }}>
              <AnimatedNumber value={stats.apps} />
            </span>
          </div>
          <div>
            <div className="stat-label">Candidatures</div>
            <div className="stat-value" style={{ fontSize: 'var(--jb-text-xl)' }}>
              <AnimatedNumber value={stats.apps} />
            </div>
          </div>
        </div>

        <div className="gravity-card dash-stat-card hover-lift" data-depth="3">
          <div className="dash-stat-card__ring">
            <ProgressRing progress={Math.min(stats.jobs * 5, 100)} color="var(--jb-accent)" radius={32} stroke={4} />
            <span className="dash-stat-card__ring-value" style={{ fontSize: 'var(--jb-text-sm)' }}>
              <AnimatedNumber value={stats.jobs} />
            </span>
          </div>
          <div>
            <div className="stat-label">Jobs Actifs</div>
            <div className="stat-value" style={{ fontSize: 'var(--jb-text-xl)' }}>
              <AnimatedNumber value={stats.jobs} />
            </div>
          </div>
        </div>

        <div className="gravity-card dash-stat-card hover-lift glass-card--accent" data-depth="3">
          <div className="dash-stat-card__ring">
            <ProgressRing progress={stats.score} color="var(--jb-accent)" radius={32} stroke={4} />
            <span className="dash-stat-card__ring-value" style={{ fontSize: 'var(--jb-text-sm)' }}>
              <AnimatedNumber value={stats.score} suffix="%" />
            </span>
          </div>
          <div>
            <div className="stat-label">Score Global</div>
            <div className="stat-value text-accent" style={{ fontSize: 'var(--jb-text-xl)' }}>
              <AnimatedNumber value={stats.score} suffix="%" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Motivational Tip ── */}
      <section className="dash-tip fade-in-up delay-1">
        <div className="glass-card dash-tip__card">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--jb-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="dash-tip__text">{dailyTip}</p>
        </div>
      </section>

      {/* ── Contextual state banners ── */}
      {!dashLoading && !dashError && (
        <>
          {/* STATE 1 — New user */}
          {isNewUser && (
            <section className="fade-in-up delay-2" style={{ marginBottom: 'var(--jb-space-4)' }}>
              <div className="glass-card" style={{ padding: '20px 24px', borderColor: 'rgba(79,158,255,0.25)', background: 'rgba(79,158,255,0.06)' }}>
                <h3 className="font-display" style={{ fontSize: 'var(--jb-text-xl)', fontWeight: 700, marginBottom: 10 }}>Bienvenue sur JobBoat</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginBottom: 14, maxWidth: 500 }}>
                  Importez votre CV ou lancez votre premier coaching pour que l\'IA commence a vous connaitre.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn--primary btn--sm" onClick={() => navigate('/cv-builder')}>Importer mon CV</button>
                  <button className="btn btn--secondary btn--sm" onClick={() => navigate('/coaching')}>Premier coaching</button>
                </div>
              </div>
            </section>
          )}

          {/* STATE 2 — Starter */}
          {isStarter && (
            <section className="fade-in-up delay-2" style={{ marginBottom: 'var(--jb-space-4)' }}>
              <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderColor: 'rgba(139,92,246,0.2)' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: 4 }}>Conseil du moment</div>
                  <p style={{ fontSize: 'var(--jb-text-sm)', color: 'var(--jb-text-secondary)', margin: 0 }}>
                    Continuez le coaching IA pour affiner votre profil et debloquer des metriques personnalisees.
                  </p>
                </div>
                <button className="btn btn--secondary btn--sm" onClick={() => navigate('/coaching')} style={{ flexShrink: 0 }}>
                  Lancer le coaching
                </button>
              </div>
            </section>
          )}

          {/* STATE 3 — Active user */}
          {isActive && (
            <section className="fade-in-up delay-2" style={{ marginBottom: 'var(--jb-space-4)' }}>
              <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderColor: 'rgba(16,185,129,0.2)' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: 4 }}>Tu progressses !</div>
                  <p style={{ fontSize: 'var(--jb-text-sm)', color: 'var(--jb-text-secondary)', margin: 0 }}>
                    Niveau {level} atteint · {stats.sessions} sessions · {stats.apps} candidatures. Continue pour débloquer de nouveaux badges.
                  </p>
                </div>
                <button className="btn btn--secondary btn--sm" onClick={() => navigate('/profile')} style={{ flexShrink: 0 }}>
                  Voir mes KPIs
                </button>
              </div>
            </section>
          )}

          {/* STATE 4 — Champion */}
          {isChampion && (
            <section className="fade-in-up delay-2" style={{ marginBottom: 'var(--jb-space-4)' }}>
              <div className="glass-card" style={{
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                borderColor: 'rgba(79,158,255,0.3)',
                background: 'linear-gradient(135deg, rgba(79,158,255,0.08), rgba(139,92,246,0.08))'
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--jb-neon-blue,#4f9eff)', textTransform: 'uppercase', marginBottom: 4 }}>Jobby Mind Champion</div>
                  <p style={{ fontSize: 'var(--jb-text-sm)', color: 'var(--jb-text-secondary)', margin: 0 }}>
                    Score {stats.score}% · Niveau {level}. Passez à Pro pour débloquer le mode IA illimité et les entretiens avancés.
                  </p>
                </div>
                <button className="btn btn--primary btn--sm" onClick={() => navigate('/settings?tab=subscription')} style={{ flexShrink: 0 }}>
                  Passer au Pro
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Badges / Achievements ── */}
      <section className="dash-badges fade-in-up delay-2">
        <div className="dash-badges__header">
          <h3 className="section-title" style={{ fontSize: 'var(--jb-text-xl)', marginBottom: 0 }}>Accomplissements</h3>
          <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>{earnedBadges.length} / {BADGES.length}</span>
        </div>
        <div className="dash-badges__grid">
          {BADGES.map(badge => {
            const earned = badge.check(badgeState);
            return (
              <div key={badge.id} className={`dash-badge glass-card hover-lift ${earned ? 'dash-badge--earned' : 'dash-badge--locked'}`} title={badge.desc}>
                <span className="dash-badge__icon"><BadgeIcon name={badge.icon} locked={!earned} /></span>
                <span className="dash-badge__label">{badge.label}</span>
              </div>
            );
          })}
        </div>
        {nextBadge && (
          <div className="dash-badges__next">
            <span className="text-secondary" style={{ fontSize: 'var(--jb-text-xs)' }}>
              Prochain objectif : <strong>{nextBadge.label}</strong> -- {nextBadge.desc}
            </span>
          </div>
        )}
      </section>

      {/* ── Module Cards ── */}
      <section className="dash-modules fade-in-up delay-2">
        <h3 className="section-title" style={{ fontSize: 'var(--jb-text-xl)', marginBottom: 'var(--jb-space-4)' }}>Modules</h3>
        <div className="dash-modules__grid stagger-children">
          {MODULES.map((mod) => (
            <button
              key={mod.to}
              className={`glass-card dash-module-card hover-lift ripple-container ${mod.accent ? 'border-glow' : ''}`}
              style={{ background: mod.gradient }}
              onClick={() => navigate(mod.to)}
            >
              <span className="dash-module-card__icon"><ModuleIcon name={mod.icon} /></span>
              <div className="dash-module-card__info">
                <span className="dash-module-card__label font-display">{mod.label}</span>
                <span className="dash-module-card__desc text-secondary">{mod.desc}</span>
              </div>
              <span className="dash-module-card__arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent Applications ── */}
      <section className="dash-recent fade-in-up delay-3">
        <h3 className="section-title" style={{ fontSize: 'var(--jb-text-xl)', marginBottom: 'var(--jb-space-4)' }}>Candidatures Recentes</h3>
        <div className="glass-card">
          {applications.length > 0 ? (
            <div className="dash-recent__list">
              {applications.slice(0, 5).map((app, i) => (
                <div key={app.id ?? app.job_id ?? app.application_id ?? `app-${(app.company || app.job_company)}-${(app.title || app.job_title)}-${i}`} className="dash-recent__item">
                  <div className="dash-recent__item-left">
                    <span className="dash-recent__item-company font-display">{app.company || app.job_company || 'Entreprise'}</span>
                    <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>{app.title || app.job_title || 'Poste'}</span>
                  </div>
                  <span className={`badge badge--${app.status === 'sent' ? 'success' : app.status === 'failed' ? 'danger' : 'accent'}`}>
                    {app.status === 'sent' ? 'Envoyee' : app.status === 'failed' ? 'Echec' : app.status || 'En cours'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-recent__empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>
              <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)' }}>
                Aucune candidature encore. Lance ta premiere depuis Auto-Apply !
              </p>
              <button className="btn btn--primary btn--sm btn-magnetic" onClick={() => navigate('/auto-apply')}>
                Lancer Auto-Apply
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── Activity Feed ── */}
      <section className="dash-activity fade-in-up delay-4">
        <h3 className="section-title" style={{ fontSize: 'var(--jb-text-xl)', marginBottom: 'var(--jb-space-4)' }}>Activite</h3>
        <div className="glass-card">
          {activity ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--jb-space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)' }}>
                  Evenements suivis: <strong className="text-accent"><AnimatedNumber value={activity.events_total || 0} /></strong>
                </span>
                <span className="badge badge--accent">
                  Score : {activity.behavior_profile?.overall ?? '--'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(activity.professional_flags || []).map((flag, idx) => (
                  <span key={`${flag}-${idx}`} className="badge badge--success">{flag}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)', textAlign: 'center', padding: 'var(--jb-space-6) 0' }}>
              L'activite se remplira au fur et a mesure de ton utilisation.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

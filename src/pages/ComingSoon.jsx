import { useState, useEffect, useRef } from 'react';
import { JobBoatMark } from '../components/JobBoatLogo';
import './coming-soon.css';

/* ── Launch date: 72 hours from Feb 14 2026 20:00 CET ── */
const LAUNCH_DATE = new Date('2026-02-17T20:00:00+01:00').getTime();

function getTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, LAUNCH_DATE - now);
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    total: diff,
  };
}

/* ── Countdown Block ── */
function CountdownUnit({ value, label }) {
  const display = String(value).padStart(2, '0');
  return (
    <div className="cs-timer__unit">
      <div className="cs-timer__digits">
        <span key={display} className="cs-timer__number">{display}</span>
      </div>
      <span className="cs-timer__label">{label}</span>
    </div>
  );
}

/* ── Floating particles (stars above the horizon) ── */
function Stars() {
  const count = 60;
  const stars = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 55,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 6,
      dur: Math.random() * 3 + 2,
    }))
  );
  return (
    <div className="cs-stars" aria-hidden="true">
      {stars.current.map((s, i) => (
        <div
          key={i}
          className="cs-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Email capture ── */
function EmailCapture() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    // Store locally for now; replace with API call later
    const list = JSON.parse(localStorage.getItem('jb_waitlist') || '[]');
    if (!list.includes(email)) {
      list.push(email);
      localStorage.setItem('jb_waitlist', JSON.stringify(list));
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="cs-email__success fade-in-up">
        <CheckSVG />
        <span>Vous etes sur la liste. Nous vous notifierons au lancement.</span>
      </div>
    );
  }

  return (
    <form className="cs-email" onSubmit={handleSubmit}>
      <input
        type="email"
        className="cs-email__input"
        placeholder="Entrez votre email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit" className="cs-email__btn">
        Me notifier
      </button>
    </form>
  );
}

/* ── Main Coming Soon Page ── */
export default function ComingSoon() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cs">
      {/* Sky */}
      <Stars />
      <div className="cs-moon" aria-hidden="true" />

      {/* Nav */}
      <nav className="cs-nav">
        <div className="cs-nav__brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <JobBoatMark size={26} />
          <div style={{ lineHeight: 1.1 }}>
            <span className="cs-nav__name font-display">JOBBOAT <span className="jb-sidebar__beta-tag">BETA</span></span>
            <span style={{ display: 'block', fontSize: '0.5rem', color: 'var(--jb-text-muted, rgba(255,255,255,0.4))', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>by AZZ&amp;CO LABS</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="cs-content">
        <div className="cs-badge fade-in-up">LANCEMENT IMMINENT</div>

        <h1 className="cs-title font-display fade-in-up delay-1">
          Le futur du recrutement<br />arrive bientot.
        </h1>

        <p className="cs-subtitle fade-in-up delay-2">
          JobBoat est une plateforme d'intelligence de carriere propulsee par l'IA
          qui ne se contente pas de trouver des emplois -- elle ingenierie toute votre
          trajectoire professionnelle. 572 patterns comportementaux analyses.
          Scoring sur 15 dimensions. Une seule plateforme.
        </p>

        {/* Timer */}
        <div className="cs-timer fade-in-up delay-3">
          <CountdownUnit value={time.days} label="JOURS" />
          <span className="cs-timer__sep">:</span>
          <CountdownUnit value={time.hours} label="HEURES" />
          <span className="cs-timer__sep">:</span>
          <CountdownUnit value={time.minutes} label="MIN" />
          <span className="cs-timer__sep">:</span>
          <CountdownUnit value={time.seconds} label="SEC" />
        </div>

        {/* Email capture */}
        <div className="cs-email-wrap fade-in-up delay-4">
          <p className="cs-email-cta">Soyez les premiers a bord.</p>
          <EmailCapture />
        </div>

        {/* Impact pills */}
        <div className="cs-impact fade-in-up delay-5">
          <div className="cs-impact__pill">
            <strong>3x</strong> plus rapide en matching
          </div>
          <div className="cs-impact__pill">
            <strong>572</strong> patterns comportementaux
          </div>
          <div className="cs-impact__pill">
            <strong>IA</strong> coaching en temps reel
          </div>
          <div className="cs-impact__pill">
            <strong>Zero</strong> candidature gaspillee
          </div>
        </div>

        {/* Value proposition */}
        <div className="cs-manifesto fade-in-up delay-5">
          <p>
            Chaque annee, des millions de professionnels qualifies envoient des
            milliers de candidatures dans le vide. Rejet sans explication.
            Ghosting a grande echelle. JobBoat existe pour mettre fin a ce cycle.
            Nous croyons que votre carriere merite la meme precision que les
            algorithmes qui propulsent la finance moderne. Intelligence
            comportementale, pas du matching par mots-cles. Design de
            trajectoire, pas du spam de CV.
          </p>
        </div>
      </main>

      {/* Ocean scene */}
      <div className="cs-ocean" aria-hidden="true">
        {/* Boat */}
        <div className="cs-boat">
          <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="cs-boat__svg">
            {/* Mast */}
            <line x1="60" y1="10" x2="60" y2="55" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Sail */}
            <path d="M60 14 L60 50 L38 50 Z" fill="rgba(226,232,240,0.12)" stroke="#64748b" strokeWidth="0.8" />
            <path d="M62 18 L62 48 L80 48 Z" fill="rgba(148,163,184,0.08)" stroke="#475569" strokeWidth="0.6" />
            {/* Hull */}
            <path d="M30 55 Q35 70 60 70 Q85 70 90 55 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            {/* Hull line */}
            <path d="M36 60 Q60 66 84 60" stroke="#475569" strokeWidth="0.5" fill="none" />
            {/* Flag */}
            <path d="M60 10 L60 6 L68 8 L60 10" fill="#94a3b8" />
            {/* Window */}
            <circle cx="55" cy="60" r="2" fill="#334155" stroke="#475569" strokeWidth="0.5" />
            <circle cx="65" cy="60" r="2" fill="#334155" stroke="#475569" strokeWidth="0.5" />
            {/* Light reflection on water */}
            <line x1="50" y1="72" x2="70" y2="72" stroke="rgba(148,163,184,0.15)" strokeWidth="0.5" />
            <line x1="45" y1="74" x2="75" y2="74" stroke="rgba(148,163,184,0.08)" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Moon reflection on water */}
        <div className="cs-ocean__reflection" />

        {/* Wave layers */}
        <svg className="cs-wave cs-wave--1" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120Z" fill="rgba(30,41,59,0.6)" />
        </svg>
        <svg className="cs-wave cs-wave--2" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,80 C360,40 720,100 1080,50 C1260,30 1380,70 1440,60 L1440,120 L0,120Z" fill="rgba(15,23,42,0.7)" />
        </svg>
        <svg className="cs-wave cs-wave--3" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,90 C180,60 360,100 540,70 C720,40 900,90 1080,60 C1260,30 1380,80 1440,70 L1440,120 L0,120Z" fill="rgba(3,7,17,0.9)" />
        </svg>
      </div>

      {/* Footer */}
      <footer className="cs-footer">
        <span>JobBoat V1 -- AZZ&CO LABS</span>
      </footer>
    </div>
  );
}

/* ── Check icon ── */
function CheckSVG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

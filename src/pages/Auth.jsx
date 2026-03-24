import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { JobBoatMark } from '../components/JobBoatLogo';
import { api } from '../services/apiClient';
import { supabase } from '../lib/supabase';
import './auth.css';

// ── Step constants ──
const STEP_CHOOSE = 'choose';
const STEP_PHONE_CODE = 'phone_code';
const STEP_PHONE_EMAIL = 'phone_email';
const STEP_MAGIC_SENT = 'magic_sent';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEP_CHOOSE);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  const isBusy = useMemo(() => Boolean(busy), [busy]);

  // ── OAuth (Google / Apple) ──
  async function signInOAuth(provider) {
    setBusy(provider);
    setError('');
    setInfo('');
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message || `Connexion ${provider} impossible.`);
    } finally {
      setBusy('');
    }
  }

  // ── Email magic link ──
  async function sendMagicLink(emailOverride) {
    const value = String(emailOverride || email || '').trim().toLowerCase();
    if (!value) {
      setError('Email requis.');
      return;
    }
    setBusy('email');
    setError('');
    setInfo('');
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: mailErr } = await supabase.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo: redirectTo },
      });
      if (mailErr) throw mailErr;
      setStep(STEP_MAGIC_SENT);
      setInfo(`Lien de connexion envoye a ${value}. Verifiez votre boite mail (et les spams).`);
    } catch (err) {
      setError(err.message || 'Envoi du lien impossible.');
    } finally {
      setBusy('');
    }
  }

  // ── Phone: send SMS code ──
  async function sendPhoneCode() {
    const normalizedPhone = String(phone || '').trim();
    if (!normalizedPhone) {
      setError('Numero de telephone requis.');
      return;
    }
    setBusy('phone-send');
    setError('');
    setInfo('');
    try {
      const res = await api.v2PhoneSendCode({ phone: normalizedPhone });
      const ok = Boolean(res?.success || res?.data?.success);
      if (!ok) {
        throw new Error(res?.error || res?.data?.error || 'Envoi du code impossible.');
      }
      setStep(STEP_PHONE_CODE);
      setInfo('Code SMS envoye. Consultez vos messages.');
    } catch (err) {
      setError(err.message || 'Erreur d\'envoi SMS.');
    } finally {
      setBusy('');
    }
  }

  // ── Phone: verify SMS code → then ask for email ──
  async function verifyPhoneCode() {
    const normalizedPhone = String(phone || '').trim();
    const code = String(phoneCode || '').trim();
    if (!normalizedPhone || !code) {
      setError('Numero et code requis.');
      return;
    }
    setBusy('phone-verify');
    setError('');
    setInfo('');
    try {
      const res = await api.v2PhoneVerify({ phone: normalizedPhone, code });
      const verified = Boolean(res?.verified || res?.data?.verified);
      if (!verified) {
        throw new Error(res?.error || res?.data?.error || 'Verification echouee.');
      }
      setPhoneCode('');
      setStep(STEP_PHONE_EMAIL);
      setInfo('Numero verifie ! Entrez votre email pour finaliser la creation de votre compte.');
    } catch (err) {
      setError(err.message || 'Verification SMS impossible.');
    } finally {
      setBusy('');
    }
  }

  // ── Phone flow: after phone verified, send magic link to complete session ──
  async function completePhoneSignup() {
    const value = String(email || '').trim().toLowerCase();
    if (!value) {
      setError('Email requis pour creer votre compte.');
      return;
    }
    await sendMagicLink(value);
  }

  // ── Helper: divider ──
  function Divider({ label }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.15)' }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--jb-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.15)' }} />
      </div>
    );
  }

  // ── Helper: back button ──
  function BackButton() {
    return (
      <button
        className="btn btn--ghost btn--sm"
        onClick={() => { setStep(STEP_CHOOSE); setError(''); setInfo(''); setPhoneCode(''); }}
        style={{ alignSelf: 'flex-start', fontSize: 'var(--jb-text-xs)', padding: '4px 0', marginBottom: 4 }}
      >
        ← Retour
      </button>
    );
  }

  return (
    <div className="auth-page">
      <div className="stars-bg" />
      <div className="page-bg" />

      <div className="auth-container fade-in-up">
        {/* Left panel -- branding */}
        <div className="auth-brand">
          <div className="auth-brand__inner">
            <JobBoatMark size={44} />
            <h2 className="font-display" style={{ fontSize: 'var(--jb-text-3xl)', fontWeight: 700, letterSpacing: '-0.03em', marginTop: 16 }}>
              JobBoat <span className="jb-sidebar__beta-tag">BETA</span>
            </h2>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--jb-text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: -4 }}>by AZZ&amp;CO LABS</span>
            <p className="text-secondary" style={{ marginTop: 8, lineHeight: 1.6 }}>
              Plateforme d'intelligence de carriere propulsee par l'IA.
              Coaching de precision, analyse comportementale et matching automatise.
            </p>

            <div className="auth-brand__features">
              <div className="auth-brand__feature">
                <span className="glow-dot" />
                <span>572 patterns comportementaux</span>
              </div>
              <div className="auth-brand__feature">
                <span className="glow-dot" />
                <span>Scoring sur 15 dimensions</span>
              </div>
              <div className="auth-brand__feature">
                <span className="glow-dot" />
                <span>Tracking EWMA adaptatif</span>
              </div>
              <div className="auth-brand__feature">
                <span className="glow-dot" />
                <span>Candidature automatique par email</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel -- connect */}
        <div className="auth-form-panel">
          <div className="auth-form-panel__inner">

            {/* ═══════ STEP: CHOOSE (main screen) ═══════ */}
            {step === STEP_CHOOSE && (
              <>
                <h3 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700 }}>Bienvenue</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginTop: 4 }}>
                  Connectez-vous ou creez un compte en quelques secondes.
                </p>

                <div className="auth-form" style={{ marginTop: 'var(--jb-space-6)', display: 'grid', gap: 10 }}>
                  {/* Google */}
                  <button className="btn btn--primary btn--lg btn--full" onClick={() => signInOAuth('google')} disabled={isBusy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {busy === 'google' ? 'Connexion Google...' : 'Continuer avec Google'}
                  </button>

                  {/* Apple */}
                  <button className="btn btn--outline btn--lg btn--full" onClick={() => signInOAuth('apple')} disabled={isBusy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    {busy === 'apple' ? 'Connexion Apple...' : 'Continuer avec Apple'}
                  </button>

                  <Divider label="Email" />

                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    disabled={isBusy}
                    onKeyDown={(e) => e.key === 'Enter' && sendMagicLink()}
                  />
                  <button className="btn btn--secondary btn--full" onClick={() => sendMagicLink()} disabled={isBusy}>
                    {busy === 'email' ? 'Envoi du lien...' : 'Envoyer un lien magique'}
                  </button>

                  <Divider label="Telephone" />

                  <input
                    className="input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                    disabled={isBusy}
                    onKeyDown={(e) => e.key === 'Enter' && sendPhoneCode()}
                  />
                  <button className="btn btn--secondary btn--full" onClick={sendPhoneCode} disabled={isBusy}>
                    {busy === 'phone-send' ? 'Envoi SMS...' : 'Envoyer code SMS'}
                  </button>

                  {/* LinkedIn */}
                  <button
                    className="btn btn--ghost btn--full"
                    onClick={async () => {
                      setBusy('linkedin');
                      setError('');
                      try {
                        const res = await api.linkedinAuthUrl();
                        if (res?.url) {
                          window.location.href = res.url;
                          return;
                        }
                        throw new Error(res?.error || 'LinkedIn non disponible.');
                      } catch (err) {
                        setError(err.message || 'Erreur LinkedIn');
                        setBusy('');
                      }
                    }}
                    disabled={isBusy}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    {busy === 'linkedin' ? 'Redirection LinkedIn...' : 'Continuer avec LinkedIn'}
                  </button>
                </div>
              </>
            )}

            {/* ═══════ STEP: PHONE CODE (enter 6-digit SMS code) ═══════ */}
            {step === STEP_PHONE_CODE && (
              <>
                <BackButton />
                <h3 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700 }}>Verification SMS</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginTop: 4 }}>
                  Entrez le code a 6 chiffres envoye au <strong>{phone}</strong>.
                </p>

                <div className="auth-form" style={{ marginTop: 'var(--jb-space-6)', display: 'grid', gap: 10 }}>
                  <input
                    className="input"
                    type="text"
                    maxLength={6}
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Code a 6 chiffres"
                    disabled={isBusy}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && phoneCode.length === 6 && verifyPhoneCode()}
                    style={{ fontSize: 'var(--jb-text-xl)', letterSpacing: '0.3em', textAlign: 'center' }}
                  />
                  <button className="btn btn--primary btn--full" onClick={verifyPhoneCode} disabled={isBusy || phoneCode.length !== 6}>
                    {busy === 'phone-verify' ? <><span className="auth-spinner" /> Verification...</> : 'Verifier le code'}
                  </button>
                  <button className="btn btn--ghost btn--sm btn--full" onClick={sendPhoneCode} disabled={isBusy} style={{ fontSize: 'var(--jb-text-xs)' }}>
                    Renvoyer le code
                  </button>
                </div>
              </>
            )}

            {/* ═══════ STEP: PHONE EMAIL (phone verified, now enter email) ═══════ */}
            {step === STEP_PHONE_EMAIL && (
              <>
                <BackButton />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span style={{ color: '#34d399', fontWeight: 600, fontSize: 'var(--jb-text-sm)' }}>Telephone verifie !</span>
                </div>
                <h3 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700 }}>Finalisez votre compte</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginTop: 4 }}>
                  Entrez votre email pour creer votre session. Un lien de connexion sera envoye.
                </p>

                <div className="auth-form" style={{ marginTop: 'var(--jb-space-6)', display: 'grid', gap: 10 }}>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    disabled={isBusy}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && completePhoneSignup()}
                  />
                  <button className="btn btn--primary btn--lg btn--full" onClick={completePhoneSignup} disabled={isBusy}>
                    {busy === 'email' ? <><span className="auth-spinner" /> Envoi...</> : 'Creer mon compte'}
                  </button>

                  <Divider label="ou connectez-vous directement" />

                  <button className="btn btn--outline btn--full" onClick={() => signInOAuth('google')} disabled={isBusy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continuer avec Google
                  </button>

                  <button className="btn btn--outline btn--full" onClick={() => signInOAuth('apple')} disabled={isBusy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continuer avec Apple
                  </button>
                </div>
              </>
            )}

            {/* ═══════ STEP: MAGIC LINK SENT (waiting) ═══════ */}
            {step === STEP_MAGIC_SENT && (
              <>
                <BackButton />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span style={{ color: '#6366f1', fontWeight: 600, fontSize: 'var(--jb-text-sm)' }}>Email envoye !</span>
                </div>
                <h3 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700 }}>Verifiez votre email</h3>
                <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginTop: 4, lineHeight: 1.6 }}>
                  Nous avons envoye un lien de connexion a <strong>{email}</strong>.<br />
                  Cliquez dessus pour vous connecter. Pensez a verifier vos spams.
                </p>

                <div className="auth-form" style={{ marginTop: 'var(--jb-space-6)', display: 'grid', gap: 10 }}>
                  <button className="btn btn--secondary btn--full" onClick={() => sendMagicLink()} disabled={isBusy}>
                    {busy === 'email' ? 'Renvoi...' : 'Renvoyer le lien'}
                  </button>
                  <button className="btn btn--ghost btn--full" onClick={() => { setStep(STEP_CHOOSE); setError(''); setInfo(''); }}>
                    Utiliser une autre methode
                  </button>
                </div>
              </>
            )}

            {/* ═══════ Messages (always visible) ═══════ */}
            {error && <p className="auth-error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
            {info && !error && <p className="auth-info" style={{ marginTop: 12 }}>{info}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

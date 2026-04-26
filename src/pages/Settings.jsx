import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getProfile,
  updateUserName,
  updateProfile,
  uploadAvatar,
  changePassword,
} from '../services/profileService';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';
import { loadStripe } from '@stripe/stripe-js';
import ReferralCard from '../components/ReferralCard';
import ContactModal from '../components/ContactModal';
import './settings.css';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

/* ────────────────────────────────────────────────────────────
   TABS
   ──────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'profile',       label: 'Profil',             icon: UserIcon },
  { id: 'billing',       label: 'Facturation',        icon: InvoiceIcon },
  { id: 'subscription',  label: 'Abonnement',         icon: StarIcon },
  { id: 'payment',       label: 'Paiement',           icon: CardIcon },
  { id: 'preferences',   label: 'Preferences',        icon: SlidersIcon },
  { id: 'system',        label: 'Systeme',            icon: CpuIcon },
];

/* ────────────────────────────────────────────────────────────
   PLANS
   ──────────────────────────────────────────────────────────── */
const PLANS = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0',
    period: '/mois',
    features: [
      'CV Builder complet + enrichissement IA',
      '10 candidatures auto par jour',
      '15 sessions coaching par jour',
      'Tableau de bord standard',
    ],
    cta: 'Plan actuel',
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29',
    period: '/mois',
    popular: true,
    features: [
      'Analyse de CV avancee (15 dimensions)',
      'Candidatures illimitees',
      'Coaching IA illimite',
      'Personas adaptatifs',
      'Rapports KPI detailles',
      'Support prioritaire',
    ],
    cta: 'Passer au Pro',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '49',
    period: '/mois',
    features: [
      'Tout le plan Pro',
      'Coaching IA intensif illimite',
      'Personas adaptatifs avances',
      'Analytics coaching detailles',
      'Sessions vocales illimitees',
      'Support prioritaire',
    ],
    cta: 'Passer au Growth',
  },
  {
    id: 'enterprise',
    name: 'Entreprise',
    price: '99',
    period: '/mois',
    features: [
      'Tout le plan Pro',
      'Candidatures illimitees',
      'API acces direct',
      'Marque blanche',
      'Gestionnaire de compte dedie',
      'SLA garanti 99.9%',
      'Integration SIRH',
    ],
    cta: 'Contacter les ventes',
  },
];

export default function Settings() {
  const { user, logout, updateEmail, updateName } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showContact, setShowContact] = useState(false);

  // Profile state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Payment success banner (shown after Stripe redirect)
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // User fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [targetJob, setTargetJob] = useState('');
  const [summary, setSummary] = useState('');
  const [yearsExp, setYearsExp] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Preferences
  const [notifications, setNotifications] = useState(true);
  const [coachingVoice, setCoachingVoice] = useState(true);
  const [autoApplyLimit, setAutoApplyLimit] = useState(10);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);

  // Phone verification
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMsg, setOtpMsg] = useState({ type: '', text: '' });

  // DB user id
  const [dbUserId, setDbUserId] = useState(null);

  // Subscription state
  const [subPlan, setSubPlan] = useState('free');
  const [subStatus, setSubStatus] = useState('active');
  const [subEndDate, setSubEndDate] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // Handle Stripe success redirect: ?status=success&session_id=cs_xxx
  useEffect(() => {
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session_id');
    const tab = searchParams.get('tab');

    if (tab) setActiveTab(tab);

    if (status === 'success' && sessionId) {
      // Verify session directly with Stripe — no webhook dependency
      api.v2StripeVerifySession({ sessionId })
        .then(data => {
          if (data.verified) {
            setSubPlan(data.plan || 'pro');
            setSubStatus('active');
            setPaymentSuccess(data.plan || 'pro');
          }
          // Always reload from DB after verify to get the freshest state
          loadSubscription();
        })
        .catch(err => {
          console.warn('[Settings] verify-session error:', err.message);
          loadSubscription();
        })
        .finally(() => {
          // Clean the URL params so refresh doesn't re-trigger
          navigate('/settings?tab=subscription', { replace: true });
        });
    } else if (status === 'cancelled') {
      flash('info', 'Paiement annule. Vous pouvez reessayer a tout moment.');
      navigate('/settings?tab=subscription', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load profile on mount
  // Skip loadSubscription on initial mount if processing a Stripe redirect
  // (the verify-session effect handles subscription state in that case)
  useEffect(() => {
    const hasStripeRedirect = searchParams.get('status') === 'success' && searchParams.get('session_id');
    loadProfile();
    if (!hasStripeRedirect) loadSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadSubscription() {
    try {
      const data = await api.v2StripeSubscriptionStatus();
      if (data.success) {
        setSubPlan(data.plan || 'free');
        setSubStatus(data.status || 'active');
        setSubEndDate(data.endDate || null);
      }
    } catch {
      // Stripe not configured yet -- keep defaults
    }
  }

  async function handleSubscribe(planId) {
    setCheckoutLoading(planId);
    try {
      const data = await api.v2StripeCheckout({ planId });
      if (data.url) {
        window.location.href = data.url;
      } else {
        flash('error', 'Impossible de creer la session de paiement.');
      }
    } catch (err) {
      flash('error', err.message || 'Erreur lors du paiement.');
    }
    setCheckoutLoading(null);
  }

  async function handleManageBilling() {
    try {
      const data = await api.v2StripePortal({});
      if (data.url) {
        window.location.href = data.url;
      } else {
        flash('info', 'Le portail de facturation sera bientot disponible.');
      }
    } catch (err) {
      flash('error', err.message || 'Erreur.');
    }
  }

  async function loadProfile() {
    setLoading(true);
    try {
      const userEmail = user?.email;
      if (!userEmail) { setLoading(false); return; }

      const { data: dbUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .single();

      if (dbUser) {
        setDbUserId(dbUser.id);
        setDisplayName(dbUser.name || user?.name || '');
        setEmail(dbUser.email || userEmail);

        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', dbUser.id)
          .single();

        if (prof) {
          setPhone(prof.phone || '');
          setLocation(prof.location || '');
          setTargetJob(prof.target_job_title || '');
          setSummary(prof.summary || '');
          setYearsExp(prof.years_experience || 0);
          setAvatarUrl(prof.preferences_json?.avatar_url || '');

          setPhoneVerified(prof.phone_verified || false);

          const prefs = prof.preferences_json || {};
          if (prefs.notifications !== undefined) setNotifications(prefs.notifications);
          if (prefs.coachingVoice !== undefined) setCoachingVoice(prefs.coachingVoice);
          if (prefs.autoApplyLimit !== undefined) setAutoApplyLimit(prefs.autoApplyLimit);
          if (prefs.smsNotifications !== undefined) setSmsNotifications(prefs.smsNotifications);
          if (prefs.jobAlerts !== undefined) setJobAlerts(prefs.jobAlerts);
        }
      } else {
        setDisplayName(user?.name || '');
        setEmail(userEmail);
      }
    } catch (err) {
      console.warn('[Settings] Echec chargement profil:', err.message);
      setDisplayName(user?.name || '');
      setEmail(user?.email || '');
    }
    setLoading(false);
  }

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      if (dbUserId) {
        await updateUserName(dbUserId, displayName);
        await updateProfile(dbUserId, {
          phone, phone_verified: phoneVerified, location, target_job_title: targetJob, summary,
          years_experience: yearsExp,
          preferences_json: { avatar_url: avatarUrl, notifications, coachingVoice, autoApplyLimit, smsNotifications, jobAlerts },
        });
      }
      localStorage.setItem('jobboat_settings', JSON.stringify({ notifications, coachingVoice, autoApplyLimit }));
      if (displayName && updateName) updateName(displayName);
      flash('success', 'Profil sauvegarde avec succes.');
    } catch (err) {
      flash('error', 'Erreur : ' + err.message);
    }
    setSaving(false);
  }

  const [avatarUploading, setAvatarUploading] = useState(false);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file || !dbUserId) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      flash('error', 'Format non supporte. Utilisez JPEG, PNG, GIF ou WebP.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      flash('error', 'Image trop volumineuse (max 5 Mo).');
      return;
    }

    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(dbUserId, file);
      setAvatarUrl(url);
      window.dispatchEvent(new CustomEvent('jobboat:avatar-updated', { detail: { avatarUrl: url } }));
      flash('success', 'Photo de profil mise a jour.');
    } catch (err) {
      console.warn('[Avatar] Supabase Storage upload failed, using base64 fallback:', err.message);
      // Fallback: convert to base64 and store directly in profile
      try {
        const reader = new FileReader();
        const base64Url = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        // Store base64 URL in preferences_json
        await updateProfile(dbUserId, {
          preferences_json: { ...getCurrentPrefs(), avatar_url: base64Url }
        });
        setAvatarUrl(base64Url);
        window.dispatchEvent(new CustomEvent('jobboat:avatar-updated', { detail: { avatarUrl: base64Url } }));
        flash('success', 'Photo mise a jour (stockage local).');
      } catch (fallbackErr) {
        flash('error', 'Erreur upload : ' + err.message);
      }
    }
    setAvatarUploading(false);
  }

  function getCurrentPrefs() {
    return { avatar_url: avatarUrl, notifications, coachingVoice, autoApplyLimit, smsNotifications, jobAlerts };
  }

  async function handleChangePassword() {
    if (!newPass || newPass.length < 6) {
      flash('error', 'Le mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      flash('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setPassLoading(true);
    try {
      await changePassword(newPass);
      setNewPass('');
      setConfirmPass('');
      flash('success', 'Mot de passe modifie avec succes.');
    } catch (err) {
      flash('error', 'Erreur : ' + err.message);
    }
    setPassLoading(false);
  }

  const [cancelLoading, setCancelLoading] = useState(false);

  function handleDeleteAccount() {
    navigate('/delete-account');
  }

  const [exporting, setExporting] = useState(false);
  async function handleExportData() {
    if (!email) {
      flash('error', 'Connectez-vous pour exporter vos donnees.');
      return;
    }
    setExporting(true);
    try {
      const res = await api.v2ComplianceExport(email);
      if (!res || res.success === false) {
        throw new Error(res?.error || 'Export impossible.');
      }
      // Download the JSON as a file (GDPR Art. 15: portable, machine-readable)
      const blob = new Blob([JSON.stringify(res.export || res, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobboat-export-${email.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flash('success', 'Export telecharge avec succes.');
    } catch (err) {
      console.error('[Settings] export failed:', err);
      flash('error', err?.message || 'Export impossible. Contactez le support.');
    } finally {
      setExporting(false);
    }
  }

  async function handleCancelSubscription() {
    if (cancelLoading) return;
    setCancelLoading(true);
    try {
      const data = await api.v2StripeCancelSubscription();
      if (data.success) {
        setSubStatus('canceling');
        if (data.endsAt) setSubEndDate(data.endsAt);
        flash('success', `Abonnement annule. Acces actif jusqu'au ${new Date(data.endsAt).toLocaleDateString('fr-FR')}.`);
      }
    } catch (err) {
      flash('error', err.message || 'Erreur lors de l\'annulation.');
    }
    setCancelLoading(false);
  }

  if (loading) {
    return (
      <div className="settings">
        <div className="settings__header fade-in-up">
          <h2 className="section-title">Reglages</h2>
          <p className="section-subtitle">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings__header fade-in-up">
        <h2 className="section-title">Reglages</h2>
        <p className="section-subtitle">
          Gerez votre profil, votre abonnement, vos moyens de paiement et vos preferences.
        </p>
      </div>

      {msg.text && (
        <div className={`settings__flash settings__flash--${msg.type} fade-in-up`}>
          {msg.text}
        </div>
      )}

      {paymentSuccess && (
        <div className="settings__flash settings__flash--success fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--jb-space-4)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>
            <strong>Paiement confirme !</strong> Votre plan <strong>{paymentSuccess.charAt(0).toUpperCase() + paymentSuccess.slice(1)}</strong> est maintenant actif. Profitez de toutes les fonctionnalites.
          </span>
          <button onClick={() => setPaymentSuccess(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Tab Navigation ── */}
      <div className="settings__tabs fade-in-up">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`settings__tab ${activeTab === tab.id ? 'settings__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="settings__tab-content fade-in-up delay-1">

        {/* ════════════════ PROFIL ════════════════ */}
        {activeTab === 'profile' && (
          <div className="settings__grid">
            {/* Photo */}
            <div className="glass-card settings__section settings__avatar-section">
              <h3 className="font-display settings__section-title">Photo de profil</h3>
              <div className="settings__avatar-row">
                <div className="settings__avatar-circle" onClick={() => !avatarUploading && fileRef.current?.click()} style={avatarUploading ? { opacity: 0.6, pointerEvents: 'none' } : {}}>
                  {avatarUploading ? (
                    <span className="settings__avatar-letter" style={{ fontSize: 'var(--jb-text-xs)' }}>Upload...</span>
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="settings__avatar-img" />
                  ) : (
                    <span className="settings__avatar-letter">
                      {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                  {!avatarUploading && (
                    <div className="settings__avatar-overlay">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="settings__avatar-info">
                  <p style={{ fontWeight: 500 }}>{displayName || 'Utilisateur'}</p>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>{email}</p>
                  <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()} disabled={avatarUploading}>
                    {avatarUploading ? 'Upload en cours...' : 'Changer la photo'}
                  </button>
                  <span className="text-muted" style={{ fontSize: '0.6rem', marginTop: 2 }}>JPEG, PNG, GIF ou WebP (max 5 Mo)</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            {/* Informations personnelles */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Informations personnelles</h3>
              <div className="settings__field">
                <label className="label">Nom complet</label>
                <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Votre nom" />
              </div>
              <div className="settings__field">
                <label className="label">Email</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" style={{ flex: 1 }} />
                  <button className="btn btn--secondary btn--sm" type="button" onClick={() => {
                    const val = email.trim().toLowerCase();
                    if (!val || !val.includes('@')) { flash('error', 'Veuillez entrer une adresse email valide.'); return; }
                    updateEmail(val);
                    flash('success', 'Email mis a jour.');
                  }}>
                    Mettre a jour
                  </button>
                </div>
                <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', marginTop: 4 }}>
                  Cet email est utilise pour toutes les communications et l'authentification.
                </span>
              </div>
              <div className="settings__field">
                <label className="label">Telephone</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="input" type="tel" value={phone} onChange={e => { setPhone(e.target.value); setPhoneVerified(false); setOtpSent(false); setOtpCode(''); setOtpMsg({ type: '', text: '' }); }} placeholder="+33 6 12 34 56 78" style={{ flex: 1 }} />
                  {phone && !phoneVerified && !otpSent && (
                    <button className="btn btn--secondary btn--sm" type="button" disabled={otpLoading} onClick={async () => {
                      setOtpLoading(true);
                      setOtpMsg({ type: '', text: '' });
                      try {
                        const res = await api.v2PhoneSendCode({ phone });
                        const data = res.data || res;
                        if (data.success) {
                          setOtpSent(true);
                          setOtpMsg({ type: 'success', text: 'Code envoye par SMS!' });
                        } else {
                          setOtpMsg({ type: 'error', text: data.error || 'Erreur envoi SMS' });
                        }
                      } catch (err) {
                        const msg = err.response?.data?.error || err.message || '';
                        if (msg.includes('non configure') || msg.includes('not configured') || err.status === 503) {
                          setOtpMsg({ type: 'error', text: 'Service SMS temporairement indisponible.' });
                        } else {
                          setOtpMsg({ type: 'error', text: msg || 'Erreur envoi SMS' });
                        }
                      }
                      setOtpLoading(false);
                    }}>
                      {otpLoading ? 'Envoi...' : 'Verifier'}
                    </button>
                  )}
                  {phoneVerified && (
                    <span style={{ color: 'var(--jb-success, #22c55e)', fontWeight: 600, fontSize: 'var(--jb-text-sm)', whiteSpace: 'nowrap' }}>Verifie</span>
                  )}
                </div>
                {otpSent && !phoneVerified && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="input" type="text" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} placeholder="Code a 6 chiffres" style={{ maxWidth: 160 }} />
                    <button className="btn btn--primary btn--sm" type="button" disabled={otpLoading || otpCode.length !== 6} onClick={async () => {
                      setOtpLoading(true);
                      setOtpMsg({ type: '', text: '' });
                      try {
                        const res = await api.v2PhoneVerify({ phone, code: otpCode });
                        const data = res.data || res;
                        if (data.success && data.verified) {
                          setPhoneVerified(true);
                          setOtpSent(false);
                          setOtpMsg({ type: 'success', text: 'Numero verifie!' });
                        } else {
                          setOtpMsg({ type: 'error', text: data.error || 'Code incorrect' });
                        }
                      } catch (err) {
                        setOtpMsg({ type: 'error', text: err.response?.data?.error || err.message });
                      }
                      setOtpLoading(false);
                    }}>
                      Confirmer
                    </button>
                  </div>
                )}
                {otpMsg.text && (
                  <span style={{ fontSize: 'var(--jb-text-xs)', marginTop: 4, color: otpMsg.type === 'error' ? 'var(--jb-danger, #ef4444)' : 'var(--jb-success, #22c55e)' }}>
                    {otpMsg.text}
                  </span>
                )}
              </div>
              <div className="settings__field">
                <label className="label">Localisation</label>
                <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Paris, France" />
              </div>
            </div>

            {/* Profil professionnel */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Profil professionnel</h3>
              <div className="settings__field">
                <label className="label">Poste recherche</label>
                <input className="input" value={targetJob} onChange={e => setTargetJob(e.target.value)} placeholder="Developpeur Full Stack, Product Manager..." />
              </div>
              <div className="settings__field">
                <label className="label">Annees d'experience</label>
                <input className="input" type="number" min={0} max={50} value={yearsExp} onChange={e => setYearsExp(Number(e.target.value))} style={{ maxWidth: 120 }} />
              </div>
              <div className="settings__field">
                <label className="label">Resume / Bio</label>
                <textarea className="input settings__textarea" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Une breve description de votre parcours et vos objectifs..." rows={4} />
              </div>
            </div>

            {/* Securite */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Securite</h3>
              <div className="settings__field">
                <label className="label">Nouveau mot de passe</label>
                <input className="input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Minimum 6 caracteres" minLength={6} />
              </div>
              <div className="settings__field">
                <label className="label">Confirmer le mot de passe</label>
                <input className="input" type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Retapez le mot de passe" />
              </div>
              <button className="btn btn--secondary" onClick={handleChangePassword} disabled={passLoading} style={{ alignSelf: 'flex-start' }}>
                {passLoading ? 'Modification...' : 'Changer le mot de passe'}
              </button>
            </div>

            {/* Actions */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Actions</h3>
              <div className="settings__actions">
                <button className="btn btn--primary" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
                </button>
                <button className="btn btn--danger" onClick={handleDeleteAccount} style={{ marginTop: 8 }}>
                  Supprimer le compte
                </button>
              </div>
            </div>

            {/* Referral */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Programme de parrainage</h3>
              <ReferralCard />
            </div>
          </div>
        )}

        {/* ════════════════ FACTURATION ════════════════ */}
        {activeTab === 'billing' && (
          <div className="settings__billing">
            {/* Resume du plan */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Plan actuel</h3>
              <div className="settings__plan-badge">
                <span className="badge badge--accent">{subPlan === 'free' ? 'Gratuit' : subPlan.charAt(0).toUpperCase() + subPlan.slice(1)}</span>
                <span className="text-muted" style={{ fontSize: 'var(--jb-text-sm)' }}>
                  {subPlan === 'free'
                    ? 'Vous utilisez le plan gratuit. Passez au Pro pour debloquer toutes les fonctionnalites.'
                    : `Votre abonnement ${subPlan} est ${subStatus === 'active' ? 'actif' : subStatus}.`}
                </span>
              </div>
              <div className="settings__billing-summary">
                <div className="settings__billing-stat">
                  <span className="settings__billing-stat-value">
                    {subPlan === 'pro' ? '29,00' : subPlan === 'enterprise' ? '99,00' : '0,00'} &euro;
                  </span>
                  <span className="text-muted">Prochain paiement</span>
                </div>
                <div className="settings__billing-stat">
                  <span className="settings__billing-stat-value">
                    {subEndDate ? new Date(subEndDate).toLocaleDateString('fr-FR') : '--'}
                  </span>
                  <span className="text-muted">Date de renouvellement</span>
                </div>
                <div className="settings__billing-stat">
                  <span className="settings__billing-stat-value">Mensuel</span>
                  <span className="text-muted">Cycle de facturation</span>
                </div>
              </div>
              {subPlan !== 'free' && (
                <button className="btn btn--secondary" style={{ marginTop: 16 }} onClick={handleManageBilling}>
                  Gerer la facturation via Stripe
                </button>
              )}
            </div>

            {/* Historique des factures */}
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Historique des factures</h3>
              {subPlan === 'free' ? (
                <div className="settings__empty-state">
                  <InvoiceIcon />
                  <p>Aucune facture pour le moment.</p>
                  <span className="text-muted" style={{ fontSize: 'var(--jb-text-sm)' }}>
                    Les factures apparaitront ici une fois que vous aurez souscrit a un plan payant.
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-muted" style={{ marginBottom: 12 }}>
                    Consultez et telechargez vos factures directement depuis le portail Stripe.
                  </p>
                  <button className="btn btn--secondary" onClick={handleManageBilling}>
                    Voir mes factures
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════ ABONNEMENT ════════════════ */}
        {activeTab === 'subscription' && (
          <div className="settings__subscription">
            {subPlan === 'free' && (
              <div className="glass-card settings__promo-banner fade-in-up">
                <div className="settings__promo-content">
                  <strong>7 jours gratuits</strong>
                  <p>Essayez Pro ou Enterprise gratuitement pendant 7 jours. Annulez avant la fin de l'essai et vous ne serez pas facture.</p>
                </div>
              </div>
            )}
            <div className="settings__plans-grid">
              {PLANS.map(plan => {
                const isCurrent = plan.id === subPlan;
                return (
                  <div key={plan.id} className={`glass-card settings__plan-card ${plan.popular ? 'settings__plan-card--popular' : ''} ${isCurrent ? 'settings__plan-card--current' : ''}`}>
                    {plan.popular && <div className="settings__plan-popular-tag">Le plus populaire</div>}
                    {isCurrent && <div className="settings__plan-current-tag">Plan actuel</div>}
                    <h3 className="font-display settings__plan-name">{plan.name}</h3>
                    <div className="settings__plan-price">
                      <span className="settings__plan-amount">{plan.price}&euro;</span>
                      <span className="text-muted">{plan.period}</span>
                    </div>
                    {plan.id !== 'free' && !isCurrent && (
                      <div className="settings__plan-trial-badge">7 jours gratuits</div>
                    )}
                    <ul className="settings__plan-features">
                      {plan.features.map((f, i) => (
                        <li key={i}>
                          <CheckIcon />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className={`btn ${isCurrent ? 'btn--ghost' : plan.popular ? 'btn--primary' : 'btn--secondary'} btn--full`}
                      disabled={isCurrent || checkoutLoading === plan.id}
                      onClick={() => {
                        if (plan.id === 'free') return;
                        if (plan.id === 'enterprise') {
                          window.open('https://azzcolabs.business', '_blank', 'noopener,noreferrer');
                        } else {
                          handleSubscribe(plan.id);
                        }
                      }}
                    >
                      {checkoutLoading === plan.id ? 'Redirection...' : isCurrent ? 'Plan actuel' : plan.cta}
                    </button>
                  </div>
                );
              })}
            </div>

            {subPlan !== 'free' && (
              <div className="glass-card settings__section" style={{ marginTop: 24 }}>
                <h3 className="font-display settings__section-title">Gestion de l'abonnement</h3>
                <p className="text-muted" style={{ marginBottom: 12 }}>
                  Plan actuel : <strong>{subPlan.charAt(0).toUpperCase() + subPlan.slice(1)}</strong>
                  {subStatus === 'active' && ' (Actif)'}
                  {subStatus === 'trialing' && ' (Periode d\'essai)'}
                  {subStatus === 'canceling' && ' (Annulation programmee)'}
                  {subStatus === 'past_due' && ' (Paiement en retard)'}
                  {subStatus === 'canceled' && ' (Annule)'}
                  {subEndDate && (
                    <> -- {subStatus === 'canceling' ? 'Acces jusqu\'au' : 'Renouvellement :'} {new Date(subEndDate).toLocaleDateString('fr-FR')}</>
                  )}
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button className="btn btn--secondary" onClick={handleManageBilling}>
                    Gerer via Stripe
                  </button>
                  {subStatus !== 'canceling' && subStatus !== 'canceled' && (
                    <button
                      className="btn btn--danger"
                      onClick={handleCancelSubscription}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? 'Annulation...' : 'Annuler mon abonnement'}
                    </button>
                  )}
                </div>
                {subStatus === 'canceling' && (
                  <p style={{ marginTop: 8, fontSize: 'var(--jb-text-sm)', color: 'var(--jb-warning, #f59e0b)' }}>
                    Votre abonnement sera annule a la fin de la periode. Vous conservez l'acces jusqu'a cette date.
                  </p>
                )}
              </div>
            )}

            {/* FAQ Abonnement */}
            <div className="glass-card settings__section" style={{ marginTop: 24 }}>
              <h3 className="font-display settings__section-title">Questions frequentes</h3>
              <div className="settings__faq">
                <div className="settings__faq-item">
                  <h4>Puis-je changer de plan a tout moment ?</h4>
                  <p className="text-muted">Oui, vous pouvez upgrader ou downgrader votre plan a tout moment. Le prorata sera applique automatiquement.</p>
                </div>
                <div className="settings__faq-item">
                  <h4>Comment fonctionne la periode d'essai ?</h4>
                  <p className="text-muted">Tous les nouveaux utilisateurs beneficient de 7 jours gratuits sur les plans payants. Vous pouvez annuler avant la fin de l'essai et ne serez pas facture. La facturation commence automatiquement a l'issue des 7 jours.</p>
                </div>
                <div className="settings__faq-item">
                  <h4>Quels moyens de paiement acceptez-vous ?</h4>
                  <p className="text-muted">Nous acceptons les cartes Visa, Mastercard, American Express via Stripe. Paiement 100% securise.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ MOYENS DE PAIEMENT ════════════════ */}
        {activeTab === 'payment' && (
          <div className="settings__payment">
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Moyens de paiement</h3>
              <p className="text-muted" style={{ marginBottom: 16 }}>
                Les paiements sont geres de maniere securisee par Stripe. Vos informations de carte ne transitent jamais par nos serveurs.
              </p>
              <div className="settings__payment-stripe-info">
                <CardIcon />
                <div>
                  <p style={{ fontWeight: 500 }}>Paiement securise par Stripe</p>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                    Paiements traites via Stripe -- Visa, Mastercard, American Express et les autres cartes supportees par Stripe selon votre region.
                  </p>
                </div>
              </div>
              <button className="btn btn--primary" style={{ marginTop: 16 }} onClick={handleManageBilling}>
                {subPlan === 'free' ? 'Ajouter un moyen de paiement' : 'Gerer mes moyens de paiement'}
              </button>
            </div>

            <div className="glass-card settings__section" style={{ marginTop: 16 }}>
              <h3 className="font-display settings__section-title">Securite des paiements</h3>
              <ul className="settings__security-list">
                <li>
                  <CheckIcon />
                  <span>Chiffrement SSL 256-bit de bout en bout</span>
                </li>
                <li>
                  <CheckIcon />
                  <span>Conforme PCI DSS niveau 1 (via Stripe)</span>
                </li>
                <li>
                  <CheckIcon />
                  <span>Aucune donnee de carte stockee sur nos serveurs</span>
                </li>
                <li>
                  <CheckIcon />
                  <span>Annulation possible a tout moment</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ════════════════ PREFERENCES ════════════════ */}
        {activeTab === 'preferences' && (
          <div className="settings__preferences">
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Notifications</h3>
              <div className="settings__toggle-row">
                <div>
                  <p style={{ fontWeight: 500 }}>Notifications email</p>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                    Recevoir des mises a jour sur les candidatures et le coaching.
                  </p>
                </div>
                <button className={`settings__toggle ${notifications ? 'settings__toggle--on' : ''}`} onClick={() => setNotifications(v => !v)} aria-label="Activer les notifications par email" role="switch" aria-checked={notifications}>
                  <span className="settings__toggle-knob" />
                </button>
              </div>
              <div className="settings__toggle-row">
                <div>
                  <p style={{ fontWeight: 500 }}>Alertes de nouvelles offres</p>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                    Etre prevenu quand de nouvelles offres correspondent a votre profil.
                  </p>
                </div>
                <button
                  className={`settings__toggle ${jobAlerts ? 'settings__toggle--on' : ''}`}
                  onClick={() => setJobAlerts(v => !v)}
                  aria-label="Activer les alertes de nouvelles offres"
                >
                  <span className="settings__toggle-knob" />
                </button>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Notifications SMS</h3>
              <div className="settings__toggle-row">
                <div>
                  <p style={{ fontWeight: 500 }}>Alertes SMS</p>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                    Recevoir des notifications par SMS (candidatures, alertes offres).
                    {!phoneVerified && <span style={{ color: 'var(--jb-warning, #f59e0b)', display: 'block', marginTop: 2 }}>Verifiez votre telephone dans l'onglet Profil pour activer les SMS.</span>}
                  </p>
                </div>
                <button
                  className={`settings__toggle ${smsNotifications ? 'settings__toggle--on' : ''}`}
                  onClick={() => {
                    if (!phoneVerified) {
                      flash('error', 'Veuillez d\'abord verifier votre numero de telephone dans l\'onglet Profil.');
                      return;
                    }
                    setSmsNotifications(v => !v);
                  }}
                  style={!phoneVerified ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  aria-label="Activer les notifications SMS"
                  role="switch"
                  aria-checked={smsNotifications}
                  disabled={!phoneVerified}
                >
                  <span className="settings__toggle-knob" />
                </button>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Coaching IA</h3>
              <div className="settings__toggle-row">
                <div>
                  <p style={{ fontWeight: 500 }}>Voix du coaching</p>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>
                    Activer la synthese vocale en session de coaching.
                  </p>
                </div>
                <button className={`settings__toggle ${coachingVoice ? 'settings__toggle--on' : ''}`} onClick={() => setCoachingVoice(v => !v)} aria-label="Activer la voix de coaching" role="switch" aria-checked={coachingVoice}>
                  <span className="settings__toggle-knob" />
                </button>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Auto-candidature</h3>
              <div className="settings__field" style={{ marginTop: 4 }}>
                <label className="label">Limite quotidienne de candidatures automatiques</label>
                <input className="input" type="number" min={1} max={50} value={autoApplyLimit} onChange={e => setAutoApplyLimit(Number(e.target.value))} style={{ maxWidth: 120 }} />
                <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', marginTop: 4 }}>
                  Nombre maximum de candidatures envoyees automatiquement par jour.
                </span>
              </div>
            </div>

            <button className="btn btn--primary" onClick={handleSaveProfile} disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Sauvegarde...' : 'Sauvegarder les preferences'}
            </button>
          </div>
        )}

        {/* ════════════════ SYSTEME ════════════════ */}
        {activeTab === 'system' && (
          <div className="settings__system">
            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Informations systeme</h3>
              <div className="settings__info-grid">
                <div>
                  <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Version</span>
                  <span>V1.0.0</span>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Mode d'authentification</span>
                  <span className="badge badge--accent">Supabase Auth</span>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Patterns comportementaux</span>
                  <span>572 patterns &middot; 58 ensembles</span>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Scoring candidat</span>
                  <span>6 dimensions</span>
                </div>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Donnees et confidentialite</h3>
              <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)', marginBottom: 12 }}>
                Vos donnees sont protegees et traitees conformement au RGPD. Vous pouvez exporter ou supprimer vos donnees a tout moment.
              </p>
              <div className="settings__actions" style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn--secondary btn--sm" onClick={handleExportData} disabled={exporting}>
                  {exporting ? 'Export en cours...' : 'Exporter mes donnees'}
                </button>
                <button className="btn btn--danger btn--sm" onClick={handleDeleteAccount}>
                  Supprimer mon compte
                </button>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">A propos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://www.azzcolabs.business" target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  AZZ&CO LABS — Notre entreprise
                </a>
                <a href="https://jobboat.xyz/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  Politique de confidentialite
                </a>
                <a href="https://www.azzcolabs.business/terms.html" target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  Conditions d'utilisation
                </a>
                <a href="https://www.azzco.life" target="_blank" rel="noopener noreferrer" className="btn btn--ghost" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>
                  LONGTERM Standpoint — AFTER-GAP
                </a>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Support</h3>
              <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)', marginBottom: 12 }}>
                Une question, un bug, ou besoin d'aide ? Notre equipe repond sous 24h (lun-ven).
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button className="btn btn--primary btn--sm" onClick={() => setShowContact(true)}>
                  Contacter le support
                </button>
                <a className="btn btn--ghost btn--sm" href="mailto:rached.azer@azzcolabs.business">
                  Email direct
                </a>
              </div>
            </div>

            <div className="glass-card settings__section">
              <h3 className="font-display settings__section-title">Session</h3>
              <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)', marginBottom: 12 }}>
                Connecte en tant que <strong>{email || 'Utilisateur'}</strong>
              </p>
              <button className="btn btn--ghost" onClick={() => { logout(); }}>
                Se deconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   MINI SVG ICONS
   ──────────────────────────────────────────────────────────── */
function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function InvoiceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
function CardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function CpuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

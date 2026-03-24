import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import './consent-banner.css';

const CONSENT_KEY = 'jobboat_consent';
const CONSENT_VERSION = '1.0';

function getSavedConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.version === CONSENT_VERSION) return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export default function ConsentBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [detailed, setDetailed] = useState(false);

  // Consent states
  const [essential, setEssential] = useState(true); // always on
  const [analytics, setAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);

  useEffect(() => {
    const saved = getSavedConsent();
    if (!saved) {
      setVisible(true);
    }
  }, []);

  function saveConsent(consents) {
    const payload = {
      version: CONSENT_VERSION,
      essential: true,
      analytics: consents.analytics,
      personalization: consents.personalization,
      accepted_at: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    setVisible(false);

    // Fire PostHog only after explicit analytics consent (RGPD)
    if (consents.analytics) {
      window.initPostHog?.();
    } else {
      // Opt out if previously consented and now revoking
      window.posthog?.opt_out_capturing();
    }

    // Persist to backend if user is logged in
    if (user?.email) {
      api.v2ComplianceConsent({
        email: user.email,
        consent_json: payload,
        version: CONSENT_VERSION,
      }).catch(() => { /* non-blocking */ });
    }
  }

  function acceptAll() {
    saveConsent({ analytics: true, personalization: true });
  }

  function acceptSelected() {
    saveConsent({ analytics, personalization });
  }

  function rejectOptional() {
    saveConsent({ analytics: false, personalization: false });
  }

  if (!visible) return null;

  return (
    <div className="consent-overlay">
      <div className="consent-banner glass-card fade-in-up">
        <div className="consent-banner__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h3 className="font-display consent-banner__title">Votre vie privee compte</h3>

        <p className="consent-banner__text">
          JobBoat utilise des cookies et des technologies similaires pour vous offrir la meilleure experience possible.
          Nous analysons votre profil uniquement pour <strong>optimiser le matching d'emploi</strong> et <strong>personnaliser le coaching IA</strong>.
          Aucune donnee n'est vendue a des tiers.
        </p>

        {!detailed ? (
          <div className="consent-banner__actions">
            <button className="btn btn--primary" onClick={acceptAll}>
              Tout accepter
            </button>
            <button className="btn btn--ghost" onClick={rejectOptional}>
              Essentiel uniquement
            </button>
            <button className="consent-banner__customize" onClick={() => setDetailed(true)}>
              Personnaliser mes choix
            </button>
          </div>
        ) : (
          <div className="consent-banner__detail fade-in-up">
            <div className="consent-banner__option">
              <div className="consent-banner__option-info">
                <span className="consent-banner__option-title">Cookies essentiels</span>
                <span className="consent-banner__option-desc">
                  Necessaires au fonctionnement : authentification, session, preferences.
                </span>
              </div>
              <span className="consent-banner__option-badge">Toujours actif</span>
            </div>

            <div className="consent-banner__option">
              <div className="consent-banner__option-info">
                <span className="consent-banner__option-title">Analyse et amelioration</span>
                <span className="consent-banner__option-desc">
                  Nous permettent de comprendre comment vous utilisez la plateforme pour l'ameliorer (duree de session, pages visitees, taux de conversion).
                </span>
              </div>
              <button
                className={`settings__toggle ${analytics ? 'settings__toggle--on' : ''}`}
                onClick={() => setAnalytics(v => !v)}
              >
                <span className="settings__toggle-knob" />
              </button>
            </div>

            <div className="consent-banner__option">
              <div className="consent-banner__option-info">
                <span className="consent-banner__option-title">Personnalisation</span>
                <span className="consent-banner__option-desc">
                  Permettent d'adapter le coaching, les recommandations d'offres et les suggestions IA a votre profil specifique.
                </span>
              </div>
              <button
                className={`settings__toggle ${personalization ? 'settings__toggle--on' : ''}`}
                onClick={() => setPersonalization(v => !v)}
              >
                <span className="settings__toggle-knob" />
              </button>
            </div>

            <div className="consent-banner__actions">
              <button className="btn btn--primary" onClick={acceptSelected}>
                Confirmer mes choix
              </button>
              <button className="btn btn--ghost" onClick={acceptAll}>
                Tout accepter
              </button>
            </div>
          </div>
        )}

        <p className="consent-banner__legal">
          Conformement au RGPD, vous pouvez modifier vos choix a tout moment dans Reglages &gt; Systeme.
          <br /><a href="/legal" style={{ color: '#818cf8', textDecoration: 'underline' }}>Politique de confidentialite &amp; CGU</a>
        </p>
      </div>
    </div>
  );
}

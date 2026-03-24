import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setUpgradeCallback } from '../services/apiClient';
import './upgradePrompt.css';

const FEATURE_LABELS = {
  apply: 'candidatures automatiques',
  coaching: 'sessions de coaching IA',
  usage_time: "temps d'utilisation",
};

export default function UpgradePrompt() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  const handleUpgrade = useCallback((upgradeData) => {
    setData(upgradeData);
  }, []);

  useEffect(() => {
    setUpgradeCallback(handleUpgrade);
    return () => setUpgradeCallback(null);
  }, [handleUpgrade]);

  if (!data) return null;

  const isLimit = data.type === 'limit_reached';
  const featureLabel = FEATURE_LABELS[data.actionType] || 'cette fonctionnalite';

  function handleGoToPricing() {
    setData(null);
    navigate('/pricing');
  }

  function handleDismiss() {
    setData(null);
  }

  return (
    <div className="upgrade-overlay" onClick={handleDismiss}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <button className="upgrade-modal__close" onClick={handleDismiss} aria-label="Fermer">&times;</button>

        <div className="upgrade-modal__icon">
          {isLimit ? (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ) : (
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
            </svg>
          )}
        </div>

        <h2 className="upgrade-modal__title">
          {isLimit ? 'Limite quotidienne atteinte' : 'Fonctionnalite Pro'}
        </h2>

        <p className="upgrade-modal__desc">
          {isLimit
            ? `Vous avez utilise vos ${data.limit} ${featureLabel} gratuites aujourd'hui. Passez au Pro pour un acces illimite.`
            : `${data.message || 'Cette fonctionnalite est reservee aux abonnes Pro, Growth ou Enterprise.'}`
          }
        </p>

        <div className="upgrade-modal__plans">
          <div className="upgrade-modal__plan">
            <div className="upgrade-modal__plan-name">Pro</div>
            <div className="upgrade-modal__plan-price">29&euro;<span>/mois</span></div>
            <ul className="upgrade-modal__plan-features">
              <li>Candidatures illimitees</li>
              <li>Coaching IA complet</li>
              <li>CV Builder assistant IA</li>
            </ul>
          </div>
          <div className="upgrade-modal__plan upgrade-modal__plan--highlight">
            <div className="upgrade-modal__plan-badge">Populaire</div>
            <div className="upgrade-modal__plan-name">Growth</div>
            <div className="upgrade-modal__plan-price">49&euro;<span>/mois</span></div>
            <ul className="upgrade-modal__plan-features">
              <li>Tout ce qui est dans Pro</li>
              <li>Coaching intensif illimite</li>
              <li>Sessions vocales illimitees</li>
            </ul>
          </div>
        </div>

        <div className="upgrade-modal__actions">
          <button className="upgrade-modal__cta" onClick={handleGoToPricing}>
            Voir les offres
          </button>
          <button className="upgrade-modal__dismiss" onClick={handleDismiss}>
            Pas maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

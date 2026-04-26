/**
 * UpgradeModal — Listens for 'jobboat:upgrade-prompt' events dispatched from
 * apiClient when the backend returns a 429/403 with a plan gate reason.
 *
 * Shows a contextual upgrade modal tailored to the action the user hit a wall on.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './upgrade-modal.css';

// Per-action context copy — turn "limit reached" into a reason to upgrade.
const ACTION_CONTEXT = {
  search: {
    icon: '🔎',
    title: 'Tu as utilisé tes 3 recherches quotidiennes',
    subtitle: 'Passe en Pro pour chercher sans limite.',
    benefits: [
      'Recherches illimitées tous les jours',
      'Matching IA sur tes préférences',
      'Alertes emploi personnalisées',
    ],
  },
  apply: {
    icon: '🚀',
    title: 'Tu as postulé à 3 offres — bravo !',
    subtitle: 'Passe en Pro pour enchaîner sans limite.',
    benefits: [
      'Candidatures illimitées chaque jour',
      'Lettres de motivation IA personnalisées',
      'CV adapté à chaque poste automatiquement',
    ],
  },
  cv_build: {
    icon: '📄',
    title: 'Ton CV du jour est terminé',
    subtitle: 'En Pro, génère plusieurs versions ciblées par poste.',
    benefits: [
      'CV Oracle illimité, toutes les tonalités',
      'Export PDF, LinkedIn, partage web',
      'Enrichissement IA sur tes expériences',
    ],
  },
  coaching: {
    icon: '🎯',
    title: 'Session de coaching terminée',
    subtitle: 'En Pro, continue avec le coach live et les 105 personas.',
    benefits: [
      'Sessions coaching illimitées',
      'Avatar coach en visio (BeyondPresence)',
      'Simulation d\'entretien IA avancée',
    ],
  },
  usage_time: {
    icon: '⏱️',
    title: 'Tu as utilisé tes 10 minutes gratuites',
    subtitle: 'Passe en Pro pour continuer sans chronomètre.',
    benefits: [
      'Temps coaching illimité',
      'Priorité sur les sessions IA',
      'Réponse plus rapide (< 500ms)',
    ],
  },
  pro_required: {
    icon: '⭐',
    title: 'Fonctionnalité Pro',
    subtitle: 'Cette fonctionnalité est réservée aux abonnés Pro.',
    benefits: [
      'Auto-remplissage sur 9 plateformes',
      'Coaching live avec avatar IA',
      'Enrichissement CV avec Mantiks NLP',
      'Support prioritaire',
    ],
  },
  default: {
    icon: '⭐',
    title: 'Passe en Pro pour continuer',
    subtitle: 'Débloque toutes les fonctionnalités.',
    benefits: [
      'Tout illimité',
      'Coaching avancé',
      'CV + candidatures sans limite',
    ],
  },
};

function buildContext(detail) {
  if (!detail) return ACTION_CONTEXT.default;
  if (detail.reason === 'pro_required') return ACTION_CONTEXT.pro_required;
  return ACTION_CONTEXT[detail.actionType] || ACTION_CONTEXT.default;
}

export default function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onPrompt(ev) {
      setDetail(ev.detail || null);
      setOpen(true);
    }
    window.addEventListener('jobboat:upgrade-prompt', onPrompt);
    return () => window.removeEventListener('jobboat:upgrade-prompt', onPrompt);
  }, []);

  if (!open) return null;

  const ctx = buildContext(detail);
  const targetUrl = detail?.upgradeUrl || '/pricing';

  function handleUpgrade() {
    setOpen(false);
    navigate(targetUrl);
  }

  function handleClose() {
    setOpen(false);
  }

  return (
    <div className="jb-upgrade-modal-backdrop" onClick={handleClose}>
      <div className="jb-upgrade-modal" onClick={e => e.stopPropagation()}>
        <button className="jb-upgrade-close" onClick={handleClose} aria-label="Fermer">×</button>

        <div className="jb-upgrade-icon">{ctx.icon}</div>
        <h2 className="jb-upgrade-title">{ctx.title}</h2>
        <p className="jb-upgrade-subtitle">{ctx.subtitle}</p>

        <ul className="jb-upgrade-benefits">
          {ctx.benefits.map((b, i) => (
            <li key={i}>
              <span className="jb-upgrade-check">✓</span> {b}
            </li>
          ))}
        </ul>

        <div className="jb-upgrade-price">
          <span className="jb-upgrade-price-amount">29€</span>
          <span className="jb-upgrade-price-period">/mois</span>
        </div>
        <p className="jb-upgrade-price-note">Annule quand tu veux. Sans engagement.</p>

        <div className="jb-upgrade-actions">
          <button className="jb-upgrade-cta" onClick={handleUpgrade}>
            Passer au Pro
          </button>
          <button className="jb-upgrade-later" onClick={handleClose}>
            Plus tard
          </button>
        </div>

        {detail?.message && (
          <p className="jb-upgrade-debug">{detail.message}</p>
        )}
      </div>
    </div>
  );
}

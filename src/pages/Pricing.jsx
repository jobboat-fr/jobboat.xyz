import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import PaymentModal from '../components/PaymentModal';
import './pricing.css';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '/mois',
    desc: 'Pour decouvrir JobBoat et commencer a postuler.',
    features: [
      'CV Builder complet + enrichissement IA',
      'Lien partageable + export PDF',
      '10 candidatures auto / jour',
      '15 sessions coaching / jour',
      '3 heures d\'utilisation / jour',
      'Dashboard standard',
    ],
    cta: 'Plan actuel',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: '/mois',
    desc: 'Pour les candidats serieux qui veulent maximiser leurs chances.',
    features: [
      'Tout ce qui est dans Free',
      'Candidatures illimitees',
      'Coaching IA illimite',
      'Aucune limite de temps',
      'Personas coaching adaptatifs',
      'Rapports KPI detailles',
      'Support prioritaire',
    ],
    cta: 'Passer au Pro',
    popular: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 49,
    period: '/mois',
    desc: 'Pour les candidats intensifs qui veulent maximiser leur coaching IA.',
    features: [
      'Tout ce qui est dans Pro',
      'Coaching IA intensif illimite',
      'Personas adaptatifs avances',
      'Analytics coaching detailles',
      'Sessions vocales illimitees',
      'Support prioritaire',
    ],
    cta: 'Passer au Growth',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    period: '/mois',
    desc: 'Pour les equipes et entreprises avec des besoins avances.',
    features: [
      'Tout ce qui est dans Pro',
      'Acces API direct',
      'White-label',
      'Account manager dedie',
      'SLA 99.9%',
      'Integration HRIS',
      'Multi-utilisateurs',
    ],
    cta: 'Contacter les ventes',
    popular: false,
  },
];

const PAYG_RATES = [
  { action: 'Candidature auto', price: '0,20', unit: 'par candidature' },
  { action: 'Session coaching', price: '0,30', unit: 'par session' },
  { action: 'Temps supplementaire', price: '0,25', unit: 'par 30 min' },
];

const COMPARE_ROWS = [
  { feature: 'CV Builder + enrichissement IA', free: 'check', payg: 'check', pro: 'check', growth: 'check', enterprise: 'check' },
  { feature: 'CV web partageable + PDF', free: 'check', payg: 'check', pro: 'check', growth: 'check', enterprise: 'check' },
  { feature: 'Candidatures auto / jour', free: '10', payg: 'Illimite', pro: 'Illimite', growth: 'Illimite', enterprise: 'Illimite' },
  { feature: 'Sessions coaching / jour', free: '15', payg: 'Illimite', pro: 'Illimite', growth: 'Illimite', enterprise: 'Illimite' },
  { feature: 'Temps d\'utilisation / jour', free: '3h', payg: 'Illimite', pro: 'Illimite', growth: 'Illimite', enterprise: 'Illimite' },
  { feature: 'Personas coaching adaptatifs', free: 'cross', payg: 'cross', pro: 'check', growth: 'check', enterprise: 'check' },
  { feature: 'Analytics coaching detailles', free: 'cross', payg: 'cross', pro: 'cross', growth: 'check', enterprise: 'check' },
  { feature: 'Sessions vocales illimitees', free: 'cross', payg: 'cross', pro: 'cross', growth: 'check', enterprise: 'check' },
  { feature: 'Rapports KPI detailles', free: 'cross', payg: 'cross', pro: 'check', growth: 'check', enterprise: 'check' },
  { feature: 'Support prioritaire', free: 'cross', payg: 'cross', pro: 'check', growth: 'check', enterprise: 'check' },
  { feature: 'Acces API', free: 'cross', payg: 'cross', pro: 'cross', growth: 'cross', enterprise: 'check' },
  { feature: 'White-label', free: 'cross', payg: 'cross', pro: 'cross', growth: 'cross', enterprise: 'check' },
  { feature: 'Integration HRIS', free: 'cross', payg: 'cross', pro: 'cross', growth: 'cross', enterprise: 'check' },
];

const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne le Pay-As-You-Go ?',
    a: 'Activez le PAYG en ajoutant une carte bancaire. Utilisez l\'app normalement -- quand vous depassez les limites du plan Free, chaque action est facturee au tarif affiche. Un paiement automatique est declenche tous les 5 EUR d\'usage cumule. Vous pouvez desactiver le PAYG a tout moment.',
  },
  {
    q: 'Le CV Builder est-il vraiment gratuit ?',
    a: 'Oui, le CV Builder avec enrichissement IA, lien partageable et export PDF est 100% gratuit pour tous les plans. C\'est notre cadeau pour vous aider dans votre recherche d\'emploi.',
  },
  {
    q: 'Puis-je changer de plan a tout moment ?',
    a: 'Oui, vous pouvez upgrader, downgrader ou passer au PAYG a tout moment. Le prorata est applique automatiquement pour les abonnements.',
  },
  {
    q: 'Comment fonctionne la periode d\'essai ?',
    a: 'Tous les nouveaux utilisateurs beneficient de 7 jours gratuits sur les plans payants. Aucune carte requise pendant l\'essai. La facturation commence automatiquement a la fin de la periode d\'essai -- vous pouvez annuler a tout moment avant.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Visa, Mastercard, American Express via Stripe. Paiement 100% securise -- vos informations de carte ne transitent jamais par nos serveurs.',
  },
  {
    q: 'Que se passe-t-il si je desactive le PAYG ?',
    a: 'Vous revenez aux limites du plan Free (10 candidatures/jour, 15 coaching/jour, 3h/jour). Votre solde PAYG en cours sera facture normalement.',
  },
];

function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--jb-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subPlan, setSubPlan] = useState('free');
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // PAYG state
  const [paygActive, setPaygActive] = useState(false);
  const [paygLoading, setPaygLoading] = useState(false);
  const [paygAmount, setPaygAmount] = useState(0);
  const [paygThreshold] = useState(500);

  // FAQ
  const [openFaq, setOpenFaq] = useState(null);

  // Usage
  const [usage, setUsage] = useState(null);

  // Payment Modal
  const [paymentModal, setPaymentModal] = useState({ open: false, mode: 'payg', planId: 'pro' });

  const loadSubscription = useCallback(async () => {
    try {
      const data = await api.v2StripeSubscriptionStatus();
      if (data.success) {
        setSubPlan(data.plan || 'free');
      }
    } catch { /* stripe not configured */ }
  }, []);

  const loadPaygStatus = useCallback(async () => {
    try {
      const data = await api.v2PaygStatus();
      if (data.success) {
        setPaygActive(data.active || false);
        setPaygAmount(data.currentAmountCents || 0);
      }
    } catch { /* not configured yet */ }
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      const data = await api.v2UsageToday();
      if (data.success) setUsage(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadSubscription();
    loadPaygStatus();
    loadUsage();
  }, [loadSubscription, loadPaygStatus, loadUsage]);

  async function handleSubscribe(planId) {
    if (planId === 'free') return;
    if (planId === 'enterprise') {
      window.open('https://azzcolabs.business', '_blank', 'noopener,noreferrer');
      return;
    }
    setCheckoutLoading(planId);
    window.posthog?.capture('checkout_started', { plan: planId });
    try {
      const data = await api.v2StripeCheckout({ planId });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('[Pricing] Checkout error:', err.message);
    }
    setCheckoutLoading(null);
  }

  function handlePaymentModalSuccess() {
    loadSubscription();
    loadPaygStatus();
    loadUsage();
  }

  async function handleTogglePayg() {
    if (paygLoading) return;
    if (paygActive) {
      setPaygLoading(true);
      try {
        await api.v2PaygDeactivate();
        setPaygActive(false);
        setPaygAmount(0);
      } catch (err) {
        console.error('[Pricing] PAYG deactivate error:', err.message);
      }
      setPaygLoading(false);
    } else {
      window.posthog?.capture('payg_activated');
      setPaymentModal({ open: true, mode: 'payg', planId: 'pro' });
    }
  }

  const isPro = subPlan === 'pro' || subPlan === 'growth' || subPlan === 'enterprise';

  return (
    <div className="pricing">
      {/* Hero */}
      <div className="pricing__hero">
        <h1 className="pricing__hero-title">Trouvez le plan qui vous correspond</h1>
        <p className="pricing__hero-sub">
          Le CV Builder est gratuit pour tous. Choisissez votre plan pour les candidatures automatiques et le coaching IA.
        </p>
        <div className="pricing__trial-badge">
          <span>7 jours gratuits sur tous les plans payants -- aucune carte requise</span>
        </div>
      </div>

      {/* Plans */}
      <div className="pricing__plans">
        {PLANS.map(plan => {
          const isCurrent = plan.id === subPlan;
          const price = plan.price;
          return (
            <div
              key={plan.id}
              className={`glass-card pricing__plan ${plan.popular ? 'pricing__plan--popular' : ''}`}
            >
              {plan.popular && <div className="pricing__plan-popular-tag">Le plus populaire</div>}
              <h3 className="pricing__plan-name">{plan.name}</h3>
              <div className="pricing__plan-price">
                <span className="pricing__plan-amount">{price}&euro;</span>
                <span className="pricing__plan-period">{plan.period}</span>
              </div>
              <p className="pricing__plan-desc">{plan.desc}</p>
              {isCurrent && <span className="pricing__plan-current-badge">Plan actuel</span>}
              {plan.id !== 'free' && !isCurrent && <span className="pricing__plan-trial">7 jours gratuits</span>}
              <ul className="pricing__plan-features">
                {plan.features.map((f, i) => (
                  <li key={i}><CheckIcon /> <span>{f}</span></li>
                ))}
              </ul>
              <button
                className={`btn ${isCurrent ? 'btn--ghost' : plan.popular ? 'btn--primary btn--lg' : 'btn--secondary'} btn--full`}
                disabled={isCurrent || checkoutLoading === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                {checkoutLoading === plan.id ? 'Redirection...' : isCurrent ? 'Plan actuel' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Pay-As-You-Go */}
      {!isPro && (
        <div className="glass-card pricing__payg">
          <div className="pricing__payg-header">
            <div>
              <h2 className="pricing__payg-title">Pay-As-You-Go</h2>
              <p className="pricing__payg-sub">Payez uniquement ce que vous utilisez, au-dela des limites Free.</p>
            </div>
            <div className="pricing__payg-toggle">
              <span className="pricing__payg-toggle-label">{paygActive ? 'Actif' : 'Desactive'}</span>
              <div
                className={`pricing__payg-switch ${paygActive ? 'pricing__payg-switch--active' : ''}`}
                onClick={handleTogglePayg}
                role="switch"
                aria-checked={paygActive}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTogglePayg(); } }}
              >
                <div className="pricing__payg-switch-knob" />
              </div>
            </div>
          </div>

          {/* 3 Steps */}
          <div className="pricing__payg-steps">
            <div className="pricing__payg-step">
              <div className="pricing__payg-step-num">1</div>
              <div className="pricing__payg-step-title">Activez</div>
              <div className="pricing__payg-step-desc">Ajoutez une carte bancaire pour activer le compteur</div>
            </div>
            <div className="pricing__payg-step">
              <div className="pricing__payg-step-num">2</div>
              <div className="pricing__payg-step-title">Utilisez</div>
              <div className="pricing__payg-step-desc">Depassez les limites Free -- l'usage est metre en temps reel</div>
            </div>
            <div className="pricing__payg-step">
              <div className="pricing__payg-step-num">3</div>
              <div className="pricing__payg-step-title">Payez 5&euro;</div>
              <div className="pricing__payg-step-desc">Facturation automatique a chaque tranche de 5&euro; atteinte</div>
            </div>
          </div>

          {/* Usage meter (only when PAYG is active) */}
          {paygActive && (
            <div className="pricing__payg-meter">
              <div className="pricing__payg-meter-header">
                <span className="pricing__payg-meter-label">Usage en cours</span>
                <span className="pricing__payg-meter-amount">
                  {(paygAmount / 100).toFixed(2)}&euro; / {(paygThreshold / 100).toFixed(2)}&euro;
                </span>
              </div>
              <div className="pricing__payg-meter-bar">
                <div
                  className="pricing__payg-meter-fill"
                  style={{ width: `${Math.min(100, (paygAmount / paygThreshold) * 100)}%` }}
                />
              </div>
              <div className="pricing__payg-meter-threshold">
                Prochain paiement a {(paygThreshold / 100).toFixed(2)}&euro;
              </div>
            </div>
          )}

          {/* Usage today */}
          {usage && (
            <div style={{ marginBottom: 'var(--jb-space-6)', display: 'flex', gap: 'var(--jb-space-4)', flexWrap: 'wrap' }}>
              <div className="glass-card" style={{ flex: '1 1 140px', padding: 'var(--jb-space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700, fontFamily: 'var(--jb-font-display)' }}>
                  {usage.appliesCount || 0}<span style={{ fontSize: 'var(--jb-text-xs)', color: 'var(--jb-text-muted)' }}>/10</span>
                </div>
                <div className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Candidatures aujourd'hui</div>
              </div>
              <div className="glass-card" style={{ flex: '1 1 140px', padding: 'var(--jb-space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700, fontFamily: 'var(--jb-font-display)' }}>
                  {usage.coachingCount || 0}<span style={{ fontSize: 'var(--jb-text-xs)', color: 'var(--jb-text-muted)' }}>/15</span>
                </div>
                <div className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Sessions coaching aujourd'hui</div>
              </div>
              <div className="glass-card" style={{ flex: '1 1 140px', padding: 'var(--jb-space-4)', textAlign: 'center' }}>
                <div style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700, fontFamily: 'var(--jb-font-display)' }}>
                  {usage.usageMinutes || 0}<span style={{ fontSize: 'var(--jb-text-xs)', color: 'var(--jb-text-muted)' }}>/180</span>
                </div>
                <div className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Minutes aujourd'hui</div>
              </div>
            </div>
          )}

          {/* Rates */}
          <div className="pricing__payg-rates">
            {PAYG_RATES.map((r, i) => (
              <div key={i} className="pricing__payg-rate">
                <div className="pricing__payg-rate-action">{r.action}</div>
                <div className="pricing__payg-rate-price">{r.price}&euro;</div>
                <div className="pricing__payg-rate-unit">{r.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="pricing__compare">
        <h2 className="pricing__compare-title">Comparaison detaillee</h2>
        <table className="pricing__compare-table">
          <thead>
            <tr>
              <th>Fonctionnalite</th>
              <th>Free</th>
              <th>PAYG</th>
              <th>Pro</th>
              <th>Growth</th>
              <th>Enterprise</th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, i) => (
              <tr key={i}>
                <td>{row.feature}</td>
                {['free', 'payg', 'pro', 'growth', 'enterprise'].map(col => (
                  <td key={col}>
                    {row[col] === 'check' ? (
                      <span className="pricing__compare-check"><CheckIcon /></span>
                    ) : row[col] === 'cross' ? (
                      <span className="pricing__compare-cross"><CrossIcon /></span>
                    ) : (
                      <span className="pricing__compare-limit">{row[col]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FAQ */}
      <div className="pricing__faq">
        <h2 className="pricing__faq-title">Questions frequentes</h2>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="pricing__faq-item">
            <button
              className={`pricing__faq-q ${openFaq === i ? 'pricing__faq-q--open' : ''}`}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span>{item.q}</span>
              <ChevronDown />
            </button>
            {openFaq === i && <div className="pricing__faq-a">{item.a}</div>}
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal(prev => ({ ...prev, open: false }))}
        mode={paymentModal.mode}
        planId={paymentModal.planId}
        onSuccess={handlePaymentModalSuccess}
      />
    </div>
  );
}

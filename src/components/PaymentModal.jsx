import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../services/apiClient';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

function PaymentForm({ mode, planId, clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setError(submitErr.message);
        setLoading(false);
        return;
      }

      if (mode === 'payg') {
        const { setupIntent, error: confirmErr } = await stripe.confirmSetup({
          elements,
          clientSecret,
          redirect: 'if_required',
        });

        if (confirmErr) {
          setError(confirmErr.message);
          setLoading(false);
          return;
        }

        // Confirm PAYG with backend
        if (setupIntent?.payment_method) {
          await api.v2PaygConfirm({ paymentMethodId: setupIntent.payment_method });
        }
      } else {
        // Subscription mode: redirect to Stripe Checkout (existing flow)
        const data = await api.v2StripeCheckout({ planId });
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue.');
    }

    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--jb-space-8)' }}>
        <div style={{ width: 56, height: 56, margin: '0 auto var(--jb-space-4)', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--jb-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="font-display" style={{ marginBottom: 'var(--jb-space-2)' }}>
          {mode === 'payg' ? 'Pay-As-You-Go active' : 'Abonnement active'}
        </h3>
        <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)' }}>
          {mode === 'payg'
            ? 'Votre carte a ete ajoutee. L\'usage au-dela des limites Free sera facture automatiquement.'
            : 'Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalites.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--jb-space-5)' }}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && (
        <div style={{ padding: '8px 12px', borderRadius: 'var(--jb-radius-md)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--jb-danger)', fontSize: 'var(--jb-text-sm)' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 'var(--jb-space-3)' }}>
        <button type="button" className="btn btn--secondary" style={{ flex: 1 }} onClick={onCancel} disabled={loading}>
          Annuler
        </button>
        <button type="submit" className="btn btn--primary" style={{ flex: 2 }} disabled={!stripe || loading}>
          {loading ? 'Traitement...' : mode === 'payg' ? 'Activer le PAYG' : `S'abonner`}
        </button>
      </div>
      <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', textAlign: 'center' }}>
        Paiement securise par Stripe. Vos informations ne transitent jamais par nos serveurs.
      </p>
    </form>
  );
}

export default function PaymentModal({ isOpen, onClose, mode = 'payg', planId = 'pro', onSuccess }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setError(null);
      return;
    }

    async function init() {
      setLoading(true);
      setError(null);
      try {
        if (mode === 'payg') {
          const data = await api.v2PaygActivate();
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else {
            setError('Impossible d\'initialiser le paiement.');
          }
        } else {
          // For subscriptions, redirect to Stripe Checkout (existing flow)
          const data = await api.v2StripeCheckout({ planId });
          if (data.url) {
            window.location.href = data.url;
            return;
          }
          setError('Impossible de creer la session de paiement.');
        }
      } catch (err) {
        setError(err.message || 'Erreur de connexion.');
      }
      setLoading(false);
    }

    init();
  }, [isOpen, mode, planId]);

  if (!isOpen) return null;

  function handleSuccess() {
    if (onSuccess) onSuccess();
    onClose();
  }

  const appearance = {
    theme: 'night',
    variables: {
      colorPrimary: '#2d6aa0',
      colorBackground: '#0f1724',
      colorText: '#f1f5f9',
      colorTextSecondary: '#94a3b8',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1px solid rgba(148, 163, 184, 0.15)',
        backgroundColor: '#0a0f1a',
      },
      '.Input:focus': {
        border: '1px solid #2d6aa0',
        boxShadow: '0 0 0 3px rgba(30, 90, 150, 0.25)',
      },
    },
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="payment-modal glass-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--jb-space-5)' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: 'var(--jb-text-lg)', fontWeight: 700 }}>
              {mode === 'payg' ? 'Activer le Pay-As-You-Go' : `S'abonner au plan ${planId === 'enterprise' ? 'Enterprise' : 'Pro'}`}
            </h2>
            <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)', marginTop: 'var(--jb-space-1)' }}>
              {mode === 'payg'
                ? 'Ajoutez une carte pour activer le compteur d\'usage.'
                : 'Saisissez vos informations de paiement.'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--jb-text-muted)', padding: 4 }} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 'var(--jb-space-8)' }}>
            <div style={{ width: 32, height: 32, margin: '0 auto var(--jb-space-3)', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--jb-accent-light, #2d6aa0)', borderRadius: '50%', animation: 'jb-pulse 0.8s linear infinite' }} />
            <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)' }}>Initialisation du paiement...</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '16px', borderRadius: 'var(--jb-radius-md)', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: 'var(--jb-space-4)' }}>
            <p style={{ color: 'var(--jb-danger)', fontSize: 'var(--jb-text-sm)' }}>{error}</p>
            <button className="btn btn--secondary btn--sm" style={{ marginTop: 'var(--jb-space-3)' }} onClick={onClose}>Fermer</button>
          </div>
        )}

        {clientSecret && stripePromise && !loading && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <PaymentForm
              mode={mode}
              planId={planId}
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        )}
      </div>

      <style>{`
        .payment-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: var(--jb-space-4);
        }
        .payment-modal {
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: payment-modal-in 0.25s ease;
        }
        @keyframes payment-modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

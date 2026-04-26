import { useState } from 'react';
import { api } from '../services/apiClient';

const SUBJECTS = [
  'Question technique',
  'Problème de compte',
  'Facturation / abonnement',
  'Signaler un bug',
  'Suggestion d\'amélioration',
  'Autre',
];

export default function ContactModal({ onClose }) {
  // `website` is a honeypot. Real users never fill it (visually hidden);
  // bots blindly fill every field and the backend rejects the submission.
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '', website: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Tous les champs sont requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // BUG FIX: `api` is an object, not a function. The previous
      // `api('/api/v2/contact', {...})` call silently threw a TypeError
      // (caught below), so no network request was ever made. Use the
      // named helper instead.
      const res = await api.v2Contact(form);
      if (res && res.success) {
        setSuccess(res.ticketId);
      } else {
        setError((res && res.error) || 'Erreur lors de l\'envoi.');
      }
    } catch (err) {
      console.error('[ContactModal] send failed:', err);
      setError(err?.message || 'Impossible d\'envoyer le message. Réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#111827', borderRadius: '16px',
        border: '1px solid rgba(148,163,184,0.1)',
        width: '100%', maxWidth: '480px',
        padding: '0', overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg,#1a3a5c 0%,#2d6aa0 100%)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Contacter le support</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Réponse sous 24h (lun–ven)
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
              width: 32, height: 32, cursor: 'pointer', color: '#fff',
              fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
                Message envoyé !
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                Un email de confirmation t'a été envoyé.
              </div>
              {success && (
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Référence : <strong style={{ color: '#60a5fa' }}>#{success}</strong>
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  marginTop: 20, padding: '10px 28px',
                  background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  border: 'none', borderRadius: '8px',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Honeypot field: hidden from real users, auto-filled by bots.
                  The backend rejects submissions where this is non-empty. */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={e => set('website', e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                    Nom
                  </label>
                  <input
                    type="text"
                    placeholder="Sophie Martin"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="sophie@email.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                  Sujet
                </label>
                <select
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>
                  Message
                </label>
                <textarea
                  placeholder="Décris ton problème ou ta question..."
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                  rows={5}
                  required
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
                  fontSize: 13, color: '#fca5a5',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px', borderRadius: '8px',
                  background: loading ? 'rgba(37,99,235,0.4)' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                  border: 'none', color: '#fff', fontWeight: 700,
                  fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: '8px', color: '#e2e8f0',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

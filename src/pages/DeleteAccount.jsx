import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import './delete-account.css';

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'SUPPRIMER';

  async function handleDelete() {
    if (!canDelete || loading) return;
    if (!user?.email) {
      setStatus({ type: 'error', message: 'Connectez-vous pour supprimer votre compte.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await api.v2ComplianceDelete({ email: user.email });
      await logout();
      navigate('/auth', { replace: true });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Impossible de supprimer le compte.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="delete-account">
      <div className="delete-account__header">
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <div>
          <h1 className="section-title">Supprimer mon compte</h1>
          <p className="section-subtitle">
            Cette action supprime votre compte JobBoat et demande l'effacement de vos donnees.
          </p>
        </div>
      </div>

      <div className="glass-card delete-account__card">
        <h3 className="font-display">Ce que cela implique</h3>
        <ul className="delete-account__list">
          <li>Acces immediat bloque et deconnexion de tous vos appareils.</li>
          <li>Suppression des donnees personnelles (profil, candidatures, historique).</li>
          <li>Annulation des abonnements actifs en cours.</li>
          <li>Effacement complet sous 30 jours maximum (conformite RGPD).</li>
        </ul>
      </div>

      <div className="glass-card delete-account__card delete-account__danger">
        <h3 className="font-display">Confirmer la suppression</h3>
        {!user?.email ? (
          <div className="delete-account__confirm">
            <p className="text-muted">
              Connectez-vous pour confirmer la suppression de votre compte.
            </p>
            <button className="btn btn--primary" onClick={() => navigate('/auth')}>
              Se connecter
            </button>
          </div>
        ) : (
          <div className="delete-account__confirm">
            <p className="text-muted">
              Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression du compte <strong>{user.email}</strong>.
            </p>
            <input
              className="input delete-account__input"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
            />
            <button
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={!canDelete || loading}
            >
              {loading ? 'Suppression...' : 'Supprimer definitivement'}
            </button>
          </div>
        )}
        {status && (
          <div className={`delete-account__status delete-account__status--${status.type}`}>
            {status.message}
          </div>
        )}
      </div>

      <div className="glass-card delete-account__card">
        <h3 className="font-display">Besoin d'aide ?</h3>
        <p className="text-muted">
          Ecrivez a <a href="mailto:privacy@jobboat.xyz">privacy@jobboat.xyz</a> si vous ne pouvez pas acceder a votre compte.
        </p>
      </div>
    </div>
  );
}

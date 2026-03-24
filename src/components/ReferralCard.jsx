import { useState, useEffect } from 'react';
import { api } from '../services/apiClient';
import { useToast } from './ToastProvider';

export default function ReferralCard() {
  const [code, setCode] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [codeRes, statsRes] = await Promise.all([
          api.referralGetCode(),
          api.referralStats(),
        ]);
        if (codeRes?.code) setCode(codeRes.code);
        if (statsRes?.success) setStats(statsRes);
      } catch (e) {
        console.warn('[Referral] load error:', e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareUrl = code ? `https://jobboat.xyz/auth?ref=${code}` : '';

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast?.success('Lien de parrainage copie !');
    }).catch(() => {
      toast?.info(shareUrl);
    });
  };

  const shareNative = () => {
    if (navigator.share && code) {
      navigator.share({
        title: 'JobBoat — Assistant Carriere IA',
        text: 'Rejoins JobBoat et decroche ton prochain job avec l\'IA. Utilise mon code de parrainage pour 7 jours Pro offerts !',
        url: shareUrl,
      }).catch(() => {});
    } else {
      copyCode();
    }
  };

  if (loading) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(45,106,160,0.12), rgba(139,92,246,0.08))',
      border: '1px solid rgba(45,106,160,0.25)',
      borderRadius: 12,
      padding: '24px 20px',
      marginTop: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6aa0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' }}>
          Parraine tes amis
        </h3>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px' }}>
        Invite un ami sur JobBoat. Vous recevez <strong style={{ color: '#10b981' }}>7 jours Pro offerts</strong> chacun — toi et ton filleul.
      </p>

      {code && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(15,23,42,0.5)',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 12,
        }}>
          <code style={{
            flex: 1,
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#2d6aa0',
            letterSpacing: '0.05em',
            fontFamily: 'var(--jb-font-mono, monospace)',
          }}>
            {code}
          </code>
          <button
            onClick={copyCode}
            style={{
              background: 'rgba(45,106,160,0.15)',
              border: '1px solid rgba(45,106,160,0.3)',
              borderRadius: 6,
              padding: '6px 12px',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Copier le lien
          </button>
        </div>
      )}

      <button
        onClick={shareNative}
        style={{
          width: '100%',
          background: 'var(--jb-accent, #2d6aa0)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 0',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
      >
        Partager avec un ami
      </button>

      {stats && stats.total > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 14,
          fontSize: '0.75rem',
          color: '#94a3b8',
        }}>
          <span><strong style={{ color: '#e2e8f0' }}>{stats.total}</strong> invites</span>
          <span><strong style={{ color: '#10b981' }}>{stats.converted}</strong> inscrits</span>
          <span><strong style={{ color: '#f59e0b' }}>{stats.rewarded}</strong> recompenses</span>
        </div>
      )}
    </div>
  );
}

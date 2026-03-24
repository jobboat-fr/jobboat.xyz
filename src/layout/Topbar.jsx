import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { JobBoatMark } from '../components/JobBoatLogo';
import { supabase } from '../lib/supabase';

const PAGE_TITLES = {
  '/dashboard': 'Centre de Commande',
  '/coaching': 'Coaching IA',
  '/auto-apply': 'Auto-Apply Hub',
  '/cv-builder': 'CV Builder',
  '/profile': 'Profil & KPIs',
  '/pricing': 'Tarifs',
  '/settings': 'Reglages',
};

const PAGE_SUBTITLES = {
  '/dashboard': 'Vue d\'ensemble de ton parcours',
  '/coaching': 'Session de coaching adaptatif',
  '/auto-apply': 'Decouverte et candidatures automatiques',
  '/cv-builder': 'Editeur de CV intelligent',
  '/profile': 'Metriques et progression',
  '/pricing': 'Plans, PAYG et facturation',
  '/settings': 'Parametres du compte',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname] || 'JobBoat';
  const subtitle = PAGE_SUBTITLES[location.pathname] || '';

  const [avatarUrl, setAvatarUrl] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  }

  // Load avatar from DB
  async function fetchAvatar() {
    if (!user?.email) return;
    try {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email.toLowerCase())
        .single();
      if (!dbUser) return;

      try {
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('preferences_json')
          .eq('user_id', dbUser.id)
          .single();
        if (!error && prof?.preferences_json?.avatar_url) {
          setAvatarUrl(prof.preferences_json.avatar_url);
        }
      } catch { /* ignore */ }
    } catch (err) {
      console.warn('[Topbar] Avatar fetch failed:', err.message);
    }
  }

  useEffect(() => {
    fetchAvatar();
  }, [user?.email]);

  // Listen for avatar updates from Settings page
  useEffect(() => {
    function handleAvatarUpdate(e) {
      if (e.detail?.avatarUrl) {
        setAvatarUrl(e.detail.avatarUrl);
      } else {
        fetchAvatar();
      }
    }
    window.addEventListener('jobboat:avatar-updated', handleAvatarUpdate);
    return () => window.removeEventListener('jobboat:avatar-updated', handleAvatarUpdate);
  }, [user?.email]);

  return (
    <header className="jb-topbar">
      <div className="jb-topbar__left">
        <div className="jb-topbar__mobile-logo" onClick={() => navigate('/landing')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <JobBoatMark size={24} />
          <div style={{ lineHeight: 1.1 }}>
            <span className="font-display" style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>JobBoat</span>
            <span style={{ display: 'block', fontSize: '0.45rem', color: 'var(--jb-text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>by AZZ&amp;CO LABS</span>
          </div>
        </div>
        <div className="jb-topbar__title-group">
          <h1 className="jb-topbar__title">{title}</h1>
          {subtitle && <p className="jb-topbar__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="jb-topbar__right">
        <div className="jb-topbar__status">
          <span className="glow-dot" />
          <span className="text-secondary jb-topbar__status-text">En ligne</span>
        </div>
        <div className="jb-topbar__user-wrap" ref={menuRef}>
          <div className="jb-topbar__user" onClick={() => setMenuOpen(o => !o)} role="button" aria-haspopup="true" aria-expanded={menuOpen} tabIndex={0} style={{ cursor: 'pointer' }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMenuOpen(o => !o); } }}>
            <div className="jb-topbar__avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Photo de profil de ${user?.name || 'utilisateur'}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <span className="jb-topbar__user-name">{user?.name || 'Utilisateur'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="jb-topbar__dropdown drop-in" role="menu" aria-label="Menu utilisateur">
              <button className="jb-topbar__dropdown-item" onClick={() => { setMenuOpen(false); navigate('/settings'); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Reglages
              </button>
              <button className="jb-topbar__dropdown-item" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
                </svg>
                Profil & KPIs
              </button>
              <div className="jb-topbar__dropdown-divider" />
              <button className="jb-topbar__dropdown-item jb-topbar__dropdown-item--danger" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Deconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

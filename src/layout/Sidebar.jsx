import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import JobBoatLogo, { JobBoatMark } from '../components/JobBoatLogo';
import ContactModal from '../components/ContactModal';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Centre de Commande', icon: GridIcon, badge: null },
  { to: '/coaching',  label: 'Coaching IA',        icon: BrainIcon, badge: null },
  { to: '/auto-apply',label: 'Auto-Apply',         icon: RocketIcon, badge: null },
  { to: '/mes-candidatures', label: 'Mes Candidatures', icon: MailIcon, badge: null },
  { to: '/cv-builder',label: 'CV Builder',         icon: DocIcon, badge: null },
  { to: '/profile',   label: 'Profil & KPIs',      icon: ChartIcon, badge: null },
  { to: '/profil-carriere', label: 'Profil de carrière', icon: ChartIcon, badge: 'NEW' },
  { to: '/pricing',   label: 'Tarifs',             icon: TagIcon, badge: null },
  { to: '/settings',  label: 'Reglages',           icon: GearIcon, badge: null },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <aside className="jb-sidebar">
      <div className="jb-sidebar__brand" onClick={() => navigate('/landing')} style={{ cursor: 'pointer' }}>
        <JobBoatLogo size={36} className="jb-sidebar__logo-full" />
        <JobBoatMark size={28} className="jb-sidebar__logo-compact" />
        <div className="jb-sidebar__brand-info">
          <span className="jb-sidebar__brand-text">JobBoat <span className="jb-sidebar__beta-tag">BETA</span></span>
          <span className="jb-sidebar__brand-sub">by AZZ&amp;CO LABS</span>
        </div>
      </div>

      <nav className="jb-sidebar__nav">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `jb-sidebar__link ${isActive ? 'jb-sidebar__link--active' : ''}`
            }
          >
            <span className="jb-sidebar__link-icon">
              <item.icon />
            </span>
            <span className="jb-sidebar__link-label">{item.label}</span>
            {item.badge && (
              <span className="jb-sidebar__badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="jb-sidebar__footer">
        <button className="btn btn--ghost btn--sm btn--full" onClick={() => setShowContact(true)} style={{ marginBottom: 6 }}>
          <SupportIcon />
          <span className="jb-sidebar__link-label">Support</span>
        </button>
        <button className="btn btn--ghost btn--sm btn--full" onClick={handleLogout}>
          <LogoutIcon />
          <span className="jb-sidebar__link-label">Deconnexion</span>
        </button>
      </div>
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </aside>
  );
}

/* --- Mini SVG Icons --- */
function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M9 21h6" /><path d="M10 17v4" /><path d="M14 17v4" />
    </svg>
  );
}
function RocketIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function SupportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

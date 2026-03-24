import { NavLink, useLocation } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';

const ITEMS = [
  { to: '/dashboard', label: 'Home', icon: GridIcon },
  { to: '/coaching', label: 'Coach', icon: BrainIcon },
  { to: '/auto-apply', label: 'Jobs', icon: RocketIcon },
  { to: '/cv-builder', label: 'CV', icon: DocIcon },
  { to: '/settings', label: 'Plus', icon: MoreIcon },
];

export default function MobileNav() {
  const location = useLocation();
  const navRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({});

  // Calculate pill position based on active item
  useEffect(() => {
    if (!navRef.current) return;
    const activeIdx = ITEMS.findIndex((item) => location.pathname.startsWith(item.to));
    if (activeIdx < 0) return;

    const nav = navRef.current;
    const items = nav.querySelectorAll('.jb-mobile-nav__item');
    const activeEl = items[activeIdx];
    if (!activeEl) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();

    setPillStyle({
      width: `${itemRect.width}px`,
      transform: `translateX(${itemRect.left - navRect.left}px)`,
    });
  }, [location.pathname]);

  return (
    <nav className="jb-mobile-nav" ref={navRef} aria-label="Navigation principale mobile">
      {/* Sliding pill indicator */}
      <div className="jb-mobile-nav__pill" style={pillStyle} />

      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `jb-mobile-nav__item ${isActive ? 'jb-mobile-nav__item--active' : ''}`
          }
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/* --- SVG Icons (stroke-only, no fill, 20x20) --- */

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M9 21h6" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}

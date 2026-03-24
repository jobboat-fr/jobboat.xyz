import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import PageTransition from '../components/PageTransition';
import AIChatbot from '../components/chat/AIChatbot';
import ConsentBanner from '../components/ConsentBanner';
import { useAuth } from '../context/AuthContext';
import OnboardingWizard, { needsOnboarding } from '../components/OnboardingWizard';
import './layout.css';

/* Pages where the floating chatbot is hidden (embedded in-page instead) */
const HIDE_CHATBOT_ROUTES = ['/cv-builder'];

function EmailPromptModal() {
  const { updateEmail } = useAuth();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const val = draft.trim().toLowerCase();
    if (!val || !val.includes('@') || !val.includes('.')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    updateEmail(val);
  }

  return (
    <div className="jb-email-prompt-overlay">
      <form className="jb-email-prompt glass-card" onSubmit={handleSubmit}>
        <h3 className="font-display" style={{ marginBottom: 8 }}>Adresse email requise</h3>
        <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginBottom: 16 }}>
          Ton fournisseur de connexion n'a pas transmis d'email. Entre ton adresse pour continuer.
        </p>
        <input
          className="input"
          type="email"
          placeholder="exemple@mail.com"
          value={draft}
          onChange={e => { setDraft(e.target.value); setError(''); }}
          autoFocus
          required
        />
        {error && <p style={{ color: 'var(--jb-red)', fontSize: 'var(--jb-text-xs)', marginTop: 4 }}>{error}</p>}
        <button className="btn btn--primary" type="submit" style={{ marginTop: 12, width: '100%' }}>
          Continuer
        </button>
      </form>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const { needsEmail, user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(() => user && needsOnboarding());
  const showFloatingChat = !HIDE_CHATBOT_ROUTES.includes(location.pathname);

  return (
    <div className="jb-layout">
      <div className="page-bg-gradient" aria-hidden="true" />
      <div className="page-bg" aria-hidden="true" />
      <Sidebar />
      <div className="jb-main-area">
        <Topbar />
        <main className="jb-content">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <MobileNav />
      {showFloatingChat && <AIChatbot />}
      {needsEmail && <EmailPromptModal />}
      {showOnboarding && !needsEmail && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      <ConsentBanner />
    </div>
  );
}

import { useMemo, useState } from 'react';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import JupiterRoomEnhanced from './pages/JupiterRoomEnhanced';
import AutoApplyHub from './pages/AutoApplyHub';
import B2BLanding from './pages/B2BLanding';
import CorporateDashboard from './pages/CorporateDashboard';
import Legal from './pages/Legal';
import LaunchOffer from './pages/LaunchOffer';
import CookiesFAQ from './pages/CookiesFAQ';
import PartnersB2B2C from './pages/PartnersB2B2C';

const TABS = [
  { id: 'signup', label: 'Auth', component: Signup },
  { id: 'profile', label: 'Profile', component: Profile },
  { id: 'coaching', label: 'Coaching', component: JupiterRoomEnhanced },
  { id: 'autoapply', label: 'AutoApply', component: AutoApplyHub },
  { id: 'legal', label: 'Legal FR/UE', component: Legal },
  { id: 'cookies-faq', label: 'Cookies & FAQ', component: CookiesFAQ },
  { id: 'launch-offer', label: 'Offre 1EUR', component: LaunchOffer },
  { id: 'b2b', label: 'B2B', component: B2BLanding },
  { id: 'corporate', label: 'Corporate', component: CorporateDashboard },
  { id: 'partners', label: 'B2B2C', component: PartnersB2B2C }
];

export default function AppV1() {
  const [activeTab, setActiveTab] = useState('signup');
  const ActiveComponent = useMemo(() => {
    const found = TABS.find(tab => tab.id === activeTab);
    return found ? found.component : Signup;
  }, [activeTab]);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ margin: 0 }}>JobBoat V1 - MVP Console</h1>
        <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Extraction legacy + stabilisation progressive</p>
      </header>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 16 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              border: '1px solid #334155',
              padding: '8px 12px',
              background: tab.id === activeTab ? '#1d4ed8' : '#111827',
              color: '#f8fafc',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main style={{ padding: 16 }}>
        <ActiveComponent />
      </main>
    </div>
  );
}

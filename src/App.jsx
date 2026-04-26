import { lazy, Suspense } from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';

import { GravityProvider } from './context/GravityContext';

import { ActivityProvider } from './context/ActivityContext';

import AdminProtectedRoute, { checkAdminAccess } from './components/AdminProtectedRoute';

import SEOHead from './components/SEOHead';

// ActivityFeed panel intentionally disabled — see App body for note.
// import ActivityFeed from './components/ActivityFeed';

import UpgradeModal from './components/UpgradeModal';



const Layout       = lazy(() => import('./layout/Layout'));

const Landing      = lazy(() => import('./pages/Landing'));

const Auth         = lazy(() => import('./pages/Auth'));

const Dashboard    = lazy(() => import('./pages/Dashboard'));

const CoachingRoom = lazy(() => import('./pages/CoachingRoom'));

const AutoApply    = lazy(() => import('./pages/AutoApply'));

const ProfileKPI   = lazy(() => import('./pages/ProfileKPI'));

const Settings     = lazy(() => import('./pages/Settings'));

const CvBuilder    = lazy(() => import('./pages/CvBuilder'));

const Pricing      = lazy(() => import('./pages/Pricing'));

const Marketing         = lazy(() => import('./pages/Marketing'));

const MesCandidatures  = lazy(() => import('./pages/MesCandidatures'));

const NotFound     = lazy(() => import('./pages/NotFound'));

const AuthCallback = lazy(() => import('./pages/AuthCallback'));

const AdminLogin      = lazy(() => import('./pages/AdminLogin'));

const AdminDashboard  = lazy(() => import('./pages/AdminDashboard'));

const AdminAPIKeys    = lazy(() => import('./pages/AdminAPIKeys'));

const AdminLogs       = lazy(() => import('./pages/AdminLogs'));

const AdminRevenue    = lazy(() => import('./pages/AdminRevenue'));

const AdminCosts      = lazy(() => import('./pages/AdminCosts'));

const AdminMetrics    = lazy(() => import('./pages/AdminMetrics'));

const AdminRecruiter  = lazy(() => import('./pages/AdminRecruiter'));

const MyReadiness     = lazy(() => import('./pages/MyReadiness'));

const CvViewer        = lazy(() => import('./pages/CvViewer'));

const Legal           = lazy(() => import('./pages/Legal'));

const DeleteAccount   = lazy(() => import('./pages/DeleteAccount'));

const PublicStats     = lazy(() => import('./pages/PublicStats'));



function PageLoader() {

  return (

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>

      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>

  );

}



function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) return (

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>

      <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>

  );

  if (!user && !checkAdminAccess()) return <Navigate to="/auth" replace />;

  return children;

}



function GuestRoute({ children, fallback }) {

  const { user, loading } = useAuth();

  if (loading) return (

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>

      <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    </div>

  );

  if (user) return <Navigate to={fallback || "/dashboard"} replace />;

  return children;

}



function AppRoutes() {

  const { user } = useAuth();



  return (

    <Routes>

      {/* Root: Landing or Dashboard */}

      <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />

      <Route path="/landing" element={<Landing />} />

      <Route path="/auth" element={<GuestRoute><Auth /></GuestRoute>} />

      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/cv/:slug" element={<CvViewer />} />

      <Route path="/legal" element={<Legal />} />

      <Route path="/delete-account" element={<DeleteAccount />} />

      <Route path="/stats" element={<PublicStats />} />



      {/* Admin routes */}

      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

      <Route path="/admin/api-keys" element={<AdminProtectedRoute><AdminAPIKeys /></AdminProtectedRoute>} />

      <Route path="/admin/logs" element={<AdminProtectedRoute><AdminLogs /></AdminProtectedRoute>} />

      <Route path="/admin/revenue" element={<AdminProtectedRoute><AdminRevenue /></AdminProtectedRoute>} />

      <Route path="/admin/costs" element={<AdminProtectedRoute><AdminCosts /></AdminProtectedRoute>} />

      <Route path="/admin/metrics" element={<AdminProtectedRoute><AdminMetrics /></AdminProtectedRoute>} />

      <Route path="/admin/recruiter" element={<AdminProtectedRoute><AdminRecruiter /></AdminProtectedRoute>} />



      {/* Protected app routes */}

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/coaching" element={<CoachingRoom />} />

        <Route path="/auto-apply" element={<AutoApply />} />

        <Route path="/mes-candidatures" element={<MesCandidatures />} />

        <Route path="/profile" element={<ProfileKPI />} />

        <Route path="/profil-carriere" element={<MyReadiness />} />

        <Route path="/cv-builder" element={<CvBuilder />} />

        <Route path="/pricing" element={<Pricing />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="/marketing" element={<Marketing />} />

      </Route>



      <Route path="*" element={<NotFound />} />

    </Routes>

  );

}



export default function App() {

  return (

    <ActivityProvider>

      <AuthProvider>

        <GravityProvider>

          <BrowserRouter>

            <SEOHead />

            <Suspense fallback={<PageLoader />}>

              <AppRoutes />

            </Suspense>

            {/* ActivityFeed panel disabled per product decision (Apr 2026). */}
            {/* To re-enable, restore: <ActivityFeed /> */}

            <UpgradeModal />

          </BrowserRouter>

        </GravityProvider>

      </AuthProvider>

    </ActivityProvider>

  );

}


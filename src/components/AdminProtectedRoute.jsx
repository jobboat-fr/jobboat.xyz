import { Navigate } from 'react-router-dom';

// Frontend gate: we just verify a token exists, isn't stale, and has a
// reasonable length. The backend enforces actual authorization on every
// admin request via x-admin-token => ADMIN_BYPASS_TOKEN timing-safe compare.
export function checkAdminAccess() {
  const token = localStorage.getItem('admin_access_token');
  const accessTime = localStorage.getItem('admin_access_time');

  if (!token || !accessTime) return false;
  if (String(token).length < 10) return false;

  // 24h local session window (backend still validates every request)
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  if (Date.now() - parseInt(accessTime, 10) > TWENTY_FOUR_HOURS) {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_access_time');
    return false;
  }

  return true;
}

export function getAdminToken() {
  return localStorage.getItem('admin_access_token') || '';
}

export default function AdminProtectedRoute({ children }) {
  if (!checkAdminAccess()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

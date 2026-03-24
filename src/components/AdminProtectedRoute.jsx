import { Navigate } from 'react-router-dom';

const ADMIN_USER = import.meta.env.VITE_ADMIN_USERNAME || '';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || '';
const ADMIN_CREDENTIALS = ADMIN_USER && ADMIN_PASS ? `${ADMIN_USER}:${ADMIN_PASS}` : null;

export function checkAdminAccess() {
  const token = localStorage.getItem('admin_access_token');
  const accessTime = localStorage.getItem('admin_access_time');

  if (!token || !accessTime) return false;

  try {
    const decoded = atob(token);
    if (!ADMIN_CREDENTIALS || decoded !== ADMIN_CREDENTIALS) return false;

    // Token expires after 24 hours
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(accessTime) > TWENTY_FOUR_HOURS) {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_access_time');
      return false;
    }

    return true;
  } catch {
    return false;
  }
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

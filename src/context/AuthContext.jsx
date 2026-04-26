import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../services/apiClient';

const AuthContext = createContext(null);

function persistUser(u) {
  try {
    localStorage.setItem('jobboat_user', JSON.stringify({
      uid: u.uid || '',
      email: u.email || '',
      phone: u.phone || '',
      name: u.name || '',
      avatar: u.avatar || '',
      provider: u.provider || '',
    }));
  } catch {
    // noop
  }
}

function normalizeSupabaseUser(sbUser) {
  if (!sbUser) return null;

  const email = String(sbUser.email || sbUser.user_metadata?.email || '').toLowerCase();
  const phone = String(sbUser.phone || '').trim();
  const name =
    sbUser.user_metadata?.full_name
    || sbUser.user_metadata?.name
    || (email ? email.split('@')[0] : (phone || 'User'));
  const avatar =
    sbUser.user_metadata?.avatar_url
    || sbUser.user_metadata?.picture
    || '';
  const provider = String(sbUser.app_metadata?.provider || sbUser.user_metadata?.provider || '').toLowerCase();

  return {
    uid: sbUser.id || email || phone,
    email,
    phone,
    name,
    avatar,
    provider,
    _raw: sbUser,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsEmail, setNeedsEmail] = useState(false);

  const applySessionUser = useCallback((sbUser) => {
    const normalized = normalizeSupabaseUser(sbUser);

    if (!normalized) {
      setUser(null);
      setNeedsEmail(false);
      return;
    }

    setUser(normalized);
    persistUser(normalized);
    setNeedsEmail(!normalized.email);

    window.posthog?.identify(normalized.uid || normalized.email, {
      email: normalized.email,
      name: normalized.name,
      provider: normalized.provider || 'supabase',
    });
    window.posthog?.capture('user_logged_in', {
      email: normalized.email,
      provider: normalized.provider || 'supabase',
    });

    if (normalized.email) {
      api.v2SyncAuth({
        uid: normalized.uid,
        name: normalized.name,
        email: normalized.email,
      }).then(resp => {
        if (resp?.user?.name && resp.user.name !== normalized.name) {
          setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, name: resp.user.name };
            persistUser(updated);
            return updated;
          });
        }
      }).catch((err) => {
        console.warn('[JobBoat] Backend sync failed (non-blocking):', err.message);
      });
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        applySessionUser(data?.session?.user || null);
      })
      .catch((err) => {
        console.warn('[Auth] Unable to read session:', err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySessionUser(session?.user || null);
      setLoading(false);
    });

    // Handle session-expired events from apiClient: try to refresh, else sign out.
    const onSessionExpired = async (_ev) => {
      try {
        const { data: refreshed } = await supabase.auth.refreshSession();
        if (refreshed?.session?.user) {
          // Refresh worked — apiClient will pick up the new token on next poll.
          applySessionUser(refreshed.session.user);
          return;
        }
      } catch (_e) { /* fall through to sign-out */ }
      // No refresh possible — clear local state + force redirect to /auth.
      try { await supabase.auth.signOut(); } catch (_e) { /* noop */ }
      setUser(null);
      setNeedsEmail(false);
      if (typeof window !== 'undefined' && window.location.pathname !== '/auth' && window.location.pathname !== '/') {
        window.location.replace('/auth?reason=session_expired');
      }
    };
    window.addEventListener('jobboat:session-expired', onSessionExpired);

    return () => {
      active = false;
      data.subscription?.unsubscribe();
      window.removeEventListener('jobboat:session-expired', onSessionExpired);
    };
  }, [applySessionUser]);

  const updateName = useCallback((newName) => {
    const name = String(newName || '').trim();
    if (!name) return;

    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, name };
      persistUser(updated);
      return updated;
    });

    supabase.auth.updateUser({ data: { full_name: name, name } }).catch((err) => {
      console.warn('[Auth] Supabase name update failed (non-blocking):', err.message);
    });
  }, []);

  const updateEmail = useCallback((newEmail) => {
    const email = String(newEmail || '').trim().toLowerCase();
    if (!email) return;

    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, email };
      persistUser(updated);
      return updated;
    });
    setNeedsEmail(false);

    supabase.auth.updateUser({ email }).catch((err) => {
      console.warn('[Auth] Supabase email update failed (non-blocking):', err.message);
    });

    api.v2SyncAuth({
      uid: user?.uid || email,
      name: user?.name || email.split('@')[0],
      email,
    }).catch((err) => {
      console.warn('[JobBoat] Backend sync after email update failed:', err.message);
    });
  }, [user]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Auth] Supabase signOut error:', err.message);
    }

    setUser(null);
    setNeedsEmail(false);

    const keysToRemove = [
      'jobboat_user',
      'jobboat_ewma',
      'jobboat_coaching_history',
      'jobboat_cv_uploaded',
      'jobboat_matching_context',
      'jb_avatar_mode',
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    try {
      const keys = Object.keys(localStorage);
      keys.filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
    } catch {
      // noop
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsEmail,
        updateEmail,
        updateName,
        logout,
        login: () => {},
        signOut: logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

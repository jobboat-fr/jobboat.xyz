import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const RAILWAY_BACKEND = 'https://api.jobboat.xyz';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);
  const [status, setStatus] = useState('Connexion en cours...');

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const error = params.get('error') || params.get('error_description');
    const code = params.get('code');
    const state = params.get('state');
    const provider = params.get('provider');
    const email = params.get('email');
    const name = params.get('name');
    const picture = params.get('picture');

    const hash = window.location.hash;
    const hasSupabaseTokens = hash.includes('access_token=') || hash.includes('refresh_token=');

    console.log('[AuthCallback]', { hasSupabaseTokens, provider, code: code ? '***' : null, error });

    if (error) {
      console.error('[AuthCallback] error:', error);
      setStatus(`Erreur: ${error}`);
      alert()
      setTimeout(() => navigate('/auth', { replace: true }), 3000);
      return;
    }

    // ── Supabase OAuth / Magic Link redirect (tokens in URL hash) ──
    if (hasSupabaseTokens) {
      setStatus('Authentification Supabase en cours...');

      // Parse hash tokens and explicitly set the session
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ data: sessionData, error: sessionError }) => {
            if (sessionError) {
              console.error('[AuthCallback] setSession error:', sessionError.message);
              setStatus(`Erreur de session: ${sessionError.message}. Redirection...`);
              alert()
              setTimeout(() => navigate('/auth', { replace: true }), 3000);
              return;
            }
            if (sessionData?.session?.user) {
              console.log('[AuthCallback] Session set successfully for', sessionData.session.user.email);
              navigate('/dashboard', { replace: true });
            } else {
              setStatus('Session introuvable. Redirection...');
              alert()
              setTimeout(() => navigate('/auth', { replace: true }), 2000);
            }
          })
          .catch((err) => {
            console.error('[AuthCallback] setSession catch:', err);
            setStatus('Erreur inattendue. Redirection...');
            alert()
            setTimeout(() => navigate('/auth', { replace: true }), 2000);
          });
      } else {
        // Fallback: wait for onAuthStateChange to pick up the hash
        const timeout = setTimeout(() => {
          setStatus('Delai depasse. Redirection...');
          navigate('/auth', { replace: true });
        }, 8000);

        const { data: listenerData } = supabase.auth.onAuthStateChange((event, session) => {
          if (session?.user) {
            clearTimeout(timeout);
            listenerData.subscription?.unsubscribe();
            navigate('/dashboard', { replace: true });
          }
        });

        return () => {
          clearTimeout(timeout);
          listenerData.subscription?.unsubscribe();
        };
      }
      return;
    }

    // ── LinkedIn OAuth callback with code (needs backend exchange) ──
    if (code && !provider) {
      setStatus('Verification LinkedIn en cours...');
      const backendCallback = `${RAILWAY_BACKEND}/api/v2/auth/linkedin/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}`;
      window.location.replace(backendCallback);
      return;
    }

    // ── LinkedIn callback with user data (backend redirected back) ──
    if (provider === 'linkedin' && email) {
      const userData = {
        uid: email,
        email,
        name: name || email.split('@')[0],
        avatar: picture || '',
        provider: 'linkedin',
      };
      try {
        localStorage.setItem('jobboat_user', JSON.stringify(userData));
      } catch (e) {
        console.warn('[AuthCallback] localStorage error:', e);
      }
      setStatus('Connexion LinkedIn reussie ! Redirection...');
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 300);
      return;
    }

    // ── Generic provider callback with user data ──
    if (provider && email) {
      const userData = {
        uid: email,
        email,
        name: name || email.split('@')[0],
        avatar: picture || '',
        provider,
      };
      try {
        localStorage.setItem('jobboat_user', JSON.stringify(userData));
      } catch (e) {
        console.warn('[AuthCallback] localStorage error:', e);
      }
      setStatus('Connexion reussie ! Redirection...');
      setTimeout(() => {
        window.location.replace('/dashboard');
      }, 300);
      return;
    }

    // ── Fallback: check if Supabase already has a session ──
    setStatus('Verification de la session...');
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData?.session?.user) {
        navigate('/dashboard', { replace: true });
      } else {
        setStatus('Parametres de connexion manquants. Redirection...');
        setTimeout(() => navigate('/auth', { replace: true }), 2000);
      }
    }).catch(() => {
      setTimeout(() => navigate('/auth', { replace: true }), 2000);
    });
  }, [params, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--jb-bg, #0f172a)',
      color: 'var(--jb-text, #e2e8f0)',
      gap: 16,
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid rgba(99,102,241,0.3)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p>{status}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

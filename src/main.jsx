import React from 'react';
import ReactDOM from 'react-dom/client';

// Sentry — activate by adding VITE_SENTRY_DSN to Vercel environment variables
if (import.meta.env.VITE_SENTRY_DSN) {
  import('@sentry/react').then(({ init, browserTracingIntegration }) => {
    init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      integrations: [browserTracingIntegration()],
    });
  }).catch(() => { /* run: npm install @sentry/react in frontend/ */ });
}
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/ToastProvider';
import App from './App';

import './design/tokens.css';
import './design/components.css';
import './design/global.css';
import './design/animations.css';

// PostHog product analytics — deferred until GDPR consent is granted (RGPD compliant)
// ConsentBanner calls window.initPostHog() after analytics consent is given.
if (import.meta.env.VITE_POSTHOG_KEY) {
  window._posthogKey = import.meta.env.VITE_POSTHOG_KEY;
  window._posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com';

  window.initPostHog = function() {
    if (window._posthogInitialised) return;
    window._posthogInitialised = true;
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]);t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;a!==void 0?u=e[a]=[]:a="posthog";u.people=u.people||[];u.toString=function(t){var e="posthog";return a!=="posthog"&&(e+="."+a),t||(e+=" (stub)"),e};u.people.toString=function(){return u.toString(1)+" (stub)"};o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" ");for(n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(window._posthogKey, {
      api_host: window._posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    });
  };

  // If consent was already given in a previous session, init immediately
  try {
    const saved = JSON.parse(localStorage.getItem('jobboat_consent') || 'null');
    if (saved?.analytics === true) window.initPostHog();
  } catch { /* ignore */ }
}

// Crisp customer support chat — add VITE_CRISP_WEBSITE_ID to Vercel env vars
if (import.meta.env.VITE_CRISP_WEBSITE_ID) {
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID;
  const _cs = document.createElement('script');
  _cs.type = 'text/javascript'; _cs.async = true;
  _cs.src = 'https://client.crisp.chat/l.js';
  document.head.appendChild(_cs);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

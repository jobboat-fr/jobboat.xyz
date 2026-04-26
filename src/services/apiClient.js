// ── Activity feed hook (populated by ActivityContext) ─────────────────────────

let _activityCb = null;

export function setActivityCallback(cb) { _activityCb = cb; }



let _activitySeq = 0;

function nextId() { return `act-${++_activitySeq}`; }



const ROUTE_LABELS = {

  'POST /api/v2/coaching/session':               { icon: "🤖", label: "Oracle traite votre message...",       sub: "IA coaching" },

  'POST /api/v2/coaching/session/stream':        { icon: "🤖", label: "Oracle genere une reponse...",         sub: "IA streaming" },

  'POST /api/v2/jobs/search':                    { icon: "🔍", label: "Recherche d'offres d'emploi...",       sub: "Agregateur multi-API" },

  'POST /api/v2/jobs/discovery/auto':            { icon: "🎯", label: "Decouverte d'offres personnalisee...", sub: "Matching IA" },

  'POST /api/v2/cv/upload':                      { icon: "📄", label: "Envoi et analyse du CV...",            sub: "Parseur CV" },

  'GET  /api/v2/cv/latest':                      { icon: "📄", label: "Chargement du CV...",                  sub: "" },

  'POST /api/v2/autoapply/apply':                { icon: "📧", label: "Envoi de candidature...",              sub: "Auto-Apply" },

  'POST /api/v2/autoapply/prepare':              { icon: "⚙", label: "Preparation de la candidature...",     sub: "Lettre de motivation IA" },

  'GET  /api/v2/profile':                        { icon: "👤", label: "Chargement du profil...",              sub: "" },

  'POST /api/v2/profile':                        { icon: "💾", label: "Sauvegarde du profil...",              sub: "" },

  'PUT  /api/v2/profile':                        { icon: "💾", label: "Mise a jour du profil...",             sub: "" },

  'POST /api/v2/stripe/create-checkout-session': { icon: "💳", label: "Creation session paiement...",        sub: "Stripe" },

  'POST /api/v2/stripe/create-portal-session':   { icon: "💳", label: "Portail abonnement...",               sub: "Stripe" },

  'POST /api/v2/ai/avatar/generate':             { icon: "🎭", label: "Generation de l'avatar IA...",        sub: "RunwayML" },

  'GET  /api/v2/ai/avatar/status':               { icon: "🎭", label: "Verification avatar...",              sub: "" },

  'POST /api/v2/ai/tts':                         { icon: "🔊", label: "Synthese vocale...",                  sub: "TTS RapidAPI" },

  'POST /api/v2/tts/stream':                     { icon: "🔊", label: "Generation voix ElevenLabs...",       sub: "TTS streaming" },

  'GET  /api/v2/tts/voices':                     { icon: "🔊", label: "Chargement des voix...",              sub: "ElevenLabs" },

  'POST /api/v2/auth/sync':                       { icon: "🔐", label: "Synchronisation auth...",              sub: "Supabase" },

  'GET  /api/v2/check-access':                   { icon: "🔑", label: "Verification des acces...",           sub: "Plan usage" },

  'POST /api/v2/coaching/feedback':              { icon: "⭐", label: "Envoi du feedback...",                sub: "" },

  'GET  /api/v2/coaching/ewma':                  { icon: "📊", label: "Chargement des scores EWMA...",       sub: "KPI coaching" },

  'POST /api/v2/coaching/ewma/sync':             { icon: "📊", label: "Sync des scores EWMA...",             sub: "" },

  'GET  /api/v2/coaching/analytics':             { icon: "📈", label: "Chargement analytics coaching...",   sub: "" },

  'POST /api/v2/companies/research':             { icon: "🏢", label: "Recherche entreprise...",             sub: "Intelligence swarm" },

  'POST /api/v2/companies/research/batch':       { icon: "🏢", label: "Recherche batch entreprises...",      sub: "Intelligence swarm" },

  'POST /api/v2/push/register':                  { icon: "🔔", label: "Enregistrement notifications...",     sub: "Push" },

  'POST /api/v2/ai/execute':                     { icon: "🧠", label: "Execution tache IA...",               sub: "Orchestrateur" },

  'GET  /api/v2/kpi/overview':                   { icon: "📊", label: "Chargement KPI...",                   sub: "" },

  'GET  /api/v2/activity/summary':               { icon: "📋", label: "Chargement activite...",              sub: "" },

  'GET  /api/admin/revenue':                     { icon: "💰", label: "Chargement MRR...",                   sub: "Admin" },

  'GET  /api/admin/users':                       { icon: "👥", label: "Chargement utilisateurs...",          sub: "Admin" },

  'GET  /api/admin/dashboard':                   { icon: "📊", label: "Chargement dashboard admin...",       sub: "Admin" },

  'POST /api/v2/contact':                        { icon: "💬", label: "Envoi du message support...",          sub: "Support" },

};



function resolveLabel(method, path) {

  const m = (method || 'GET').toUpperCase().padEnd(4);

  const p = path.split('?')[0].replace(/\/[0-9a-f-]{8,}(?=\/|$)/g, '/:id');

  const key = `${m.trim()} ${p}`;

  return ROUTE_LABELS[key] || { icon: '⚡', label: `${m.trim()} ${p.replace('/api/v2/', '').replace('/api/', '')}`, sub: '' };

}



// In production (Vercel), VITE_API_BASE_URL should be the Railway backend URL.

// Fallback: if empty and NOT on localhost, use the known Railway URL so API calls

// never accidentally hit the Vercel SPA catch-all rewrite (which returns HTML).

const RAILWAY_BACKEND = 'https://jobboatv1-production-cb89.up.railway.app';



function resolveBase() {

  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

  if (fromEnv) return fromEnv;

  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {

    return RAILWAY_BACKEND;

  }

  return '';

}



const BASE = resolveBase();

// Exposed for pages that need to make raw fetch calls (e.g. admin login verify)
export function getApiBase() { return BASE; }



// Admin bypass token is now stored raw in localStorage after AdminLogin
// verifies it against the backend. No frontend env dependency, no base64 dance.
function getAdminBypassToken() {
  const token = localStorage.getItem('admin_access_token');
  if (!token) return '';
  // Backward compat: if token was stored old-style as btoa(user:pass),
  // try to decode and return first part (legacy logins pre-fix).
  if (/^[A-Za-z0-9+/=]+$/.test(token) && token.length > 20) {
    try {
      const decoded = atob(token);
      if (decoded.includes(':')) return decoded.split(':')[0] || token;
    } catch (_e) { /* not base64, use as-is */ }
  }
  return token;
}



function getUserEmailHeader() {

  try {

    // Try Supabase session first

    const sbSession = localStorage.getItem('sb-qxnlfyuuufqkmulpgxbn-auth-token');

    if (sbSession) {

      const parsed = JSON.parse(sbSession);

      const email = parsed?.user?.email;

      if (email) return String(email).toLowerCase();

    }

    // Fallback to legacy localStorage

    const raw = localStorage.getItem('jobboat_user');

    if (!raw) return '';

    const parsed = JSON.parse(raw);

    return parsed && parsed.email ? String(parsed.email).toLowerCase() : '';

  } catch {

    return '';

  }

}



function buildUrl(path) {

  const p = '/' + (path || '').replace(/^\/*/, '');

  // If BASE is empty, return relative path (goes through Vite proxy in dev)

  if (!BASE) return p;

  // Otherwise prepend the full backend URL

  return BASE + p;

}



async function request(path, opts = {}) {

  const adminToken = getAdminBypassToken();

  const userEmail = getUserEmailHeader();

  const headers = {

    'Content-Type': 'application/json',

    ...(adminToken ? { 'x-admin-token': adminToken } : {}),

    ...(userEmail ? { 'x-user-email': userEmail } : {}),

    ...(opts.headers || {}),

  };



  const method = (opts.method || 'GET').toUpperCase();

  const actId = nextId();

  const { icon, label, sub } = resolveLabel(method, path);

  _activityCb?.({ id: actId, icon, label, sub, status: 'pending' });



  const url = buildUrl(path);

  try {

    const res = await fetch(url, { headers, ...opts });

    if (!res.ok) {

      const body = await res.json().catch(() => ({}));

      _activityCb?.({ id: actId, status: 'error' });

      // 401 => session expired. Emit a global event once per 60s so components
      // can stop polling, show a reconnect prompt, or force-logout.
      // Prevents the "401 storm" where dashboards poll /profile every minute forever.
      if (res.status === 401) {
        const now = Date.now();
        if (!window.__jobboatLast401 || (now - window.__jobboatLast401) > 60000) {
          window.__jobboatLast401 = now;
          try {
            window.dispatchEvent(new CustomEvent('jobboat:session-expired', {
              detail: { path, status: 401, message: body.message || body.error || '' },
            }));
          } catch (_e) { /* best-effort */ }
        }
      }

      // If this is a plan/limit error, dispatch a global event for UpgradeModal.
      // We still throw so callers can handle the error, but the modal is shown centrally.
      if (res.status === 429 || res.status === 403) {
        const reason = body.error || '';
        if (reason === 'limit_reached' || reason === 'pro_required' || reason === 'payg_billing_error') {
          try {
            window.dispatchEvent(new CustomEvent('jobboat:upgrade-prompt', {
              detail: {
                reason,
                message: body.message || '',
                limit: body.limit,
                used: body.used,
                actionType: body.actionType,
                currentPlan: body.currentPlan,
                upgradeUrl: body.upgradeUrl || '/pricing',
              },
            }));
          } catch (_e) { /* best-effort */ }
        }
      }

      const err = new Error(body.error || body.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;

    }

    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {

      const text = await res.text().catch(() => '');

      _activityCb?.({ id: actId, status: 'error' });

      throw new Error(`Expected JSON but got ${contentType || 'unknown'}: ${text.slice(0, 120)}`);

    }

    const data = await res.json();

    _activityCb?.({ id: actId, status: 'done' });

    return data;

  } catch (e) {

    _activityCb?.({ id: actId, status: 'error' });

    throw e;

  }

}



export const api = {

  // Auth

  signup: (body) => request('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) }),



  // Profile

  saveProfile: (body) => request('/api/profile', { method: 'POST', body: JSON.stringify(body) }),

  getProfile: (email) => request(`/api/profile?email=${encodeURIComponent(email)}`),



  // Jobs

  searchJobs: (body) => request('/api/jobs/search', { method: 'POST', body: JSON.stringify(body) }),



  // Matching

  getMatchingScore: (body) => request('/api/matching/score', { method: 'POST', body: JSON.stringify(body) }),



  // Coaching

  coachingSession: (body) => request('/api/coaching/interview/session', { method: 'POST', body: JSON.stringify(body) }),



  // Auto-apply

  autoApply: (body) => request('/api/autoapply/apply', { method: 'POST', body: JSON.stringify(body) }),



  // Corporate

  corporateOverview: () => request('/api/corporate/overview'),



  // Health

  health: () => request('/health'),



  // V2 workflow endpoints

  v2SyncAuth: (body) => request('/api/v2/auth/sync', { method: 'POST', body: JSON.stringify(body) }),

  v2Contact: (body) => request('/api/v2/contact', { method: 'POST', body: JSON.stringify(body) }),

  v2GetProfile: (email) => request(`/api/v2/profile?email=${encodeURIComponent(email)}`),

  v2SaveProfile: (body) => request('/api/v2/profile', { method: 'POST', body: JSON.stringify(body) }),

  v2AutoJobDiscovery: (body) => request('/api/v2/jobs/discovery/auto', { method: 'POST', body: JSON.stringify(body) }),

  v2SearchJobs: (body) => request('/api/v2/jobs/search', { method: 'POST', body: JSON.stringify(body) }),

  v2ActivitySummary: (email) => request(`/api/v2/activity/summary?email=${encodeURIComponent(email)}`),

  v2KpiOverview: (email) => request(`/api/v2/kpi/overview?email=${encodeURIComponent(email)}`),

  v2CoachingSession: (body) => request('/api/v2/coaching/session', { method: 'POST', body: JSON.stringify(body) }),

  v2CoachingSessionStream: (body) => fetch(buildUrl('/api/v2/coaching/session/stream'), {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      ...(getAdminBypassToken() ? { 'x-admin-token': getAdminBypassToken() } : {}),

      ...(getUserEmailHeader() ? { 'x-user-email': getUserEmailHeader() } : {}),

    },

    body: JSON.stringify(body),

  }),

  v2CoachingPersonas: () => request('/api/v2/coaching/personas'),

  v2CoachingModes: () => request('/api/v2/coaching/modes'),

  v2CoachingEwma: () => request('/api/v2/coaching/ewma'),

  v2CoachingEwmaSync: (body) => request('/api/v2/coaching/ewma/sync', { method: 'POST', body: JSON.stringify(body) }),

  v2CoachingFeedback: (body) => request('/api/v2/coaching/feedback', { method: 'POST', body: JSON.stringify(body) }),

  v2CoachingSessionEnd: (body) => request('/api/v2/coaching/session/end', { method: 'POST', body: JSON.stringify(body) }),

  v2AutoApply: (body) => request('/api/v2/autoapply/apply', { method: 'POST', body: JSON.stringify(body) }),

  v2AutoApplyPrepare: (body) => request('/api/v2/autoapply/prepare', { method: 'POST', body: JSON.stringify(body) }),

  v2AiExecute: (body) => request('/api/v2/ai/execute', { method: 'POST', body: JSON.stringify(body) }),

  v2DiscoverContacts: (body) => request('/api/v2/company/contacts/discover', { method: 'POST', body: JSON.stringify(body) }),



  // Company Intelligence

  v2CompanyIntel: (domain) => request(`/api/v2/companies/${encodeURIComponent(domain)}`),

  v2CompanyResearch: (body) => request('/api/v2/companies/research', { method: 'POST', body: JSON.stringify(body) }),

  v2CompanyResearchBatch: (body) => request('/api/v2/companies/research/batch', { method: 'POST', body: JSON.stringify(body) }),

  v2CompanyIntelForJob: (jobId) => request(`/api/v2/companies/job/${encodeURIComponent(jobId)}`),



  // Job aggregation

  v2AggregationStatus: () => request('/api/v2/jobs/aggregation/status'),

  v2AggregationContacts: () => request('/api/v2/jobs/aggregation/contacts'),

  v2AggregationRefresh: () => request('/api/v2/jobs/aggregation/refresh', { method: 'POST' }),



  // Coaching analytics

  v2CoachingAnalytics: (email) => request(`/api/v2/coaching/analytics?email=${encodeURIComponent(email)}`),



  // Matching score

  v2MatchingScore: (body) => request('/api/v2/matching/score', { method: 'POST', body: JSON.stringify(body) }),



  // TTS

  v2Tts: (body) => request('/api/v2/ai/tts', { method: 'POST', body: JSON.stringify(body) }),



  // Avatar (Runway legacy)

  v2AvatarGenerate: (body) => request('/api/v2/ai/avatar/generate', { method: 'POST', body: JSON.stringify(body) }),

  v2AvatarStatus: (uuid) => request(`/api/v2/ai/avatar/status?uuid=${encodeURIComponent(uuid)}`),



  // ElevenLabs TTS

  v2TtsStream: (body) => request('/api/v2/tts/stream', { method: 'POST', body: JSON.stringify(body) }),

  v2TtsVoices: () => request('/api/v2/tts/voices'),

  v2TtsStatus: () => request('/api/v2/tts/status'),



  // Tavus Conversational Video

  v2AvatarConversationStart: (body) => request('/api/v2/avatar/conversation/start', { method: 'POST', body: JSON.stringify(body) }),

  v2AvatarConversationEnd: (body) => request('/api/v2/avatar/conversation/end', { method: 'POST', body: JSON.stringify(body) }),

  v2AvatarConversationStatus: (id) => request(`/api/v2/avatar/conversation/${id}`),



  // D-ID Talks

  v2AvatarTalk: (body) => request('/api/v2/avatar/talk', { method: 'POST', body: JSON.stringify(body) }),

  v2AvatarTalkStatus: (id) => request(`/api/v2/avatar/talk/${id}`),



  // CV latest (check existing)

  v2GetLatestCv: (email) => request(`/api/v2/cv/latest?email=${encodeURIComponent(email)}`),



  // Document Vault

  v2Documents: (type) => request(`/api/v2/documents${type ? `?type=${encodeURIComponent(type)}` : ''}`),

  v2Document: (id) => request(`/api/v2/documents/${id}`),

  v2UpdateDocument: (id, body) => request(`/api/v2/documents/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  v2DeleteDocument: (id) => request(`/api/v2/documents/${id}`, { method: 'DELETE' }),

  async v2UploadDocument(file, name, type = 'other', description = '') {

    const form = new FormData();

    form.append('file', file, file.name);

    form.append('name', name);

    form.append('type', type);

    if (description) form.append('description', description);

    const adminToken = getAdminBypassToken();

    const userEmail = getUserEmailHeader();

    const headers = {

      ...(adminToken ? { 'x-admin-token': adminToken } : {}),

      ...(userEmail ? { 'x-user-email': userEmail } : {}),

    };

    const res = await fetch(buildUrl('/api/v2/documents/upload'), { method: 'POST', headers, body: form, credentials: 'include' });

    return res.json();

  },



  // Applications list

  v2Applications: (email) => request(`/api/v2/applications?email=${encodeURIComponent(email)}`),

  v2Application: (id) => request(`/api/v2/applications/${id}`),

  v2UpdateApplication: (id, body) => request(`/api/v2/applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  v2RelanceApplication: (id, body) => request(`/api/v2/applications/${id}/relance`, { method: 'POST', body: JSON.stringify(body) }),

  v2CancelApplication: (id, body) => request(`/api/v2/applications/${id}/cancel`, { method: 'POST', body: JSON.stringify(body || {}) }),

  v2ApplicationsCoachingSummary: () => request('/api/v2/applications/summary/for-coaching'),



  // Whisper Transcription

  async v2Transcribe(audioBlob, language = 'fr') {

    const form = new FormData();

    form.append('audio', audioBlob, 'recording.webm');

    form.append('language', language);



    const adminToken = getAdminBypassToken();

    const userEmail = getUserEmailHeader();

    const headers = {

      ...(adminToken ? { 'x-admin-token': adminToken } : {}),

      ...(userEmail ? { 'x-user-email': userEmail } : {}),

    };



    const res = await fetch(buildUrl('/api/v2/ai/transcribe'), {

      method: 'POST',

      headers,

      body: form,

    });

    if (!res.ok) {

      const body = await res.json().catch(() => ({}));

      throw new Error(body.error || `HTTP ${res.status}`);

    }

    return res.json();

  },



  // Stripe

  v2StripeCheckout: (body) => request('/api/v2/stripe/create-checkout-session', { method: 'POST', body: JSON.stringify(body) }),

  v2StripePortal: (body) => request('/api/v2/stripe/create-portal-session', { method: 'POST', body: JSON.stringify(body) }),

  v2StripeSubscriptionStatus: () => request('/api/v2/stripe/subscription-status'),

  v2StripePlans: () => request('/api/v2/stripe/plans'),

  v2StripeVerifySession: (body) => request('/api/v2/stripe/verify-session', { method: 'POST', body: JSON.stringify(body) }),

  v2StripeCancelSubscription: () => request('/api/v2/stripe/cancel-subscription', { method: 'POST' }),

  v2ComplianceDelete: (body) => request('/api/v2/compliance/delete', { method: 'POST', body: JSON.stringify(body) }),



  // PAYG (Pay-As-You-Go)

  v2PaygActivate: () => request('/api/v2/payg/activate', { method: 'POST' }),

  v2PaygConfirm: (body) => request('/api/v2/payg/confirm', { method: 'POST', body: JSON.stringify(body) }),

  v2PaygDeactivate: () => request('/api/v2/payg/deactivate', { method: 'POST' }),

  v2PaygStatus: () => request('/api/v2/payg/status'),



  // Usage tracking

  v2UsageToday: () => request('/api/v2/usage/today'),



  // CV enrichment

  v2CvEnrich: (body) => request('/api/v2/cv/enrich', { method: 'POST', body: JSON.stringify(body) }),

  v2CvGenerateWeb: (body) => request('/api/v2/cv/generate-web', { method: 'POST', body: JSON.stringify(body) }),

  v2CvWebAnalytics: (slug) => request(`/api/v2/cv/web/${encodeURIComponent(slug)}/analytics`),

  v2CvExportPdf: (body) => request('/api/v2/cv/export/pdf', { method: 'POST', body: JSON.stringify(body) }),



  // Twilio phone verification

  v2PhoneSendCode: (body) => request('/api/v2/phone/send-code', { method: 'POST', body: JSON.stringify(body) }),

  v2PhoneVerify: (body) => request('/api/v2/phone/verify', { method: 'POST', body: JSON.stringify(body) }),



  // Referral program

  referralGetCode: () => request('/api/v2/referral/code'),

  referralApply: (email, code) => request('/api/v2/referral/apply', { method: 'POST', body: JSON.stringify({ email, code }) }),

  referralStats: () => request('/api/v2/referral/stats'),



  // LinkedIn OAuth

  linkedinAuthUrl: () => request('/api/v2/auth/linkedin'),

  linkedinStatus: () => request('/api/v2/auth/linkedin/status'),



  // Mantiks NLP

  mantiksEnrichCv: (text) => request('/api/v2/mantiks/enrich-cv', { method: 'POST', body: JSON.stringify({ text }) }),

  mantiksAnalyzeJob: (text) => request('/api/v2/mantiks/analyze-job', { method: 'POST', body: JSON.stringify({ text }) }),

  mantiksMatch: (cv, job) => request('/api/v2/mantiks/match', { method: 'POST', body: JSON.stringify({ cv, job }) }),

  mantiksStatus: () => request('/api/v2/mantiks/status'),



  // Jobby Mind Semantic OS

  v2MindStatus: () => request('/api/v2/mind/status'),

  v2MindPerformance: (days = 30) => request(`/api/v2/mind/performance?days=${days}`),

  v2MindDialects: () => request('/api/v2/mind/dialects'),

  v2MindModels: () => request('/api/v2/mind/models'),

  v2MindLexicon: (opts = {}) => request(`/api/v2/mind/lexicon?limit=${opts.limit || 200}${opts.category ? `&category=${opts.category}` : ''}${opts.search ? `&search=${encodeURIComponent(opts.search)}` : ''}`),

  v2MindStats: (days = 30) => request(`/api/v2/mind/stats?days=${days}`),

  v2MindAnalyze: (body) => request('/api/v2/mind/analyze', { method: 'POST', body: JSON.stringify(body) }),

  v2MindTelemetry: (batch) => request('/api/v2/mind/telemetry', { method: 'POST', body: JSON.stringify(batch) }),

  v2MindSwarmRun: (sources) => request('/api/v2/mind/swarm/run', { method: 'POST', body: JSON.stringify(sources ? { sources } : {}) }),



  // LLM Engine

  v2LlmInference: (body) => request('/api/v2/llm/inference', { method: 'POST', body: JSON.stringify(body) }),

  v2LlmStatus: () => request('/api/v2/llm/status'),

  v2LlmTrainStats: () => request('/api/v2/llm/train/stats'),



  // GDPR

  v2ComplianceConsent: (body) => request('/api/v2/compliance/consent', { method: 'POST', body: JSON.stringify(body) }),

  v2ComplianceExport: (email) => request(`/api/v2/compliance/export?email=${encodeURIComponent(email)}`),

  // v2ComplianceDelete is defined earlier (takes a body object). Removing the
  // duplicate here that overrode it and expected a raw string, which caused
  // DeleteAccount.jsx to send { email: { email: "..." } } and silently fail.



  // Matching (bilateral B2C + B2B)

  v2MatchingPersonas: () => request('/api/v2/matching/personas'),

  v2MatchingAssess: (candidateData) => request('/api/v2/matching/assess', {
    method: 'POST', body: JSON.stringify({ candidateData }),
  }),

  v2MatchingMyReadiness: () => request('/api/v2/matching/my-readiness'),

  v2MatchingMyMatches: () => request('/api/v2/matching/my-matches'),

  v2MatchingMatch: (body) => request('/api/v2/matching/match', {
    method: 'POST', body: JSON.stringify(body),
  }),

  v2MatchingRecruiterMatches: () => request('/api/v2/matching/recruiter/matches'),

  v2MatchingFunnel: (matchId, body) => request(`/api/v2/matching/${encodeURIComponent(matchId)}/funnel`, {
    method: 'PATCH', body: JSON.stringify(body),
  }),



  // Jupiter Room (Interview Simulator)

  v2JupiterSession: (body) => request('/api/v2/jupiter/session', { method: 'POST', body: JSON.stringify(body) }),

  v2JupiterMessage: (body) => request('/api/v2/jupiter/message', { method: 'POST', body: JSON.stringify(body) }),

  v2JupiterFeedback: (body) => request('/api/v2/jupiter/feedback', { method: 'POST', body: JSON.stringify(body) }),



  // CV Conversational

  v2CvChat: (body) => request('/api/v2/cv/chat', { method: 'POST', body: JSON.stringify(body) }),

  v2CvChatStream: (body) => fetch(buildUrl('/api/v2/cv/chat/stream'), {

    method: 'POST',

    headers: {

      'Content-Type': 'application/json',

      ...(getAdminBypassToken() ? { 'x-admin-token': getAdminBypassToken() } : {}),

      ...(getUserEmailHeader() ? { 'x-user-email': getUserEmailHeader() } : {}),

    },

    body: JSON.stringify(body),

  }),

  v2CvGenerateHtml: (body) => request('/api/v2/cv/generate-html', { method: 'POST', body: JSON.stringify(body) }),

  v2CvWebPage: (slug) => request(`/api/v2/cv/web/${encodeURIComponent(slug)}`),

  adminCosts: () => request('/api/admin/costs'),



  // multipart upload (CV)

  async v2UploadCv({ email, file, cvText }) {

    const form = new FormData();

    if (email) form.append('email', email);

    if (cvText) form.append('cv_text', cvText);

    if (file) form.append('cv', file);



    const adminToken = getAdminBypassToken();

    const userEmail = getUserEmailHeader();

    const headers = {

      ...(adminToken ? { 'x-admin-token': adminToken } : {}),

      ...(userEmail ? { 'x-user-email': userEmail } : {}),

    };



    const res = await fetch(buildUrl('/api/v2/cv/upload'), {

      method: 'POST',

      headers,

      body: form

    });

    if (!res.ok) {

      const body = await res.json().catch(() => ({}));

      throw new Error(body.error || `HTTP ${res.status}`);

    }

    return res.json();

  }

};


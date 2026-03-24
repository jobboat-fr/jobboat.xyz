/**
 * jobbyMindLocal.js -- Client-side Jobby Mind intelligence for web app.
 * Mirrors the mobile version for consistent pre-processing on edge.
 */

const INTENT_PATTERNS = {
  job_search:         ['cherche', 'recherche', 'trouver', 'emploi', 'job', 'poste', 'offre', 'candidature', 'postuler'],
  cv_review:          ['cv', 'curriculum', 'resume', 'relire', 'améliorer', 'corriger', 'optimiser'],
  cover_letter:       ['lettre', 'motivation', 'cover', 'letter', 'candidature', 'rédiger'],
  interview_prep:     ['entretien', 'interview', 'préparer', 'question', 'réponse'],
  salary_negotiation: ['salaire', 'négocier', 'rémunération', 'augmentation', 'compensation'],
  career_coaching:    ['coaching', 'conseil', 'orientation', 'reconversion', 'carrière'],
  skill_analysis:     ['compétence', 'skill', 'formation', 'apprendre', 'certification'],
  general:            []
};

const TASK_MAP = {
  job_search: 'general',
  cv_review: 'cv_review',
  cover_letter: 'cover_letter',
  interview_prep: 'coaching',
  salary_negotiation: 'coaching',
  career_coaching: 'coaching',
  skill_analysis: 'skill_analysis',
  general: 'general'
};

class LocalTrie {
  constructor() {
    this.root = {};
    this.size = 0;
  }

  insert(word, weight = 0.5, category = 'general') {
    const key = normalize(word);
    if (!key) return;
    let node = this.root;
    for (const ch of key) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    if (!node._end) this.size++;
    node._end = true;
    node._w = weight;
    node._c = category;
    node._t = word;
  }

  match(word) {
    const key = normalize(word);
    if (!key) return null;
    let node = this.root;
    for (const ch of key) {
      if (!node[ch]) return null;
      node = node[ch];
    }
    return node._end ? { term: node._t, weight: node._w, category: node._c } : null;
  }

  prefixSearch(prefix, limit = 5) {
    const key = normalize(prefix);
    if (!key) return [];
    let node = this.root;
    for (const ch of key) {
      if (!node[ch]) return [];
      node = node[ch];
    }
    const results = [];
    _collect(node, results, limit);
    return results.sort((a, b) => b.weight - a.weight);
  }
}

function _collect(node, results, limit) {
  if (results.length >= limit) return;
  if (node._end) results.push({ term: node._t, weight: node._w, category: node._c });
  for (const [k, child] of Object.entries(node)) {
    if (k.startsWith('_')) continue;
    if (results.length >= limit) return;
    _collect(child, results, limit);
  }
}

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .trim();
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[\s,;:.!?()[\]{}"'`]+/)
    .map(w => w.replace(/[^a-z0-9_-]/g, '').trim())
    .filter(w => w.length >= 2);
}

function detectIntent(text) {
  const tokens = new Set(tokenize(text));
  let best = 'general';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    if (!keywords.length) continue;
    let hits = 0;
    for (const kw of keywords) {
      const norm = normalize(kw);
      for (const token of tokens) {
        if (token.includes(norm) || norm.includes(token)) { hits++; break; }
      }
    }
    const score = hits / keywords.length;
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return { intent: best, confidence: Math.min(bestScore * 2, 1.0), task: TASK_MAP[best] || 'general' };
}

let _telemetryBuffer = [];
const TELEMETRY_FLUSH_SIZE = 20;
const TELEMETRY_FLUSH_INTERVAL = 60000;
let _flushTimer = null;

function trackInteraction(data) {
  _telemetryBuffer.push({
    intent: data.intent,
    entities_count: data.entitiesCount || 0,
    model_used: data.modelUsed || null,
    response_time_ms: data.responseTimeMs || null,
    satisfaction: data.satisfaction || null,
    timestamp: Date.now()
  });

  if (_telemetryBuffer.length >= TELEMETRY_FLUSH_SIZE) {
    flushTelemetry();
  }

  if (!_flushTimer) {
    _flushTimer = setInterval(flushTelemetry, TELEMETRY_FLUSH_INTERVAL);
  }
}

async function flushTelemetry() {
  if (!_telemetryBuffer.length) return;
  const batch = _telemetryBuffer.splice(0, TELEMETRY_FLUSH_SIZE);

  try {
    const { api } = await import('./apiClient');
    if (api?.v2MindTelemetry) {
      await api.v2MindTelemetry(batch);
    }
  } catch {
    _telemetryBuffer.unshift(...batch);
  }
}

let _localTrie = null;

function getLocalTrie() {
  if (!_localTrie) _localTrie = new LocalTrie();
  return _localTrie;
}

async function loadTrieFromServer() {
  try {
    const { api } = await import('./apiClient');
    if (!api?.v2MindLexicon) return;
    const data = await api.v2MindLexicon();
    if (data?.terms?.length) {
      const trie = new LocalTrie();
      for (const t of data.terms) {
        trie.insert(t.term, t.weight, t.category);
      }
      _localTrie = trie;
      console.log(`[JobbyMindLocal] Loaded ${trie.size} terms into local trie`);
    }
  } catch (err) {
    console.warn('[JobbyMindLocal] Failed to load trie:', err.message);
  }
}

function preAnalyze(text) {
  const tokens = tokenize(text);
  const intent = detectIntent(text);
  const trie = getLocalTrie();

  const recognized = [];
  const unrecognized = [];

  for (const token of tokens) {
    const match = trie.match(token);
    if (match) recognized.push(match);
    else unrecognized.push(token);
  }

  return {
    intent: intent.intent,
    confidence: intent.confidence,
    suggestedTask: intent.task,
    recognized,
    unrecognized,
    lexiconCoverage: tokens.length > 0 ? recognized.length / tokens.length : 0,
    tokenCount: tokens.length
  };
}

const JobbyMindLocal = {
  detectIntent,
  preAnalyze,
  trackInteraction,
  flushTelemetry,
  loadTrieFromServer,
  getLocalTrie,
  LocalTrie,
  normalize,
  tokenize,
  INTENT_PATTERNS,
  TASK_MAP
};

export default JobbyMindLocal;

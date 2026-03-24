import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApiClient';
import './admin.css';

const AI_PROVIDERS = [
  { name: 'OpenAI', key: 'OPENAI_API_KEY', models: ['gpt-4.1', 'gpt-5-nano', 'o3-mini'], website: 'https://platform.openai.com/api-keys', status: 'recommended', statusLabel: 'Recommandé', desc: 'Idéal pour le coaching, la génération de lettres et les tâches IA générales' },
  { name: 'Google Gemini', key: 'GOOGLE_API_KEY', models: ['gemini-pro'], website: 'https://makersuite.google.com/app/apikey', status: 'free', statusLabel: 'Gratuit', desc: 'Niveau gratuit disponible, adapté à l\'intégration de recherche' },
  { name: 'Groq', key: 'GROQ_API_KEY', models: ['mixtral-8x7b', 'llama3-70b'], website: 'https://console.groq.com/keys', status: 'fastest', statusLabel: 'Le plus rapide', desc: 'Inférence ultra-rapide pour les applications en temps réel' },
  { name: 'Anthropic Claude', key: 'ANTHROPIC_API_KEY', models: ['claude-3.5-sonnet'], website: 'https://console.anthropic.com/', status: 'premium', statusLabel: 'Premium', desc: 'Raisonnement complexe et analyse éthique' },
  { name: 'Cohere', key: 'COHERE_API_KEY', models: ['command-r'], website: 'https://dashboard.cohere.com/api-keys', status: 'business', statusLabel: 'Entreprise', desc: 'Optimisé pour les tâches professionnelles et la classification' },
];

const JOB_APIS = [
  { name: 'France Travail', key: 'FRANCE_TRAVAIL_API_KEY', website: 'https://francetravail.io/data/api', status: 'required', statusLabel: 'Requis', desc: 'API emploi officielle du gouvernement français (gratuite)' },
  { name: 'The Muse', key: 'THEMUSE_API_KEY', website: 'https://www.themuse.com/developers/api', status: 'optional', statusLabel: 'Optionnel', desc: 'Emplois créatifs et tech' },
  { name: 'RemoteOK', key: 'REMOTEOK_API_KEY', website: 'https://remoteok.io/api', status: 'free', statusLabel: 'Gratuit', desc: 'Emplois à distance dans le monde entier (clé non requise)' },
];

const STATUS_BADGE = {
  recommended: 'accent',
  free: 'success',
  fastest: 'accent',
  premium: 'warning',
  business: 'warning',
  required: 'danger',
  optional: '',
};

export default function AdminAPIKeys() {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState({});
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    adminApi.getApiKeys()
      .then(data => setApiKeys(data.keys || {}))
      .catch(() => {
        const stored = localStorage.getItem('jobboat_api_keys');
        if (stored) setApiKeys(JSON.parse(stored));
      });
  }, []);

  async function handleSave() {
    try {
      await adminApi.saveApiKeys(apiKeys);
      localStorage.setItem('jobboat_api_keys', JSON.stringify(apiKeys));
    } catch {
      localStorage.setItem('jobboat_api_keys', JSON.stringify(apiKeys));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleTest(providerKey) {
    setTesting(providerKey);
    try {
      const result = await adminApi.testApiKey(providerKey, apiKeys[providerKey]);
      setTestResults(prev => ({ ...prev, [providerKey]: result }));
    } catch (err) {
      setTestResults(prev => ({ ...prev, [providerKey]: { success: false, error: err.message } }));
    } finally {
      setTesting(null);
    }
  }

  function renderProvider(provider) {
    const badgeClass = STATUS_BADGE[provider.status] || '';
    return (
      <div key={provider.key} className="glass-card admin-apikey-card">
        <div className="admin-apikey-header">
          <h3 className="font-display" style={{ fontWeight: 600 }}>{provider.name}</h3>
          <span className={`badge ${badgeClass ? `badge--${badgeClass}` : ''}`}>
            {provider.statusLabel || provider.status}
          </span>
        </div>
        <p className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', marginBottom: 8 }}>{provider.desc}</p>
        {provider.models && (
          <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', marginBottom: 8 }}>
            Modèles : {provider.models.join(', ')}
          </p>
        )}
        <div className="admin-apikey-input-row">
          <input
            className="input"
            type="password"
            placeholder={`Saisir la clé API ${provider.name}`}
            value={apiKeys[provider.key] || ''}
            onChange={e => setApiKeys(prev => ({ ...prev, [provider.key]: e.target.value }))}
          />
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => handleTest(provider.key)}
            disabled={!apiKeys[provider.key] || testing === provider.key}
          >
            {testing === provider.key ? '...' : 'Tester'}
          </button>
        </div>
        {testResults[provider.key] && (
          <p style={{
            fontSize: 'var(--jb-text-xs)',
            marginTop: 6,
            color: testResults[provider.key].success ? 'var(--jb-success)' : 'var(--jb-danger)',
          }}>
            {testResults[provider.key].success ? 'Clé valide' : testResults[provider.key].error || 'Clé invalide'}
          </p>
        )}
        <a
          href={provider.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent"
          style={{ fontSize: 'var(--jb-text-xs)', marginTop: 6, display: 'inline-block' }}
        >
          Obtenir une clé API
        </a>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-bg" />

      <header className="admin-header glass-card">
        <div className="admin-header-left">
          <h1 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700 }}>
            Gestion des clés API
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--jb-text-xs)' }}>
            Configurer les modèles IA et les API de recherche d'emploi
          </p>
        </div>
        <div className="admin-header-right">
          <button className="btn btn--secondary btn--sm" onClick={() => navigate('/admin')}>
            Retour au tableau de bord
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={saved}>
            {saved ? 'Enregistré' : 'Enregistrer toutes les clés'}
          </button>
        </div>
      </header>

      {/* Fournisseurs IA */}
      <div className="admin-section fade-in-up">
        <h2 className="section-title">Fournisseurs IA</h2>
        <p className="section-subtitle">Configurer les modèles IA pour le coaching, l'analyse de CV et la correspondance d'emplois.</p>
        <div className="admin-apikey-grid">
          {AI_PROVIDERS.map(renderProvider)}
        </div>
      </div>

      {/* API emploi */}
      <div className="admin-section fade-in-up delay-1">
        <h2 className="section-title">API de recherche d'emploi</h2>
        <p className="section-subtitle">Configurer les plateformes d'agrégation d'emplois.</p>
        <div className="admin-apikey-grid">
          {JOB_APIS.map(renderProvider)}
        </div>
      </div>

      {/* Démarrage rapide */}
      <div className="admin-section fade-in-up delay-2">
        <h2 className="section-title">Démarrage rapide</h2>
        <div className="admin-quickstart-steps">
          {['Obtenir des clés API gratuites (Groq + Gemini)', 'Tester les connexions avec le bouton Tester', 'Enregistrer toutes les clés pour persister', 'Aller dans Coaching ou Emplois pour vérifier'].map((step, i) => (
            <div key={i} className="glass-card admin-quickstart-step">
              <span className="admin-quickstart-num">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

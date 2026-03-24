import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import './marketing.css';

const TOOLS = [
  { id: 'brand_statement', label: 'Personal Brand', desc: 'Genere ton pitch professionnel unique', icon: 'target', task: 'humanize' },
  { id: 'linkedin_post', label: 'Post LinkedIn', desc: 'Cree du contenu engageant pour LinkedIn', icon: 'briefcase', task: 'general' },
  { id: 'email_intro', label: 'Email d\'Introduction', desc: 'Redige un email de networking percutant', icon: 'mail', task: 'application_email' },
  { id: 'elevator_pitch', label: 'Elevator Pitch', desc: 'Pitch de 30 secondes adapte a ton profil', icon: 'rocket', task: 'general' },
  { id: 'portfolio_bio', label: 'Bio Portfolio', desc: 'Bio professionnelle pour ton site/portfolio', icon: 'globe', task: 'humanize' },
  { id: 'thank_you', label: 'Email de Remerciement', desc: 'Post-entretien, suivi professionnel', icon: 'heart', task: 'application_email' },
];

function ToolIcon({ name, size = 22 }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'target': return <svg {...props}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
    case 'briefcase': return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
    case 'mail': return <svg {...props}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></svg>;
    case 'rocket': return <svg {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /></svg>;
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
    case 'heart': return <svg {...props}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>;
    default: return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
}

export default function Marketing() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState(null);
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!activeTool || !context.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const tool = TOOLS.find(t => t.id === activeTool);
      const res = await api.v2AiExecute({
        task: tool?.task || 'general',
        prompt: `[${tool?.label}] Contexte du candidat: ${user?.name || 'Candidat'}.\n\nInstruction: ${context.trim()}\n\nGenere un contenu professionnel, engageant et pret a l'emploi. Reponds en francais.`,
        maxTokens: 600,
        temperature: 0.8
      });
      setResult(res?.text || 'Pas de resultat genere.');
    } catch (err) {
      setResult('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result).catch(() => {});
  };

  return (
    <div className="marketing">
      <section className="fade-in-up">
        <h2 className="section-title gradient-text" style={{ fontSize: 'var(--jb-text-3xl)' }}>Marketing Engine</h2>
        <p className="section-subtitle">Propulse ton personal branding avec l'IA. Cree du contenu qui fait la difference.</p>
      </section>

      {/* Tool selection */}
      <section className="mkt-tools fade-in-up delay-1">
        <div className="mkt-tools__grid stagger-children">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`glass-card mkt-tool-card hover-lift ${activeTool === tool.id ? 'mkt-tool-card--active' : ''}`}
              onClick={() => setActiveTool(tool.id)}
            >
              <span className="mkt-tool-card__icon"><ToolIcon name={tool.icon} /></span>
              <span className="mkt-tool-card__label font-display">{tool.label}</span>
              <span className="mkt-tool-card__desc text-muted">{tool.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Generator */}
      {activeTool && (
        <section className="mkt-generator fade-in-up">
          <div className="glass-card">
            <h3 className="font-display" style={{ fontSize: 'var(--jb-text-lg)', marginBottom: 'var(--jb-space-4)' }}>
              {TOOLS.find(t => t.id === activeTool)?.label}
            </h3>
            <label className="label">Contexte / Instructions</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Decris ton contexte, ton poste cible, ton industrie..."
              value={context}
              onChange={e => setContext(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 'var(--jb-space-3)', marginTop: 'var(--jb-space-4)' }}>
              <button className="btn btn--primary btn-magnetic" onClick={handleGenerate} disabled={loading || !context.trim()}>
                {loading ? 'Generation...' : 'Generer'}
              </button>
              {result && (
                <button className="btn btn--secondary" onClick={handleCopy}>
                  Copier
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Result */}
      {result && (
        <section className="mkt-result scale-in">
          <div className="glass-card glass-card--accent">
            <h4 className="font-display text-accent" style={{ marginBottom: 'var(--jb-space-3)' }}>Resultat</h4>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--jb-text-sm)', lineHeight: 1.7, color: 'var(--jb-text-primary)' }}>
              {result}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

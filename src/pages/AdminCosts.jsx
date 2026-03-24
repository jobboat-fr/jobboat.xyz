import { useEffect, useState, useCallback } from 'react';
import { api } from '../services/apiClient';

const fmt = (n) => `€${Number(n).toFixed(2)}`;
const pct = (n) => n === null ? '—' : `${n}%`;
const marginColor = (p) => p === null ? '#64748b' : p >= 70 ? '#10b981' : p >= 40 ? '#f59e0b' : '#ef4444';
const CARD = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '20px 22px' };

function Stat({ label, value, sub, color = '#e2e8f0' }) {
  return (
    <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '9px 12px', color: cell?.color || '#cbd5e1', fontWeight: cell?.bold ? 700 : 400, fontFamily: cell?.mono ? 'monospace' : 'inherit', whiteSpace: 'nowrap' }}>
                  {cell?.value ?? cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminCosts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState(100);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminCosts();
      if (res?.success) setData(res);
      else setError(res?.error || 'Erreur inconnue');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p>Chargement de l'analyse des coûts…</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 32, color: '#ef4444' }}>Erreur: {error}</div>
  );

  const { infrastructure, api_costs, plans, analysis } = data;

  // Projected total cost at N active users
  const projectedVarCost = activeUsers * api_costs.total_per_active_user;
  const projectedTotalCost = infrastructure.total_monthly_fixed + projectedVarCost;

  const planColors = { free: '#64748b', pro: '#6366f1', enterprise: '#f59e0b' };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, color: '#e2e8f0', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💰</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Analyse des Coûts JobBoat</h1>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
          Coûts d'exploitation réels vs revenus par plan. Utilisez ces données pour fixer les prix et optimiser la marge.
          <span style={{ marginLeft: 12, fontSize: 11, color: '#334155' }}>Mis à jour: {new Date(data.generatedAt).toLocaleString('fr-FR')}</span>
        </p>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        <Stat label="Coût fixe mensuel" value={fmt(infrastructure.total_monthly_fixed)} sub="infrastructure & outils" color="#f97316" />
        <Stat label="Coût variable / user" value={fmt(api_costs.total_per_active_user)} sub="API actives (user actif)" color="#06b6d4" />
        <Stat label="Break-even Pro" value={`${analysis.break_even_pro_users} users`} sub="users Pro pour couvrir les fixes" color="#a5b4fc" />
        <Stat label="Prix Pro minimum" value={fmt(analysis.min_viable_pro_price)} sub="pour 65% marge cible" color="#10b981" />
        <Stat label="Prix Enterprise min." value={fmt(analysis.min_viable_enterprise_price)} sub="pour 65% marge cible" color="#f59e0b" />
      </div>

      {/* Recommendation */}
      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <div>
          <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 4, fontSize: 14 }}>Recommandation algorithmique</div>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{analysis.recommendation}</p>
        </div>
      </div>

      {/* Infrastructure costs */}
      <Section title="Coûts Fixes Mensuels — Infrastructure" icon="🏗">
        <div style={CARD}>
          <Table
            headers={['Service', 'Coût/mo', 'Type', 'Notes']}
            rows={infrastructure.items.map(item => [
              item.name,
              { value: item.type === 'variable' ? 'Variable' : fmt(item.cost), color: item.type === 'variable' ? '#f59e0b' : '#cbd5e1' },
              { value: item.type === 'fixed' ? 'Fixe' : 'Variable', color: item.type === 'fixed' ? '#6366f1' : '#f59e0b' },
              { value: item.notes, color: '#64748b' },
            ])}
          />
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>Total coût fixe mensuel</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#f97316' }}>{fmt(infrastructure.total_monthly_fixed)}</span>
          </div>
        </div>
      </Section>

      {/* API variable costs */}
      <Section title="Coûts Variables — APIs (par utilisateur actif)" icon="🔌">
        <div style={CARD}>
          <Table
            headers={['API / Service', 'Coût/user/mo', 'Base de calcul', 'Hypothèse']}
            rows={api_costs.items.map(item => [
              item.name,
              { value: fmt(item.costPerUser), color: '#06b6d4', bold: true, mono: true },
              { value: item.basis, color: '#64748b' },
              { value: item.notes, color: '#475569' },
            ])}
          />
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#475569' }}>Total variable par utilisateur actif</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#06b6d4' }}>{fmt(api_costs.total_per_active_user)}</span>
          </div>
        </div>
      </Section>

      {/* Cost projector */}
      <Section title="Simulateur de Coûts Total Mensuel" icon="📊">
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, color: '#94a3b8' }}>Nombre d'utilisateurs actifs :</label>
            <input
              type="range" min="10" max="5000" step="10" value={activeUsers}
              onChange={e => setActiveUsers(Number(e.target.value))}
              style={{ width: 220, accentColor: '#6366f1' }}
            />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#a5b4fc', minWidth: 60 }}>{activeUsers.toLocaleString('fr-FR')}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'Coût fixe', value: fmt(infrastructure.total_monthly_fixed), color: '#f97316' },
              { label: 'Coût variable total', value: fmt(projectedVarCost), color: '#06b6d4' },
              { label: 'Coût total mensuel', value: fmt(projectedTotalCost), color: '#ef4444' },
              { label: 'Coût moyen / user', value: fmt(projectedTotalCost / activeUsers), color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 11, color: '#334155' }}>
            * Hypothèses : utilisateurs actifs = utilisent l'app régulièrement. Free users comptent comme 10% d'un Pro en termes d'usage API.
          </p>
        </div>
      </Section>

      {/* Per-plan breakdown */}
      <Section title="Analyse Marge par Plan" icon="📈">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {plans.map(plan => {
            const pColor = planColors[plan.id] || '#64748b';
            const mColor = marginColor(plan.margin_pct);
            return (
              <div key={plan.id} style={{ ...CARD, borderColor: `${pColor}30` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: pColor, marginBottom: 2 }}>{plan.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>{fmt(plan.price)}<span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>/mo</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>Marge</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: mColor }}>{pct(plan.margin_pct)}</div>
                  </div>
                </div>

                {/* Cost breakdown bars */}
                <div style={{ marginBottom: 14 }}>
                  {[
                    { label: 'APIs', value: plan.costBreakdown.api_costs, color: '#06b6d4' },
                    { label: 'Infrastructure', value: plan.costBreakdown.overhead_share, color: '#f97316' },
                    { label: 'Stripe', value: plan.costBreakdown.stripe_fee, color: '#8b5cf6' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#64748b', minWidth: 80 }}>{item.label}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: plan.price > 0 ? `${Math.min(100, (item.value / plan.price) * 100)}%` : '100%', background: item.color, borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 11, color: item.color, fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#475569' }}>Coût total</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ef4444' }}>{fmt(plan.costBreakdown.total)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#475569' }}>Marge nette / user</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: mColor }}>{fmt(plan.margin)}</div>
                  </div>
                </div>

                <p style={{ margin: '10px 0 0', fontSize: 11, color: '#374151', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>{plan.notes}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Pricing sensitivity table */}
      <Section title="Sensibilité Prix vs Marge (Plan Pro)" icon="🎯">
        <div style={CARD}>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#475569' }}>
            Simulation de la marge Pro selon différents prix. Coût fixe par user Pro : {fmt(plans[1]?.costBreakdown.total)}
          </p>
          <Table
            headers={['Prix mensuel', 'Marge brute', 'Marge %', 'Break-even (users Pro)']}
            rows={[15, 19, 25, 29, 35, 49, 59].map(price => {
              const cost = plans[1]?.costBreakdown.total || 5;
              const margin = price - cost;
              const marginP = ((margin / price) * 100).toFixed(1);
              const be = Math.ceil(infrastructure.total_monthly_fixed / margin);
              return [
                { value: `€${price}/mo`, bold: price === 29, color: price === 29 ? '#a5b4fc' : '#cbd5e1' },
                { value: fmt(margin), color: margin > 0 ? '#10b981' : '#ef4444' },
                { value: `${marginP}%`, color: marginColor(Number(marginP)) },
                { value: margin > 0 ? be : '∞', color: '#64748b' },
              ];
            })}
          />
        </div>
      </Section>
    </div>
  );
}

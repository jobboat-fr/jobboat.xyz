import { useState } from 'react';
import { api } from '../services/apiClient';

export default function CorporateDashboard() {
  const [kpis, setKpis] = useState(null);
  const [status, setStatus] = useState('');

  async function loadOverview() {
    setStatus('');
    try {
      const data = await api.corporateOverview();
      setKpis(data.kpis);
    } catch (error) {
      setStatus(`Erreur corporate: ${error.message}`);
    }
  }

  return (
    <section className="card">
      <h2>Corporate Dashboard legacy reconnecte</h2>
      <p>Connexion backend: `GET /api/corporate/overview`</p>
      <button onClick={loadOverview}>Charger KPIs</button>
      {status ? <p>{status}</p> : null}
      {kpis ? (
        <ul>
          <li>Candidats actifs: {kpis.activeCandidates}</li>
          <li>Profils completes: {kpis.profilesCompleted}</li>
          <li>Offres ouvertes: {kpis.openRoles}</li>
        </ul>
      ) : null}
    </section>
  );
}

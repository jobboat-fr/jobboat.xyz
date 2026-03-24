import { useMemo, useState } from 'react';
import { api } from '../services/apiClient';

export default function AutoApplyHub() {
  const profile = useMemo(
    () => ({
      name: localStorage.getItem('jobboat_user_name') || 'Demo User',
      email: localStorage.getItem('jobboat_user_email') || 'demo@jobboat.io'
    }),
    []
  );
  const [query, setQuery] = useState('developer');
  const [jobs, setJobs] = useState([]);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');

  async function fetchJobs() {
    setStatus('');
    try {
      const data = await api.searchJobs({ query, location: '' });
      setJobs(data.jobs || []);
      setStatus(`${data.total || 0} jobs trouves`);
      } catch (error) {
      setStatus(`Erreur jobs: ${error.message}`);
    }
  }

  async function runAutoApply() {
    setStatus('');
    try {
      const data = await api.autoApply({
        jobs,
        profile,
        message: 'Bonjour, je souhaite candidater a ce poste.'
      });
      setResult(data);
      setStatus(`Auto-apply termine: ${data.sent}/${data.total}`);
    } catch (error) {
      setStatus(`Erreur auto-apply: ${error.message}`);
    }
  }

  return (
    <section className="card">
      <h2>AutoApply legacy reconnecte</h2>
      <p>Connexion backend: `POST /api/jobs/search` + `POST /api/autoapply/apply`</p>
      <div className="row">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Mot-cle job" />
        <button onClick={fetchJobs}>Trouver des jobs</button>
        <button onClick={runAutoApply} disabled={jobs.length === 0}>
          Lancer auto-apply email-only
          </button>
        </div>
      {status ? <p>{status}</p> : null}
      <ul>
        {jobs.map(job => (
          <li key={job.id}>
            {job.title} - {job.company}
                    </li>
                  ))}
                </ul>
      {result ? <p>Resultat: {JSON.stringify(result.results || []).slice(0, 220)}...</p> : null}
    </section>
  );
}

import { useState } from 'react';
import { api } from '../services/apiClient';

export default function Signup() {
  const [name, setName] = useState(localStorage.getItem('jobboat_user_name') || '');
  const [email, setEmail] = useState(localStorage.getItem('jobboat_user_email') || '');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus('');
    try {
      const response = await api.signup({ name, email });
      localStorage.setItem('jobboat_user_name', response.user.name);
      localStorage.setItem('jobboat_user_email', response.user.email);
      setStatus(`Compte connecte: ${response.user.email}`);
    } catch (error) {
      setStatus(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Signup legacy reconnecte</h2>
      <p>Connexion backend: `POST /api/auth/signup`</p>
      <form onSubmit={handleSubmit} className="row">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
        <button type="submit" disabled={loading}>
          {loading ? 'Creation...' : 'Creer/Connecter'}
        </button>
      </form>
      {status ? <p>{status}</p> : null}
    </section>
  );
}

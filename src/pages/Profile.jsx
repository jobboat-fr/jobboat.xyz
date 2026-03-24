import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/apiClient';

const DEFAULT_PROFILE = {
  technical: 70,
  business: 60,
  soft: 75,
  experience: 65,
  portfolio: 55,
  growth: 80
};

export default function Profile() {
  const email = useMemo(() => localStorage.getItem('jobboat_user_email') || '', []);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [status, setStatus] = useState('');
  const [score, setScore] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      if (!email) return;
      try {
        const data = await api.getProfile(email);
        if (data.profile) setProfile(prev => ({ ...prev, ...data.profile }));
      } catch (error) {
        setStatus(`Lecture profil echouee: ${error.message}`);
      }
    }
    loadProfile();
  }, [email]);

  function updateValue(key, value) {
    setProfile(prev => ({ ...prev, [key]: Number(value) }));
  }

  async function saveProfile() {
    try {
      setStatus('');
      await api.saveProfile({ email, profile });
      setStatus('Profil enregistre');
    } catch (error) {
      setStatus(`Erreur sauvegarde: ${error.message}`);
    }
  }

  async function computeScore() {
    try {
      const data = await api.getMatchingScore({ profile });
      setScore(data.score);
    } catch (error) {
      setStatus(`Erreur score: ${error.message}`);
    }
  }

  return (
    <section className="card">
      <h2>Profile legacy reconnecte</h2>
      <p>Connexion backend: `GET/POST /api/profile` + `POST /api/matching/score`</p>
      <div className="row">
        {Object.keys(DEFAULT_PROFILE).map(key => (
          <label key={key}>
            {key}
            <input
              type="number"
              min="0"
              max="100"
              value={profile[key]}
              onChange={e => updateValue(key, e.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="row">
        <button onClick={saveProfile}>Sauvegarder profil</button>
        <button onClick={computeScore}>Calculer score</button>
      </div>
      {score ? <p>Score total: {score.total}/100</p> : null}
      {status ? <p>{status}</p> : null}
    </section>
  );
}

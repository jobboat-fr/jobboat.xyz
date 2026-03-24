import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/apiClient';

export default function CvViewer() {
  const { slug } = useParams();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    api.v2CvWebPage(slug)
      .then(res => {
        if (res?.html) setHtml(res.html);
        else setError('CV introuvable');
      })
      .catch(() => setError('CV introuvable ou lien expire'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', color: '#4a5568' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p>Chargement du CV...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
        <div style={{ textAlign: 'center', color: '#e53e3e' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f4f8', minHeight: '100vh' }}>
      <div style={{ background: '#1a3a5c', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>JobBoat — CV Partagé</span>
        <button
          onClick={() => window.print()}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 6, padding: '6px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
        >
          Imprimer / PDF
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

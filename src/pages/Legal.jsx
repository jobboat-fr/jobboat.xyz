import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  { id: 'privacy', label: 'Politique de confidentialite' },
  { id: 'cgu', label: 'Conditions d\'utilisation' },
  { id: 'cookies', label: 'Politique des cookies' },
  { id: 'data', label: 'Vos droits (RGPD)' },
];

export default function Legal() {
  const [active, setActive] = useState('privacy');
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--jb-bg, #030711)', color: 'var(--jb-text, #e2e8f0)', fontFamily: 'var(--jb-font-body, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            ← Retour
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Mentions legales &amp; Confidentialite</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>JobBoat SAS · Derniere mise a jour : fevrier 2026</p>
          </div>
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: active === s.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', color: active === s.id ? '#a5b4fc' : '#94a3b8', borderBottom: active === s.id ? '2px solid #6366f1' : '2px solid transparent' }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ lineHeight: 1.75, fontSize: 14, color: '#cbd5e1' }}>

          {active === 'privacy' && (
            <article>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 8 }}>Politique de confidentialite</h2>
              <p><strong>Responsable du traitement :</strong> JobBoat SAS, joignable a <a href="mailto:privacy@jobboat.xyz" style={{ color: '#818cf8' }}>privacy@jobboat.xyz</a>.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Donnees collectees</h3>
              <ul>
                <li><strong>Compte :</strong> adresse e-mail, nom, identifiant unique.</li>
                <li><strong>Profil candidat :</strong> CV, competences, experience, preferences de poste.</li>
                <li><strong>Activite :</strong> sessions de coaching, candidatures, scores IA.</li>
                <li><strong>Paiement :</strong> traite exclusivement par Stripe — JobBoat ne stocke aucune donnee de carte.</li>
                <li><strong>Technique :</strong> adresse IP, type d'appareil, logs de session (securite uniquement).</li>
              </ul>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Finalites du traitement</h3>
              <ul>
                <li>Fourniture du service : matching d'emploi, coaching IA, candidatures automatiques.</li>
                <li>Amelioration du produit : analyse agregee et anonymisee de l'usage.</li>
                <li>Communication : emails transactionnels (confirmations, alertes de matching).</li>
                <li>Securite et conformite legale.</li>
              </ul>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Base legale</h3>
              <p>Execution du contrat (art. 6.1.b RGPD) pour les services principaux. Consentement (art. 6.1.a) pour l'analytique et la personnalisation optionnelle.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Conservation</h3>
              <p>Donnees de compte : duree de l'abonnement + 3 ans. Logs techniques : 90 jours. Sur demande de suppression : 30 jours.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Transferts hors UE</h3>
              <p>Certains sous-traitants (OpenAI, Stripe, Supabase) sont bases aux Etats-Unis et couverts par des clauses contractuelles types (CCT) conformes au RGPD.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Sous-traitants principaux</h3>
              <ul>
                <li>Supabase Inc. (base de donnees)</li>
                <li>Railway Corp. (hebergement backend)</li>
                <li>Vercel Inc. (hebergement frontend)</li>
                <li>Stripe Inc. (paiement)</li>
                <li>OpenAI / Anthropic / Together AI (generation IA)</li>
                <li>PostHog Inc. (analytique produit — avec consentement)</li>
              </ul>
            </article>
          )}

          {active === 'cgu' && (
            <article>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 8 }}>Conditions generales d'utilisation</h2>
              <p>En utilisant JobBoat, vous acceptez les presentes CGU. Elles regissent l'acces et l'usage de la plateforme disponible sur <strong>jobboat.xyz</strong> et l'application mobile JobBoat.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>1. Description du service</h3>
              <p>JobBoat est une plateforme SaaS d'aide a la recherche d'emploi proposant : un CV builder IA, un moteur de candidatures automatiques, un coaching IA personnalise (Jupiter), et des outils d'analyse de carriere.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>2. Compte utilisateur</h3>
              <p>L'acces aux fonctionnalites avancees requiert la creation d'un compte. Vous etes responsable de la confidentialite de vos identifiants. Toute activite sous votre compte vous est imputable.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>3. Plans et facturation</h3>
              <ul>
                <li><strong>Free :</strong> acces limite, sans carte bancaire.</li>
                <li><strong>Pay-As-You-Go :</strong> facturation a l'usage, seuil de 5 EUR.</li>
                <li><strong>Pro (29 EUR/mois) :</strong> usage illimite, coaching avance.</li>
                <li><strong>Growth (49 EUR/mois) :</strong> coaching intensif, sessions vocales illimitees.</li>
                <li><strong>Enterprise (99 EUR/mois) :</strong> API, white-label, SLA.</li>
              </ul>
              <p>Les abonnements sont renouveles automatiquement. Resiliation possible a tout moment depuis Reglages → Abonnement.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>4. Usage acceptable</h3>
              <p>Il est interdit d'utiliser JobBoat pour envoyer des candidatures frauduleuses, contourner des systemes de recrutement, ou revendre l'acces a des tiers.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>5. Propriete intellectuelle</h3>
              <p>Le contenu genere par l'IA (lettres de motivation, analyses) vous appartient une fois telechcharge. L'interface, les algorithmes et le code source restent la propriete de JobBoat SAS.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>6. Limitation de responsabilite</h3>
              <p>JobBoat n'est pas responsable des decisions de recrutement prises par des employeurs. Le service est fourni "en l'etat" avec une disponibilite cible de 99,5%.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>7. Droit applicable</h3>
              <p>Les presentes CGU sont regies par le droit francais. Tout litige sera soumis aux tribunaux competents de Paris.</p>
            </article>
          )}

          {active === 'cookies' && (
            <article>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 8 }}>Politique des cookies</h2>
              <p>JobBoat utilise des cookies et technologies similaires pour faire fonctionner le service et, avec votre consentement, ameliorer votre experience.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Cookies essentiels (toujours actifs)</h3>
              <ul>
                <li><strong>Session auth :</strong> maintien de votre connexion (Supabase JWT).</li>
                <li><strong>Preferences :</strong> theme, langue, consentement RGPD.</li>
              </ul>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Cookies analytiques (avec consentement)</h3>
              <ul>
                <li><strong>PostHog :</strong> analyse comportementale anonymisee, pages visitees, taux de conversion. Aucune revente a des tiers.</li>
              </ul>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Cookies tiers</h3>
              <ul>
                <li><strong>Stripe :</strong> securite des paiements (obligatoire pour les transactions).</li>
                <li><strong>Crisp :</strong> chat support (avec consentement, desactivable).</li>
              </ul>
              <p style={{ marginTop: 16 }}>Vous pouvez modifier vos preferences a tout moment dans <strong>Reglages → Systeme → Confidentialite</strong>.</p>
            </article>
          )}

          {active === 'data' && (
            <article>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, marginBottom: 8 }}>Vos droits RGPD</h2>
              <p>En tant que resident de l'UE, vous disposez des droits suivants sur vos donnees personnelles :</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, margin: '20px 0' }}>
                {[
                  { title: 'Acces (Art. 15)', desc: 'Obtenir une copie de toutes vos donnees.' },
                  { title: 'Rectification (Art. 16)', desc: 'Corriger des donnees inexactes.' },
                  { title: 'Effacement (Art. 17)', desc: 'Supprimer votre compte et toutes vos donnees sous 30 jours.' },
                  { title: 'Portabilite (Art. 20)', desc: 'Recevoir vos donnees dans un format machine-readable.' },
                  { title: 'Opposition (Art. 21)', desc: 'Vous opposer au traitement fonde sur interet legitime.' },
                  { title: 'Limitation (Art. 18)', desc: 'Limiter le traitement en cas de contestation.' },
                ].map(r => (
                  <div key={r.title} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: 13, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{r.desc}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Exercer vos droits</h3>
              <p>Contactez-nous a <a href="mailto:privacy@jobboat.xyz" style={{ color: '#818cf8' }}>privacy@jobboat.xyz</a>. Reponse garantie sous 30 jours. Pour la suppression de compte, utilisez directement <strong>Reglages → Systeme → Supprimer mon compte</strong>.</p>
              <h3 style={{ color: '#e2e8f0', marginTop: 24 }}>Reclamation</h3>
              <p>Si vous estimez que vos droits ne sont pas respectes, vous pouvez deposer une plainte aupres de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8' }}>CNIL</a>.</p>
            </article>
          )}
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#475569', textAlign: 'center' }}>
          JobBoat SAS · <a href="mailto:privacy@jobboat.xyz" style={{ color: '#64748b' }}>privacy@jobboat.xyz</a> · Paris, France
        </div>
      </div>
    </div>
  );
}

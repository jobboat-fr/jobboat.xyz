import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactModal from '../components/ContactModal';
import { PARENT_COMPANY } from '../config/brand';

const SECTIONS = [
  { id: 'mentions', label: 'Mentions légales' },
  { id: 'cgu',      label: 'CGU' },
  { id: 'privacy',  label: 'Confidentialité' },
  { id: 'cookies',  label: 'Cookies' },
  { id: 'data',     label: 'Vos droits (RGPD)' },
];

// Read the canonical legal entity from the shared brand config so any future
// correction (capital change, address change, etc.) only happens in one file.
const COMPANY = {
  name:       PARENT_COMPANY.legalName,
  capital:    PARENT_COMPANY.capital,
  rcs:        PARENT_COMPANY.rcs,
  siren:      PARENT_COMPANY.siren,
  address:    PARENT_COMPANY.address.full,
  director:   PARENT_COMPANY.director,
  jurisdiction: PARENT_COMPANY.jurisdiction,
  host:       'Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA (frontend) · Railway Corp. (backend)',
};
const SUPPORT_EMAIL = PARENT_COMPANY.contact.email;
const LAST_UPDATED  = '25 avril 2026';

// Style helpers (kept simple — no design-system import needed)
const link = { color: '#818cf8' };
const h2 = { color: '#f1f5f9', fontSize: 20, marginBottom: 8, scrollMarginTop: 16 };
const h3 = { color: '#e2e8f0', fontSize: 15, marginTop: 24, marginBottom: 6 };
const sub = { color: '#94a3b8', fontSize: 12, marginTop: -4, marginBottom: 16 };

export default function Legal({ initialSection = 'mentions' }) {
  const [active, setActive] = useState(initialSection);
  const [showContact, setShowContact] = useState(false);
  const navigate = useNavigate();
  const tabRefs = useRef({});

  // Read ?section=... or hash to deep-link a section.
  useEffect(() => {
    const hash = (window.location.hash || '').replace('#', '');
    const param = new URLSearchParams(window.location.search).get('section');
    const target = (hash || param || initialSection || '').toLowerCase();
    if (target && SECTIONS.some((s) => s.id === target)) setActive(target);
  }, [initialSection]);

  function focusTab(id) {
    const el = tabRefs.current[id];
    if (el && typeof el.focus === 'function') el.focus();
  }

  function onTabKeyDown(e) {
    const idx = SECTIONS.findIndex((s) => s.id === active);
    if (idx < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = SECTIONS[(idx + 1) % SECTIONS.length];
      setActive(next.id); focusTab(next.id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = SECTIONS[(idx - 1 + SECTIONS.length) % SECTIONS.length];
      setActive(prev.id); focusTab(prev.id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(SECTIONS[0].id); focusTab(SECTIONS[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(SECTIONS[SECTIONS.length - 1].id); focusTab(SECTIONS[SECTIONS.length - 1].id);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--jb-bg, #030711)', color: 'var(--jb-text, #e2e8f0)', fontFamily: 'var(--jb-font-body, system-ui, sans-serif)' }}>
      {/* Skip to content link for screen readers */}
      <a href="#legal-main" className="jb-skip" style={{ position: 'absolute', left: -9999, top: 0 }}
         onFocus={(e) => { e.target.style.left = '12px'; e.target.style.top = '12px'; e.target.style.padding = '8px 12px'; e.target.style.background = '#6366f1'; e.target.style.color = '#fff'; e.target.style.borderRadius = '6px'; e.target.style.zIndex = 100; }}
         onBlur={(e) => { e.target.style.left = '-9999px'; }}>
        Aller au contenu
      </a>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 96px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', color: '#cbd5e1', cursor: 'pointer', fontSize: 13 }}
            aria-label="Revenir à la page précédente"
          >
            ← Retour
          </button>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>Mentions légales &amp; Confidentialité</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
              Édité par <strong>{COMPANY.name}</strong> · {COMPANY.rcs} · Dernière mise à jour&nbsp;: {LAST_UPDATED}
            </p>
          </div>
        </div>

        {/* Tab list (ARIA) */}
        <div
          role="tablist"
          aria-label="Sections légales"
          onKeyDown={onTabKeyDown}
          style={{
            display: 'flex', gap: 6, marginBottom: 28,
            borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14,
            overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          }}
        >
          {SECTIONS.map((s) => {
            const isActive = active === s.id;
            return (
              <button
                key={s.id}
                ref={(el) => { tabRefs.current[s.id] = el; }}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${s.id}`}
                id={`tab-${s.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(s.id)}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  borderBottom: isActive ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Quick action bar (always visible) */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8,
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)',
          borderRadius: 10, padding: 12, marginBottom: 28, fontSize: 13,
        }}>
          <span style={{ color: '#cbd5e1', alignSelf: 'center', marginRight: 'auto' }}>Actions RGPD rapides&nbsp;:</span>
          <button
            onClick={() => navigate('/settings#data')}
            style={{ padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            Exporter mes données
          </button>
          <button
            onClick={() => navigate('/delete-account')}
            style={{ padding: '6px 12px', background: 'transparent', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Supprimer mon compte
          </button>
          <button
            onClick={() => setShowContact(true)}
            style={{ padding: '6px 12px', background: 'transparent', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
          >
            Contacter le DPO
          </button>
        </div>

        {/* Content */}
        <div id="legal-main" style={{ lineHeight: 1.75, fontSize: 14, color: '#cbd5e1' }}>

          {active === 'mentions' && (
            <article role="tabpanel" id="panel-mentions" aria-labelledby="tab-mentions">
              <h2 style={h2}>Mentions légales</h2>
              <p style={sub}>Conformes à l'article 6 III de la loi n° 2004-575 du 21 juin 2004 (LCEN).</p>

              <h3 style={h3}>Éditeur</h3>
              <ul>
                <li><strong>{COMPANY.name}</strong>, société par actions simplifiée au capital de {COMPANY.capital}.</li>
                <li>{COMPANY.rcs} — SIREN&nbsp;{COMPANY.siren}.</li>
                <li>Siège social&nbsp;: {COMPANY.address}</li>
                <li>Directeur de la publication&nbsp;: {COMPANY.director}.</li>
                <li>Email&nbsp;: <a href={`mailto:${SUPPORT_EMAIL}`} style={link}>{SUPPORT_EMAIL}</a></li>
              </ul>

              <h3 style={h3}>Hébergement</h3>
              <p>{COMPANY.host}. Données stockées sur Supabase Inc. (UE — Irlande).</p>

              <h3 style={h3}>Propriété intellectuelle</h3>
              <p>L'ensemble du site jobboat.xyz, son code source, son design, ses contenus rédactionnels et ses algorithmes sont protégés par le droit d'auteur et la propriété intellectuelle. Toute reproduction, même partielle, est soumise à autorisation préalable de {COMPANY.name}.</p>

              <h3 style={h3}>Médiateur de la consommation</h3>
              <p>Conformément à l'article L612-1 du Code de la consommation, en cas de litige non résolu après réclamation écrite auprès de notre service client, vous pouvez saisir gratuitement le médiateur de la consommation&nbsp;:</p>
              <ul>
                <li><strong>CNPM — Médiation de la Consommation</strong></li>
                <li>27 avenue de la Libération, 42400 Saint-Chamond</li>
                <li><a href="https://cnpm-mediation-consommation.eu" target="_blank" rel="noopener noreferrer" style={link}>cnpm-mediation-consommation.eu</a></li>
              </ul>
              <p>Plateforme européenne de règlement des litiges en ligne&nbsp;: <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={link}>ec.europa.eu/consumers/odr</a>.</p>
            </article>
          )}

          {active === 'cgu' && (
            <article role="tabpanel" id="panel-cgu" aria-labelledby="tab-cgu">
              <h2 style={h2}>Conditions Générales d'Utilisation et de Vente</h2>
              <p style={sub}>Version du {LAST_UPDATED}. En utilisant JobBoat, vous acceptez les présentes CGU/CGV.</p>

              <h3 style={h3}>1. Description du service</h3>
              <p>JobBoat est une plateforme SaaS d'aide à la recherche d'emploi proposant&nbsp;: un constructeur de CV assisté par IA, un moteur de candidatures automatiques, un coaching IA personnalisé (Mars / Jupiter), une extension navigateur d'auto-remplissage, et des outils d'analyse de carrière.</p>

              <h3 style={h3}>2. Compte utilisateur</h3>
              <p>L'accès aux fonctionnalités requiert la création d'un compte avec adresse email valide. Vous êtes seul responsable de la confidentialité de vos identifiants et de toute activité effectuée sous votre compte. JobBoat est réservé aux personnes de <strong>15 ans ou plus</strong>.</p>

              <h3 style={h3}>3. Plans et facturation</h3>
              <ul>
                <li><strong>Free</strong>&nbsp;: accès limité, sans carte bancaire.</li>
                <li><strong>Pro (29&nbsp;€/mois)</strong>&nbsp;: usage illimité, coaching avancé, candidatures automatiques.</li>
                <li><strong>Enterprise (99&nbsp;€/mois)</strong>&nbsp;: API, white-label, SLA, support prioritaire.</li>
              </ul>
              <p>Les paiements sont traités par Stripe Inc. ; aucune donnée de carte n'est stockée sur nos serveurs. Les abonnements sont renouvelés automatiquement à échéance, résiliables à tout moment depuis <strong>Réglages → Abonnement</strong>. La résiliation prend effet à la fin de la période en cours, sans remboursement prorata sauf disposition légale contraire.</p>

              <h3 style={h3}>4. Droit de rétractation (consommateurs)</h3>
              <p>Conformément aux articles L221-18 et suivants du Code de la consommation, vous disposez d'un délai de <strong>14 jours</strong> à compter de la souscription d'un abonnement pour exercer votre droit de rétractation, sans avoir à motiver votre décision.</p>
              <p><strong>Renonciation expresse</strong>&nbsp;: en demandant l'accès immédiat aux fonctionnalités payantes (notamment IA et candidatures automatiques) avant l'expiration du délai de 14 jours, vous renoncez expressément à votre droit de rétractation conformément à l'article L221-28 13°. Vous restez redevable du prorata d'utilisation.</p>

              <h3 style={h3}>5. Usage acceptable</h3>
              <p>Il est strictement interdit d'utiliser JobBoat pour&nbsp;:</p>
              <ul>
                <li>envoyer des candidatures frauduleuses, mensongères ou trompeuses,</li>
                <li>contourner les systèmes anti-spam ou anti-bot des employeurs,</li>
                <li>scraper, revendre, ou exploiter commercialement les contenus de tiers,</li>
                <li>automatiser des actions hors du cadre prévu (rate limit, multi-comptes),</li>
                <li>partager votre compte ou revendre l'accès à un tiers.</li>
              </ul>

              <h3 style={h3}>6. Contenus IA et propriété intellectuelle</h3>
              <p>Les contenus générés par l'IA à votre demande (lettres de motivation, analyses, CV optimisé) vous sont concédés sous licence non-exclusive, mondiale, à titre personnel. Vous restez seul responsable de leur véracité et de leur usage. {COMPANY.name} reste propriétaire de l'interface, des modèles de prompts, des algorithmes, et du code source.</p>

              <h3 style={h3}>7. Sous-traitants IA</h3>
              <p>JobBoat s'appuie sur des modèles d'IA tiers (Anthropic Claude, OpenAI GPT, Together AI). Aucun de ces sous-traitants n'utilise vos données pour entraîner ses modèles (clauses contractuelles vérifiées). Voir la section Confidentialité pour le détail.</p>

              <h3 style={h3}>8. Limitation de responsabilité</h3>
              <p>JobBoat est fourni «&nbsp;en l'état&nbsp;» avec une disponibilité cible de 99,5&nbsp;% (hors maintenances planifiées et cas de force majeure). {COMPANY.name} ne saurait être tenue responsable&nbsp;: des décisions de recrutement prises par des tiers, des erreurs ou hallucinations d'un modèle IA, des pertes d'opportunités professionnelles, ni des dommages indirects ou immatériels.</p>
              <p>La responsabilité totale de {COMPANY.name} est plafonnée, toutes causes confondues, au montant payé par l'utilisateur au cours des 12 derniers mois.</p>

              <h3 style={h3}>9. Force majeure</h3>
              <p>Aucune partie ne pourra être tenue responsable d'un manquement à ses obligations résultant d'un cas de force majeure (cyberattaque massive, défaillance d'un sous-traitant critique, décision d'autorité, etc.).</p>

              <h3 style={h3}>10. Suspension et résiliation</h3>
              <p>{COMPANY.name} se réserve le droit de suspendre ou résilier tout compte en cas de violation des CGU/CGV, après notification raisonnable lorsque les circonstances le permettent.</p>

              <h3 style={h3}>11. Modification des CGU</h3>
              <p>Les présentes CGU/CGV peuvent être modifiées. Les modifications substantielles vous seront notifiées par email au moins 30 jours avant leur entrée en vigueur, et la poursuite de l'utilisation vaudra acceptation.</p>

              <h3 style={h3}>12. Droit applicable et juridiction</h3>
              <p>Les présentes sont régies par le <strong>droit français</strong>. À défaut de résolution amiable, tout litige relèvera de la compétence du <strong>{COMPANY.jurisdiction}</strong>, sauf disposition impérative contraire en faveur du consommateur.</p>
            </article>
          )}

          {active === 'privacy' && (
            <article role="tabpanel" id="panel-privacy" aria-labelledby="tab-privacy">
              <h2 style={h2}>Politique de confidentialité</h2>
              <p style={sub}>Conforme RGPD (UE 2016/679) et loi Informatique &amp; Libertés modifiée.</p>

              <p><strong>Responsable du traitement&nbsp;:</strong> {COMPANY.name}, joignable à <a href={`mailto:${SUPPORT_EMAIL}?subject=RGPD`} style={link}>{SUPPORT_EMAIL}</a>.</p>

              <h3 style={h3}>1. Données collectées</h3>
              <ul>
                <li><strong>Compte&nbsp;:</strong> email, nom, identifiant unique, mot de passe haché.</li>
                <li><strong>Profil candidat&nbsp;:</strong> CV, compétences, expérience, ville, préférences de poste.</li>
                <li><strong>Activité&nbsp;:</strong> sessions de coaching, candidatures, scores IA, événements produit.</li>
                <li><strong>Paiement&nbsp;:</strong> traité exclusivement par Stripe Inc. ; aucune donnée de carte n'est stockée par {COMPANY.name}.</li>
                <li><strong>Technique&nbsp;:</strong> adresse IP, type d'appareil, logs de session (sécurité uniquement).</li>
              </ul>

              <h3 style={h3}>2. Finalités</h3>
              <ul>
                <li>Fourniture du service&nbsp;: CV, matching, coaching IA, candidatures.</li>
                <li>Amélioration produit&nbsp;: analyse agrégée et anonymisée.</li>
                <li>Communication transactionnelle&nbsp;: confirmations, alertes, factures.</li>
                <li>Sécurité, prévention de la fraude, conformité légale.</li>
              </ul>

              <h3 style={h3}>3. Base légale</h3>
              <p>Exécution du contrat (art. 6.1.b RGPD) pour les services principaux. Consentement (art. 6.1.a) pour l'analytique et la personnalisation optionnelle. Intérêt légitime (art. 6.1.f) pour la sécurité.</p>

              <h3 style={h3}>4. Sous-traitants</h3>
              <ul>
                <li><strong>Supabase Inc.</strong> (UE — Irlande)&nbsp;: base de données.</li>
                <li><strong>Vercel Inc.</strong> (USA, sous CCT)&nbsp;: hébergement frontend.</li>
                <li><strong>Railway Corp.</strong> (USA, sous CCT)&nbsp;: hébergement backend.</li>
                <li><strong>Stripe Inc.</strong> (USA, sous CCT)&nbsp;: paiement.</li>
                <li><strong>Anthropic PBC, OpenAI Inc., Together AI Inc.</strong> (USA, sous CCT)&nbsp;: génération IA. Aucun n'entraîne ses modèles avec vos données API.</li>
                <li><strong>SendGrid (Twilio)</strong> (USA, sous CCT)&nbsp;: emails transactionnels.</li>
                <li><strong>PostHog Inc.</strong> (UE)&nbsp;: analytique produit, uniquement après consentement.</li>
              </ul>
              <p>Tous les transferts hors UE sont couverts par les Clauses Contractuelles Types (CCT) de la Commission européenne.</p>

              <h3 style={h3}>5. Conservation</h3>
              <ul>
                <li>Compte actif&nbsp;: durée d'utilisation + 3 ans à compter de la dernière activité.</li>
                <li>Logs techniques&nbsp;: 90 jours.</li>
                <li>Suppression sur demande&nbsp;: effacement complet sous 30 jours.</li>
                <li>Sauvegardes chiffrées&nbsp;: rotation 30 jours.</li>
                <li>Données comptables (factures Stripe)&nbsp;: 10 ans (obligation légale).</li>
              </ul>

              <h3 style={h3}>6. Sécurité</h3>
              <p>Chiffrement TLS 1.3 en transit, AES-256 au repos pour les données sensibles, contrôle d'accès basé sur les rôles (RLS Supabase), audit trail des accès admin, sauvegardes chiffrées.</p>
            </article>
          )}

          {active === 'cookies' && (
            <article role="tabpanel" id="panel-cookies" aria-labelledby="tab-cookies">
              <h2 style={h2}>Politique des cookies</h2>
              <p style={sub}>Conforme aux recommandations CNIL de 2020.</p>

              <p>JobBoat utilise des cookies et technologies similaires pour faire fonctionner le service et, avec votre consentement, en améliorer l'expérience.</p>

              <h3 style={h3}>Cookies essentiels (toujours actifs)</h3>
              <ul>
                <li><strong>Session auth</strong>&nbsp;: maintien de votre connexion (Supabase JWT).</li>
                <li><strong>Préférences UI</strong>&nbsp;: thème, langue, état du consentement RGPD.</li>
              </ul>

              <h3 style={h3}>Cookies analytiques (avec consentement)</h3>
              <ul>
                <li><strong>PostHog</strong>&nbsp;: analyse comportementale anonymisée (pages visitées, taux de conversion). Aucune revente. Désactivable à tout moment.</li>
              </ul>

              <h3 style={h3}>Cookies tiers</h3>
              <ul>
                <li><strong>Stripe</strong>&nbsp;: sécurité des paiements (obligatoire pour les transactions).</li>
              </ul>

              <p style={{ marginTop: 16 }}>Vous pouvez modifier vos préférences à tout moment depuis <strong>Réglages → Système → Confidentialité</strong>. Le bandeau de consentement réapparaîtra après réinitialisation.</p>
            </article>
          )}

          {active === 'data' && (
            <article role="tabpanel" id="panel-data" aria-labelledby="tab-data">
              <h2 style={h2}>Vos droits RGPD</h2>
              <p style={sub}>Articles 15 à 22 du Règlement (UE) 2016/679.</p>

              <p>En tant que résident de l'UE, vous disposez des droits suivants sur vos données personnelles&nbsp;:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, margin: '20px 0' }}>
                {[
                  { title: 'Accès (Art. 15)',         desc: 'Obtenir une copie de toutes vos données.' },
                  { title: 'Rectification (Art. 16)', desc: 'Corriger des données inexactes.' },
                  { title: 'Effacement (Art. 17)',    desc: 'Supprimer votre compte sous 30 jours.' },
                  { title: 'Portabilité (Art. 20)',   desc: 'Recevoir vos données dans un format JSON portable.' },
                  { title: 'Opposition (Art. 21)',    desc: "Vous opposer au traitement basé sur l'intérêt légitime." },
                  { title: 'Limitation (Art. 18)',    desc: 'Limiter le traitement en cas de contestation.' },
                ].map((r) => (
                  <div key={r.title} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: 13, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>{r.desc}</div>
                  </div>
                ))}
              </div>

              <h3 style={h3}>Exercer vos droits</h3>
              <p>Plusieurs canaux à votre disposition&nbsp;:</p>
              <ul>
                <li><strong>Export immédiat</strong>&nbsp;: bouton «&nbsp;Exporter mes données&nbsp;» dans <strong>Réglages → Données et confidentialité</strong> (JSON portable).</li>
                <li><strong>Suppression de compte</strong>&nbsp;: <strong>Réglages → Données et confidentialité → Supprimer mon compte</strong> (effacement sous 30 jours).</li>
                <li><strong>Demande écrite</strong>&nbsp;: via le <button onClick={() => setShowContact(true)} style={{ color: '#818cf8', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}>formulaire de support</button> ou par email à <a href={`mailto:${SUPPORT_EMAIL}?subject=RGPD`} style={link}>{SUPPORT_EMAIL}</a>. Réponse garantie sous 30 jours.</li>
              </ul>

              <h3 style={h3}>Réclamation</h3>
              <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une plainte auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={link}>CNIL</a> (Commission Nationale de l'Informatique et des Libertés, 3 place de Fontenoy 75007 Paris).</p>
            </article>
          )}
        </div>

        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 1.7 }}>
          {COMPANY.name} · {COMPANY.address}<br />
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#94a3b8' }}>{SUPPORT_EMAIL}</a> &nbsp;·&nbsp;
          <button onClick={() => setShowContact(true)} style={{ color: '#a5b4fc', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}>
            Contacter le support
          </button>
          &nbsp;·&nbsp;
          <a href="/privacy-extension.html" style={{ color: '#94a3b8' }} target="_blank" rel="noopener noreferrer">
            Confidentialité de l'extension Chrome
          </a>
        </div>
      </div>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </div>
  );
}

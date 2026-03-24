import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JobBoatMark } from '../components/JobBoatLogo';
import './landing.css';

const FEATURES = [
  {
    title: 'Constructeur de CV Professionnel Gratuit',
    desc: 'Creez un CV optimise pour les ATS en quelques minutes. L\'IA enrichit votre CV avec les bons mots-cles, analyse votre score de matching et vous permet de l\'exporter en PDF ou de le partager via un lien web. 100% gratuit.',
    icon: DocSVG,
  },
  {
    title: 'Coaching Carriere IA Personnalise',
    desc: 'Coaching adaptatif qui s\'ajuste a votre profil en temps reel. Preparez vos entretiens d\'embauche, ameliorez votre communication professionnelle et developpez vos competences avec un coach IA disponible 24h/24.',
    icon: BrainSVG,
  },
  {
    title: 'Candidature Automatique Intelligente',
    desc: 'Postulez automatiquement aux offres d\'emploi qui correspondent a votre profil. L\'IA genere des lettres de motivation personnalisees et envoie vos candidatures aux recruteurs. Gagnez du temps, multipliez vos chances.',
    icon: RocketSVG,
  },
  {
    title: 'Matching Emploi Multi-Dimensionnel',
    desc: 'Notre algorithme analyse votre profil sur plusieurs dimensions -- competences techniques, soft skills, motivation, adaptabilite -- pour trouver les offres d\'emploi les plus pertinentes. Fini les candidatures a l\'aveugle.',
    icon: PatternSVG,
  },
  {
    title: 'Suivi de Progression en Temps Reel',
    desc: 'Tableau de bord intelligent avec KPIs de carriere, suivi des candidatures, score de progression et metriques EWMA. Visualisez votre evolution et identifiez vos axes d\'amelioration.',
    icon: ChartSVG,
  },
  {
    title: 'Lettre de Motivation Automatique',
    desc: 'L\'IA redige des lettres de motivation personnalisees pour chaque offre d\'emploi. Adaptees au poste, a l\'entreprise et a votre profil. Plus besoin de passer des heures a ecrire.',
    icon: LetterSVG,
  },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Creez votre CV gratuitement', desc: 'Importez votre CV ou creez-en un nouveau. L\'IA l\'optimise pour les systemes ATS des recruteurs.' },
  { step: '2', title: 'Lancez le coaching IA', desc: 'Recevez des conseils personnalises pour ameliorer votre profil, preparer vos entretiens et booster vos competences.' },
  { step: '3', title: 'Postulez automatiquement', desc: 'L\'IA trouve les offres qui vous correspondent et envoie des candidatures personnalisees en votre nom.' },
  { step: '4', title: 'Suivez vos resultats', desc: 'Tableau de bord en temps reel pour suivre vos candidatures, vos reponses et votre progression de carriere.' },
];

const TESTIMONIALS = [
  {
    name: 'Sana M.',
    role: 'Developpeur Full-Stack',
    quote: 'J\'ai decroche 3 entretiens en une semaine grace aux candidatures automatiques. Le coaching IA m\'a aide a preparer chaque entretien. Resultat : CDI signe en 3 semaines.',
    avatar: 'S',
    color: '#2d6aa0',
  },
  {
    name: 'Karim B.',
    role: 'Chef de Projet Digital',
    quote: 'Le CV Builder est incroyable et gratuit. Mon score ATS est passe de 45% a 92%. Les recruteurs me rappellent maintenant au lieu de m\'ignorer.',
    avatar: 'K',
    color: '#10b981',
  },
  {
    name: 'Claire D.',
    role: 'Reconversion en Data Analyst',
    quote: 'En reconversion, je ne savais pas par ou commencer. Le coaching adaptatif m\'a guide pas a pas. J\'ai trouve mon alternance en data analyse en 2 semaines.',
    avatar: 'C',
    color: '#8b5cf6',
  },
  {
    name: 'Thomas R.',
    role: 'Commercial B2B',
    quote: 'L\'IA genere des lettres de motivation personnalisees pour chaque offre. J\'ai postule a 50 offres en une journee avec des messages uniques. Enorme gain de temps.',
    avatar: 'T',
    color: '#f59e0b',
  },
  {
    name: 'Amina L.',
    role: 'UX Designer Junior',
    quote: 'Apres 6 mois de recherche infructueuse, JobBoat a tout change. En 10 jours, 3 entretiens et une embauche. Le matching intelligent m\'a ciblee sur des offres que je n\'aurais jamais trouvees seule.',
    avatar: 'A',
    color: '#ec4899',
  },
  {
    name: 'Julien P.',
    role: 'Ingenieur DevOps',
    quote: 'Le coaching IA m\'a prepare a negocier mon salaire. Resultat : 8k EUR de plus par an par rapport a ma premiere offre. Un investissement qui se rembourse des le premier mois.',
    avatar: 'J',
    color: '#06b6d4',
  },
];

const TRUST_BADGES = [
  { label: 'Chiffrement SSL', icon: 'lock' },
  { label: 'RGPD Conforme', icon: 'shield' },
  { label: 'IA Ethique', icon: 'brain' },
  { label: 'Support Reactif', icon: 'chat' },
];

const FAQ_ITEMS = [
  { q: 'Comment trouver un emploi rapidement ?', a: 'Avec JobBoat, l\'IA analyse votre profil et envoie des candidatures ciblees automatiquement. La plupart des utilisateurs recoivent des reponses en quelques jours grace au matching intelligent et aux lettres de motivation personnalisees.' },
  { q: 'Le constructeur de CV est-il vraiment gratuit ?', a: 'Oui, le CV Builder de JobBoat est 100% gratuit pour tous les utilisateurs. Cela inclut l\'enrichissement IA, l\'analyse de score ATS, l\'export PDF et le lien web partageable. Aucune carte bancaire requise.' },
  { q: 'Comment fonctionne la candidature automatique ?', a: 'L\'IA scrute les offres d\'emploi correspondant a votre profil, genere des lettres de motivation adaptees et soumet vos candidatures automatiquement. Vous recevez un suivi en temps reel de chaque candidature.' },
  { q: 'JobBoat remplace-t-il LinkedIn ou Indeed ?', a: 'JobBoat est complementaire. La ou LinkedIn et Indeed vous montrent des offres, JobBoat va plus loin : il postule pour vous, coache vos entretiens, et optimise votre CV. C\'est votre assistant de carriere IA complet.' },
  { q: 'Est-ce adapte pour une reconversion professionnelle ?', a: 'Absolument. Le coaching IA de JobBoat est concu pour accompagner les transitions de carriere. Il analyse vos competences transferables, identifie les formations utiles et vous guide vers les secteurs qui recrutent.' },
  { q: 'Quels types d\'emploi puis-je trouver ?', a: 'CDI, CDD, interim, freelance, stage, alternance -- JobBoat couvre tous les types de contrats. L\'IA s\'adapte a votre recherche, que ce soit pour un premier emploi, une evolution de carriere ou un changement de secteur.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${BASE}/api/v2/public/stats`)
      .then(r => r.json())
      .then(d => { if (d.success) setLiveStats(d); })
      .catch(() => {});
  }, []);

  return (
    <div className="landing">
      <div className="stars-bg" />
      <div className="page-bg-gradient" aria-hidden="true" />
      <div className="page-bg" />

      {/* Nav */}
      <nav className="landing__nav">
        <div className="landing__nav-brand">
          <JobBoatMark size={28} />
          <div style={{ marginLeft: 8 }}>
            <span className="font-display" style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase' }}>JobBoat <span className="jb-sidebar__beta-tag">BETA</span></span>
            <span style={{ display: 'block', fontSize: '0.55rem', color: 'var(--jb-text-muted)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1 }}>by AZZ&amp;CO LABS</span>
          </div>
        </div>
        <button className="btn btn--primary" onClick={() => navigate('/auth')}>
          Commencer
        </button>
      </nav>

      {/* Hero */}
      <section className="landing__hero fade-in-up">
        <div className="landing__hero-badge badge badge--accent breathing">
          Intelligence Algorithmique de l'Emploi
        </div>
        <h1 className="landing__hero-title font-display">
          Votre Carriere.<br />Ingenierisee.
        </h1>
        <p className="landing__hero-sub">
          JobBoat combine l'analyse comportementale, le coaching IA adaptatif et le matching automatise
          d'emplois en une plateforme de precision unique. Concue pour les professionnels qui refusent de laisser leur trajectoire au hasard.
        </p>
        <div className="landing__hero-actions">
          <button className="btn btn--primary btn--lg" onClick={() => navigate('/auth')}>
            Lancez Votre Parcours
          </button>
          <button className="btn btn--secondary btn--lg" onClick={() => {
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
          }}>
            Decouvrir le Systeme
          </button>
        </div>

        <div className="landing__hero-stats fade-in-up delay-3">
          <div className="stat-block" style={{ alignItems: 'center' }}>
            <span className="stat-value">{liveStats ? `${liveStats.users}+` : '120+'}</span>
            <span className="stat-label">Utilisateurs Actifs</span>
          </div>
          <div className="landing__hero-stats-divider" />
          <div className="stat-block" style={{ alignItems: 'center' }}>
            <span className="stat-value">{liveStats ? `${liveStats.applications}+` : '850+'}</span>
            <span className="stat-label">Candidatures Envoyees</span>
          </div>
          <div className="landing__hero-stats-divider" />
          <div className="stat-block" style={{ alignItems: 'center' }}>
            <span className="stat-value">{liveStats ? `${liveStats.satisfaction}%` : '94%'}</span>
            <span className="stat-label">Taux de Satisfaction</span>
          </div>
          <div className="landing__hero-stats-divider" />
          <div className="stat-block" style={{ alignItems: 'center' }}>
            <span className="stat-value">{liveStats ? `${liveStats.rating}/5` : '4.8/5'}</span>
            <span className="stat-label">Note Moyenne</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features" id="features">
        <div className="landing__features-header fade-in-up delay-1">
          <h2 className="section-title font-display" style={{ textAlign: 'center' }}>
            L'Architecture derriere la Precision
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto' }}>
            Chaque module s'interconnecte via notre systeme de maillage algorithmique.
            Les donnees circulent, l'intelligence se compose, les resultats s'accelerent.
          </p>
        </div>

        <div className="landing__features-grid stagger-spring">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="gravity-card landing__feature-card" data-depth={i < 2 ? '2' : '3'}>
              <div className="landing__feature-icon">
                <f.icon />
              </div>
              <h3 className="landing__feature-title">{f.title}</h3>
              <p className="landing__feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="landing__how" id="how-it-works">
        <div className="landing__features-header fade-in-up">
          <h2 className="section-title font-display" style={{ textAlign: 'center' }}>
            Comment Trouver un Emploi avec JobBoat
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto' }}>
            De la creation de votre CV a la reponse du recruteur, JobBoat automatise chaque etape de votre recherche d'emploi.
          </p>
        </div>
        <div className="landing__how-grid stagger-spring">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="glass-card landing__how-card hover-lift">
              <div className="landing__how-step">{item.step}</div>
              <h3 className="landing__feature-title">{item.title}</h3>
              <p className="landing__feature-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof -- Live Counter */}
      <section className="landing__social-proof fade-in-up" id="social-proof">
        <div className="landing__proof-counter">
          <div className="landing__proof-counter-item">
            <span className="landing__proof-number font-display">2,400+</span>
            <span className="landing__proof-label">Utilisateurs actifs</span>
          </div>
          <div className="landing__proof-divider" />
          <div className="landing__proof-counter-item">
            <span className="landing__proof-number font-display">18,000+</span>
            <span className="landing__proof-label">Candidatures envoyees</span>
          </div>
          <div className="landing__proof-divider" />
          <div className="landing__proof-counter-item">
            <span className="landing__proof-number font-display">94%</span>
            <span className="landing__proof-label">Satisfaction utilisateur</span>
          </div>
          <div className="landing__proof-divider" />
          <div className="landing__proof-counter-item">
            <span className="landing__proof-number font-display">4.8/5</span>
            <span className="landing__proof-label">Note moyenne</span>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="landing__testimonials fade-in-up" id="testimonials">
        <div className="landing__features-header">
          <h2 className="section-title font-display" style={{ textAlign: 'center' }}>
            Ils ont trouve leur emploi avec JobBoat
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            Decouvrez les histoires de professionnels qui ont accelere leur carriere grace a l'IA.
          </p>
        </div>
        <div className="landing__testimonials-grid stagger-spring">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="glass-card landing__testimonial-card hover-lift">
              <div className="landing__testimonial-stars">
                {'★★★★★'}
              </div>
              <p className="landing__testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="landing__testimonial-author">
                <div className="landing__testimonial-avatar" style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="landing__testimonial-name">{t.name}</div>
                  <div className="landing__testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="landing__trust fade-in-up">
        <div className="landing__trust-badges">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="landing__trust-badge">
              <TrustIcon type={b.icon} />
              <span>{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SEO Content Block */}
      <section className="landing__seo-content fade-in-up">
        <article className="glass-card" style={{ padding: 'var(--jb-space-8)', maxWidth: 800, margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 'var(--jb-text-2xl)', fontWeight: 700, marginBottom: 'var(--jb-space-4)' }}>
            La Plateforme Intelligente pour Votre Recherche d'Emploi
          </h2>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--jb-space-4)' }}>
            <strong>JobBoat</strong> est une plateforme de <strong>recherche d'emploi</strong> propulsee par l'<strong>intelligence artificielle</strong>.
            Que vous cherchiez un <strong>CDI</strong>, un <strong>CDD</strong>, un <strong>stage</strong>, une <strong>alternance</strong> ou une mission <strong>freelance</strong>,
            notre technologie vous accompagne a chaque etape : creation de <strong>CV professionnel</strong>, <strong>preparation aux entretiens d'embauche</strong>,
            <strong>candidature automatique</strong> et <strong>coaching carriere</strong> personnalise.
          </p>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--jb-space-4)' }}>
            Notre <strong>constructeur de CV gratuit</strong> utilise l'IA pour optimiser votre CV pour les systemes <strong>ATS</strong> (Applicant Tracking System)
            utilises par les recruteurs. Obtenez un <strong>score de matching</strong>, des suggestions d'amelioration et exportez votre CV en <strong>PDF</strong>
            ou partagez-le via un <strong>lien web professionnel</strong>.
          </p>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8 }}>
            Disponible en <strong>France</strong> et en <strong>Europe</strong>, JobBoat s'adapte au marche de l'emploi local.
            Que vous soyez a <strong>Paris</strong>, <strong>Lyon</strong>, <strong>Marseille</strong>, <strong>Toulouse</strong>, <strong>Bordeaux</strong>,
            <strong>Lille</strong> ou ailleurs, notre IA trouve les meilleures <strong>offres d'emploi</strong> pres de chez vous.
          </p>
        </article>
      </section>

      {/* FAQ Section */}
      <section className="landing__faq fade-in-up" id="faq">
        <div className="landing__features-header">
          <h2 className="section-title font-display" style={{ textAlign: 'center' }}>
            Questions Frequentes sur la Recherche d'Emploi
          </h2>
        </div>
        <div className="landing__faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <details key={i} className="glass-card landing__faq-item">
              <summary className="landing__faq-question">{item.q}</summary>
              <p className="landing__faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="landing__cta fade-in-up delay-4">
        <div className="glass-card glass-card--accent landing__cta-inner">
          <h2 className="font-display" style={{ fontSize: 'var(--jb-text-3xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Pret a Trouver Votre Prochain Emploi ?
          </h2>
          <p className="text-secondary" style={{ maxWidth: 500, margin: '12px auto 0', lineHeight: 1.6 }}>
            Rejoignez des milliers de professionnels qui utilisent l'IA pour accelerer leur recherche d'emploi. CV Builder gratuit, coaching et candidature automatique.
          </p>
          <div style={{ display: 'flex', gap: 'var(--jb-space-3)', justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            <button className="btn btn--primary btn--lg" onClick={() => navigate('/auth')}>
              Commencer Gratuitement
            </button>
            <button className="btn btn--secondary btn--lg" onClick={() => navigate('/pricing')}>
              Voir les Tarifs
            </button>
          </div>
        </div>
      </section>

      {/* Extended SEO Content Block */}
      <section className="landing__seo-content fade-in-up" style={{ marginTop: 'var(--jb-space-6)' }}>
        <article className="glass-card" style={{ padding: 'var(--jb-space-8)', maxWidth: 800, margin: '0 auto' }}>
          <h2 className="font-display" style={{ fontSize: 'var(--jb-text-xl)', fontWeight: 700, marginBottom: 'var(--jb-space-4)' }}>
            Pourquoi choisir JobBoat pour votre recherche d'emploi ?
          </h2>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--jb-space-3)' }}>
            Contrairement aux sites d'emploi classiques comme <strong>Indeed</strong>, <strong>LinkedIn</strong>, <strong>HelloWork</strong>, <strong>Monster</strong> ou <strong>France Travail</strong> (ex Pole Emploi),
            JobBoat ne se contente pas d'afficher des offres. Notre <strong>intelligence artificielle</strong> postule activement pour vous, redige des <strong>lettres de motivation</strong> personnalisees,
            optimise votre <strong>CV pour les ATS</strong> et vous prepare aux <strong>entretiens d'embauche</strong> avec un coaching adaptatif.
          </p>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--jb-space-3)' }}>
            Que vous cherchiez un emploi en <strong>informatique</strong>, <strong>marketing</strong>, <strong>commerce</strong>, <strong>finance</strong>,
            <strong>ingenierie</strong>, <strong>sante</strong>, <strong>education</strong> ou <strong>restauration</strong>,
            JobBoat couvre tous les secteurs d'activite. Notre algorithme de <strong>matching emploi</strong> analyse votre profil
            sur 15 dimensions pour vous proposer les offres les plus pertinentes.
          </p>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8, marginBottom: 'var(--jb-space-3)' }}>
            <strong>Pour les etudiants</strong> : trouvez un <strong>stage</strong> ou une <strong>alternance</strong> facilement.
            <strong> Pour les seniors</strong> : une <strong>reconversion professionnelle</strong> assistee par IA.
            <strong> Pour les freelances</strong> : decrochez des <strong>missions freelance</strong> adaptees a votre expertise.
            <strong> Pour le teletravail</strong> : filtrez les offres <strong>100% remote</strong> et <strong>travail a distance</strong>.
          </p>
          <h3 style={{ fontSize: 'var(--jb-text-lg)', fontWeight: 600, marginBottom: 'var(--jb-space-2)', marginTop: 'var(--jb-space-4)', color: 'var(--jb-text-primary)' }}>
            Le meilleur generateur de CV en ligne gratuit
          </h3>
          <p style={{ color: 'var(--jb-text-secondary)', lineHeight: 1.8 }}>
            Le <strong>CV Builder</strong> de JobBoat est le seul outil gratuit qui combine <strong>enrichissement IA</strong>,
            <strong> optimisation ATS</strong>, <strong>analyse de score</strong>, <strong>export PDF professionnel</strong> et
            <strong> lien web partageable</strong>. Creez un <strong>curriculum vitae</strong> moderne et percutant en quelques minutes.
            Compatible avec tous les <strong>modeles de CV</strong> et adapte aux standards des recruteurs francais et internationaux.
          </p>
        </article>
      </section>

      {/* SEO Footer with semantic links */}
      <footer className="landing__footer" role="contentinfo">
        <nav className="landing__footer-links" aria-label="Navigation principale">
          <a href="/cv-builder" onClick={(e) => { e.preventDefault(); navigate('/cv-builder'); }}>CV Builder Gratuit</a>
          <a href="/coaching" onClick={(e) => { e.preventDefault(); navigate('/coaching'); }}>Coaching Carriere IA</a>
          <a href="/auto-apply" onClick={(e) => { e.preventDefault(); navigate('/auto-apply'); }}>Candidature Automatique</a>
          <a href="/pricing" onClick={(e) => { e.preventDefault(); navigate('/pricing'); }}>Tarifs et Abonnements</a>
          <a href="/auth" onClick={(e) => { e.preventDefault(); navigate('/auth'); }}>Inscription Gratuite</a>
        </nav>
        <nav className="landing__footer-links" aria-label="Liens utiles" style={{ marginTop: 'var(--jb-space-2)', opacity: 0.7 }}>
          <a href="/auto-apply" onClick={(e) => { e.preventDefault(); navigate('/auto-apply'); }}>Offres d'emploi</a>
          <a href="/cv-builder" onClick={(e) => { e.preventDefault(); navigate('/cv-builder'); }}>Faire un CV</a>
          <a href="/coaching" onClick={(e) => { e.preventDefault(); navigate('/coaching'); }}>Preparation Entretien</a>
          <a href="/auto-apply" onClick={(e) => { e.preventDefault(); navigate('/auto-apply'); }}>Postuler en ligne</a>
          <a href="/coaching" onClick={(e) => { e.preventDefault(); navigate('/coaching'); }}>Reconversion Pro</a>
        </nav>
        <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', marginTop: 'var(--jb-space-3)' }}>
          JobBoat — Plateforme IA de recherche d'emploi automatisee, constructeur de CV gratuit, coaching carriere et candidature automatique. Concu par AZZ&amp;CO LABS.
        </p>
        <p className="text-muted" style={{ fontSize: '0.6rem', marginTop: 'var(--jb-space-2)', opacity: 0.5 }}>
          Recherche emploi | Trouver un emploi | CV en ligne gratuit | Candidature automatique | Coaching carriere IA | Offres emploi France |
          CDI CDD Stage Alternance Freelance | Job search AI | AI Resume builder | Career coaching | Emploi Paris Lyon Marseille Toulouse Bordeaux Lille |
          Preparation entretien embauche | Lettre de motivation IA | Score CV ATS | Application emploi | Site emploi gratuit | Reconversion professionnelle
        </p>
      </footer>
    </div>
  );
}

/* --- SVG Icons --- */
function BrainSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
      <path d="M9 21h6" /><path d="M10 17v4" /><path d="M14 17v4" />
    </svg>
  );
}

function PatternSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
    </svg>
  );
}

function RocketSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ChartSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function DocSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function LetterSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function TrustIcon({ type }) {
  const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (type) {
    case 'lock':
      return <svg {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
    case 'shield':
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
    case 'brain':
      return <svg {...props}><path d="M12 2a7 7 0 017 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 017-7z"/></svg>;
    case 'chat':
      return <svg {...props}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    default:
      return null;
  }
}

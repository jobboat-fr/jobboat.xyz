import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://jobboat.xyz';

const ROUTE_SEO = {
  '/': {
    title: "JobBoat — Recherche d'emploi IA | Candidature automatique, CV Builder, Coaching Carriere",
    description: "Automatisez votre recherche d'emploi avec l'IA. Candidatures automatiques, coaching carriere, creation de CV intelligent, matching d'offres. CDI, CDD, stage, alternance, freelance, teletravail. Gratuit pour commencer.",
    keywords: "recherche emploi, trouver emploi, offre emploi, job search, find a job, candidature automatique, auto apply, postuler automatiquement, CV IA, resume builder, coaching carriere, emploi France, CDI, CDD, stage, alternance, freelance, teletravail, remote, intelligence artificielle emploi, JobBoat",
  },
  '/landing': {
    title: "JobBoat — Recherche d'emploi IA | Candidature automatique, CV Builder, Coaching Carriere",
    description: "Automatisez votre recherche d'emploi avec l'IA. Candidatures automatiques, coaching carriere, creation de CV intelligent, matching d'offres. CDI, CDD, stage, alternance, freelance, teletravail. Gratuit pour commencer.",
    keywords: "recherche emploi, trouver emploi, offre emploi, job search, find a job, candidature automatique, auto apply, CV IA, resume builder, coaching carriere, emploi France, CDI, CDD, stage, alternance, freelance, teletravail, JobBoat",
  },
  '/cv-builder': {
    title: "CV Builder IA Gratuit — Creer un CV professionnel en ligne | JobBoat",
    description: "Creez votre CV professionnel gratuitement avec l'intelligence artificielle. Optimisation ATS automatique, analyse de mots-cles, enrichissement avec donnees marche, export PDF, partage web. Le meilleur generateur de CV IA en ligne.",
    keywords: "creer CV, faire un CV, CV en ligne, CV gratuit, modele CV, generateur CV, CV IA, AI resume builder, CV professionnel, CV builder, resume builder, resume maker, AI resume, CV ATS, optimiser CV, telecharger CV PDF, CV moderne, curriculum vitae, exemple CV, template CV, faire son CV, rediger CV, creer CV en ligne gratuit, meilleur CV builder, CV optimise ATS",
  },
  '/coaching': {
    title: "Coaching Carriere IA — Preparation entretien, Conseils emploi | JobBoat",
    description: "Coaching de carriere personnalise par intelligence artificielle. Preparation entretien d'embauche, conseils recherche emploi, amelioration profil. Coach IA adaptatif multi-personas. Sessions illimitees en plan Pro.",
    keywords: "coaching carriere, coach emploi, coaching entretien, preparation entretien embauche, aide recherche emploi, conseil carriere, coaching professionnel, career coaching AI, interview preparation, job coach, reconversion professionnelle, bilan competences, coaching IA, simulateur entretien, questions entretien",
  },
  '/auto-apply': {
    title: "Candidature Automatique IA — Postuler automatiquement aux offres d'emploi | JobBoat",
    description: "Postulez automatiquement a des centaines d'offres d'emploi avec l'IA. Matching intelligent, lettre de motivation personnalisee, CV adapte a chaque poste. CDI, CDD, interim, stage, alternance, freelance.",
    keywords: "candidature automatique, postuler automatiquement, auto apply jobs, automated job application, candidature spontanee, envoyer CV, chercher emploi, offres emploi, job matching, emploi France, emploi Paris, emploi Lyon, emploi Marseille, emploi tech, emploi developpeur, Indeed, LinkedIn, France Travail, Pole Emploi, HelloWork",
  },
  '/pricing': {
    title: "Tarifs JobBoat — Plan gratuit, Pro 29€, Enterprise 99€ | Recherche emploi IA",
    description: "Decouvrez les tarifs JobBoat. Plan gratuit avec CV Builder complet et 10 candidatures IA/jour. Pro a 29€/mois pour tout illimite. Enterprise a 99€/mois avec API et white-label. Pay-as-you-go disponible.",
    keywords: "tarifs JobBoat, prix JobBoat, abonnement recherche emploi, plan gratuit emploi, candidature automatique prix, coaching emploi tarif, job search pricing, free job search, outil recherche emploi gratuit",
  },
  '/auth': {
    title: "Connexion / Inscription — JobBoat | Plateforme recherche emploi IA",
    description: "Connectez-vous ou creez votre compte JobBoat gratuitement. Commencez votre recherche d'emploi automatisee par IA en quelques secondes. Inscription rapide et securisee.",
    keywords: "inscription JobBoat, creer compte emploi, connexion recherche emploi, sign up job search, creer compte gratuit",
  },
  '/dashboard': {
    title: "Tableau de bord — Suivi candidatures et progression | JobBoat",
    description: "Votre centre de commande JobBoat : suivi de candidatures en temps reel, metriques de progression, score global, badges et gamification. Gerez votre recherche d'emploi efficacement.",
    keywords: "suivi candidatures, tableau bord emploi, metriques recherche emploi, application tracker, job dashboard, progression carriere, tracking candidatures",
  },
  '/profile': {
    title: "Profil & KPIs — Scoring multi-dimensionnel candidat | JobBoat",
    description: "Analysez votre profil professionnel sur 15 dimensions : technique, communication, motivation, adaptabilite, leadership. Metriques adaptatives EWMA et graphiques de progression.",
    keywords: "profil professionnel, scoring candidat, KPI emploi, evaluation competences, bilan professionnel, analyse profil, radar competences",
  },
  '/marketing': {
    title: "Marketing Personnel IA — Marque personnelle professionnelle | JobBoat",
    description: "Developpez votre marque personnelle avec l'IA. Generez du contenu professionnel, optimisez votre presence en ligne, attirez les recruteurs.",
    keywords: "personal branding, marque personnelle, visibilite professionnelle, marketing personnel, attirer recruteurs, presence en ligne",
  },
};

const OG_IMAGE = `${BASE_URL}/og-image.png`;

export default function SEOHead() {
  const location = useLocation();
  const path = location.pathname;
  const seo = ROUTE_SEO[path] || ROUTE_SEO['/'];
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="JobBoat" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@JobBoatAI" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
}

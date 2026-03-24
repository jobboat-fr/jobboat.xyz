import { useState, useEffect } from 'react';
import './loading-tips.css';

const TIPS = [
  "Saviez-vous ? JobBoat analyse votre CV sur 15 dimensions professionnelles.",
  "L'algorithme compare vos competences avec plus de 500 offres actives.",
  "Le coaching adaptatif ajuste ses questions en fonction de vos points faibles.",
  "Chaque session de coaching ameliore votre score EWMA en temps reel.",
  "JobBoat utilise 572 modeles comportementaux pour evaluer votre profil.",
  "Le matching d'emploi tient compte du titre, des mots-cles et de votre profil 15D.",
  "Les candidatures automatiques sont personnalisees pour chaque entreprise.",
  "Votre score global augmente a chaque interaction avec la plateforme.",
  "L'IA genere des lettres de motivation adaptees au destinataire (RH, CEO, Manager).",
  "Les offres sont actualisees toutes les 8 heures depuis France Travail et nos partenaires.",
  "Le systeme de scoring EWMA s'adapte progressivement : chaque action compte.",
  "JobBoat detecte automatiquement le secteur d'activite de votre CV.",
  "Les dimensions les plus valorisees par les recruteurs : fiabilite, communication, technique.",
  "Un CV optimise avec JobBoat multiplie vos chances par 3 en moyenne.",
  "Le coaching cible specifiquement les dimensions ou vous etes le plus faible.",
  "Pendant que vous dormez, JobBoat peut candidater pour vous automatiquement.",
];

export default function LoadingWithTips({ message = 'Chargement en cours...', steps = [] }) {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % TIPS.length);
        setFade(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-tips">
      <div className="loading-tips__spinner">
        <div className="loading-tips__ring" />
        <div className="loading-tips__ring loading-tips__ring--2" />
        <div className="loading-tips__ring loading-tips__ring--3" />
      </div>

      <p className="loading-tips__message">{message}</p>

      {steps.length > 0 && (
        <div className="loading-tips__steps">
          {steps.map((s, i) => (
            <div key={i} className={`loading-tips__step ${s.done ? 'loading-tips__step--done' : s.active ? 'loading-tips__step--active' : ''}`}>
              <span className="loading-tips__step-dot" />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className={`loading-tips__tip ${fade ? 'loading-tips__tip--visible' : ''}`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}>
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>{TIPS[tipIndex]}</span>
      </div>
    </div>
  );
}

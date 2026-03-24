/**
 * EWMA -- Exponentially Weighted Moving Average
 * Ported from legacy BrandPublisher behavioral engine.
 *
 * Used for adaptive skill tracking in coaching sessions.
 * Alpha = 0.18 (legacy default)
 * Score = 0.55 * confidence + 0.45 * answerQuality
 */

const ALPHA = 0.18;

export function createEWMA(initial = 0) {
  let estimate = initial;
  let count = 0;

  return {
    get value() { return estimate; },
    get observations() { return count; },

    update(confidence, answerQuality) {
      const raw = 0.55 * clamp(confidence) + 0.45 * clamp(answerQuality);
      estimate = count === 0 ? raw : ALPHA * raw + (1 - ALPHA) * estimate;
      count++;
      return estimate;
    },

    reset(initial = 0) {
      estimate = initial;
      count = 0;
    },

    toJSON() {
      return { estimate, count, alpha: ALPHA };
    },

    fromJSON(data) {
      estimate = data.estimate ?? 0;
      count = data.count ?? 0;
    },
  };
}

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * 15-dimension keys matching the backend contract.
 */
export const DIMENSION_KEYS = [
  // Assessment (8)
  'technical_competence',
  'cognitive_ability',
  'behavioral_traits',
  'emotional_intelligence',
  'cultural_fit',
  'motivation_drive',
  'potential',
  'practical_constraints',
  // HR Priority (7)
  'reliability',
  'accountability',
  'professional_behavior',
  'learning_mindset',
  'team_compatibility',
  'motivation_stability',
  'communication',
];

export const DIMENSION_LABELS = {
  technical_competence:   'Competence Technique',
  cognitive_ability:      'Capacite Cognitive',
  behavioral_traits:      'Traits Comportementaux',
  emotional_intelligence: 'Intelligence Emotionnelle',
  cultural_fit:           'Alignement Culturel',
  motivation_drive:       'Motivation & Ambition',
  potential:              'Potentiel (Valeur Future)',
  practical_constraints:  'Contraintes Pratiques',
  reliability:            'Fiabilite',
  accountability:         'Responsabilite',
  professional_behavior:  'Comportement Professionnel',
  learning_mindset:       "Mentalite d'Apprentissage",
  team_compatibility:     "Compatibilite d'Equipe",
  motivation_stability:   'Motivation & Stabilite',
  communication:          'Communication',
};

export const DIMENSION_GROUPS = {
  assessment: {
    label: 'Evaluation Candidat',
    keys: [
      'technical_competence', 'cognitive_ability', 'behavioral_traits',
      'emotional_intelligence', 'cultural_fit', 'motivation_drive',
      'potential', 'practical_constraints',
    ],
  },
  hr_priority: {
    label: 'Priorites RH',
    keys: [
      'reliability', 'accountability', 'professional_behavior',
      'learning_mindset', 'team_compatibility', 'motivation_stability',
      'communication',
    ],
  },
};

/**
 * 15-dimension EWMA tracker.
 */
export function createDimensionTracker() {
  const dims = {};
  for (const key of DIMENSION_KEYS) {
    dims[key] = createEWMA(0);
  }

  return {
    update(dimension, confidence, quality) {
      if (dims[dimension]) {
        return dims[dimension].update(confidence, quality);
      }
      return null;
    },

    getAll() {
      const out = {};
      for (const [k, v] of Object.entries(dims)) {
        out[k] = { value: v.value, observations: v.observations };
      }
      return out;
    },

    getOverallScore() {
      const values = Object.values(dims).map(d => d.value);
      return values.reduce((a, b) => a + b, 0) / values.length;
    },

    getGroupScore(groupKey) {
      const group = DIMENSION_GROUPS[groupKey];
      if (!group) return 0;
      const values = group.keys.map(k => dims[k]?.value ?? 0);
      return values.reduce((a, b) => a + b, 0) / values.length;
    },

    toJSON() {
      const out = {};
      for (const [k, v] of Object.entries(dims)) out[k] = v.toJSON();
      return out;
    },

    fromJSON(data) {
      for (const [k, v] of Object.entries(data)) {
        if (dims[k]) dims[k].fromJSON(v);
      }
    },
  };
}

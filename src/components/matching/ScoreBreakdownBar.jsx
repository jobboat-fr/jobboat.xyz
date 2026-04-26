/**
 * ScoreBreakdownBar — algorithm transparency component used on
 * BOTH the candidate (B2C) and recruiter (B2B) sides so they see the
 * SAME explanation of why a match score was produced.
 *
 * Inputs: a score-breakdown object whose values sum to ~100.
 * Renders a stacked horizontal bar with labelled segments.
 */

const COLORS = {
  skill:       '#38bdf8',  // sky-400
  experience:  '#a78bfa',  // violet-400
  growth:      '#34d399',  // emerald-400
  personality: '#fbbf24',  // amber-400
  behavioral:  '#f472b6',  // pink-400
};

const LABELS = {
  skill:       'Skill alignment',
  experience:  'Experience',
  growth:      'Growth potential',
  personality: 'Personality fit',
  behavioral:  'Behavioral patterns',
};

const DEFAULT_WEIGHTS = {
  skill: 30,
  experience: 25,
  growth: 15,
  personality: 10,
  behavioral: 20,
};

export default function ScoreBreakdownBar({ score, breakdown, weights = DEFAULT_WEIGHTS }) {
  const total = Math.max(0, Math.min(100, Number(score) || 0));
  // Render the static weight contribution (the ceilings each axis can contribute).
  // The breakdown prop is metadata-only here (e.g. skill_gaps, growth_potential).
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Match score</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
          {total.toFixed(0)} / 100
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          height: 14,
          borderRadius: 7,
          overflow: 'hidden',
          background: 'rgba(148,163,184,0.12)',
        }}
        aria-label={`Match score ${total.toFixed(0)} out of 100`}
      >
        {Object.keys(weights).map((axis) => (
          <div
            key={axis}
            title={`${LABELS[axis]} — up to ${weights[axis]} points`}
            style={{
              width: `${weights[axis]}%`,
              background: COLORS[axis],
              opacity: total >= weights[axis] ? 1 : Math.max(0.25, total / 100),
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
        {Object.keys(weights).map((axis) => (
          <span key={axis} style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: COLORS[axis],
                marginRight: 6,
              }}
            />
            {LABELS[axis]} <span style={{ marginLeft: 4, color: '#64748b' }}>(/{weights[axis]})</span>
          </span>
        ))}
      </div>
      {breakdown && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
          {typeof breakdown.skill_gaps_count === 'number' && (
            <div>• Skill gaps: <strong>{breakdown.skill_gaps_count}</strong></div>
          )}
          {typeof breakdown.readiness_aligned === 'boolean' && (
            <div>
              • Readiness aligned with role:&nbsp;
              <strong style={{ color: breakdown.readiness_aligned ? '#34d399' : '#fbbf24' }}>
                {breakdown.readiness_aligned ? 'oui' : 'partiel'}
              </strong>
            </div>
          )}
          {breakdown.growth_potential?.recommendation && (
            <div>• Growth: <strong>{breakdown.growth_potential.recommendation}</strong></div>
          )}
        </div>
      )}
    </div>
  );
}

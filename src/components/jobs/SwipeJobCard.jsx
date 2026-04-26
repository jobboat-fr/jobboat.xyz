import { useRef, useState, useCallback } from 'react';
import './swipeJobCard.css';

const SWIPE_THRESHOLD = 100;

export default function SwipeJobCard({ job, onAccept, onReject, index, total }) {
  const cardRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exiting, setExiting] = useState(null);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swiping) return;
    const diff = e.touches[0].clientX - startX.current;
    currentX.current = diff;
    setOffset(diff);
  }, [swiping]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    const diff = currentX.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      const direction = diff > 0 ? 'right' : 'left';
      setExiting(direction);
      setTimeout(() => {
        if (direction === 'right') onAccept?.(job);
        else onReject?.(job);
      }, 300);
    } else {
      setOffset(0);
    }
  }, [job, onAccept, onReject]);

  // Mouse handlers (desktop support)
  const handleMouseDown = useCallback((e) => {
    startX.current = e.clientX;
    currentX.current = 0;
    setSwiping(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!swiping) return;
    const diff = e.clientX - startX.current;
    currentX.current = diff;
    setOffset(diff);
  }, [swiping]);

  const handleMouseUp = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);
    const diff = currentX.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      const direction = diff > 0 ? 'right' : 'left';
      setExiting(direction);
      setTimeout(() => {
        if (direction === 'right') onAccept?.(job);
        else onReject?.(job);
      }, 300);
    } else {
      setOffset(0);
    }
  }, [swiping, job, onAccept, onReject]);

  const handleButtonAccept = useCallback(() => {
    setExiting('right');
    setTimeout(() => onAccept?.(job), 300);
  }, [job, onAccept]);

  const handleButtonReject = useCallback(() => {
    setExiting('left');
    setTimeout(() => onReject?.(job), 300);
  }, [job, onReject]);

  const rotation = swiping ? offset * 0.05 : 0;
  const opacity = swiping ? Math.max(0.5, 1 - Math.abs(offset) / 400) : 1;
  const acceptOpacity = Math.min(1, Math.max(0, offset / SWIPE_THRESHOLD));
  const rejectOpacity = Math.min(1, Math.max(0, -offset / SWIPE_THRESHOLD));

  let transform = `translateX(${offset}px) rotate(${rotation}deg)`;
  if (exiting === 'right') transform = 'translateX(120vw) rotate(20deg)';
  if (exiting === 'left') transform = 'translateX(-120vw) rotate(-20deg)';

  const matchScore = typeof job.match_score === 'number' ? job.match_score : null;
  const tags = job.tags || [];
  const description = job.description || job.snippet || '';

  return (
    <div className="swipe-card-wrapper">
      <div className="swipe-card__counter">
        <span className="swipe-card__counter-text">{index + 1} / {total}</span>
      </div>

      <div
        ref={cardRef}
        className={`swipe-card glass-card ${exiting ? 'swipe-card--exiting' : ''}`}
        style={{ transform, opacity }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Swipe indicators */}
        <div className="swipe-card__indicator swipe-card__indicator--accept" style={{ opacity: acceptOpacity }}>
          POSTULER
        </div>
        <div className="swipe-card__indicator swipe-card__indicator--reject" style={{ opacity: rejectOpacity }}>
          PASSER
        </div>

        {/* Match score */}
        {matchScore !== null && (
          <div className="swipe-card__score">
            <span className="swipe-card__score-value">{matchScore}</span>
            <span className="swipe-card__score-label">% match</span>
          </div>
        )}

        {/* Job info */}
        <div className="swipe-card__body">
          <h2 className="swipe-card__title font-display">{job.title}</h2>
          <p className="swipe-card__company">
            {job.company}
            {job.location && <span className="swipe-card__location"> — {job.location}</span>}
          </p>

          {/* Badges */}
          <div className="swipe-card__badges">
            {job.contract && job.contract !== 'n/a' && (
              <span className="badge">{job.contract}</span>
            )}
            {tags.slice(0, 4).map((tag, i) => {
              const label = typeof tag === 'string' ? tag : (tag?.skill_name || tag?.name || JSON.stringify(tag));
              return <span key={`${job.id}-tag-${i}`} className="badge badge--accent">{label}</span>;
            })}
            {job.apply_email && <span className="badge badge--success">Email direct</span>}
            {!job.apply_email && job.apply_url && <span className="badge">Portail</span>}
          </div>

          {/* Description */}
          {description && (
            <p className="swipe-card__description text-secondary">
              {description.length > 280 ? description.slice(0, 280) + '...' : description}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="swipe-card__actions">
        <button
          className="swipe-card__btn swipe-card__btn--reject"
          onClick={handleButtonReject}
          aria-label="Passer cette offre"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <button
          className="swipe-card__btn swipe-card__btn--accept"
          onClick={handleButtonAccept}
          aria-label="Postuler a cette offre"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      {/* Keyboard hint (desktop) */}
      <div className="swipe-card__keyboard-hint">
        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
          Glisse ou utilise les boutons — Clique &amp; glisse sur desktop
        </span>
      </div>
    </div>
  );
}

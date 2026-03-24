import { useState, useEffect, useRef } from 'react';
import { useActivity } from '../context/ActivityContext';
import './ActivityFeed.css';

function elapsed(startedAt, endedAt) {
  const ms = (endedAt || Date.now()) - (startedAt || Date.now());
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function ActivityFeed() {
  const { activities } = useActivity();
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef(null);

  const hasPending = activities.some(a => a.status === 'pending');
  const hasError   = activities.some(a => a.status === 'error');

  // Tick every 200ms to update elapsed timers while items are pending
  useEffect(() => {
    if (hasPending) {
      intervalRef.current = setInterval(() => setTick(t => t + 1), 200);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [hasPending]);

  // Auto-open panel when a new pending item arrives
  useEffect(() => {
    if (hasPending) setOpen(true);
  }, [hasPending]);

  // Auto-close after all done + a brief delay
  useEffect(() => {
    if (!hasPending && !hasError && open && activities.length > 0) {
      const t = setTimeout(() => setOpen(false), 3500);
      return () => clearTimeout(t);
    }
  }, [hasPending, hasError, open, activities.length]);

  const pulseClass = hasPending
    ? 'activity-feed__toggle-pulse'
    : hasError
      ? 'activity-feed__toggle-pulse activity-feed__toggle-pulse--error'
      : 'activity-feed__toggle-pulse activity-feed__toggle-pulse--idle';

  const toggleLabel = hasPending
    ? 'Système actif'
    : hasError
      ? 'Erreur détectée'
      : activities.length > 0
        ? 'Activité récente'
        : 'Système prêt';

  return (
    <div className="activity-feed" aria-live="polite">
      {open && (
        <div className="activity-feed__panel">
          <div className="activity-feed__header">
            <span className="activity-feed__title">Activité système</span>
            <button className="activity-feed__close" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
          </div>
          <div className="activity-feed__list">
            {activities.length === 0 ? (
              <p className="activity-feed__empty">Aucune activité récente</p>
            ) : (
              activities.map(item => (
                <ActivityItem key={item.id} item={item} tick={tick} />
              ))
            )}
          </div>
        </div>
      )}

      <button
        className="activity-feed__toggle"
        onClick={() => setOpen(o => !o)}
        aria-label="Ouvrir l'activité système"
      >
        <span className={pulseClass} />
        {toggleLabel}
        {activities.filter(a => a.status === 'pending').length > 0 && (
          <span style={{ marginLeft: 2, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            ({activities.filter(a => a.status === 'pending').length})
          </span>
        )}
      </button>
    </div>
  );
}

function ActivityItem({ item, tick: _tick }) {
  const dotClass = `activity-item__dot activity-item__dot--${item.status}`;
  const itemClass = `activity-item activity-item--${item.status}`;

  return (
    <div className={itemClass}>
      <span className={dotClass} />
      <div className="activity-item__body">
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="activity-item__icon">{item.icon}</span>
          <span className="activity-item__label">{item.label}</span>
        </div>
        <div className="activity-item__meta">
          {item.sub && <span className="activity-item__sub">{item.sub}</span>}
          <span className="activity-item__elapsed">
            {item.status === 'pending'
              ? elapsed(item.startedAt, null)
              : item.endedAt
                ? elapsed(item.startedAt, item.endedAt)
                : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import './portalAssistPanel.css';

/**
 * PortalAssistPanel — Shows results after auto-apply with two sections:
 *   1. Emails sent automatically
 *   2. Portal Assist cards for jobs requiring manual action
 */
export default function PortalAssistPanel({ emailResults = [], portalJobs = [], skippedJobs = [] }) {
  const [completedIds, setCompletedIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const markDone = useCallback((jobId) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId); else next.add(jobId);
      return next;
    });
  }, []);

  const copyToClipboard = useCallback(async (text, jobId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(jobId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(jobId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const openPortal = useCallback((url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const totalDone = completedIds.size;
  const totalPortal = portalJobs.length;

  return (
    <div className="portal-panel">
      {/* Summary */}
      <div className="portal-panel__summary">
        {emailResults.length > 0 && (
          <div className="portal-panel__stat portal-panel__stat--email">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            {emailResults.filter(e => e.status === 'sent').length} emails envoyes
          </div>
        )}
        {totalPortal > 0 && (
          <div className="portal-panel__stat portal-panel__stat--portal">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            {totalPortal} portails a completer {totalDone > 0 && `(${totalDone} fait${totalDone > 1 ? 's' : ''})`}
          </div>
        )}
        {skippedJobs.length > 0 && (
          <div className="portal-panel__stat portal-panel__stat--skipped">
            {skippedJobs.length} non contactable{skippedJobs.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Email results */}
      {emailResults.length > 0 && (
        <div className="portal-panel__section">
          <div className="portal-panel__section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Candidatures envoyees par email
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {emailResults.map((r, i) => (
              <div key={r.jobId || i} className="portal-panel__email-item">
                <span>{r.company || 'Entreprise'} — {r.title || r.jobId}</span>
                <span className={`portal-panel__email-status portal-panel__email-status--${r.status === 'sent' || r.summary?.sent > 0 ? 'sent' : 'failed'}`}>
                  {r.status === 'sent' || r.summary?.sent > 0 ? 'Envoye' : 'Echec'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portal Assist cards */}
      {portalJobs.length > 0 && (
        <div className="portal-panel__section">
          <div className="portal-panel__section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Candidatures via portail — ta lettre est prete, ouvre et colle
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--jb-space-3)' }}>
            {portalJobs.map((job) => {
              const isDone = completedIds.has(job.jobId);
              const isCopied = copiedId === job.jobId;
              const isExpanded = expandedId === job.jobId;
              const hasLetter = Boolean(job.letter || job.clipboard_text);
              const instructions = job.instructions || job.platformInfo?.instructions || [];

              return (
                <div key={job.jobId} className={`portal-card ${isDone ? 'portal-card--done' : ''}`}>
                  <div className="portal-card__header">
                    <div className="portal-card__info">
                      <span className="portal-card__title">{job.title || 'Poste'}</span>
                      <span className="portal-card__company">{job.company || 'Entreprise'}</span>
                    </div>
                    <span className="portal-card__platform">
                      {job.platform_name || job.platformInfo?.name || job.platform || 'Portail'}
                    </span>
                  </div>

                  {/* Instructions */}
                  {instructions.length > 0 && (
                    <div className="portal-card__instructions">
                      <ol>
                        {instructions.map((inst, idx) => (
                          <li key={idx}>{inst}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Letter preview */}
                  {hasLetter && (
                    <div
                      className={`portal-card__letter ${isExpanded ? 'portal-card__letter--expanded' : ''}`}
                      onClick={() => setExpandedId(isExpanded ? null : job.jobId)}
                      style={{ cursor: 'pointer' }}
                    >
                      {job.letter || job.clipboard_text}
                      {!isExpanded && <div className="portal-card__letter-fade" />}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="portal-card__actions">
                    {job.apply_url && (
                      <button
                        className="portal-card__btn portal-card__btn--primary"
                        onClick={() => openPortal(job.apply_url)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        Ouvrir le portail
                      </button>
                    )}
                    {hasLetter && (
                      <button
                        className="portal-card__btn portal-card__btn--copy"
                        onClick={() => copyToClipboard(job.letter || job.clipboard_text, job.jobId)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        {isCopied ? 'Copie !' : 'Copier la lettre'}
                      </button>
                    )}
                    <button
                      className={`portal-card__btn ${isDone ? 'portal-card__btn--done' : ''}`}
                      onClick={() => markDone(job.jobId)}
                    >
                      {isDone ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          Fait
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                          Marquer comme fait
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import './oracle.css';

export default function OracleInterface({
  state = 'idle',
  statusText = '',
  onMicToggle,
  onTextSubmit,
  typingPrompt = 'Tapez votre reponse...',
  title,
  subtitle,
  onBack,
  extraControls,
  avatarUrl = null,
  avatarLoading = false,
  children,
}) {
  const [showTyping, setShowTyping] = useState(false);
  const [typingValue, setTypingValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (showTyping && textareaRef.current) textareaRef.current.focus();
  }, [showTyping]);

  function handleSubmit() {
    if (!typingValue.trim()) return;
    onTextSubmit?.(typingValue.trim());
    setTypingValue('');
    setShowTyping(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  }

  const defaultStatus = {
    idle:      'Appuyez pour parler',
    listening: 'Je vous ecoute...',
    thinking:  'Traitement en cours...',
    speaking:  'En cours de reponse...',
  }[state] || '';

  return (
    <div className={`oracle oracle--${state}`}>
      {onBack && (
        <button className="oracle__back" onClick={onBack} aria-label="Retour">
          <BackIcon />
        </button>
      )}
      {(title || subtitle) && (
        <div className="oracle__header">
          {title && <h2 className="oracle__title font-display">{title}</h2>}
          {subtitle && <p className="oracle__subtitle">{subtitle}</p>}
        </div>
      )}
      {children && <div className="oracle__content">{children}</div>}

      {/* Avatar from settings */}
      {(avatarUrl || avatarLoading) && (
        <div className="oracle__avatar">
          {avatarLoading && !avatarUrl && (
            <div className="oracle__avatar-spinner" />
          )}
          {avatarUrl && (
            <video
              src={avatarUrl}
              autoPlay
              loop
              muted
              playsInline
              className={`oracle__avatar-video oracle__avatar-video--${state}`}
            />
          )}
        </div>
      )}

      <div className="oracle__stage">
        <button
          className={`oracle__orb oracle__orb--${state}`}
          onClick={onMicToggle}
          aria-label={state === 'listening' ? 'Arreter' : 'Parler'}
        >
          <div className="oracle__orb-core" />
          <div className="oracle__orb-ring oracle__orb-ring--1" />
          <div className="oracle__orb-ring oracle__orb-ring--2" />
          <div className="oracle__orb-ring oracle__orb-ring--3" />
        </button>
        <p className="oracle__status-text">{statusText || defaultStatus}</p>
        {showTyping && (
          <div className="oracle__typing-box fade-in-up">
            <textarea
              ref={textareaRef}
              className="oracle__typing-input"
              value={typingValue}
              onChange={e => setTypingValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={typingPrompt}
              rows={3}
            />
            <div className="oracle__typing-actions">
              <button className="btn btn--ghost btn--sm" onClick={() => { setShowTyping(false); setTypingValue(''); }}>
                Annuler
              </button>
              <button className="btn btn--primary btn--sm" onClick={handleSubmit} disabled={!typingValue.trim()}>
                Envoyer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="oracle__controls">
        <button
          className={`oracle__ctrl oracle__ctrl--mic ${state === 'listening' ? 'oracle__ctrl--active' : ''}`}
          onClick={onMicToggle}
          title={state === 'listening' ? 'Arreter' : 'Parler'}
        >
          <MicIcon />
        </button>
        <button
          className={`oracle__ctrl oracle__ctrl--keyboard ${showTyping ? 'oracle__ctrl--active' : ''}`}
          onClick={() => setShowTyping(p => !p)}
          title="Clavier"
        >
          <KeyboardIcon />
        </button>
        {extraControls}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function MicIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function KeyboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="6" y1="9" x2="6.01" y2="9" /><line x1="10" y1="9" x2="10.01" y2="9" />
      <line x1="14" y1="9" x2="14.01" y2="9" /><line x1="18" y1="9" x2="18.01" y2="9" />
      <line x1="6" y1="13" x2="6.01" y2="13" /><line x1="18" y1="13" x2="18.01" y2="13" />
      <line x1="10" y1="13" x2="14" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}

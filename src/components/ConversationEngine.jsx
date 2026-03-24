/**
 * ConversationEngine.jsx -- Shared conversational UI component.
 * Used by CoachingRoom, CvBuilder (chat mode), and JupiterRoomEnhanced.
 *
 * Props:
 *   messages       [{ role, content, ts, id }]
 *   onSend         (text: string) => void
 *   loading        bool
 *   avatarVariant  'A'|'B'|'C'|'D'|'E'|'F'  (default 'A')
 *   avatarName     string
 *   chips          string[]   -- quick-action suggestions
 *   placeholder    string
 *   disabled       bool
 *   isRecording    bool
 *   onMicClick     () => void
 *   headerSlot     ReactNode  -- optional top-right controls
 */

import { useRef, useEffect, useState, useCallback } from 'react';

const AVATAR_COLORS = {
  A: { bg: '#1e3a5f', accent: '#4f9eff', initial: 'J' },
  B: { bg: '#2d1b4e', accent: '#a78bfa', initial: 'M' },
  C: { bg: '#1a3a2a', accent: '#34d399', initial: 'S' },
  D: { bg: '#3b1f1f', accent: '#f87171', initial: 'R' },
  E: { bg: '#2a2a1a', accent: '#fbbf24', initial: 'A' },
  F: { bg: '#1a2a3a', accent: '#38bdf8', initial: 'L' },
};

function AvatarSVG({ variant = 'A', size = 48, speaking = false }) {
  const { bg, accent, initial } = AVATAR_COLORS[variant] || AVATAR_COLORS.A;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          borderRadius: '50%',
          boxShadow: speaking ? `0 0 0 3px ${accent}, 0 0 16px ${accent}66` : `0 0 0 2px ${accent}44`
        }}
      >
        <circle cx="24" cy="24" r="24" fill={bg} />
        <circle cx="24" cy="20" r="9" fill={accent} opacity="0.9" />
        <ellipse cx="24" cy="38" rx="13" ry="10" fill={accent} opacity="0.6" />
        <text x="24" y="24" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">{initial}</text>
      </svg>
      {speaking && (
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 12, height: 12, borderRadius: '50%',
          background: '#22c55e',
          border: '2px solid #0b1220',
          animation: 'pulse 1.2s ease-in-out infinite'
        }} />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--jb-neon-blue, #4f9eff)',
            display: 'inline-block',
            animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
    </div>
  );
}

export default function ConversationEngine({
  messages = [],
  onSend,
  loading = false,
  avatarVariant = 'A',
  avatarName = 'Assistant',
  chips = [],
  placeholder = 'Écris un message…',
  disabled = false,
  isRecording = false,
  onMicClick,
  headerSlot = null,
  style = {}
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading || disabled) return;
    setInput('');
    onSend?.(text);
  }, [input, loading, disabled, onSend]);

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--jb-bg-primary, #0b1220)',
      borderRadius: 'var(--jb-radius-lg, 16px)',
      overflow: 'hidden',
      ...style
    }}>
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.85); }
          30% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .ce-msg { animation: msgIn 0.25s ease; }
        .ce-input:focus { outline: none; box-shadow: var(--jb-input-ring, 0 0 0 2px rgba(79,158,255,0.55)); }
        .ce-send-btn:hover:not(:disabled) { background: var(--jb-neon-blue, #4f9eff); color: white; }
        .ce-chip:hover { background: rgba(79,158,255,0.18); border-color: var(--jb-neon-blue, #4f9eff); color: white; }
        .ce-mic-btn { transition: all 0.2s; }
        .ce-mic-btn:hover { color: var(--jb-neon-blue, #4f9eff); }
        .ce-mic-btn.recording { color: #f87171; animation: pulse 1s infinite; }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        borderBottom: '1px solid var(--jb-glass-border, rgba(255,255,255,0.08))',
        background: 'var(--jb-glass-bg, rgba(255,255,255,0.04))',
        flexShrink: 0
      }}>
        <AvatarSVG variant={avatarVariant} size={36} speaking={loading} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--jb-text-primary, #f1f5f9)' }}>{avatarName}</div>
          <div style={{ fontSize: '0.72rem', color: loading ? 'var(--jb-neon-blue, #4f9eff)' : 'var(--jb-text-muted, #64748b)' }}>
            {loading ? 'En train d\'écrire…' : 'En ligne'}
          </div>
        </div>
        {headerSlot}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--jb-text-muted, #64748b)', marginTop: 40, fontSize: '0.85rem' }}>
            Commence la conversation…
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';
          return (
            <div
              key={msg.id || idx}
              className="ce-msg"
              style={{
                display: 'flex',
                flexDirection: isUser ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 8,
              }}
            >
              {!isUser && !isSystem && (
                <AvatarSVG variant={avatarVariant} size={28} />
              )}
              <div style={{
                maxWidth: '78%',
                padding: isSystem ? '6px 12px' : '10px 14px',
                borderRadius: isUser
                  ? '16px 16px 4px 16px'
                  : isSystem ? '8px' : '16px 16px 16px 4px',
                background: isUser
                  ? 'var(--jb-neon-blue, #4f9eff)'
                  : isSystem
                    ? 'rgba(248,113,113,0.12)'
                    : 'var(--jb-glass-strong-bg, rgba(255,255,255,0.09))',
                border: isSystem
                  ? '1px solid rgba(248,113,113,0.3)'
                  : isUser
                    ? 'none'
                    : '1px solid var(--jb-glass-strong-border, rgba(255,255,255,0.14))',
                color: isUser
                  ? 'white'
                  : isSystem
                    ? '#f87171'
                    : 'var(--jb-text-primary, #f1f5f9)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="ce-msg" style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <AvatarSVG variant={avatarVariant} size={28} speaking />
            <div style={{
              padding: '10px 14px',
              borderRadius: '16px 16px 16px 4px',
              background: 'var(--jb-glass-strong-bg, rgba(255,255,255,0.09))',
              border: '1px solid var(--jb-glass-strong-border, rgba(255,255,255,0.14))',
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Chips */}
      {chips.length > 0 && !loading && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap',
          padding: '8px 16px 0',
          flexShrink: 0
        }}>
          {chips.map((chip, i) => (
            <button
              key={i}
              className="ce-chip"
              onClick={() => onSend?.(chip)}
              disabled={disabled || loading}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--jb-radius-full, 9999px)',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent',
                color: 'var(--jb-text-secondary, #94a3b8)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.18s'
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8,
        padding: '12px 16px',
        borderTop: '1px solid var(--jb-glass-border, rgba(255,255,255,0.08))',
        background: 'var(--jb-glass-bg, rgba(255,255,255,0.04))',
        flexShrink: 0
      }}>
        {onMicClick && (
          <button
            className={`ce-mic-btn${isRecording ? ' recording' : ''}`}
            onClick={onMicClick}
            disabled={disabled}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
            style={{
              background: 'none', border: 'none',
              color: isRecording ? '#f87171' : 'var(--jb-text-muted, #64748b)',
              cursor: 'pointer', padding: '6px',
              display: 'flex', alignItems: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}

        <textarea
          ref={inputRef}
          className="ce-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled || loading}
          rows={1}
          style={{
            flex: 1,
            background: 'var(--jb-glass-strong-bg, rgba(255,255,255,0.09))',
            border: '1px solid var(--jb-glass-strong-border, rgba(255,255,255,0.14))',
            borderRadius: 'var(--jb-radius-lg, 16px)',
            padding: '10px 14px',
            color: 'var(--jb-text-primary, #f1f5f9)',
            fontSize: '0.875rem',
            resize: 'none',
            minHeight: 42,
            maxHeight: 120,
            lineHeight: 1.5,
            transition: 'box-shadow 0.2s',
            fontFamily: 'inherit',
            overflowY: 'auto'
          }}
        />

        <button
          className="ce-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading || disabled}
          style={{
            width: 40, height: 40,
            borderRadius: '50%',
            border: '1px solid var(--jb-glass-strong-border, rgba(255,255,255,0.14))',
            background: input.trim() && !loading
              ? 'var(--jb-neon-blue, #4f9eff)'
              : 'var(--jb-glass-strong-bg, rgba(255,255,255,0.09))',
            color: input.trim() && !loading
              ? 'white'
              : 'var(--jb-text-muted, #64748b)',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s',
            flexShrink: 0
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

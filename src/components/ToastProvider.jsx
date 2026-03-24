import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let _toastId = 0;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, message, type = 'info', duration = 5000, action }) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev.slice(-4), { id, title, message, type, action }]);
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const success = useCallback((msg, opts) => toast({ message: msg, type: 'success', ...opts }), [toast]);
  const error = useCallback((msg, opts) => toast({ message: msg, type: 'error', duration: 8000, ...opts }), [toast]);
  const info = useCallback((msg, opts) => toast({ message: msg, type: 'info', ...opts }), [toast]);
  const warning = useCallback((msg, opts) => toast({ message: msg, type: 'warning', ...opts }), [toast]);

  const typeColors = {
    success: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', icon: '✓', color: '#10b981' },
    error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.4)',   icon: '✕', color: '#ef4444' },
    warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.4)',  icon: '⚠', color: '#f59e0b' },
    info:    { bg: 'rgba(59,130,246,0.12)',   border: 'rgba(59,130,246,0.4)',  icon: 'ℹ', color: '#3b82f6' },
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, dismiss }}>
      {children}

      {/* Toast container */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 380,
        pointerEvents: 'none',
      }}>
        {toasts.map((t) => {
          const c = typeColors[t.type] || typeColors.info;
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                background: c.bg,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${c.border}`,
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                animation: 'jb-toast-in 0.3s ease-out',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                fontFamily: 'var(--jb-font-body, system-ui, sans-serif)',
              }}
            >
              <span style={{ fontSize: 16, color: c.color, fontWeight: 700, lineHeight: 1.4, flexShrink: 0 }}>
                {c.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#e2e8f0', marginBottom: 2 }}>
                    {t.title}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: 'rgba(226,232,240,0.85)', lineHeight: 1.5 }}>
                  {t.message}
                </div>
                {t.action && (
                  <button
                    onClick={t.action.onClick}
                    style={{
                      marginTop: 6,
                      background: 'none',
                      border: 'none',
                      color: c.color,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    {t.action.label}
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(148,163,184,0.6)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '0 2px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes jb-toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

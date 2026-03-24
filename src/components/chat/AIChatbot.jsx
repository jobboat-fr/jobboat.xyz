import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/apiClient';
import './chatbot.css';

const SUGGESTIONS = [
  { label: 'Coach moi', task: 'coaching', prompt: 'Comment puis-je ameliorer mon profil professionnel ?' },
  { label: 'Redige ma lettre', task: 'application_email', prompt: 'Redige un email de candidature pour un poste de developpeur full-stack.' },
  { label: 'Cherche des jobs', task: 'general', prompt: 'Quels types de postes correspondent a mon profil ?' },
  { label: 'Analyse mon CV', task: 'general', prompt: 'Analyse les forces et faiblesses de mon profil actuel.' },
];

export default function AIChatbot({ embedded = false }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(embedded);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Salut ${user?.name || 'Capitaine'} ! Je suis ton co-pilote IA. Pose-moi n'importe quelle question sur ta carriere, tes candidatures ou ton coaching.`, ts: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) { setUnread(0); inputRef.current?.focus(); }
  }, [open]);

  const sendMessage = useCallback(async (text, task = 'general') => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const chatHistory = [...messages.slice(-8), userMsg].map(m => ({
        role: m.role, content: m.content
      }));

      const res = await api.v2AiExecute({
        task,
        prompt: text.trim(),
        messages: chatHistory,
        max_tokens: 500,
        temperature: 0.8
      });

      const reply = res?.result?.text || 'Desole, je n\'ai pas pu generer de reponse. Reessaie.';
      const meta = res?.result?.provider ? `${res.result.provider}/${res.result.model || ''}` : null;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        meta,
        ts: Date.now()
      }]);

      if (!open) setUnread(prev => prev + 1);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Oups, erreur: ${err.message}. Verifie ta connexion ou reessaie.`,
        error: true,
        ts: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (s) => {
    sendMessage(s.prompt, s.task);
  };

  return (
    <>
      {/* Floating trigger button — hidden in embedded mode */}
      {!embedded && (
        <button
          className={`chatbot-trigger btn-magnetic ${open ? 'chatbot-trigger--open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label="Ouvrir le chatbot IA"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
          {unread > 0 && !open && (
            <span className="chatbot-trigger__badge pop-in">{unread}</span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {(open || embedded) && (
        <div className={`chatbot-panel drop-in ${embedded ? 'chatbot-panel--embedded' : ''}`}>
          <div className="chatbot-panel__header">
            <div className="chatbot-panel__header-left">
              <div className="chatbot-panel__avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" /><path d="M9 21h6" /></svg>
              </div>
              <div>
                <div className="chatbot-panel__name">Co-Pilote IA</div>
                <div className="chatbot-panel__status">
                  <span className="glow-dot" style={{ width: 6, height: 6 }} />
                  <span>En ligne</span>
                </div>
              </div>
            </div>
            {!embedded && (
              <button className="btn btn--ghost btn--sm" onClick={() => setOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
            )}
          </div>

          <div className="chatbot-panel__messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg--${msg.role} ${msg.error ? 'chatbot-msg--error' : ''}`}>
                <div className="chatbot-msg__bubble">
                  {msg.content}
                </div>
                {msg.meta && (
                  <div className="chatbot-msg__meta">{msg.meta}</div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg chatbot-msg--assistant">
                <div className="chatbot-msg__bubble">
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 2 && (
            <div className="chatbot-panel__suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="chatbot-suggestion btn-magnetic" onClick={() => handleSuggestion(s)}>
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <form className="chatbot-panel__input" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="input"
              placeholder="Ecris ton message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn--primary btn--sm" disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

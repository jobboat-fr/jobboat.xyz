import { useCallback, useRef, useState } from 'react';

/**
 * useOracleVoice — always-on, auto-submitting voice for Oracle mode.
 *
 * Uses Web Speech API continuous mode (no Whisper round-trip → ~0ms transcription).
 * Auto-submits after `silenceMs` of silence following the last final speech segment.
 * Shows interim text live while the user speaks.
 */
export function useOracleVoice({
  language = 'fr-FR',
  silenceMs = 2500,
  onSubmit,
  onInterim,
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText]   = useState('');
  const [error, setError]               = useState('');

  const recognitionRef  = useRef(null);
  const timerRef        = useRef(null);
  const finalTextRef    = useRef('');
  const activeRef       = useRef(false); // desired state

  /* ── internal helpers ── */
  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const flush = useCallback(() => {
    clearTimer();
    const text = finalTextRef.current.trim();
    finalTextRef.current = '';
    setInterimText('');
    if (text && onSubmit) onSubmit(text);
  }, [onSubmit]);

  const armTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(flush, silenceMs);
  }, [flush, silenceMs]);

  /* ── build recognition instance ── */
  const makeRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const rec = new SR();
    rec.lang            = language;
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalTextRef.current += r[0].transcript;
          armTimer(); // reset silence countdown
        } else {
          interim += r[0].transcript;
        }
      }
      const display = (finalTextRef.current + interim).trim();
      setInterimText(display);
      if (onInterim) onInterim(display);
    };

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return; // non-fatal in continuous mode
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setError('Microphone non autorisé. Autorise-le dans les paramètres du navigateur.');
        activeRef.current = false;
        setIsListening(false);
      }
    };

    rec.onend = () => {
      // Browser stops recognition after long silence — auto-restart if still active
      if (activeRef.current && recognitionRef.current === rec) {
        try { rec.start(); } catch { /* already starting */ }
      } else {
        setIsListening(false);
      }
    };

    return rec;
  }, [language, armTimer, onInterim]);

  /* ── public API ── */
  const start = useCallback(() => {
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) {
      setError('Reconnaissance vocale non disponible. Utilise Chrome ou Edge.');
      return;
    }
    setError('');
    finalTextRef.current = '';
    activeRef.current = true;

    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch { /* already running */ }
      return;
    }
    const rec = makeRecognition();
    recognitionRef.current = rec;
    try { rec.start(); } catch (e) { setError('Erreur démarrage: ' + e.message); }
  }, [makeRecognition]);

  const stop = useCallback(() => {
    clearTimer();
    activeRef.current = false;
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) try { rec.abort(); } catch { /* noop */ } // abort() releases AudioContext immediately
    setIsListening(false);
    setInterimText('');
    finalTextRef.current = '';
  }, []);

  const toggle = useCallback(() => {
    if (activeRef.current) stop(); else start();
  }, [start, stop]);

  return { isListening, interimText, error, start, stop, toggle, submitNow: flush };
}

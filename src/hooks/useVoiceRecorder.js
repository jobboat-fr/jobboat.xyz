import { useCallback, useRef, useState } from 'react';
import { api } from '../services/apiClient';

/**
 * Browser-based speech recognition fallback (Web Speech API).
 * Works in Chrome, Edge, Safari. Free, no API key needed.
 */
function createBrowserRecognition(language, onResult, onError) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = language === 'fr' ? 'fr-FR' : language;
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let finalText = '';

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalText += event.results[i][0].transcript + ' ';
      }
    }
  };

  recognition.onend = () => {
    const text = finalText.trim();
    if (text) {
      onResult(text);
    } else {
      onError('Aucune parole detectee. Reessaie en parlant plus fort.');
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') {
      onError('Aucune parole detectee.');
    } else if (event.error === 'not-allowed') {
      onError('Acces au microphone refuse.');
    } else {
      onError(`Erreur reconnaissance vocale: ${event.error}`);
    }
  };

  return recognition;
}

/**
 * useVoiceRecorder -- records audio from the microphone, sends it to
 * the backend Whisper endpoint, and returns the transcribed text.
 * Falls back to browser Web Speech API if Whisper is unavailable.
 *
 * Usage:
 *   const { isRecording, isTranscribing, transcript, error, startRecording, stopRecording } = useVoiceRecorder();
 */
export function useVoiceRecorder({ language = 'fr', onTranscript } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const useBrowserFallbackRef = useRef(false);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    setTranscript('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const browserTextRef = { current: '' };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Always start browser recognition in parallel as backup
      if (SpeechRecognition) {
        const recognition = createBrowserRecognition(
          language,
          (text) => { browserTextRef.current = text; },
          () => { /* silent */ }
        );
        if (recognition) {
          recognitionRef.current = recognition;
          try { recognition.start(); } catch { /* noop */ }
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const activeStream = streamRef.current;
        if (activeStream) {
          activeStream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        mediaRecorderRef.current = null;
        chunksRef.current = [];
        setIsRecording(false);

        // Stop browser recognition -- it populates browserTextRef
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch { /* noop */ }
        }

        if (blob.size < 1000 && !browserTextRef.current) {
          setError('Enregistrement trop court. Reessaie en parlant plus longtemps.');
          return;
        }

        setIsTranscribing(true);

        // If using browser-only mode (Whisper previously failed), use browser result directly
        if (useBrowserFallbackRef.current) {
          // Wait a bit for browser recognition to finish
          await new Promise(r => setTimeout(r, 600));
          const text = browserTextRef.current.trim();
          setIsTranscribing(false);
          if (text) {
            setTranscript(text);
            if (onTranscript) onTranscript(text);
          } else {
            setError('Aucune parole detectee. Reessaie en parlant plus fort.');
          }
          return;
        }

        // Try Whisper backend first (higher quality)
        try {
          const result = await api.v2Transcribe(blob, language);
          const text = String(result.text || '').trim();
          setTranscript(text);
          setIsTranscribing(false);
          if (text && onTranscript) {
            onTranscript(text);
          }
        } catch {
          // Whisper unavailable -- fall back to browser result
          useBrowserFallbackRef.current = true;
          await new Promise(r => setTimeout(r, 600));
          const browserText = browserTextRef.current.trim();
          setIsTranscribing(false);
          if (browserText) {
            setTranscript(browserText);
            if (onTranscript) onTranscript(browserText);
          } else if (SpeechRecognition) {
            setError('Transcription serveur indisponible. Reconnaissance navigateur activee, reessaie.');
          } else {
            setError('Transcription indisponible. Configurez GROQ_API_KEY ou OPENAI_API_KEY sur le serveur.');
          }
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (err) {
      cleanup();
      setIsRecording(false);
      if (err.name === 'NotAllowedError') {
        setError('Acces au microphone refuse. Autorise le microphone dans les parametres du navigateur.');
      } else {
        setError(`Erreur microphone: ${err.message}`);
      }
    }
  }, [language, onTranscript, cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      if (recognitionRef.current) {
        setIsTranscribing(true);
        try { recognitionRef.current.stop(); } catch { /* noop */ }
      }
      cleanup();
      setIsRecording(false);
    }
  }, [cleanup]);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
  };
}

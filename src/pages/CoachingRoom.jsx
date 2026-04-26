import { useCallback, useEffect, useRef, useState } from 'react';

import OracleInterface from '../components/OracleInterface';

import { useLocation } from 'react-router-dom';

import ReactMarkdown from 'react-markdown';

import { useAuth } from '../context/AuthContext';

import { api } from '../services/apiClient';

import { createDimensionTracker, DIMENSION_LABELS, DIMENSION_GROUPS } from '../services/ewma';

import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

import { useOracleVoice } from '../hooks/useOracleVoice';

import LiveCoachingRoom from '../components/LiveCoachingRoom';

import './coaching.css';



/* â”€â”€ TTS (Text-to-Speech) helper â”€â”€ */

function speakText(text, lang = 'fr-FR', onEnd) {

  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();



  function doSpeak() {

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = lang;

    utterance.rate = 0.95;

    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();

    const frNative = voices.find(v => v.lang === 'fr-FR')

      || voices.find(v => v.lang.startsWith('fr'));

    if (frNative) utterance.voice = frNative;

    utterance.onend = () => { if (onEnd) onEnd(); };

    utterance.onerror = () => { if (onEnd) onEnd(); };

    window.speechSynthesis.speak(utterance);

  }



  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {

    doSpeak();

  } else {

    window.speechSynthesis.onvoiceschanged = () => doSpeak();

  }

}



export default function CoachingRoom() {

  const { user } = useAuth();

  const routerLocation = useLocation();

  const routeWeakDims = routerLocation.state?.weakDimensions || null;

  const routeAvgMatch = routerLocation.state?.avgMatch || null;

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');

  const [loading, setLoading] = useState(false);

  const [sessionCount, setSessionCount] = useState(0);

  const [intensity, setIntensity] = useState(0);

  const [sessionId, setSessionId] = useState(null);



  // Toggles

  const [micOn, setMicOn] = useState(false);

  const [camOn, setCamOn] = useState(false);



  // Avatar mode: 'off' | 'audio' | 'clip' | 'live'

  const [avatarMode, setAvatarMode] = useState(() => localStorage.getItem('jb_avatar_mode') || 'audio');

  const [avatarUrl, setAvatarUrl] = useState(null);

  const [avatarLoading, setAvatarLoading] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [tavusUrl, setTavusUrl] = useState(null);

  const [tavusConvId, setTavusConvId] = useState(null);

  const [tavusLoading, setTavusLoading] = useState(false);

  const [livekitUrl, setLivekitUrl] = useState(null);

  const [livekitToken, setLivekitToken] = useState(null);

  const [livekitRoom, setLivekitRoom] = useState(null);

  const [didVideoUrl, setDidVideoUrl] = useState(null);

  const [didPolling, setDidPolling] = useState(false);

  const audioRef = useRef(null);



  // Persist avatar mode

  useEffect(() => {

    localStorage.setItem('jb_avatar_mode', avatarMode);

  }, [avatarMode]);



  // Play ElevenLabs audio from base64

  function playAudioBase64(base64, contentType = 'audio/mpeg') {

    if (!base64) return;

    try {

      const binary = atob(base64);

      const bytes = new Uint8Array(binary.length);

      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const blob = new Blob([bytes], { type: contentType });

      const url = URL.createObjectURL(blob);

      if (audioRef.current) {

        audioRef.current.src = url;

        audioRef.current.onplay = () => setIsSpeaking(true);

        audioRef.current.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };

        audioRef.current.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };

        audioRef.current.play().catch(() => setIsSpeaking(false));

      }

    } catch (e) {

      console.warn('[Avatar] Audio playback error:', e);

    }

  }



  // Poll D-ID talk status

  async function pollDIDTalk(talkId, attempts = 0) {

    if (attempts > 30) { setDidPolling(false); return; }

    try {

      const status = await api.v2AvatarTalkStatus(talkId);

      if (status?.status === 'done' && status?.resultUrl) {

        setDidVideoUrl(status.resultUrl);

        setDidPolling(false);

      } else if (status?.status === 'error' || status?.status === 'rejected') {

        setDidPolling(false);

      } else {

        setTimeout(() => pollDIDTalk(talkId, attempts + 1), 2000);

      }

    } catch {

      setDidPolling(false);

    }

  }



  // Start Tavus live session

  async function startTavusSession() {

    if (tavusUrl) return;

    setTavusLoading(true);

    try {

      const userName = user?.name || user?.email || 'l\'utilisateur';

      const res = await api.v2AvatarConversationStart({

        context: `Tu es Jobby, le coach carriere IA de JobBoat. Tu es un mentor visionnaire, expert en negociation, strategie business, pitch, droit du travail et developpement de carriere. Utilisateur: ${userName}. Tu comprends son profil et tu adaptes ton approche. Reponds en francais, sois direct et percutant.`,

        greeting: `Bonjour ! Je suis Jobby, ton coach carriere. Je connais ton profil et je suis pret a travailler avec toi. Par quoi on commence ?`,

        language: 'french',

      });

      if (res?.conversationUrl) {

        setTavusUrl(res.conversationUrl);

        setTavusConvId(res.conversationId);

      }

    } catch (e) {

      console.warn('[Tavus] Session start failed:', e.message);

    } finally {

      setTavusLoading(false);

    }

  }



  // End Tavus live session

  async function endTavusSession() {

    if (tavusConvId) {

      api.v2AvatarConversationEnd({ conversation_id: tavusConvId }).catch(() => {});

    }

    setTavusUrl(null);

    setTavusConvId(null);

    setLivekitUrl(null);

    setLivekitToken(null);

    setLivekitRoom(null);

  }



  // 15D EWMA tracker

  const trackerRef = useRef(createDimensionTracker());

  const [ewmaScores, setEwmaScores] = useState(trackerRef.current.getAll());



  // EWMA panel expanded on mobile

  const [ewmaOpen, setEwmaOpen] = useState(false);



  // activeMode: 'oracle' | 'live'

  const [activeMode, setActiveMode] = useState('oracle');

  const [showTranscript, setShowTranscript] = useState(false);



  // Evaluation feedback

  const [lastEvaluation, setLastEvaluation] = useState(null);

  const [feedbackGiven, setFeedbackGiven] = useState({});



  // Refs

  const chatEndRef = useRef(null);

  const videoRef = useRef(null);

  const sendMessageRef = useRef(null);

  const streamingRef = useRef(false); // guard: prevent concurrent Oracle requests



  // Whisper voice recorder — used in transcript/chat panel only

  const handleVoiceTranscript = useCallback((text) => {

    if (text.trim() && sendMessageRef.current) sendMessageRef.current(text);

  }, []);



  const {

    isRecording,

    isTranscribing,

    error: voiceError,

    startRecording,

    stopRecording

  } = useVoiceRecorder({

    language: 'fr',

    onTranscript: handleVoiceTranscript

  });



  // TTS audio queue for sentence-level playback during streaming

  const ttsQueueRef    = useRef([]);

  const ttsPlayingRef  = useRef(false);

  const oracleVoiceRef = useRef(null); // filled after useOracleVoice declaration



  const drainTTSQueue = useCallback(async () => {

    if (ttsPlayingRef.current || ttsQueueRef.current.length === 0) return;

    ttsPlayingRef.current = true;

    setIsSpeaking(true);

    // Allow SpeechRecognition AudioContext to release before playing audio

    await new Promise(r => setTimeout(r, 150));

    while (ttsQueueRef.current.length > 0) {

      const sentence = ttsQueueRef.current.shift();

      try {

        const r = await api.v2TtsStream({ text: sentence, language: 'fr-FR' });

        if (r?.audio_base64) {

          await new Promise((resolve) => {

            const binary = atob(r.audio_base64);

            const bytes  = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const blob = new Blob([bytes], { type: r.content_type || 'audio/mpeg' });

            const url  = URL.createObjectURL(blob);

            if (audioRef.current) {

              audioRef.current.src = url;

              audioRef.current.onended  = () => { URL.revokeObjectURL(url); resolve(); };

              audioRef.current.onerror  = () => { URL.revokeObjectURL(url); resolve(); };

              audioRef.current.play().catch(resolve);

            } else resolve();

          });

        } else {

          await new Promise((resolve) => speakText(sentence, 'fr-FR', resolve));

        }

      } catch {

        await new Promise((resolve) => speakText(sentence, 'fr-FR', resolve));

      }

    }

    ttsPlayingRef.current = false;

    setIsSpeaking(false);

    // Resume listening after Oracle finishes speaking

    if (activeMode === 'oracle') oracleVoiceRef.current?.start();

  }, [activeMode]);



  function queueTTS(sentence) {

    if (!sentence?.trim()) return;

    ttsQueueRef.current.push(sentence.trim());

    drainTTSQueue();

  }



  // Oracle voice hook — continuous, auto-submits on silence

  const oracleVoice = useOracleVoice({

    language: 'fr-FR',

    silenceMs: 2500,

    onSubmit: useCallback((text) => {

      if (text.trim()) sendMessageRef.current?.(text);

    }, []),

    onInterim: useCallback(() => {}, []),

  });

  oracleVoiceRef.current = oracleVoice;



  // Cleanup ALL media resources on unmount (user navigates away)

  useEffect(() => {

    return () => {

      // Stop oracle voice recognition

      oracleVoiceRef.current?.stop();

      // Stop voice recorder mic

      if (isRecording) try { stopRecording(); } catch { /* noop */ }

      // Cancel all TTS

      ttsQueueRef.current = [];

      ttsPlayingRef.current = false;

      if (window.speechSynthesis) window.speechSynthesis.cancel();

      // Stop audio playback

      if (audioRef.current) {

        audioRef.current.pause();

        audioRef.current.src = '';

      }

      // Stop camera stream

      if (videoRef.current?.srcObject) {

        videoRef.current.srcObject.getTracks().forEach(t => t.stop());

        videoRef.current.srcObject = null;

      }

      // End Tavus live session

      if (tavusConvId) {

        api.v2AvatarConversationEnd({ conversation_id: tavusConvId }).catch(() => {});

      }

    };

  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  // Auto-start oracle voice whenever mode is oracle (mount + after startNewSession)

  useEffect(() => {

    if (activeMode !== 'oracle') return;

    const t = setTimeout(() => oracleVoiceRef.current?.start(), 600);

    return () => clearTimeout(t);

  }, [activeMode]);



  // sendMessageStream — streaming path for Oracle mode

  const sendMessageStream = useCallback(async (text) => {

    if (!text.trim()) return;

    if (streamingRef.current) return; // already processing, drop duplicate

    streamingRef.current = true;

    const userMsg  = { role: 'user', content: text.trim(), ts: Date.now(), id: `u-${Date.now()}` };

    const aiMsgId  = `a-${Date.now()}`;

    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', id: aiMsgId, ts: Date.now(), streaming: true }]);

    setInput('');

    setLoading(true);

    // Pause oracle listening while processing

    oracleVoice.stop();



    try {

      let matchCtx = null;

      try { const raw = localStorage.getItem('jobboat_matching_context'); if (raw) matchCtx = JSON.parse(raw); } catch { /* ignore */ }

      const recentHistory = messages.slice(-8).map(m => ({ role: m.role, content: String(m.content).slice(0, 300) }));



      const httpRes = await api.v2CoachingSessionStream({

        email: user?.email,

        message: text.trim(),

        session_id: sessionId,

        conversation_history: recentHistory,

        ...(matchCtx ? { matching_context: matchCtx } : {}),

      });



      if (!httpRes.ok) throw new Error(`HTTP ${httpRes.status}`);



      const reader  = httpRes.body.getReader();

      const decoder = new TextDecoder();

      let buffer = '', fullText = '', sentenceBuf = '';



      while (true) {

        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {

          if (!line.startsWith('data:')) continue;

          let evt;

          try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }

          if (evt.type === 'token') {

            fullText   += evt.content;

            sentenceBuf += evt.content;

            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullText } : m));

            // Sentence-boundary TTS

            const match = /[.!?][\s\n]/.exec(sentenceBuf);

            if (match && match.index >= 15) {

              const sentence = sentenceBuf.slice(0, match.index + 1);

              sentenceBuf    = sentenceBuf.slice(match.index + 2);

              queueTTS(sentence);

            }

          } else if (evt.type === 'done') {

            if (sentenceBuf.trim()) queueTTS(sentenceBuf.trim());

            setMessages(prev => prev.map(m => m.id === aiMsgId ? {

              ...m, content: evt.response || fullText, streaming: false,

              persona: evt.persona, dimension: evt.dimension,

            } : m));

            if (evt.session_id && !sessionId) setSessionId(evt.session_id);

            setSessionCount(c => c + 1);

          } else if (evt.type === 'error') {

            throw new Error(evt.message);

          }

        }

      }

    } catch (err) {

      setMessages(prev => [...prev.filter(m => m.id !== aiMsgId), { role: 'system', content: `Erreur: ${err.message}`, ts: Date.now(), id: `s-${Date.now()}` }]);

    } finally {

      setLoading(false);

      streamingRef.current = false;

    }

  }, [user, sessionId, messages, oracleVoice]);



  // Auto-scroll

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages]);



  useEffect(() => {

    setIntensity(Math.min(1, messages.length * 0.06));

  }, [messages.length]);



  // Load saved EWMA (try server first, then localStorage)

  useEffect(() => {

    async function loadEwma() {

      try {

        const res = await api.v2CoachingEwma();

        if (res?.success && res.source === 'server' && res.ewma) {

          trackerRef.current.fromJSON(res.ewma);

          setEwmaScores(trackerRef.current.getAll());

          localStorage.setItem('jobboat_ewma', JSON.stringify(res.ewma));

          return;

        }

      } catch { /* server unavailable */ }

      const saved = localStorage.getItem('jobboat_ewma');

      if (saved) {

        try {

          trackerRef.current.fromJSON(JSON.parse(saved));

          setEwmaScores(trackerRef.current.getAll());

        } catch { /* ignore */ }

      }

    }

    loadEwma();

  }, []);



  // Generate AI avatar on mount — ONLY for users who already have avatar mode enabled
  // AND have previously succeeded. New free/beta users don't auto-fire this:
  // it's Pro-gated and would immediately trigger the upgrade modal, causing bounces.
  // They can still enable it manually from the avatar mode toggle.
  useEffect(() => {
    const avatarFailed = localStorage.getItem('jb_avatar_failed');
    const avatarPreviouslySucceeded = localStorage.getItem('jb_avatar_succeeded');
    if (avatarFailed) return;
    if (!avatarPreviouslySucceeded) return; // first-time visitors: skip, let them opt in
    if (avatarMode === 'off') return;
    generateAiAvatar();
  }, []);



  async function generateAiAvatar() {

    setAvatarLoading(true);

    try {

      const res = await api.v2AvatarGenerate({

        text_prompt: 'A professional, friendly AI coaching assistant, warm lighting, office environment, photorealistic portrait, looking at camera, subtle smile',

        model: 'gen3',

        time: 5

      });

      if (res?.payload?.uuid) {

        pollAvatar(res.payload.uuid);

      } else {

        localStorage.setItem('jb_avatar_failed', '1');

        setAvatarLoading(false);

      }

    } catch {

      localStorage.setItem('jb_avatar_failed', '1');

      setAvatarLoading(false);

    }

  }



  async function pollAvatar(uuid, attempts = 0) {

    if (attempts > 20) { setAvatarLoading(false); return; }

    try {

      const status = await api.v2AvatarStatus(uuid);

      if (status?.payload?.status === 'SUCCEEDED' && status?.payload?.output?.[0]) {

        setAvatarUrl(status.payload.output[0]);
        try { localStorage.setItem('jb_avatar_succeeded', '1'); } catch (_e) { /* noop */ }

        setAvatarLoading(false);

      } else if (status?.payload?.status === 'FAILED') {

        setAvatarLoading(false);

      } else {

        setTimeout(() => pollAvatar(uuid, attempts + 1), 3000);

      }

    } catch {

      setAvatarLoading(false);

    }

  }



  function saveEWMA() {

    localStorage.setItem('jobboat_ewma', JSON.stringify(trackerRef.current.toJSON()));

    setEwmaScores(trackerRef.current.getAll());

  }



  const sendMessage = useCallback(async (text) => {

    if (!text.trim()) return;

    const userMsg = { role: 'user', content: text.trim(), ts: Date.now(), id: `u-${Date.now()}` };

    setMessages(prev => [...prev, userMsg]);

    setInput('');

    setLoading(true);



    try {

      let matchCtx = null;

      if (routeWeakDims) {

        matchCtx = { weak_dimensions: routeWeakDims, avg_match: routeAvgMatch, recommendation: 'coaching' };

      } else {

        try {

          const raw = localStorage.getItem('jobboat_matching_context');

          if (raw) matchCtx = JSON.parse(raw);

        } catch { /* ignore */ }

      }



      const recentHistory = messages.slice(-8).map(m => ({

        role: m.role, content: String(m.content).slice(0, 300)

      }));



      const effectiveAvatarMode = activeMode === 'live' ? 'off' : avatarMode;

      const res = await api.v2CoachingSession({

        email: user?.email,

        message: text.trim(),

        mode: 'free_chat',

        targetRole: '',

        session_id: sessionId,

        conversation_history: recentHistory,

        avatar_mode: effectiveAvatarMode,

        ...(matchCtx ? { matching_context: matchCtx } : {}),

      });



      if (res.sessionId && !sessionId) setSessionId(res.sessionId);



      const aiMsg = {

        role: 'assistant',

        content: res.response || 'Session traitee.',

        dimension: res.dimension || 'communication',

        confidence: res.confidence ?? 0.5,

        quality: res.quality ?? 0.5,

        evaluation: res.evaluation || null,

        persona: res.persona || null,

        ts: Date.now(),

        id: `a-${Date.now()}`,

      };



      setMessages(prev => [...prev, aiMsg]);

      setSessionCount(prev => prev + 1);

      if (res.evaluation) setLastEvaluation(res.evaluation);



      // Handle avatar media from response

      if (res.avatar_media) {

        if (res.avatar_media.audio_base64) {

          playAudioBase64(res.avatar_media.audio_base64, res.avatar_media.audio_content_type);

        }

        if (res.avatar_media.talk_id) {

          setDidPolling(true);

          setDidVideoUrl(null);

          pollDIDTalk(res.avatar_media.talk_id);

        }

      }



      // Update EWMA from server response

      if (res.ewma?.scores) {

        trackerRef.current.fromJSON(res.ewma.scores);

        setEwmaScores(trackerRef.current.getAll());

        localStorage.setItem('jobboat_ewma', JSON.stringify(res.ewma.scores));

      } else if (aiMsg.dimension && DIMENSION_LABELS[aiMsg.dimension]) {

        trackerRef.current.update(aiMsg.dimension, aiMsg.confidence, aiMsg.quality);

        saveEWMA();

      }



      const score = Math.round(trackerRef.current.getOverallScore() * 100);

      const history = JSON.parse(localStorage.getItem('jobboat_coaching_history') || '[]');

      history.push({ session: history.length + 1, score });

      localStorage.setItem('jobboat_coaching_history', JSON.stringify(history.slice(-50)));

    } catch (err) {

      setMessages(prev => [...prev, { role: 'system', content: `Erreur: ${err.message}`, ts: Date.now(), id: `s-${Date.now()}` }]);

    } finally {

      setLoading(false);

    }

  }, [user, sessionCount, micOn, camOn, sessionId, messages, activeMode]);



  // Keep ref in sync — Oracle uses sendMessageStream, transcript panel uses sendMessage

  sendMessageRef.current = activeMode === 'oracle' ? sendMessageStream : sendMessage;



  // Feedback on AI message

  async function handleFeedback(msgId, rating) {

    if (feedbackGiven[msgId]) return;

    try {

      await api.v2CoachingFeedback({ message_id: msgId, rating });

      setFeedbackGiven(prev => ({ ...prev, [msgId]: rating }));

    } catch { /* silent */ }

  }



  function startNewSession() {

    // Send coaching session end email (fire-and-forget) if there was an active session

    if (sessionId && messages.length > 0) {

      const lastEval = lastEvaluation || {};

      api.v2CoachingSessionEnd({

        session_id: sessionId,

        mode: activeMode || 'oracle',

        dimension: lastEval.dimension || messages[messages.length - 1]?.dimension || '',

        score: lastEval.dimension_scores ? Object.values(lastEval.dimension_scores)[0] : null,

        durationMinutes: Math.round(messages.length * 0.5),

      }).catch(() => {});

    }



    setSessionId(null);

    setMessages([]);

    setLastEvaluation(null);

    setActiveMode('oracle');

    setShowTranscript(false);

    setFeedbackGiven({});

    setTavusUrl(null);

    setTavusConvId(null);

    window.speechSynthesis?.cancel();

    if (isRecording) stopRecording();

    oracleVoice.stop();

    ttsQueueRef.current = [];

    ttsPlayingRef.current = false;

  }



  // Camera toggle

  async function toggleCamera() {

    if (camOn) {

      if (videoRef.current?.srcObject) {

        videoRef.current.srcObject.getTracks().forEach(t => t.stop());

        videoRef.current.srcObject = null;

      }

      setCamOn(false);

      return;

    }

    try {

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });

      if (videoRef.current) videoRef.current.srcObject = stream;

      setCamOn(true);

    } catch { /* camera error */ }

  }



  // Mic toggle

  function toggleMic() {

    if (isRecording) {

      stopRecording();

      setMicOn(false);

    } else {

      startRecording();

      setMicOn(true);

    }

  }



  function handleKeyDown(e) {

    if (e.key === 'Enter' && !e.shiftKey) {

      e.preventDefault();

      sendMessage(input);

    }

  }



  const overallScore = trackerRef.current.getOverallScore();



  const dynamicStyle = {

    '--coaching-glow-opacity': 0.08 + intensity * 0.18,

    '--coaching-bg-brightness': 1 - intensity * 0.1,

  };



  return (

    <div className="coaching" style={dynamicStyle}>

      {/* Animated background orbs */}

      <div className="coaching__orbs">

        <div className="coaching__orb coaching__orb--1" />

        <div className="coaching__orb coaching__orb--2" />

        <div className="coaching__orb coaching__orb--3" />

      </div>



      {/* ── Oracle mode ── */}

      {activeMode === 'oracle' && !showTranscript && (

        <>

          <OracleInterface

            state={oracleVoice.isListening ? 'listening' : isSpeaking ? 'speaking' : loading ? 'thinking' : 'idle'}

            statusText={

              oracleVoice.isListening ? 'Je vous ecoute...' :

              isSpeaking ? 'En cours de reponse...' :

              loading ? 'Traitement...' : ''

            }

            avatarUrl={avatarMode !== 'off' ? avatarUrl : null}

            avatarLoading={avatarMode !== 'off' && avatarLoading}

            onMicToggle={oracleVoice.toggle}

            onTextSubmit={(text) => sendMessageStream(text)}

            typingPrompt="Votre message, question ou reflexion..."

            title="Oracle"

            subtitle={messages.length > 0 ? `${messages.filter(m => m.role === 'assistant').length} echanges` : 'Parlez pour commencer'}

            onBack={startNewSession}

            extraControls={

              <div style={{ display: 'flex', gap: 8 }}>

                <button className="oracle__ctrl" onClick={() => setShowTranscript(true)} title="Voir la transcription"><ChatIcon /></button>

                <button className="oracle__ctrl" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0 8px' }}

                  onClick={() => setEwmaOpen(o => !o)} title="Score EWMA">

                  {(overallScore * 100).toFixed(0)}

                </button>

                <button className="oracle__ctrl" style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0 8px' }}

                  onClick={() => { oracleVoice.stop(); setActiveMode('live'); startTavusSession(); }}

                  title="Passer en session live">

                  Live

                </button>

              </div>

            }

          />

          {/* Avatar mode toggle */}

          <div style={{ display: 'flex', gap: 6, position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}>

            {[{ id: 'off', label: 'Off' }, { id: 'audio', label: 'Audio' }, { id: 'clip', label: 'Clip' }].map(m => (

              <button key={m.id}

                style={{

                  padding: '5px 12px', borderRadius: 20, fontSize: '0.72rem', cursor: 'pointer',

                  border: avatarMode === m.id ? '1.5px solid var(--jb-accent)' : '1.5px solid rgba(255,255,255,0.12)',

                  background: avatarMode === m.id ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',

                  color: avatarMode === m.id ? 'var(--jb-accent)' : 'var(--jb-text-muted)',

                }}

                onClick={() => setAvatarMode(m.id)}

              >{m.label}</button>

            ))}

          </div>

          {ewmaOpen && (

            <div className="glass-card coaching__ewma-overlay fade-in-up" style={{ position: 'fixed', top: 80, right: 16, width: 260, zIndex: 60, padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>

                <span className="font-display" style={{ fontWeight: 700, fontSize: 'var(--jb-text-sm)' }}>Score: <span className="text-accent">{(overallScore * 100).toFixed(0)}</span></span>

                <button onClick={() => setEwmaOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--jb-text-muted)' }}>x</button>

              </div>

              {Object.entries(ewmaScores).map(([key, data]) => (

                <div key={key} style={{ marginBottom: 8 }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--jb-text-xs)', marginBottom: 3 }}>

                    <span className="text-muted">{DIMENSION_LABELS[key]}</span>

                    <span className="text-accent font-mono">{(data.value * 100).toFixed(0)}</span>

                  </div>

                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>

                    <div style={{ height: '100%', width: `${data.value * 100}%`, background: 'var(--jb-accent)', borderRadius: 2, transition: 'width 0.4s' }} />

                  </div>

                </div>

              ))}

            </div>

          )}

          <audio ref={audioRef} style={{ display: 'none' }} />

          {didVideoUrl && (

            <video src={didVideoUrl} autoPlay playsInline style={{ position: 'fixed', bottom: 80, right: 16, width: 200, borderRadius: 12, zIndex: 55 }} onEnded={() => setDidVideoUrl(null)} />

          )}

        </>

      )}



      {/* Oracle transcript */}

      {activeMode === 'oracle' && showTranscript && (

        <div className="coaching__body fade-in-up" style={{ flexDirection: 'column' }}>

          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>

            <button className="btn btn--ghost btn--sm" onClick={() => setShowTranscript(false)}>Retour Oracle</button>

            <button className="btn btn--ghost btn--sm" onClick={startNewSession}>Nouveau</button>

            <button className={`btn btn--sm ${isRecording ? 'btn--primary' : 'btn--ghost'}`} onClick={toggleMic} disabled={isTranscribing}>

              {isRecording ? 'Arreter micro' : 'Micro'}

            </button>

            <button className="coaching__ewma-toggle" style={{ marginLeft: 'auto' }} onClick={() => setEwmaOpen(o => !o)}>

              <span className="font-mono text-accent" style={{ fontWeight: 700 }}>{(overallScore * 100).toFixed(0)}</span>

              <ChevronIcon open={ewmaOpen} />

            </button>

          </div>

          <div className={`coaching__body ${ewmaOpen ? 'coaching__body--ewma-open' : ''}`} style={{ flex: 1 }}>

            <div className="coaching__chat">

              <div className="coaching__messages glass-card">

                {messages.length === 0 && <div className="coaching__empty"><p className="text-muted" style={{ textAlign: 'center', fontSize: 'var(--jb-text-sm)' }}>Retournez a l Oracle et commencez a parler.</p></div>}

                {messages.map((msg) => (

                  <div key={msg.id ?? msg.ts} className={`coaching__msg coaching__msg--${msg.role}`}>

                    <div className="coaching__msg-header">

                      <span className="coaching__msg-role">{msg.role === 'user' ? (user?.name || 'Vous') : msg.role === 'assistant' ? (msg.persona?.name || 'Jobby') : 'Systeme'}</span>

                      {msg.dimension && <span className="badge badge--accent">{DIMENSION_LABELS[msg.dimension] || msg.dimension}</span>}

                    </div>

                    <div className="coaching__msg-content">{msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <p>{msg.content}</p>}</div>

                    {msg.role === 'assistant' && (

                      <button className={`coaching__tts-btn ${isSpeaking ? 'coaching__tts-btn--active' : ''}`}

                        onClick={async () => {

                          if (isSpeaking && audioRef.current) { audioRef.current.pause(); setIsSpeaking(false); return; }

                          try { const r = await api.v2TtsStream({ text: msg.content, language: 'fr' }); if (r?.audio_base64) playAudioBase64(r.audio_base64, r.content_type); else speakText(msg.content); } catch { speakText(msg.content); }

                        }} title={isSpeaking ? 'Arreter' : 'Ecouter'}>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>

                      </button>

                    )}

                  </div>

                ))}

                {loading && <div className="coaching__msg coaching__msg--assistant"><div className="coaching__msg-content coaching__typing"><span className="coaching__typing-dot"/><span className="coaching__typing-dot"/><span className="coaching__typing-dot"/></div></div>}

                <div ref={chatEndRef} />

              </div>

              <div className="coaching__input-area">

                <textarea className="input coaching__input" rows={1} placeholder="Ecris ton message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} />

                <button className="btn btn--primary coaching__send-btn" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}><SendIcon /></button>

              </div>

            </div>

            <div className={`coaching__ewma ${ewmaOpen ? 'coaching__ewma--open' : ''}`}>

              <div className="glass-card coaching__ewma-card">

                <div className="coaching__ewma-overall"><span className="stat-label">Score Global</span><span className="stat-value text-accent" style={{ fontSize: 'var(--jb-text-3xl)' }}>{(overallScore * 100).toFixed(0)}</span></div>

                <div className="coaching__ewma-dims">

                  {Object.entries(ewmaScores).map(([key, data]) => (

                    <div key={key} className="coaching__ewma-dim">

                      <div className="coaching__ewma-dim-header"><span className="coaching__ewma-dim-label">{DIMENSION_LABELS[key]}</span><span className="coaching__ewma-dim-value">{(data.value * 100).toFixed(0)}</span></div>

                      <div className="coaching__ewma-bar"><div className="coaching__ewma-bar-fill" style={{ width: `${data.value * 100}%` }} /></div>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        </div>

      )}



      {/* Live mode */}

      {activeMode === 'live' && (

        <div className="coaching__live-panel fade-in-up">

          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', alignItems: 'center' }}>

            <button className="btn btn--ghost btn--sm" onClick={async () => { await endTavusSession(); setActiveMode(null); }}>Terminer</button>

            {tavusLoading && <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Connexion en cours...</span>}

          </div>

          {tavusUrl ? (

            <iframe src={tavusUrl} allow="camera; microphone; autoplay; display-capture; fullscreen" allowFullScreen referrerPolicy="no-referrer-when-downgrade" className="coaching__tavus-iframe coaching__tavus-iframe--full" title="Jobby Live Coach" />

          ) : (

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>

              <div className="coaching__avatar-circle" style={{ width: 80, height: 80 }}>

                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>

              </div>

              {tavusLoading

                ? <p className="text-muted">Connexion a la session live...</p>

                : <><p className="text-muted">Session live non disponible.</p><button className="btn btn--primary" onClick={startTavusSession}>Reessayer</button></>

              }

            </div>

          )}

        </div>

      )}



    </div>

  );

}

function MicIcon() {

  return (

    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />

      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />

      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />

    </svg>

  );

}



function ChatIcon() {

  return (

    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />

    </svg>

  );

}



function VideoIcon() {

  return (

    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />

    </svg>

  );

}



function SendIcon() {

  return (

    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />

    </svg>

  );

}



function PlusIcon() {

  return (

    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />

    </svg>

  );

}



function ChevronIcon({ open }) {

  return (

    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"

      style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>

      <polyline points="6 9 12 15 18 9" />

    </svg>

  );

}



function SpeakerIcon() {

  return (

    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />

      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />

    </svg>

  );

}



function FilmIcon() {

  return (

    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />

      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />

      <line x1="2" y1="12" x2="22" y2="12" />

      <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />

      <line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />

    </svg>

  );

}



function LiveIcon() {

  return (

    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />

      <circle cx="12" cy="12" r="3" />

    </svg>

  );

}


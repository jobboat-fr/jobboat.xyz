import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import { DIMENSION_LABELS, DIMENSION_GROUPS } from '../services/ewma';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useOracleVoice } from '../hooks/useOracleVoice';
import OracleInterface from '../components/OracleInterface';
import AIChatbot from '../components/chat/AIChatbot';
import LoadingWithTips from '../components/LoadingWithTips';
import ConversationEngine from '../components/ConversationEngine';
import ScoreAlgorithmPanel from '../components/ScoreAlgorithmPanel';
import './cvbuilder.css';

const DIM_COLORS = {
  technical_competence: 'var(--jb-accent)', cognitive_ability: '#6366f1',
  behavioral_traits: '#8b5cf6', emotional_intelligence: '#ec4899',
  cultural_fit: '#14b8a6', motivation_drive: '#f59e0b',
  potential: '#ef4444', practical_constraints: '#64748b',
  reliability: '#10b981', accountability: '#0ea5e9',
  professional_behavior: '#a855f7', learning_mindset: '#22d3ee',
  team_compatibility: '#e879f9', motivation_stability: '#f97316',
  communication: '#3b82f6',
};

const EMPTY_CV = {
  fullName: '', email: '', phone: '', location: '', title: '', summary: '',
  experiences: [{ company: '', role: '', period: '', description: '' }],
  education: [{ school: '', degree: '', year: '' }],
  skills: '',
  languages: '',
  certifications: '',
};

export default function CvBuilder() {
  const { user } = useAuth();
  const fileRef = useRef(null);

  // Steps: 'choose' -> 'editor' -> 'analysis'
  const [step, setStep] = useState('loading'); // start with loading to check existing CV
  const [cv, setCv] = useState({ ...EMPTY_CV, fullName: user?.name || '', email: user?.email || '' });
  const [dims, setDims] = useState({});
  const [skills, setSkills] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [algoPanel, setAlgoPanel] = useState({ open: false, scores: {}, signals: {}, loading: false });
  const [status, setStatus] = useState('');
  const [existingCvId, setExistingCvId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Check for existing CV on mount
  useEffect(() => {
    if (!user?.email) { setStep('choose'); return; }
    api.v2GetLatestCv(user.email).then(res => {
      if (res?.cv) {
        const parsed = res.cv.parsed || {};
        setDims(parsed.dimensions || {});
        setSkills(parsed.keywords || parsed.skills?.map(s => s.skill_name || s) || []);
        setExistingCvId(res.cv.id);
        // Pre-fill form from existing CV
        setCv(prev => ({
          ...prev,
          title: parsed.target_job_title || prev.title,
          skills: Array.isArray(parsed.keywords) ? parsed.keywords.join(', ') : prev.skills,
        }));
        setStep('editor');
        setStatus('CV existant charge. Vous pouvez le modifier ou en importer un nouveau.');
      } else {
        setStep('choose');
      }
    }).catch(() => setStep('choose'));
  }, [user?.email]);

  // Voice input for form fields
  const [voiceTarget, setVoiceTarget] = useState(null); // which field voice fills
  const handleVoiceTranscript = useCallback((text) => {
    if (!text.trim()) return;
    if (!voiceTarget) return;
    // Handle experience description fields like "exp_desc_0"
    const expMatch = voiceTarget.match(/^exp_desc_(\d+)$/);
    if (expMatch) {
      const idx = Number(expMatch[1]);
      setCv(prev => {
        const exps = [...prev.experiences];
        if (exps[idx]) {
          exps[idx] = { ...exps[idx], description: (exps[idx].description ? exps[idx].description + ' ' : '') + text.trim() };
        }
        return { ...prev, experiences: exps };
      });
    } else {
      setCv(prev => ({ ...prev, [voiceTarget]: (prev[voiceTarget] ? prev[voiceTarget] + ' ' : '') + text.trim() }));
    }
  }, [voiceTarget]);

  const { isRecording, isTranscribing, startRecording, stopRecording, error: voiceError } = useVoiceRecorder({
    language: 'fr',
    onTranscript: handleVoiceTranscript
  });

  function toggleVoice(field) {
    if (isRecording) {
      stopRecording();
      setVoiceTarget(null);
    } else {
      setVoiceTarget(field);
      startRecording();
    }
  }

  // Upload existing CV
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus('');
    try {
      const res = await api.v2UploadCv({ email: user?.email, file });
      const parsed = res?.parsed || res?.insights || res || {};
      // Fill form from parsed data
      setCv(prev => ({
        ...prev,
        fullName: parsed.name || parsed.full_name || prev.fullName,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        location: parsed.location || prev.location,
        title: parsed.target_job_title || parsed.title || prev.title,
        summary: parsed.summary || parsed.objective || prev.summary,
        skills: Array.isArray(parsed.skills) ? parsed.skills.join(', ') : (parsed.skills || prev.skills),
        languages: Array.isArray(parsed.languages) ? parsed.languages.join(', ') : (parsed.languages || prev.languages),
      }));
      // Set dimensions
      const d = parsed.dimensions || {};
      setDims(d);
      setSkills(Array.isArray(parsed.skills || parsed.keywords) ? (parsed.skills || parsed.keywords) : []);
      setStep('editor');
      setStatus('CV importe et analyse. Tu peux modifier chaque section.');
    } catch (err) {
      setStatus('Erreur: ' + err.message);
    } finally {
      setUploading(false);
    }
  }


  // Analyze current CV content
  async function analyzeCv() {
    setSugLoading(true);
    setStatus('');
    setAlgoPanel({ open: true, scores: {}, signals: {}, loading: true });
    try {
      // Send as text to analyze
      const cvText = buildCvText();
      const res = await api.v2UploadCv({ email: user?.email, cvText });
      const parsed = res?.parsed || res?.insights || res || {};
      const d = parsed.dimensions || {};
      setDims(d);
      const extractedSkills = Array.isArray(parsed.skills || parsed.keywords) ? (parsed.skills || parsed.keywords) : [];
      setSkills(extractedSkills);
      setAlgoPanel({ open: true, scores: d, signals: { technical_competence: extractedSkills.slice(0, 6) }, loading: false });
      setStatus('Analyse terminee sur 15 dimensions.');
    } catch (err) {
      setAlgoPanel(p => ({ ...p, loading: false }));
      setStatus('Erreur analyse: ' + err.message);
    } finally {
      setSugLoading(false);
    }
  }

  // Get AI suggestions
  async function getAiSuggestions() {
    setSugLoading(true);
    try {
      const res = await api.v2AiExecute({
        task: 'general',
        prompt: `Tu es un expert RH. Analyse ce profil a travers les 15 dimensions et donne 5 suggestions concretes d'amelioration.\n\nDimensions:\n${JSON.stringify(dims, null, 2)}\n\nCV actuel:\n${buildCvText()}\n\nConcentre-toi sur les dimensions les plus faibles. Reponds en francais.`,
        maxTokens: 800,
        temperature: 0.7
      });
      // suggestions stored in status
      setStatus(res?.text || res?.result?.text || 'Pas de suggestions.');
    } catch {
      setStatus('Erreur lors de la generation.');
    } finally {
      setSugLoading(false);
    }
  }

  function buildCvHtmlLocal() {
    const { fullName = '', email: cvEmail = '', phone = '', location = '', title = '', summary = '',
      experiences = [], education = [], skills = '', languages = '', certifications = '' } = cv;
    const skillList = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const expHtml = experiences.filter(e => e.company || e.role).map(e => `
      <div class="exp">
        <div class="exp-header"><span class="exp-title">${e.role || ''}</span><span class="exp-period">${e.period || ''}</span></div>
        <div class="exp-company">${e.company || ''}</div>
        ${e.description ? `<div class="exp-desc">${e.description.replace(/\n/g, '<br>')}</div>` : ''}
      </div>`).join('');
    const eduHtml = education.filter(e => e.school || e.degree).map(e => `
      <div class="exp">
        <div class="exp-header"><span class="exp-title">${e.degree || ''}</span><span class="exp-period">${e.year || ''}</span></div>
        <div class="exp-company">${e.school || ''}</div>
      </div>`).join('');
    return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"><title>${fullName || 'CV'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;color:#1a202c;font-size:13px;line-height:1.55}
  .page{max-width:794px;margin:32px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);border-radius:4px;overflow:hidden}
  .header{background:linear-gradient(135deg,#1a3a5c 0%,#2d6aa0 100%);color:#fff;padding:36px 40px 28px}
  .header h1{font-size:26px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px}
  .header .subtitle{font-size:14px;opacity:.85;margin-bottom:12px}
  .contact-line{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;opacity:.8}
  .body{display:grid;grid-template-columns:1fr 240px;gap:0}
  .main{padding:28px 32px}
  .sidebar{background:#f7fafc;border-left:1px solid #e2e8f0;padding:24px 20px}
  h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#2d6aa0;margin:0 0 10px;padding-bottom:5px;border-bottom:2px solid #2d6aa0}
  .section{margin-bottom:22px}
  .summary{font-style:italic;color:#4a5568;font-size:12px;line-height:1.6}
  .exp{margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #edf2f7}
  .exp:last-child{border-bottom:none;padding-bottom:0;margin-bottom:0}
  .exp-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1px}
  .exp-title{font-weight:600;font-size:13px;color:#2d3748}
  .exp-period{font-size:11px;color:#718096;white-space:nowrap}
  .exp-company{font-size:12px;color:#4a5568;margin-bottom:3px}
  .exp-desc{font-size:12px;color:#4a5568;line-height:1.5}
  .skills{display:flex;flex-wrap:wrap;gap:4px}
  .skill{background:#e8f0fe;color:#1a3a5c;padding:2px 9px;border-radius:10px;font-size:11px;font-weight:500}
  .lang-item,.cert-item{font-size:12px;color:#4a5568;padding:3px 0;border-bottom:1px dotted #e2e8f0}
  .lang-item:last-child,.cert-item:last-child{border-bottom:none}
  @media print{body{background:#fff}.page{box-shadow:none;margin:0;border-radius:0}}
</style></head><body>
<div class="page">
  <div class="header">
    <h1>${fullName || 'Candidat'}</h1>
    ${title ? `<div class="subtitle">${title}</div>` : ''}
    <div class="contact-line">${[cvEmail && `<span>✉ ${cvEmail}</span>`, phone && `<span>✆ ${phone}</span>`, location && `<span>⊙ ${location}</span>`].filter(Boolean).join('')}</div>
  </div>
  <div class="body">
    <div class="main">
      ${summary ? `<div class="section"><h2>Profil</h2><p class="summary">${summary}</p></div>` : ''}
      ${expHtml ? `<div class="section"><h2>Expérience</h2>${expHtml}</div>` : ''}
      ${eduHtml ? `<div class="section"><h2>Formation</h2>${eduHtml}</div>` : ''}
    </div>
    <div class="sidebar">
      ${skillList.length ? `<div class="section"><h2>Compétences</h2><div class="skills">${skillList.map(s => `<span class="skill">${s}</span>`).join('')}</div></div>` : ''}
      ${languages ? `<div class="section"><h2>Langues</h2>${languages.split(',').map(l => `<div class="lang-item">${l.trim()}</div>`).join('')}</div>` : ''}
      ${certifications ? `<div class="section"><h2>Certifications</h2>${certifications.split(',').map(c => `<div class="cert-item">${c.trim()}</div>`).join('')}</div>` : ''}
    </div>
  </div>
</div></body></html>`;
  }

  function buildCvText() {
    const lines = [];
    lines.push(`Nom: ${cv.fullName}`);
    if (cv.email) lines.push(`Email: ${cv.email}`);
    if (cv.phone) lines.push(`Tel: ${cv.phone}`);
    if (cv.location) lines.push(`Localisation: ${cv.location}`);
    if (cv.title) lines.push(`Poste cible: ${cv.title}`);
    if (cv.summary) lines.push(`Resume: ${cv.summary}`);
    cv.experiences.forEach((exp, i) => {
      if (exp.company || exp.role) lines.push(`Experience ${i + 1}: ${exp.role} chez ${exp.company} (${exp.period}) -- ${exp.description}`);
    });
    cv.education.forEach((edu, i) => {
      if (edu.school) lines.push(`Formation ${i + 1}: ${edu.degree} -- ${edu.school} (${edu.year})`);
    });
    if (cv.skills) lines.push(`Competences: ${cv.skills}`);
    if (cv.languages) lines.push(`Langues: ${cv.languages}`);
    if (cv.certifications) lines.push(`Certifications: ${cv.certifications}`);
    return lines.join('\n');
  }

  function updateField(field, value) {
    setCv(prev => ({ ...prev, [field]: value }));
  }

  function updateExperience(index, field, value) {
    setCv(prev => {
      const exps = [...prev.experiences];
      exps[index] = { ...exps[index], [field]: value };
      return { ...prev, experiences: exps };
    });
  }

  function addExperience() {
    setCv(prev => ({ ...prev, experiences: [...prev.experiences, { company: '', role: '', period: '', description: '' }] }));
  }

  function updateEducation(index, field, value) {
    setCv(prev => {
      const edus = [...prev.education];
      edus[index] = { ...edus[index], [field]: value };
      return { ...prev, education: edus };
    });
  }

  function addEducation() {
    setCv(prev => ({ ...prev, education: [...prev.education, { school: '', degree: '', year: '' }] }));
  }

  function VoiceBtn({ field }) {
    const active = isRecording && voiceTarget === field;
    return (
      <button
        type="button"
        className={`cv-voice-btn ${active ? 'cv-voice-btn--active' : ''}`}
        onClick={() => toggleVoice(field)}
        disabled={isTranscribing}
        title="Dicter par la voix"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        </svg>
      </button>
    );
  }

  // 'chat' = Claude text chat (default). 'oracle' = Claude + voice.
  // The legacy form-fill editor was removed — Claude builds the CV conversationally.
  const [cvMode, setCvMode] = useState('chat');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const cvChatHistoryRef = useRef([]);

  // Auto-initialize chat when user lands on editor step (so Claude greets them immediately)
  useEffect(() => {
    if (step === 'editor' && cvMode === 'chat' && chatMessages.length === 0) {
      const init = {
        role: 'assistant',
        content: 'Bonjour ! Je suis Léo, ton expert CV propulsé par Claude. Pour commencer, dis-moi ton prénom et le poste que tu cibles.',
        id: 'init',
      };
      setChatMessages([init]);
      cvChatHistoryRef.current = [{ role: 'assistant', content: init.content }];
    }
  }, [step, cvMode, chatMessages.length]);

  // ── CV Oracle voice mode ──
  const [cvOracleMessages, setCvOracleMessages] = useState([]);
  const [cvOracleSpeaking, setCvOracleSpeaking] = useState(false);
  const [cvOracleLoading, setCvOracleLoading] = useState(false);
  const cvOracleTtsQueue   = useRef([]);
  const cvOracleTtsPlaying = useRef(false);
  const cvOracleAudioRef   = useRef(null);
  const cvOracleVoiceRef   = useRef(null);
  const cvOracleHistoryRef = useRef([]);
  const cvOracleSendRef    = useRef(null);

  const drainCvTTSQueue = useCallback(async () => {
    if (cvOracleTtsPlaying.current || cvOracleTtsQueue.current.length === 0) return;
    cvOracleTtsPlaying.current = true;
    setCvOracleSpeaking(true);
    await new Promise(r => setTimeout(r, 150));
    while (cvOracleTtsQueue.current.length > 0) {
      const sentence = cvOracleTtsQueue.current.shift();
      try {
        const r = await api.v2TtsStream({ text: sentence, language: 'fr-FR' });
        if (r?.audio_base64) {
          await new Promise((resolve) => {
            const binary = atob(r.audio_base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const blob = new Blob([bytes], { type: r.content_type || 'audio/mpeg' });
            const url = URL.createObjectURL(blob);
            if (cvOracleAudioRef.current) {
              cvOracleAudioRef.current.src = url;
              cvOracleAudioRef.current.onended = () => { URL.revokeObjectURL(url); resolve(); };
              cvOracleAudioRef.current.onerror = () => { URL.revokeObjectURL(url); resolve(); };
              cvOracleAudioRef.current.play().catch(resolve);
            } else resolve();
          });
        } else {
          await new Promise(resolve => {
            if (!window.speechSynthesis) { resolve(); return; }
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(sentence);
            u.lang = 'fr-FR'; u.onend = resolve; u.onerror = resolve;
            window.speechSynthesis.speak(u);
          });
        }
      } catch { /* continue */ }
    }
    cvOracleTtsPlaying.current = false;
    setCvOracleSpeaking(false);
    if (cvMode === 'oracle') cvOracleVoiceRef.current?.start();
  }, [cvMode]);

  const queueCvTTS = useCallback((text) => {
    if (!text?.trim()) return;
    cvOracleTtsQueue.current.push(text);
    drainCvTTSQueue();
  }, [drainCvTTSQueue]);

  const sendCvMessageStream = useCallback(async (text) => {
    if (!text?.trim()) return;
    cvOracleVoiceRef.current?.stop();
    setCvOracleLoading(true);
    const userMsg = { role: 'user', content: text, id: `u-${Date.now()}` };
    const aiMsgId = `a-${Date.now()}`;
    setCvOracleMessages(prev => [...prev, userMsg, { role: 'assistant', content: '', id: aiMsgId, streaming: true }]);
    cvOracleHistoryRef.current = [...cvOracleHistoryRef.current, { role: 'user', content: text }];
    try {
      const httpRes = await api.v2CvChatStream({
        message: text,
        conversation_history: cvOracleHistoryRef.current.slice(-8),
        cv_context: cv,
      });
      if (!httpRes.ok) throw new Error(`HTTP ${httpRes.status}`);
      const reader = httpRes.body.getReader();
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
            fullText += evt.content;
            sentenceBuf += evt.content;
            setCvOracleMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: fullText } : m));
            const match = /[.!?][\s\n]/.exec(sentenceBuf);
            if (match && match.index >= 10) {
              const sentence = sentenceBuf.slice(0, match.index + 1);
              sentenceBuf = sentenceBuf.slice(match.index + 2);
              queueCvTTS(sentence);
            }
          } else if (evt.type === 'done') {
            if (sentenceBuf.trim()) queueCvTTS(sentenceBuf.trim());
            const clean = evt.response || fullText;
            setCvOracleMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: clean, streaming: false } : m));
            cvOracleHistoryRef.current = [...cvOracleHistoryRef.current, { role: 'assistant', content: clean }];
            if (evt.field_updates && typeof evt.field_updates === 'object') {
              setCv(prev => ({ ...prev, ...evt.field_updates }));
            }
          }
        }
      }
    } catch (err) {
      setCvOracleMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: `Erreur: ${err.message}`, streaming: false } : m));
    } finally {
      setCvOracleLoading(false);
    }
  }, [cv, queueCvTTS]);

  cvOracleSendRef.current = sendCvMessageStream;

  const cvOracleVoice = useOracleVoice({
    language: 'fr-FR',
    silenceMs: 2500,
    onSubmit: useCallback((text) => { if (text.trim()) cvOracleSendRef.current?.(text); }, []),
    onInterim: useCallback(() => {}, []),
  });
  cvOracleVoiceRef.current = cvOracleVoice;

  // Cleanup ALL media resources on unmount (user navigates away)
  useEffect(() => {
    return () => {
      // Stop oracle voice recognition
      cvOracleVoiceRef.current?.stop();
      // Stop voice recorder mic
      try { stopRecording(); } catch { /* noop */ }
      // Cancel all TTS
      cvOracleTtsQueue.current = [];
      cvOracleTtsPlaying.current = false;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      // Stop audio playback
      if (cvOracleAudioRef.current) {
        cvOracleAudioRef.current.pause();
        cvOracleAudioRef.current.src = '';
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCvChat(text) {
    const userMsg = { role: 'user', content: text, id: `u-${Date.now()}` };
    setChatMessages(prev => [...prev, userMsg]);
    cvChatHistoryRef.current = [...cvChatHistoryRef.current, { role: 'user', content: text }];
    setChatLoading(true);
    try {
      const res = await api.v2CvChat({
        message: text,
        conversation_history: cvChatHistoryRef.current.slice(-8),
        cv_context: cv
      });
      const aiMsg = { role: 'assistant', content: res.response || '…', id: `a-${Date.now()}` };
      setChatMessages(prev => [...prev, aiMsg]);
      cvChatHistoryRef.current = [...cvChatHistoryRef.current, { role: 'assistant', content: res.response }];
      if (res.field_updates && typeof res.field_updates === 'object') {
        setCv(prev => ({ ...prev, ...res.field_updates }));
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'system', content: `Erreur: ${err.message}`, id: `s-${Date.now()}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  // Enrichment state
  const [enrichData, setEnrichData] = useState(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // Share state
  const [shareUrl, setShareUrl] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  // PDF export
  const [exportLoading, setExportLoading] = useState(false);

  // Preview HTML
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // Build preview HTML locally
  useEffect(() => {
    const html = buildPreviewHtml();
    setPreviewHtml(html);
  }, [cv]);

  function buildPreviewHtml() {
    return buildCvHtmlLocal();
  }

  async function handleEnrich() {
    setEnrichLoading(true);
    setStatus('');
    try {
      const data = await api.v2CvEnrich({
        cvText: buildCvText(),
        cvSkills: cv.skills ? cv.skills.split(',').map(s => s.trim()) : [],
        targetJobTitle: cv.title,
        targetLocation: cv.location,
        experiences: cv.experiences.filter(e => e.description).map(e => e.description),
      });
      setEnrichData(data);
      setStatus('Enrichissement termine. Decouvrez vos insights ci-dessous.');
    } catch (err) {
      setStatus('Erreur enrichissement: ' + err.message);
    }
    setEnrichLoading(false);
  }

  async function handleShare() {
    setShareLoading(true);
    try {
      const data = await api.v2CvGenerateWeb({ cvData: cv });
      if (data.url) setShareUrl(data.url);
      setStatus('Lien de partage genere.');
    } catch (err) {
      setStatus('Erreur partage: ' + err.message);
    }
    setShareLoading(false);
  }

  async function handleExportPdf() {
    setExportLoading(true);
    try {
      let html;
      try {
        const data = await api.v2CvExportPdf({ cvData: cv });
        html = data.html;
      } catch (_e) {
        html = buildCvHtmlLocal();
      }
      if (html) {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(html);
          w.document.close();
          setTimeout(() => w.print(), 600);
        }
      }
      setStatus('PDF pret a imprimer.');
    } catch (err) {
      setStatus('Erreur export: ' + err.message);
    }
    setExportLoading(false);
  }

  return (
    <div className={`cv-builder ${chatOpen ? 'cv-builder--chat-open' : ''}`}>
      {/* ── Embedded chat toggle ── */}
      <button
        className={`cv-chat-toggle ${chatOpen ? 'cv-chat-toggle--active' : ''}`}
        onClick={() => setChatOpen(o => !o)}
        title={chatOpen ? 'Fermer le co-pilote IA' : 'Ouvrir le co-pilote IA'}
      >
        {chatOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        <span className="cv-chat-toggle__label">{chatOpen ? 'Fermer' : 'Co-Pilote IA'}</span>
      </button>

      {/* ── Step: Loading (checking existing CV) ── */}
      {step === 'loading' && (
        <LoadingWithTips
          message="Verification de votre CV..."
          steps={[
            { label: 'Connexion', done: true },
            { label: 'Recherche CV existant', active: true },
            { label: 'Chargement', done: false },
          ]}
        />
      )}

      {/* ── Step: Choose ── */}
      {step === 'choose' && (
        <section className="cv-choose fade-in-up">
          <h2 className="section-title">CV Builder propulsé par Claude</h2>
          <p className="section-subtitle" style={{ marginBottom: 'var(--jb-space-6)' }}>
            Claude construit ton CV avec toi, en chat ou à la voix. Pas de formulaire à remplir. On extrait automatiquement les infos et on optimise pour les 15 dimensions ATS.
          </p>

          <div className="cv-choose__options">
            <div className="glass-card cv-choose__option hover-lift" onClick={() => !uploading && fileRef.current?.click()} style={uploading ? { pointerEvents: 'none', opacity: 0.85 } : {}}>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleUpload} style={{ display: 'none' }} />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="font-display" style={{ fontWeight: 600 }}>Importer mon CV</span>
              <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', textAlign: 'center' }}>Claude l'analyse, extrait les infos, et te propose des améliorations</span>
              {uploading && (
                <div className="cv-upload-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--jb-space-2)', marginTop: 8 }}>
                  <svg className="cv-spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)' }}>Analyse en cours...</span>
                </div>
              )}
            </div>

            <div className="glass-card cv-choose__option hover-lift" onClick={() => { setCvMode('chat'); setStep('editor'); }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-display" style={{ fontWeight: 600 }}>Chat avec Claude</span>
              <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', textAlign: 'center' }}>Claude te pose les bonnes questions, tu tapes tes réponses, il construit ton CV</span>
            </div>

            <div className="glass-card cv-choose__option hover-lift" onClick={() => { setCvMode('oracle'); setStep('editor'); }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              <span className="font-display" style={{ fontWeight: 600 }}>Oracle CV (voix)</span>
              <span className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', textAlign: 'center' }}>Léo te parle, tu réponds à voix haute — ton CV s'écrit tout seul</span>
            </div>
          </div>
        </section>
      )}

      {status && <div className="glass-card cv-status">{status}</div>}
      {voiceError && <div className="glass-card cv-status text-danger">{voiceError}</div>}

      {/* ── Step: Editor ── */}
      {step === 'editor' && (
        <section className="cv-editor fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--jb-space-3)', marginBottom: 'var(--jb-space-4)' }}>
            <h2 className="section-title" style={{ fontSize: 'var(--jb-text-xl)' }}>Editeur de CV</h2>
            <div style={{ display: 'flex', gap: 'var(--jb-space-2)', alignItems: 'center' }}>
              <span className="cv-enrich-badge cv-enrich-badge--free">100% Gratuit</span>
            </div>
          </div>

          {/* Mode toggle — form editor removed. Claude drives the CV. */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              className={cvMode === 'chat' ? 'btn btn--primary btn--sm' : 'btn btn--ghost btn--sm'}
              onClick={() => {
                setCvMode('chat');
                cvOracleVoice.stop();
                if (chatMessages.length === 0) {
                  const init = { role: 'assistant', content: 'Bonjour ! Je suis Léo, ton expert CV propulsé par Claude. Pour commencer, dis-moi ton prénom et le poste que tu cibles.', id: 'init' };
                  setChatMessages([init]);
                  cvChatHistoryRef.current = [{ role: 'assistant', content: init.content }];
                }
              }}
            >
              💬 Chat CV
            </button>
            <button
              className={cvMode === 'oracle' ? 'btn btn--primary btn--sm' : 'btn btn--ghost btn--sm'}
              onClick={() => {
                setCvMode('oracle');
                if (cvOracleMessages.length === 0) {
                  const init = { role: 'assistant', content: 'Bonjour ! Je suis Léo, ton expert CV. Parle-moi du poste que tu cibles pour commencer.', id: 'init' };
                  setCvOracleMessages([init]);
                  cvOracleHistoryRef.current = [{ role: 'assistant', content: init.content }];
                }
                setTimeout(() => cvOracleVoice.start(), 400);
              }}
            >
              🎙 Oracle CV (voix)
            </button>
          </div>

          {/* Action bar — always visible so users can export/enrich whatever Claude built */}
          <div className="cv-action-bar">
            <button className="btn btn--ghost btn--sm" onClick={() => setStep('choose')}>Retour</button>
            <button className="btn btn--secondary btn--sm" onClick={handleEnrich} disabled={enrichLoading}>
              {enrichLoading ? 'Enrichissement...' : 'Enrichir mon CV'}
            </button>
            <button className="btn btn--secondary btn--sm" onClick={analyzeCv} disabled={sugLoading}>
              {sugLoading ? 'Analyse...' : 'Analyser (15D)'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleShare} disabled={shareLoading}>
              {shareLoading ? 'Partage...' : 'Lien web'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleExportPdf} disabled={exportLoading}>
              {exportLoading ? 'Export...' : 'PDF'}
            </button>
          </div>

          {/* Oracle Voice Mode */}
          {cvMode === 'oracle' && (
            <>
              <audio ref={cvOracleAudioRef} style={{ display: 'none' }} />
              <OracleInterface
                state={cvOracleVoice.isListening ? 'listening' : cvOracleSpeaking ? 'speaking' : cvOracleLoading ? 'thinking' : 'idle'}
                statusText={
                  cvOracleVoice.isListening ? 'Léo vous écoute...' :
                  cvOracleSpeaking ? 'Léo répond...' :
                  cvOracleLoading ? 'Analyse en cours...' : ''
                }
                title="Oracle CV — Léo"
                subtitle={cvOracleMessages.length > 1 ? `${cvOracleMessages.filter(m => m.role === 'assistant').length} échanges` : 'Parlez pour construire votre CV'}
                onMicToggle={cvOracleVoice.toggle}
                onTextSubmit={sendCvMessageStream}
                typingPrompt="Décrivez votre expérience, formation, compétences..."
                onBack={() => { cvOracleVoice.stop(); setCvMode('editor'); }}
              >
                {cvOracleMessages.length > 1 && (
                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                    {cvOracleMessages.slice(-6).map(m => (
                      <div key={m.id} style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        background: m.role === 'user' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.06)',
                        borderRadius: 12, padding: '8px 14px', maxWidth: '85%',
                        fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--jb-text)',
                      }}>{m.content}{m.streaming ? ' ▋' : ''}</div>
                    ))}
                  </div>
                )}
              </OracleInterface>
            </>
          )}

          {/* Chat Mode */}
          {cvMode === 'chat' && (
            <div style={{ height: 'calc(100vh - 260px)', minHeight: 420 }}>
              <ConversationEngine
                messages={chatMessages}
                onSend={handleCvChat}
                loading={chatLoading}
                avatarVariant="C"
                avatarName="Assistant CV"
                placeholder="Decris ton experience, formation, competences..."
                chips={chatMessages.length <= 1 ? ['Je veux un CV pour un poste tech', 'Je change de secteur', 'Je n\'ai pas encore de CV'] : []}
                style={{ borderRadius: 'var(--jb-radius-lg)' }}
              />
            </div>
          )}

          {/* Legacy form editor — kept as dead code for rollback. Always false now. */}
          {false && (<>
          <div className="cv-action-bar">
            <button className="btn btn--ghost btn--sm" onClick={() => setStep('choose')}>Retour</button>
            <button className="btn btn--secondary btn--sm" onClick={handleEnrich} disabled={enrichLoading}>
              {enrichLoading ? 'Enrichissement...' : 'Enrichir mon CV'}
            </button>
            <button className="btn btn--secondary btn--sm" onClick={analyzeCv} disabled={sugLoading}>
              {sugLoading ? 'Analyse...' : 'Analyser (15D)'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleShare} disabled={shareLoading}>
              {shareLoading ? 'Partage...' : 'Lien web'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={handleExportPdf} disabled={exportLoading}>
              {exportLoading ? 'Export...' : 'PDF'}
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => setShowPreview(p => !p)}>
              {showPreview ? 'Masquer preview' : 'Voir preview'}
            </button>
          </div>

          {/* Algorithm Score Panel */}
          {algoPanel.open && (
            <div style={{ marginBottom: 'var(--jb-space-4)' }}>
              <ScoreAlgorithmPanel
                scores={algoPanel.scores}
                signals={algoPanel.signals}
                isLoading={algoPanel.loading}
                context="cv"
                onClose={() => setAlgoPanel(p => ({ ...p, open: false }))}
              />
            </div>
          )}

          {/* Share URL */}
          {shareUrl && (
            <div className="glass-card cv-share-url" style={{ marginBottom: 'var(--jb-space-3)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jb-accent-light, #2d6aa0)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <span className="cv-share-url__text">{shareUrl}</span>
              <button className="btn btn--ghost btn--sm" onClick={() => { navigator.clipboard.writeText(shareUrl); setStatus('Lien copie.'); }}>Copier</button>
            </div>
          )}

          {/* Enrichment Results */}
          {enrichData && (
            <div className="glass-card cv-enrich-panel fade-in-up" style={{ marginBottom: 'var(--jb-space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="font-display" style={{ fontSize: 'var(--jb-text-base)', fontWeight: 700 }}>Insights d'enrichissement</h3>
                <span className="cv-enrich-badge cv-enrich-badge--free">Gratuit</span>
              </div>

              <div style={{ display: 'flex', gap: 'var(--jb-space-5)', flexWrap: 'wrap' }}>
                {/* ATS Score */}
                <div className="cv-enrich-score">
                  <span className="cv-enrich-score__number" style={{ color: (enrichData.atsScore || 0) >= 70 ? 'var(--jb-success)' : (enrichData.atsScore || 0) >= 50 ? '#f59e0b' : 'var(--jb-danger)' }}>
                    {enrichData.atsScore || 0}
                  </span>
                  <div>
                    <div className="cv-enrich-score__label">Score ATS</div>
                    <div style={{ fontSize: 10, color: 'var(--jb-text-muted)' }}>sur 100</div>
                  </div>
                </div>

                {/* Market Demand */}
                {enrichData.marketDemand > 0 && (
                  <div className="cv-enrich-score">
                    <span className="cv-enrich-score__number" style={{ color: 'var(--jb-accent-light, #2d6aa0)' }}>
                      {enrichData.marketDemand}
                    </span>
                    <div>
                      <div className="cv-enrich-score__label">Offres trouvees</div>
                      <div style={{ fontSize: 10, color: 'var(--jb-text-muted)' }}>correspondent a ton profil</div>
                    </div>
                  </div>
                )}

                {/* Salary Range */}
                {enrichData.salaryRange && (
                  <div className="cv-enrich-score">
                    <span className="cv-enrich-score__number" style={{ color: 'var(--jb-success)', fontSize: 24 }}>
                      {enrichData.salaryRange.min?.toLocaleString('fr-FR') || '?'} - {enrichData.salaryRange.max?.toLocaleString('fr-FR') || '?'}
                    </span>
                    <div>
                      <div className="cv-enrich-score__label">Fourchette salariale EUR/an</div>
                      <div style={{ fontSize: 10, color: 'var(--jb-text-muted)' }}>basee sur {enrichData.salaryRange.sampleSize} offres</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Missing Skills */}
              {enrichData.missingSkills?.length > 0 && (
                <div>
                  <p className="text-muted" style={{ fontSize: 'var(--jb-text-xs)', marginBottom: 'var(--jb-space-2)' }}>Competences manquantes pour booster ton ATS :</p>
                  <div className="cv-enrich-missing-skills">
                    {enrichData.missingSkills.map((s, i) => (
                      <span key={i} className="cv-enrich-missing-skill">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {enrichData.suggestions?.length > 0 && (
                <div className="cv-enrich-suggestions">
                  {enrichData.suggestions.map((s, i) => (
                    <div key={i} className={`cv-enrich-suggestion cv-enrich-suggestion--${s.priority}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                        {s.priority === 'high'
                          ? <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
                          : <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>}
                      </svg>
                      <span>{s.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="cv-split">
          <div className="cv-split__editor">
          <div className="glass-card cv-form">
            {/* Identity */}
            <div className="cv-form__section">
              <h3 className="cv-form__title">Identite</h3>
              <div className="cv-form__grid">
                <div className="cv-form__field">
                  <label className="label">Nom complet <VoiceBtn field="fullName" /></label>
                  <input className="input" value={cv.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="Jean Dupont" />
                </div>
                <div className="cv-form__field">
                  <label className="label">Email</label>
                  <input className="input" value={cv.email} onChange={e => updateField('email', e.target.value)} placeholder="jean@email.com" />
                </div>
                <div className="cv-form__field">
                  <label className="label">Telephone</label>
                  <input className="input" value={cv.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+33 6..." />
                </div>
                <div className="cv-form__field">
                  <label className="label">Localisation</label>
                  <input className="input" value={cv.location} onChange={e => updateField('location', e.target.value)} placeholder="Paris, France" />
                </div>
              </div>
            </div>

            {/* Target & Summary */}
            <div className="cv-form__section">
              <h3 className="cv-form__title">Profil</h3>
              <div className="cv-form__field">
                <label className="label">Poste cible <VoiceBtn field="title" /></label>
                <input className="input" value={cv.title} onChange={e => updateField('title', e.target.value)} placeholder="Developpeur Full Stack" />
              </div>
              <div className="cv-form__field">
                <label className="label">Resume professionnel <VoiceBtn field="summary" /></label>
                <textarea className="input" rows={3} value={cv.summary} onChange={e => updateField('summary', e.target.value)} placeholder="Decris ton parcours, tes objectifs, ce qui te distingue..." />
                {isRecording && voiceTarget === 'summary' && (
                  <span className="cv-form__voice-hint text-accent">Parle... ta voix est transcrite en temps reel</span>
                )}
              </div>
            </div>

            {/* Experiences */}
            <div className="cv-form__section">
              <h3 className="cv-form__title">Experiences</h3>
              {cv.experiences.some(e => e.company || e.role || e.period || e.description) ? cv.experiences.map((exp, i) => (
                <div key={`${exp.company || ''}-${exp.role || ''}-${exp.period || ''}-${i}`} className="cv-form__card">
                  <div className="cv-form__grid">
                    <div className="cv-form__field">
                      <label className="label">Entreprise</label>
                      <input className="input" value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="Nom de l'entreprise" />
                    </div>
                    <div className="cv-form__field">
                      <label className="label">Poste</label>
                      <input className="input" value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} placeholder="Ton role" />
                    </div>
                    <div className="cv-form__field">
                      <label className="label">Periode</label>
                      <input className="input" value={exp.period} onChange={e => updateExperience(i, 'period', e.target.value)} placeholder="2022 -- 2024" />
                    </div>
                  </div>
                  <div className="cv-form__field">
                    <label className="label">Description <VoiceBtn field={`exp_desc_${i}`} /></label>
                    <textarea className="input" rows={2} value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)} placeholder="Decris tes realisations, responsabilites..." />
                  </div>
                </div>
              )) : (
                <p className="text-muted cv-form__empty" style={{ fontSize: 'var(--jb-text-sm)', padding: 'var(--jb-space-3)', fontStyle: 'italic' }}>
                  Aucune experience ajoutee pour le moment.
                </p>
              )}
              <button className="btn btn--ghost btn--sm" onClick={addExperience} style={{ alignSelf: 'flex-start' }}>+ Ajouter une experience</button>
            </div>

            {/* Education */}
            <div className="cv-form__section">
              <h3 className="cv-form__title">Formation</h3>
              {cv.education.some(e => e.school || e.degree || e.year) ? cv.education.map((edu, i) => (
                <div key={`${edu.school || ''}-${edu.degree || ''}-${edu.year || ''}-${i}`} className="cv-form__card">
                  <div className="cv-form__grid">
                    <div className="cv-form__field">
                      <label className="label">Etablissement</label>
                      <input className="input" value={edu.school} onChange={e => updateEducation(i, 'school', e.target.value)} placeholder="Universite / Ecole" />
                    </div>
                    <div className="cv-form__field">
                      <label className="label">Diplome</label>
                      <input className="input" value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} placeholder="Master, Licence..." />
                    </div>
                    <div className="cv-form__field">
                      <label className="label">Annee</label>
                      <input className="input" value={edu.year} onChange={e => updateEducation(i, 'year', e.target.value)} placeholder="2023" />
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-muted cv-form__empty" style={{ fontSize: 'var(--jb-text-sm)', padding: 'var(--jb-space-3)', fontStyle: 'italic' }}>
                  Aucune formation ajoutee pour le moment.
                </p>
              )}
              <button className="btn btn--ghost btn--sm" onClick={addEducation} style={{ alignSelf: 'flex-start' }}>+ Ajouter une formation</button>
            </div>

            {/* Skills, Languages, Certs */}
            <div className="cv-form__section">
              <h3 className="cv-form__title">Competences & Langues</h3>
              <div className="cv-form__field">
                <label className="label">Competences <VoiceBtn field="skills" /></label>
                <textarea className="input" rows={2} value={cv.skills} onChange={e => updateField('skills', e.target.value)} placeholder="JavaScript, React, Python, Gestion de projet..." />
              </div>
              <div className="cv-form__grid">
                <div className="cv-form__field">
                  <label className="label">Langues</label>
                  <input className="input" value={cv.languages} onChange={e => updateField('languages', e.target.value)} placeholder="Francais (natif), Anglais (C1)" />
                </div>
                <div className="cv-form__field">
                  <label className="label">Certifications</label>
                  <input className="input" value={cv.certifications} onChange={e => updateField('certifications', e.target.value)} placeholder="AWS, PMP, TOEIC..." />
                </div>
              </div>
            </div>
          </div>

          </div>{/* end cv-split__editor */}

          {/* ── Live Preview ── */}
          {showPreview && (
            <div className="cv-split__preview">
              <div className="cv-preview-frame">
                <div className="cv-preview-header">
                  <span className="cv-preview-header__title">Apercu en direct</span>
                  <div className="cv-preview-header__actions">
                    <button className="btn btn--ghost btn--sm" onClick={handleExportPdf} disabled={exportLoading} style={{ fontSize: 11, padding: '2px 8px' }}>
                      PDF
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={handleShare} disabled={shareLoading} style={{ fontSize: 11, padding: '2px 8px' }}>
                      Partager
                    </button>
                  </div>
                </div>
                <iframe
                  srcDoc={previewHtml}
                  title="Apercu CV"
                  style={{ width: '100%', minHeight: 600, border: 'none', background: '#fff' }}
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
          </div>{/* end cv-split */}
          </>)}
        </section>
      )}

      {/* ── Step: Analysis ── */}
      {step === 'analysis' && (
        <section className="cv-analysis fade-in-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--jb-space-3)', marginBottom: 'var(--jb-space-4)' }}>
            <h2 className="section-title" style={{ fontSize: 'var(--jb-text-xl)' }}>Analyse 15 Dimensions</h2>
            <div style={{ display: 'flex', gap: 'var(--jb-space-2)' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => setStep('editor')}>Retour a l'editeur</button>
              <button className="btn btn--primary btn--sm" onClick={getAiSuggestions} disabled={sugLoading}>
                {sugLoading ? 'Analyse...' : 'Suggestions IA'}
              </button>
            </div>
          </div>

          {/* 15D */}
          {Object.entries(DIMENSION_GROUPS).map(([groupKey, group]) => (
            <div key={groupKey} style={{ marginBottom: 'var(--jb-space-5)' }}>
              <h3 className="text-secondary" style={{ fontSize: 'var(--jb-text-sm)', fontWeight: 600, marginBottom: 'var(--jb-space-3)' }}>
                {group.label}
              </h3>
              <div className="cv-dims__grid">
                {group.keys.map((d) => {
                  const val = dims[d] ?? 0;
                  return (
                    <div key={d} className="glass-card cv-dim-card">
                      <div className="cv-dim-card__header">
                        <span className="cv-dim-card__label font-display">{DIMENSION_LABELS[d]}</span>
                      </div>
                      <div className="cv-dim-card__bar">
                        <div className="xp-bar">
                          <div className="xp-bar__fill" style={{ width: `${val}%`, background: DIM_COLORS[d] || 'var(--jb-accent)' }} />
                        </div>
                        <span className="cv-dim-card__value font-mono">{val}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Skills */}
          {skills.length > 0 ? (
            <div className="glass-card" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {skills.map((s, i) => (
                <span key={typeof s === 'string' ? s : (s.skill_name || s.name || s) || `skill-${i}`} className="badge badge--accent">{typeof s === 'string' ? s : s.name || s}</span>
              ))}
            </div>
          ) : (
            <div className="glass-card cv-form__empty" style={{ padding: 'var(--jb-space-4)' }}>
              <p className="text-muted" style={{ fontSize: 'var(--jb-text-sm)', margin: 0, fontStyle: 'italic' }}>
                Aucune competence detectee. Ajoutez-en manuellement ou importez un CV.
              </p>
            </div>
          )}

          {/* AI Suggestions */}
          {aiSuggestion && (
            <div className="glass-card cv-output fade-in-up" style={{ marginTop: 'var(--jb-space-4)' }}>
              <h3 className="font-display" style={{ fontWeight: 600, fontSize: 'var(--jb-text-base)', marginBottom: 'var(--jb-space-3)' }}>Suggestions d'amelioration</h3>
              <pre className="cv-output__text">{aiSuggestion}</pre>
            </div>
          )}
        </section>
      )}

      {/* ── Embedded Chat Panel ── */}
      {chatOpen && (
        <aside className="cv-chat-sidebar fade-in-up">
          <AIChatbot embedded />
        </aside>
      )}
    </div>
  );
}

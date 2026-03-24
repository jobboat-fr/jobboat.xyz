import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/apiClient';
import './document-vault.css';

const DOC_TYPE_CONFIG = {
  cv:            { label: 'CV',             color: '#3b82f6' },
  cover:         { label: 'Lettre',         color: '#8b5cf6' },
  diploma:       { label: 'Diplome',        color: '#10b981' },
  certification: { label: 'Certification',  color: '#f59e0b' },
  reference:     { label: 'Reference',      color: '#ec4899' },
  portfolio:     { label: 'Portfolio',      color: '#06b6d4' },
  other:         { label: 'Autre',          color: '#64748b' },
};


function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentVault({ selectable = false, selectedIds = [], onSelect, compact = false }) {
  const { user } = useAuth();
  const fileRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'other', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);

  useEffect(() => { loadDocs(); }, [user]);

  async function loadDocs() {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await api.v2Documents();
      setDocs(res.documents || []);
    } catch (e) {
      console.error('[DocumentVault] Load error:', e);
    } finally {
      setLoading(false);
    }
  }

  function showToastMsg(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile || !uploadForm.name.trim()) return;
    setUploading(true);
    try {
      const res = await api.v2UploadDocument(selectedFile, uploadForm.name.trim(), uploadForm.type, uploadForm.description);
      if (res.success) {
        showToastMsg('Document ajoute !');
        setShowUpload(false);
        setSelectedFile(null);
        setUploadForm({ name: '', type: 'other', description: '' });
        await loadDocs();
      } else {
        showToastMsg(res.error || 'Erreur upload', 'error');
      }
    } catch (err) {
      showToastMsg(err.message || 'Erreur', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId) {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await api.v2DeleteDocument(docId);
      showToastMsg('Document supprime');
      await loadDocs();
    } catch (e) {
      showToastMsg(e.message, 'error');
    }
  }

  async function handleDownload(docId) {
    try {
      const res = await api.v2Document(docId);
      if (res.download_url) window.open(res.download_url, '_blank');
      else showToastMsg('Lien non disponible', 'error');
    } catch (e) {
      showToastMsg(e.message, 'error');
    }
  }

  async function handleSaveEdit() {
    if (!editingDoc) return;
    try {
      await api.v2UpdateDocument(editingDoc.id, {
        name: editingDoc.name,
        type: editingDoc.type,
        description: editingDoc.description,
      });
      showToastMsg('Document mis a jour');
      setEditingDoc(null);
      await loadDocs();
    } catch (e) {
      showToastMsg(e.message, 'error');
    }
  }

  function handleToggleSelect(docId) {
    if (!onSelect) return;
    const next = selectedIds.includes(docId)
      ? selectedIds.filter(id => id !== docId)
      : [...selectedIds, docId];
    onSelect(next);
  }

  function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!uploadForm.name.trim()) {
      setUploadForm(prev => ({ ...prev, name: file.name.replace(/\.[^.]+$/, '') }));
    }
  }

  const filtered = filterType === 'all' ? docs : docs.filter(d => d.type === filterType);
  const typeCounts = {};
  for (const d of docs) typeCounts[d.type] = (typeCounts[d.type] || 0) + 1;

  return (
    <div className={`dv ${compact ? 'dv--compact' : ''}`}>
      {toast && <div className={`dv-toast dv-toast--${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      {!compact && (
        <div className="dv-header">
          <div>
            <h2 className="dv-title">Mes Documents</h2>
            <p className="dv-subtitle">{docs.length} document{docs.length !== 1 ? 's' : ''} dans ton coffre</p>
          </div>
          <button className="mc-btn mc-btn--primary" onClick={() => setShowUpload(true)}>+ Ajouter</button>
        </div>
      )}
      {compact && (
        <div className="dv-header dv-header--compact">
          <span className="dv-title dv-title--compact">Documents ({docs.length})</span>
          <button className="mc-btn mc-btn--sm mc-btn--primary" onClick={() => setShowUpload(true)}>+ Ajouter</button>
        </div>
      )}

      {/* Type filter pills */}
      <div className="dv-filters">
        <button className={`dv-pill ${filterType === 'all' ? 'dv-pill--active' : ''}`} onClick={() => setFilterType('all')}>
          Tous ({docs.length})
        </button>
        {Object.entries(DOC_TYPE_CONFIG).map(([key, cfg]) => (
          typeCounts[key] ? (
            <button key={key} className={`dv-pill ${filterType === key ? 'dv-pill--active' : ''}`} onClick={() => setFilterType(key)}>
              {cfg.label} ({typeCounts[key]})
            </button>
          ) : null
        ))}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="dv-modal-overlay" onClick={() => setShowUpload(false)}>
          <form className="dv-modal" onClick={e => e.stopPropagation()} onSubmit={handleUpload}>
            <h3 className="dv-modal__title">Ajouter un document</h3>

            <div className="dv-dropzone" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt" onChange={onFileChange} />
              {selectedFile ? (
                <div className="dv-dropzone__file">
                  <span>{selectedFile.type?.split('/').pop()?.toUpperCase() || 'DOC'}</span>
                  <span>{selectedFile.name}</span>
                  <span className="dv-dropzone__size">{formatSize(selectedFile.size)}</span>
                </div>
              ) : (
                <div className="dv-dropzone__placeholder">
                  <span className="dv-dropzone__label">+</span>
                  <span>Cliquer pour choisir un fichier</span>
                  <span className="dv-dropzone__hint">PDF, Word, Images (max 10 MB)</span>
                </div>
              )}
            </div>

            <label className="dv-label">Nom du document</label>
            <input
              className="dv-input"
              value={uploadForm.name}
              onChange={e => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Mon CV Tech 2025"
              required
            />

            <label className="dv-label">Type</label>
            <select
              className="dv-input"
              value={uploadForm.type}
              onChange={e => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
            >
              {Object.entries(DOC_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>

            <label className="dv-label">Description (optionnel)</label>
            <textarea
              className="dv-input dv-textarea"
              value={uploadForm.description}
              onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Version adaptee pour les postes en startup..."
              rows={2}
            />

            <div className="dv-modal__btns">
              <button type="button" className="mc-btn" onClick={() => setShowUpload(false)}>Annuler</button>
              <button type="submit" className="mc-btn mc-btn--primary" disabled={uploading || !selectedFile}>
                {uploading ? 'Upload...' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit modal */}
      {editingDoc && (
        <div className="dv-modal-overlay" onClick={() => setEditingDoc(null)}>
          <div className="dv-modal" onClick={e => e.stopPropagation()}>
            <h3 className="dv-modal__title">Modifier le document</h3>
            <label className="dv-label">Nom</label>
            <input className="dv-input" value={editingDoc.name} onChange={e => setEditingDoc(prev => ({ ...prev, name: e.target.value }))} />
            <label className="dv-label">Type</label>
            <select className="dv-input" value={editingDoc.type} onChange={e => setEditingDoc(prev => ({ ...prev, type: e.target.value }))}>
              {Object.entries(DOC_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.label}</option>
              ))}
            </select>
            <label className="dv-label">Description</label>
            <textarea className="dv-input dv-textarea" value={editingDoc.description || ''} onChange={e => setEditingDoc(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            <div className="dv-modal__btns">
              <button className="mc-btn" onClick={() => setEditingDoc(null)}>Annuler</button>
              <button className="mc-btn mc-btn--primary" onClick={handleSaveEdit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Document list */}
      {loading ? (
        <div className="dv-loading">Chargement des documents...</div>
      ) : filtered.length === 0 ? (
        <div className="dv-empty">
          <div className="dv-empty__icon">--</div>
          <h3>Aucun document</h3>
          <p>Ajoute des CV, lettres de motivation, diplomes et certifications</p>
          <button className="mc-btn mc-btn--primary" onClick={() => setShowUpload(true)} style={{ marginTop: 12 }}>+ Ajouter un document</button>
        </div>
      ) : (
        <div className="dv-grid">
          {filtered.map(doc => {
            const cfg = DOC_TYPE_CONFIG[doc.type] || DOC_TYPE_CONFIG.other;
            const isSelected = selectable && selectedIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                className={`dv-doc ${isSelected ? 'dv-doc--selected' : ''} ${selectable ? 'dv-doc--selectable' : ''}`}
                onClick={selectable ? () => handleToggleSelect(doc.id) : undefined}
              >
                {selectable && (
                  <div className={`dv-doc__check ${isSelected ? 'dv-doc__check--on' : ''}`}>
                    {isSelected ? '✓' : ''}
                  </div>
                )}
                <div className="dv-doc__icon" style={{ '--doc-color': cfg.color }}>{cfg.label.charAt(0)}</div>
                <div className="dv-doc__info">
                  <div className="dv-doc__name">{doc.name}</div>
                  <div className="dv-doc__meta">
                    <span className="dv-doc__type" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {doc.description && <div className="dv-doc__desc">{doc.description}</div>}
                </div>
                {!selectable && (
                  <div className="dv-doc__actions" onClick={e => e.stopPropagation()}>
                    <button className="dv-action" title="Telecharger" onClick={() => handleDownload(doc.id)}>DL</button>
                    <button className="dv-action" title="Modifier" onClick={() => setEditingDoc({ ...doc })}>Edit</button>
                    <button className="dv-action dv-action--danger" title="Supprimer" onClick={() => handleDelete(doc.id)}>Suppr</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

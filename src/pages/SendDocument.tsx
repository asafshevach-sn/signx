import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, ChevronRight, ChevronLeft, Users,
  Plus, Trash2, Sparkles, Send, CheckCircle2, ArrowRight,
  Wand2, AlertCircle, GripVertical, Mail, UserCircle,
  Eye, PenLine, ThumbsUp
} from 'lucide-react'
import { uploadDocument } from '../api/documents'
import { createEmbeddedEditor } from '../api/embed'
import { sendInvite, type Recipient } from '../api/invites'
import { detectFields, generateSmartSubject } from '../api/ai'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../contexts/AuthContext'
import { claimDoc } from '../hooks/useUserDocs'
import { awardPoints } from '../hooks/useAchievements'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Upload', icon: <Upload size={16} /> },
  { id: 2, label: 'Add Fields', icon: <PenLine size={16} /> },
  { id: 3, label: 'Recipients', icon: <Users size={16} /> },
  { id: 4, label: 'Send', icon: <Send size={16} /> },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            current === step.id
              ? 'text-white'
              : current > step.id
              ? 'text-emerald-400'
              : 'text-slate-500'
          }`}
          style={current === step.id ? {
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)'
          } : {}}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              current > step.id ? 'bg-emerald-500/20 text-emerald-400' :
              current === step.id ? 'bg-brand-600 text-white' :
              'bg-white/8 text-slate-500'
            }`}>
              {current > step.id ? <CheckCircle2 size={14} /> : step.id}
            </div>
            {step.label}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px mx-1 transition-all ${current > step.id ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────
function UploadStep({ onUploaded }: { onUploaded: (doc: any) => void }) {
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { user } = useAuth()

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setUploading(true)
    try {
      const result = await uploadDocument(f)
      // Claim this document for the current user
      if (user?.sub && result.id) {
        claimDoc(user.sub, result.id)
        awardPoints(user.sub, 5, 'upload')
      }
      toast.success('Document uploaded!')
      onUploaded({ ...result, _fileName: f.name })
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Upload failed')
      setFile(null)
    } finally {
      setUploading(false)
    }
  }, [onUploaded, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Upload your document</h2>
      <p className="text-slate-400 mb-8">Upload a PDF to prepare it for signing</p>

      <div {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
          isDragActive
            ? 'border-brand-500 bg-brand-500/8'
            : 'border-white/15 hover:border-brand-500/50 hover:bg-white/3'
        }`}>
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
              <Spinner size={40} />
              <div className="text-white font-medium">Uploading {file?.name}...</div>
            </motion.div>
          ) : isDragActive ? (
            <motion.div key="drag" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.2)' }}>
                <Upload size={28} className="text-brand-400" />
              </div>
              <div className="text-brand-300 font-semibold text-lg">Drop it here!</div>
            </motion.div>
          ) : (
            <motion.div key="idle" className="flex flex-col items-center gap-4">
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--bg-skeleton-a)' }}>
                <Upload size={28} className="text-slate-400" />
              </motion.div>
              <div>
                <div className="text-white font-semibold text-lg mb-1">Drop your PDF here</div>
                <div className="text-slate-500 text-sm">or <span className="text-brand-400">browse</span> to upload</div>
              </div>
              <div className="text-xs text-slate-600">PDF files up to 50MB</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Step 2: Add Fields (Embedded Editor + AI) ───────────────────────────────
function FieldsStep({ document, onNext, onBack }: { document: any; onNext: (fields: any[]) => void; onBack: () => void }) {
  const [editorUrl, setEditorUrl] = useState<string | null>(null)
  const [directUrl, setDirectUrl] = useState<string | null>(null)  // fallback: open in SignNow tab
  const [loadingEditor, setLoadingEditor] = useState(false)
  const [aiFields, setAiFields] = useState<any[]>([])
  const [detecting, setDetecting] = useState(false)
  const [editorDone, setEditorDone] = useState(false)

  // Auto-detect fields on mount
  useState(() => { runDetect() })

  async function runDetect() {
    setDetecting(true)
    try {
      const result = await detectFields({
        documentName: document._fileName || document.name || 'Document',
        documentType: 'Agreement',
      })
      setAiFields(result.fields || [])
    } catch {}
    finally { setDetecting(false) }
  }

  async function openEditor() {
    setLoadingEditor(true)
    try {
      const result = await createEmbeddedEditor(document.id, { linkExpiration: 90 })
      if (result.url) {
        setEditorUrl(result.url)
      } else if ((result as any).directUrl) {
        // Embedded editor not available on this plan — use direct link
        setDirectUrl((result as any).directUrl)
      }
    } catch (e: any) {
      const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Could not open editor'
      console.error('[editor error]', e.response?.status, e.response?.data)
      toast.error(msg, { duration: 6000 })
    } finally {
      setLoadingEditor(false)
    }
  }

  const FIELD_ICONS: Record<string, string> = {
    signature: '✍️', initials: '🔤', date: '📅',
    text: '📝', checkbox: '☑️',
  }

  // Listen for SignNow postMessage events — fires when user clicks "Save and Close"
  useEffect(() => {
    if (!editorUrl) return
    function handleMessage(e: MessageEvent) {
      // SignNow sends messages from app.signnow.com or signnow.com
      if (!e.origin.includes('signnow.com')) return
      const data = e.data
      // Various event shapes SignNow may send on save/close
      const isSaveClose =
        data?.event === 'save_and_close' ||
        data?.type === 'save_and_close' ||
        data?.action === 'close' ||
        data?.event === 'document.saved' ||
        data?.type === 'document:saved' ||
        data?.type === 'close'
      if (isSaveClose) {
        setEditorDone(true)
        setEditorUrl(null)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [editorUrl])

  // Full-screen embedded editor overlay
  if (editorUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: 'var(--bg-page, #020617)' }}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-elevated)' }}>
          <div>
            <h2 className="text-sm font-semibold text-white">Add fields to your document</h2>
            <p className="text-xs text-slate-400">
              When done, click <strong className="text-white">"Save and Close"</strong> in the editor — it will advance automatically.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditorUrl(null)} className="btn-secondary flex items-center gap-2 text-sm">
              <ChevronLeft size={14} /> Back
            </button>
            <button onClick={() => { setEditorDone(true); setEditorUrl(null) }} className="btn-primary flex items-center gap-2 text-sm">
              <CheckCircle2 size={14} /> Done Adding Fields
            </button>
          </div>
        </div>
        {/* Full-height iframe */}
        <div className="flex-1 min-h-0">
          <iframe src={editorUrl} className="w-full h-full border-0" title="SignNow Document Editor" allow="clipboard-write" />
        </div>
      </motion.div>
    )
  }

  // Determine the editor CTA card
  const renderEditorCard = () => {
    if (editorDone) {
      return (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 rounded-2xl gap-4 card"
          style={{ borderColor: 'rgba(16,185,129,0.25)', background: 'rgba(16,185,129,0.04)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <div className="text-center">
            <div className="text-white font-semibold text-lg">Fields configured!</div>
            <div className="text-sm text-slate-400 mt-1">Your document is ready to send for signing</div>
          </div>
          <button onClick={openEditor} disabled={loadingEditor}
            className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
            <PenLine size={14} /> {loadingEditor ? 'Opening...' : 'Edit fields again'}
          </button>
        </motion.div>
      )
    }

    if (directUrl) {
      // Fallback: embedded editor not available — link to SignNow app
      return (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl gap-5 card"
          style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
            <PenLine size={28} className="text-brand-400" />
          </div>
          <div className="text-center px-4">
            <div className="text-white font-semibold text-lg mb-2">Add fields in SignNow</div>
            <div className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Your document has been uploaded. Open it in SignNow to drag & drop signature, date and text fields.
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 w-full px-6">
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2 px-6 w-full text-center"
              onClick={() => { /* mark as done after opening */ setTimeout(() => setEditorDone(true), 3000) }}
            >
              <PenLine size={15} />
              Open in SignNow ↗
            </a>
            <p className="text-xs text-slate-500 text-center">
              After adding fields in SignNow, come back here and click Continue.
            </p>
            <button onClick={() => setEditorDone(true)}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5">
              <CheckCircle2 size={14} /> I've added the fields, continue
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-2xl gap-5 card"
        style={{ borderColor: 'rgba(99,102,241,0.2)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)' }}>
          <PenLine size={28} className="text-brand-400" />
        </div>
        <div className="text-center">
          <div className="text-white font-semibold text-lg mb-1">Open the Document Editor</div>
          <div className="text-sm text-slate-400 max-w-xs leading-relaxed">
            Visually drag & drop signature, date, and text fields onto your PDF. Changes are saved automatically in SignNow.
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <button onClick={openEditor} disabled={loadingEditor} className="btn-primary flex items-center gap-2 px-6">
            {loadingEditor ? <Spinner size={15} /> : <PenLine size={15} />}
            {loadingEditor ? 'Opening Editor...' : 'Open Editor'}
          </button>
          <button onClick={() => onNext(aiFields)} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            Skip — send without adding fields
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-display font-bold text-white mb-1">Add signature fields</h2>
      <p className="text-slate-400 mb-8">
        Open the visual editor to place fields on your PDF. AI has pre-analysed the document to guide you.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: editor CTA */}
        <div className="lg:col-span-3">
          {renderEditorCard()}
        </div>

        {/* Right: AI suggestions panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card" style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-violet-400" />
                <span className="text-sm font-semibold text-white">AI Field Suggestions</span>
              </div>
              {detecting && <Spinner size={12} />}
            </div>
            {detecting ? (
              <div className="text-xs text-slate-500 py-4 text-center animate-pulse">Analysing your document...</div>
            ) : aiFields.length > 0 ? (
              <>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                  Use these as a guide when placing fields in the editor:
                </p>
                <div className="space-y-1.5">
                  {aiFields.slice(0, 7).map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg"
                      style={{ background: 'var(--bg-skeleton-a)' }}>
                      <span className="text-sm w-5 text-center">{FIELD_ICONS[f.type] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{f.label}</div>
                        <div className="text-[10px] text-slate-500">Page {f.page}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        f.importance === 'required' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>{f.importance}</span>
                    </div>
                  ))}
                  {aiFields.length > 7 && <div className="text-xs text-slate-500 text-center pt-1">+{aiFields.length - 7} more</div>}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                AI detection unavailable.
                <button onClick={runDetect} className="text-violet-400 hover:text-violet-300 ml-1 underline">Retry</button>
              </div>
            )}
          </div>

          <div className="card p-4" style={{ borderColor: 'rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.04)' }}>
            <div className="flex items-start gap-2.5">
              <AlertCircle size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="text-white font-medium">Want to sign it yourself?</span> Add your own email as a recipient in the next step and set the action to <em>Sign</em>.
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <FileText size={16} className="text-brand-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-white truncate">{document._fileName || 'Document'}</div>
                <div className="text-[11px] text-slate-500">Uploaded & ready</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={15} /> Back
        </button>
        <button onClick={() => onNext(aiFields)} className="btn-primary flex items-center gap-2 ml-auto">
          Continue to Recipients <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Step 3: Recipients ───────────────────────────────────────────────────────
interface RecipientRow extends Recipient {
  id: string
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  sign:    <PenLine size={14} />,
  view:    <Eye size={14} />,
  approve: <ThumbsUp size={14} />,
}

function RecipientsStep({ document, recipients, setRecipients, onNext, onBack }: {
  document: any
  recipients: RecipientRow[]
  setRecipients: (r: RecipientRow[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [generatingSubject, setGeneratingSubject] = useState<string | null>(null)

  function addRecipient() {
    const order = recipients.length + 1
    setRecipients([...recipients, {
      id: Math.random().toString(36).slice(2),
      email: '',
      role: `Recipient ${order}`,
      order,
      action: 'sign',
      subject: '',
      message: '',
    }])
  }

  function removeRecipient(id: string) {
    const updated = recipients.filter(r => r.id !== id).map((r, i) => ({ ...r, order: i + 1 }))
    setRecipients(updated)
  }

  function updateRecipient(id: string, patch: Partial<RecipientRow>) {
    setRecipients(recipients.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  async function smartSubject(r: RecipientRow) {
    setGeneratingSubject(r.id)
    try {
      const result = await generateSmartSubject({
        documentName: document._fileName || document.name || 'Document',
        recipientName: r.email.split('@')[0],
      })
      updateRecipient(r.id, { subject: result.subject })
    } catch {}
    finally { setGeneratingSubject(null) }
  }

  const canProceed = recipients.length > 0 && recipients.every(r => r.email.includes('@') && r.role)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Add recipients</h2>
      <p className="text-slate-400 mb-8">Define who needs to sign and in what order</p>

      <div className="space-y-3 mb-4">
        <AnimatePresence>
          {recipients.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              className="card p-4"
              style={{ borderColor: 'rgba(99,102,241,0.15)' }}
            >
              {/* Order + drag handle */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.25)' }}>
                  {r.order}
                </div>
                <span className="text-sm font-medium text-slate-300">Recipient {r.order}</span>
                <div className="flex items-center gap-1 ml-auto">
                  {(['sign', 'view', 'approve'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => updateRecipient(r.id, { action: a })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        r.action === a ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                      }`}
                      style={r.action === a ? { background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' } : {}}
                    >
                      {ACTION_ICONS[a]}
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  ))}
                  <button onClick={() => removeRecipient(r.id)} className="ml-2 p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Email address *</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      className="input pl-9 text-sm"
                      type="email"
                      placeholder="signer@example.com"
                      value={r.email}
                      onChange={e => updateRecipient(r.id, { email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Role name *</label>
                  <div className="relative">
                    <UserCircle size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      className="input pl-9 text-sm"
                      placeholder="e.g. Recipient 1"
                      value={r.role}
                      onChange={e => updateRecipient(r.id, { role: e.target.value })}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1.5">Email subject</label>
                  <div className="relative">
                    <input
                      className="input pr-24 text-sm"
                      placeholder="Please sign this document"
                      value={r.subject || ''}
                      onChange={e => updateRecipient(r.id, { subject: e.target.value })}
                    />
                    <button
                      onClick={() => smartSubject(r)}
                      disabled={!r.email || generatingSubject === r.id}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
                      style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd' }}
                    >
                      {generatingSubject === r.id ? <Spinner size={11} /> : <Sparkles size={11} />}
                      AI Write
                    </button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1.5">Personal message (optional)</label>
                  <textarea
                    className="input text-sm resize-none"
                    rows={2}
                    placeholder="Add a personal note..."
                    value={r.message || ''}
                    onChange={e => updateRecipient(r.id, { message: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button
        onClick={addRecipient}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-all hover:bg-white/5"
        style={{ border: '1.5px dashed var(--border-medium)' }}
      >
        <Plus size={16} />
        Add Recipient
      </button>

      {recipients.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-2 p-3 rounded-xl text-xs text-slate-400"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <GripVertical size={14} className="text-brand-400" />
          Recipients will be invited in order. Each recipient must complete their action before the next is notified.
        </motion.div>
      )}

      <div className="flex gap-3 mt-8">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={15} /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary flex items-center gap-2 ml-auto disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Review & Send <ChevronRight size={15} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Step 4: Send ─────────────────────────────────────────────────────────────
function SendStep({ document, recipients, onBack }: {
  document: any
  recipients: RecipientRow[]
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    setSending(true)
    try {
      await sendInvite(document.id, recipients)
      if (user?.sub) awardPoints(user.sub, 10, 'send')
      setSent(true)
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'],
      })
      toast.success('Document sent for signing! 🎉')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to send. Check roles match document fields.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}
        >
          <CheckCircle2 size={36} className="text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-display font-bold text-white mb-2">Document sent! 🎉</h2>
        <p className="text-slate-400 mb-8">
          Signing invites have been sent to {recipients.length} recipient{recipients.length > 1 ? 's' : ''}.
          <br />You'll be notified when they complete their action.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/documents')}
            className="btn-primary flex items-center gap-2"
          >
            View Documents <ArrowRight size={15} />
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-display font-bold text-white mb-2">Review & Send</h2>
      <p className="text-slate-400 mb-8">Everything looks good? Send it off for signing.</p>

      {/* Summary */}
      <div className="space-y-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">Document</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              <FileText size={18} className="text-brand-400" />
            </div>
            <div>
              <div className="text-sm text-white font-medium">{document._fileName || document.name || 'Document'}</div>
              <div className="text-xs text-slate-500">ID: {document.id?.slice(0, 12)}...</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={15} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">Recipients ({recipients.length})</span>
          </div>
          <div className="space-y-2">
            {recipients.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-t border-white/5 first:border-0">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white">{r.email}</div>
                  <div className="text-xs text-slate-500">{r.role} · {r.action}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {ACTION_ICONS[r.action || 'sign']}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl flex items-start gap-3"
          style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
          <AlertCircle size={15} className="text-cyan-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            Recipients will receive email invites in the order listed. Make sure their roles match the fields in the document.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ChevronLeft size={15} /> Back
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={sending}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-base"
        >
          {sending ? <Spinner size={18} /> : <Send size={18} />}
          {sending ? 'Sending...' : 'Send for Signing'}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function SendDocument() {
  const [step, setStep] = useState(1)
  const [uploadedDoc, setUploadedDoc] = useState<any>(null)
  const [docFields, setDocFields] = useState<any[]>([])
  const [recipients, setRecipients] = useState<RecipientRow[]>([])

  function handleUploaded(doc: any) {
    setUploadedDoc(doc)
    setStep(2)
  }

  function handleFieldsDone(fields: any[]) {
    setDocFields(fields)
    setStep(3)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <StepBar current={step} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <UploadStep onUploaded={handleUploaded} />
          </motion.div>
        )}
        {step === 2 && uploadedDoc && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <FieldsStep
              document={uploadedDoc}
              onNext={handleFieldsDone}
              onBack={() => setStep(1)}
            />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <RecipientsStep
              document={uploadedDoc}
              recipients={recipients}
              setRecipients={setRecipients}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <SendStep
              document={uploadedDoc}
              recipients={recipients}
              onBack={() => setStep(3)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

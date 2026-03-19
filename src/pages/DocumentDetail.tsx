import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, FileText, Download, Send, Clock, CheckCircle2,
  AlertCircle, Users, ExternalLink, Sparkles, Wand2,
  Copy, RefreshCw, XCircle, Eye, PenLine, ThumbsUp,
  Calendar, ChevronRight, Shield
} from 'lucide-react'
import { getDocument, getDocumentDownload } from '../api/documents'
import { createEmbeddedSending } from '../api/embed'
import { cancelInvite } from '../api/invites'
import { summarizeDocument } from '../api/ai'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { Modal } from '../components/ui/Modal'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const ACTION_ICON: Record<string, React.ReactNode> = {
  sign: <PenLine size={13} />,
  view: <Eye size={13} />,
  approve: <ThumbsUp size={13} />,
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  fulfilled: { label: 'Signed',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  completed: { label: 'Signed',   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  pending:   { label: 'Pending',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  expired:   { label: 'Expired',  color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  cancelled: { label: 'Cancelled',color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  created:   { label: 'Invited',  color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
}

function SignerTimeline({ participants }: { participants: any[] }) {
  const sorted = [...(participants || [])].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="space-y-3">
      {sorted.map((p, i) => {
        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.created
        const isDone = p.status === 'fulfilled' || p.status === 'completed'

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-4"
          >
            {/* Timeline line */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone ? 'ring-2 ring-emerald-500/30' : ''}`}
                style={{ background: cfg.bg, color: cfg.color }}>
                {isDone ? <CheckCircle2 size={16} /> : (p.order || i + 1)}
              </div>
              {i < sorted.length - 1 && (
                <div className={`w-px flex-1 mt-2 min-h-4 ${isDone ? 'bg-emerald-500/30' : 'bg-white/8'}`} />
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">{p.email}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{p.role || `Signer ${i + 1}`}</span>
                    <span className="text-slate-700">·</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      {ACTION_ICON[p.action] || ACTION_ICON.sign}
                      {p.action || 'sign'}
                    </span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.label}
                </span>
              </div>
              {p.updated && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-600">
                  <Clock size={10} />
                  {isDone ? 'Signed' : 'Updated'} {formatDistanceToNow(p.updated * 1000, { addSuffix: true })}
                </div>
              )}
              {p.expires_at && !isDone && (
                <div className={`flex items-center gap-1.5 mt-1 text-[11px] ${p.expired ? 'text-rose-500' : 'text-slate-600'}`}>
                  <Calendar size={10} />
                  {p.expired ? 'Expired' : 'Expires'} {format(p.expires_at * 1000, 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// AI Summary panel
function AISummaryPanel({ document }: { document: any }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const fields = document.fields || []
      const roles = document.roles?.map((r: any) => r.name || r) || []
      const result = await summarizeDocument({
        documentName: document.document_name || document.name || 'Document',
        documentType: 'Agreement',
        fields,
        roles,
        pageCount: document.page_count,
      })
      setSummary(result.summary)
    } catch (e) {
      toast.error('AI summary failed')
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard() {
    if (summary) {
      navigator.clipboard.writeText(summary)
      toast.success('Summary copied!')
    }
  }

  return (
    <div className="card" style={{ borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wand2 size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-white">AI Summary</span>
        </div>
        {summary && (
          <button onClick={copyToClipboard} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all">
            <Copy size={13} />
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Generate a plain-language summary to share with signers so they know what they're signing.
      </p>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-4">
            <Spinner size={18} />
            <span className="text-sm text-slate-400">Analyzing document...</span>
          </motion.div>
        ) : summary ? (
          <motion.div key="summary" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <div className="p-4 rounded-xl text-sm text-slate-300 leading-relaxed mb-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {summary}
            </div>
            <button
              onClick={generate}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors"
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generate}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(99,102,241,0.2))',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#c4b5fd',
            }}
          >
            <Sparkles size={14} />
            Generate Summary
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DocumentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [doc, setDoc] = useState<any>(null)
  const [docGroup, setDocGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sendingUrl, setSendingUrl] = useState<string | null>(null)
  const [showSending, setShowSending] = useState(false)

  useEffect(() => {
    if (!id) return
    getDocument(id)
      .then(data => {
        setDoc(data)
        // The docGroup invite data comes from list API, we use what we have
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  async function openSendingFlow(type: 'manage' | 'edit' | 'send-invite' = 'manage') {
    if (!id) return
    try {
      const result = await createEmbeddedSending(id, { type })
      setSendingUrl(result.url)
      setShowSending(true)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to open sending flow')
    }
  }

  async function handleDownload() {
    if (!id) return
    try {
      const result = await getDocumentDownload(id)
      const url = result.link || result.url
      if (url) window.open(url, '_blank')
    } catch {
      toast.error('Failed to get download link')
    }
  }

  async function handleCancelInvite() {
    if (!id) return
    try {
      await cancelInvite(id)
      toast.success('Invite cancelled')
      const data = await getDocument(id)
      setDoc(data)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to cancel invite')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={36} />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-8 text-center text-slate-400">Document not found.</div>
    )
  }

  const docName = doc.document_name || doc.name || 'Document'
  const updated = doc.updated || doc.created
  const fields = doc.fields || []
  const roles = doc.roles || []
  const signerCount = fields.filter((f: any) => f.type === 'signature').length

  // Derive status from doc
  const inviteStatus = doc.invite?.status
  const isCompleted = inviteStatus === 'completed' || doc.status === 'completed'
  const isPending = inviteStatus === 'pending'

  return (
    <div className="p-8">
      {/* Back */}
      <button
        onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back to Documents
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(99,102,241,0.25)' }}>
              <FileText size={26} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-white">{docName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                {updated && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    Updated {formatDistanceToNow(updated * 1000, { addSuffix: true })}
                  </span>
                )}
                {roles.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Users size={13} />
                    {roles.length} role{roles.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownload} className="btn-secondary flex items-center gap-2">
              <Download size={14} />
              Download
            </button>
            <button onClick={() => openSendingFlow('send-invite')} className="btn-primary flex items-center gap-2">
              <Send size={14} />
              Send for Signing
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Document fields overview */}
          {fields.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card">
              <div className="flex items-center gap-2 mb-4">
                <PenLine size={15} className="text-brand-400" />
                <span className="text-sm font-semibold text-white">Fields ({fields.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  fields.reduce((acc: any, f: any) => {
                    acc[f.type] = (acc[f.type] || 0) + 1
                    return acc
                  }, {})
                ).map(([type, count]: any) => (
                  <div key={type} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                    {type} <span className="opacity-60">×{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Signing status / timeline */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-cyan-400" />
                <span className="text-sm font-semibold text-white">Signing Status</span>
              </div>
              {isPending && (
                <button
                  onClick={handleCancelInvite}
                  className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                >
                  <XCircle size={12} /> Cancel Invites
                </button>
              )}
            </div>

            {doc.invite?.participants?.length > 0 ? (
              <SignerTimeline participants={doc.invite.participants} />
            ) : roles.length > 0 ? (
              <div className="space-y-2">
                {roles.map((role: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-t border-white/5 first:border-0">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-300">{role.name || role}</span>
                    <span className="text-xs text-slate-500 ml-auto">Awaiting invite</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-4">
                No signing data yet. Send this document to get signers started.
              </div>
            )}
          </motion.div>

          {/* Embedded sending */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-white">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Manage Document', icon: <ExternalLink size={14} />, type: 'manage' as const },
                { label: 'Edit Fields', icon: <PenLine size={14} />, type: 'edit' as const },
                { label: 'Send Invite', icon: <Send size={14} />, type: 'send-invite' as const },
              ].map(a => (
                <button key={a.type}
                  onClick={() => openSendingFlow(a.type)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/6 transition-all border border-white/6 hover:border-white/12">
                  <span className="text-brand-400">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* AI Summary */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <AISummaryPanel document={doc} />
          </motion.div>

          {/* Document info */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="card">
            <div className="text-sm font-semibold text-white mb-3">Document Info</div>
            <div className="space-y-3">
              {[
                { label: 'Document ID', value: doc.id?.slice(0, 16) + '...' },
                { label: 'Pages', value: doc.page_count || '—' },
                { label: 'Fields', value: fields.length },
                { label: 'Signature Fields', value: signerCount },
                { label: 'Roles', value: roles.length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Embedded Sending Modal */}
      <Modal open={showSending} onClose={() => setShowSending(false)} size="full">
        <div className="p-0 h-[80vh]">
          {sendingUrl && (
            <iframe
              src={sendingUrl}
              className="w-full h-full border-0"
              title="Document Sending"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

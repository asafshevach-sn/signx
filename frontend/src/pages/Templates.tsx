import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookTemplate, Search, Zap, ArrowRight, Clock,
  FileText, Users, Star, Sparkles, ChevronRight,
  CheckCircle2, Plus
} from 'lucide-react'
import { listTemplates, useTemplate, type Template } from '../api/templates'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

const TEMPLATE_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'
]

const TEMPLATE_EMOJIS: Record<string, string> = {
  nda: '🔒', agreement: '📝', employment: '💼', invoice: '💰',
  partner: '🤝', rental: '🏠', deal: '🤜', default: '📄'
}

function getEmoji(name: string) {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(TEMPLATE_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return TEMPLATE_EMOJIS.default
}

function TemplateCard({ template, index, onUse }: { template: Template; index: number; onUse: (t: Template) => void }) {
  const color = TEMPLATE_COLORS[index % TEMPLATE_COLORS.length]
  const emoji = getEmoji(template.name)
  const updated = template.last_updated

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="card group cursor-pointer relative overflow-hidden"
      style={{ borderColor: `${color}20` }}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl transition-opacity group-hover:opacity-10"
        style={{ background: color, transform: 'translate(30%, -30%)' }} />

      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          {emoji}
        </div>
        {template.is_prepared && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
            <CheckCircle2 size={9} /> Ready
          </span>
        )}
      </div>

      <h3 className="font-semibold text-white mb-1 group-hover:text-brand-300 transition-colors leading-snug">
        {template.name}
      </h3>

      <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {formatDistanceToNow(updated * 1000, { addSuffix: true })}
        </span>
        <span className="capitalize px-1.5 py-0.5 rounded" style={{ background: `${color}10`, color }}>
          {template.entity_type === 'template_group' ? 'Bundle' : 'Single'}
        </span>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onUse(template) }}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
        style={{
          background: `${color}15`,
          color,
          border: `1px solid ${color}25`,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = `${color}25`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = `${color}15`
        }}
      >
        <Zap size={14} />
        Use Template
      </button>
    </motion.div>
  )
}

// Use Template Modal
function UseTemplateModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState(`${template.name} — ${new Date().toLocaleDateString()}`)
  const [loading, setLoading] = useState(false)

  async function handleUse() {
    setLoading(true)
    try {
      const result = await useTemplate(template.id, name)
      toast.success('Document created from template!')
      onClose()
      const docId = result.id || result.document_id
      if (docId) navigate(`/documents/${docId}`)
      else navigate('/documents')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to create document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(99,102,241,0.15)' }}>
          {getEmoji(template.name)}
        </div>
        <div>
          <div className="font-semibold text-white">{template.name}</div>
          <div className="text-xs text-slate-400">Using template to create a new document</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Document Name</label>
        <input
          className="input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter a name for the new document"
        />
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl mb-6"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <Sparkles size={14} className="text-brand-400 flex-shrink-0" />
        <p className="text-xs text-slate-400">
          A new document will be created with all fields from this template. You can then add recipients and send for signing.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button
          onClick={handleUse}
          disabled={loading || !name.trim()}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading ? <Spinner size={15} /> : <Zap size={15} />}
          Create Document
        </button>
      </div>
    </div>
  )
}

export function Templates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    listTemplates({ limit: 50 })
      .then(data => {
        // Handle both MCP-format (templates array) and raw SignNow format (array)
        if (Array.isArray(data)) {
          setTemplates(data)
        } else if (data.templates) {
          setTemplates(data.templates)
        } else {
          setTemplates(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = templates.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Templates</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {templates.length} template{templates.length !== 1 ? 's' : ''} ready to use
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Templates Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookTemplate size={28} />}
          title="No templates yet"
          description="Create a template in SignNow to speed up your workflow"
          action={
            <button onClick={() => navigate('/send')} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus size={15} />
              Upload Document
            </button>
          }
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} onUse={setSelectedTemplate} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Use Template Modal */}
      <Modal
        open={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title="Use Template"
      >
        {selectedTemplate && (
          <UseTemplateModal
            template={selectedTemplate}
            onClose={() => setSelectedTemplate(null)}
          />
        )}
      </Modal>
    </div>
  )
}

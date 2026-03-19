import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Search, Filter, Upload, ChevronRight,
  Users, Calendar, MoreHorizontal, Download, Eye,
  Send, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  FileX, Inbox
} from 'lucide-react'
import { listDocuments, type Document } from '../api/documents'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'

const FILTERS = [
  { key: '',          label: 'All',        icon: <Inbox size={14} /> },
  { key: 'signed',    label: 'Completed',  icon: <CheckCircle2 size={14} /> },
  { key: 'pending',   label: 'Pending',    icon: <Clock size={14} /> },
  { key: 'unsent',    label: 'Drafts',     icon: <FileText size={14} /> },
  { key: 'expired',   label: 'Expired',    icon: <AlertTriangle size={14} /> },
]

function DocCard({ doc, onOpen }: { doc: Document; onOpen: (doc: Document) => void }) {
  const navigate = useNavigate()
  const status = doc.invite?.expired ? 'expired' : (doc.invite?.status || 'draft')
  const signerCount = doc.invite?.participants?.length || 0
  const completedCount = doc.invite?.participants?.filter(p => p.status === 'fulfilled').length || 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="card cursor-pointer group"
      onClick={() => navigate(`/documents/${doc.id}`)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <FileText size={22} className="text-brand-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-brand-300 transition-colors line-clamp-2">
              {doc.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge status={status} />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {signerCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Users size={11} />
                {completedCount}/{signerCount} signed
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar size={11} />
              {formatDistanceToNow(doc.last_updated * 1000, { addSuffix: true })}
            </span>
            {doc.entity_type === 'document_group' && (
              <span className="text-brand-400/70">{doc.documents.length} docs</span>
            )}
          </div>

          {/* Signing progress bar */}
          {signerCount > 0 && (
            <div className="mt-3">
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-skeleton-a)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${signerCount > 0 ? (completedCount / signerCount) * 100 : 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: status === 'completed' ? '#10b981' : '#6366f1' }}
                />
              </div>
              {/* Signer avatars */}
              <div className="flex items-center gap-1 mt-2">
                {doc.invite?.participants?.slice(0, 4).map((p, i) => (
                  <div key={i} title={p.email}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border border-surface-950"
                    style={{
                      background: p.status === 'fulfilled' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)',
                      color: p.status === 'fulfilled' ? '#10b981' : '#a5b4fc',
                      marginLeft: i > 0 ? '-4px' : 0,
                    }}>
                    {p.email?.[0]?.toUpperCase()}
                  </div>
                ))}
                {(doc.invite?.participants?.length || 0) > 4 && (
                  <span className="text-[10px] text-slate-500 ml-1">+{(doc.invite?.participants?.length || 0) - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <ChevronRight size={16} className="text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  )
}

export function Documents() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const LIMIT = 20

  const activeFilter = searchParams.get('filter') || ''

  const load = useCallback(async (reset = true) => {
    setLoading(true)
    try {
      const off = reset ? 0 : offset
      const data = await listDocuments({
        limit: LIMIT,
        offset: off,
        filter: activeFilter || undefined,
        sortby: 'updated',
        order: 'desc',
      })
      const groups = data.document_groups || []
      setDocs(reset ? groups : prev => [...prev, ...groups])
      setTotal(data.document_group_total_count || 0)
      setHasMore(data.has_more || false)
      setOffset(reset ? LIMIT : off + LIMIT)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [activeFilter, offset])

  useEffect(() => { load(true) }, [activeFilter])

  const filtered = docs.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Documents</h1>
            <p className="text-slate-400 text-sm mt-0.5">{total} total documents</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => load(true)} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={15} />
              Refresh
            </button>
            <button onClick={() => navigate('/send')} className="btn-primary flex items-center gap-2">
              <Upload size={15} />
              Upload
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-6 space-y-4">
        {/* Status filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => {
                setSearchParams(f.key ? { filter: f.key } : {})
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeFilter === f.key
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
              style={activeFilter === f.key ? {
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#a5b4fc',
              } : { border: '1px solid transparent' }}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Content */}
      {loading && docs.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileX size={28} />}
          title="No documents found"
          description={search ? 'Try a different search term' : 'Upload a document to get started'}
          action={
            <button onClick={() => navigate('/send')} className="btn-primary flex items-center gap-2 mx-auto">
              <Upload size={15} />
              Upload Document
            </button>
          }
        />
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(doc => (
                <DocCard key={doc.id} doc={doc} onOpen={() => {}} />
              ))}
            </div>
          </AnimatePresence>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => load(false)}
                disabled={loading}
                className="btn-secondary flex items-center gap-2"
              >
                {loading ? <Spinner size={15} /> : null}
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

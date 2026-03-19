import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow, format } from 'date-fns'
import {
  BarChart3, TrendingUp, FileText, CheckCircle2,
  Clock, AlertTriangle, FileX, ArrowRight, Users, Activity
} from 'lucide-react'

interface Stats {
  total: number
  signed: number
  waitingForOthers: number
  waitingForMe: number
  expired: number
  drafts: number
}

interface Doc {
  id: string
  name: string
  last_updated: number
  invite: {
    status: 'completed' | 'pending' | 'declined' | null
    expired: boolean
    participants: { email: string; status: string }[]
  } | null
}

function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-8 w-1/2 rounded" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  )
}

function StatBar({ label, value, total, color, icon }: {
  label: string; value: number; total: number; color: string; icon: React.ReactNode
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color }}>{value}</span>
          <span className="text-xs w-9 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  )
}

function FunnelStep({ label, value, total, color, isLast }: {
  label: string; value: number; total: number; color: string; isLast?: boolean
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const width = 40 + pct * 0.6
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center" style={{ width: `${width}%`, minWidth: 120 }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full h-12 rounded-xl flex items-center justify-between px-4"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span className="text-sm font-semibold" style={{ color }}>{label}</span>
          <span className="text-lg font-bold" style={{ color }}>{value}</span>
        </motion.div>
        {!isLast && (
          <div className="flex flex-col items-center mt-0.5">
            <div className="w-px h-3" style={{ background: 'var(--border-medium)' }} />
            <ArrowRight size={12} style={{ color: 'var(--text-muted)', transform: 'rotate(90deg)' }} />
          </div>
        )}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{pct}% of total</div>
    </div>
  )
}

export function Reports() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/documents?limit=100').then(r => r.json()),
    ]).then(([s, d]) => {
      setStats(s)
      setDocs(d.document_groups || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const completionRate = stats && stats.total > 0
    ? Math.round((stats.signed / stats.total) * 100) : 0

  const sent = stats ? (stats.signed + stats.waitingForOthers + stats.expired) : 0
  const recentDocs = [...docs]
    .sort((a, b) => b.last_updated - a.last_updated)
    .slice(0, 8)

  const statusLabel: Record<string, string> = {
    completed: 'Completed', pending: 'Pending', declined: 'Declined'
  }
  const statusColor: Record<string, string> = {
    completed: '#10b981', pending: '#f59e0b', declined: '#f43f5e'
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 size={22} className="text-indigo-400" />
          <h1 className="text-2xl font-display font-bold gradient-text">Reports</h1>
        </div>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Overview of your document signing activity
        </p>

        {/* Overview cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : ([
            { label: 'Total Documents', value: stats?.total ?? 0, color: '#6366f1', icon: <FileText size={18} /> },
            { label: 'Completion Rate', value: `${completionRate}%`, color: '#10b981', icon: <TrendingUp size={18} /> },
            { label: 'Awaiting Signature', value: stats?.waitingForOthers ?? 0, color: '#f59e0b', icon: <Clock size={18} /> },
            { label: 'Expired', value: stats?.expired ?? 0, color: '#f43f5e', icon: <AlertTriangle size={18} /> },
          ].map(({ label, value, color, icon }) => (
            <motion.div
              key={label}
              whileHover={{ y: -2 }}
              className="card"
              style={{ borderColor: `${color}22` }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}18`, color }}>
                {icon}
              </div>
              <div className="text-2xl font-bold font-display mb-0.5" style={{ color: 'var(--text-primary)' }}>
                {value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
            </motion.div>
          )))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Status Breakdown */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Activity size={16} className="text-indigo-400" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Status Breakdown</h2>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-6 rounded" />)}
              </div>
            ) : (
              <div className="space-y-4">
                <StatBar label="Completed" value={stats?.signed ?? 0} total={stats?.total ?? 1}
                  color="#10b981" icon={<CheckCircle2 size={14} />} />
                <StatBar label="Pending" value={stats?.waitingForOthers ?? 0} total={stats?.total ?? 1}
                  color="#f59e0b" icon={<Clock size={14} />} />
                <StatBar label="Expired" value={stats?.expired ?? 0} total={stats?.total ?? 1}
                  color="#f43f5e" icon={<AlertTriangle size={14} />} />
                <StatBar label="Drafts" value={stats?.drafts ?? 0} total={stats?.total ?? 1}
                  color="#64748b" icon={<FileX size={14} />} />
              </div>
            )}
          </div>

          {/* Signing Funnel */}
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <Users size={16} className="text-violet-400" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Signing Funnel</h2>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded" />)}
              </div>
            ) : (
              <div className="space-y-1">
                <FunnelStep label="Sent for Signing" value={sent} total={stats?.total ?? 1} color="#6366f1" />
                <FunnelStep label="Pending Response" value={stats?.waitingForOthers ?? 0} total={stats?.total ?? 1} color="#f59e0b" />
                <FunnelStep label="Signed ✓" value={stats?.signed ?? 0} total={stats?.total ?? 1} color="#10b981" isLast />
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-cyan-400" />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Document Activity</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="skeleton h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-2/3 rounded" />
                    <div className="skeleton h-2.5 w-1/3 rounded" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {recentDocs.map((doc, i) => {
                const status = doc.invite?.expired ? 'expired'
                  : doc.invite?.status ?? 'draft'
                const badgeClass = status === 'completed' ? 'badge-signed'
                  : status === 'pending' ? 'badge-pending'
                  : status === 'expired' ? 'badge-expired'
                  : 'badge-draft'
                const signers = doc.invite?.participants?.length ?? 0
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{ background: 'var(--bg-surface)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                      <FileText size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {doc.name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {doc.last_updated
                          ? formatDistanceToNow(doc.last_updated * 1000, { addSuffix: true })
                          : '—'}
                        {signers > 0 && ` · ${signers} signer${signers > 1 ? 's' : ''}`}
                      </div>
                    </div>
                    <span className={badgeClass}>
                      {status === 'completed' ? 'Signed'
                        : status === 'pending' ? 'Pending'
                        : status === 'expired' ? 'Expired'
                        : status === 'declined' ? 'Declined'
                        : 'Draft'}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

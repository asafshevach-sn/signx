import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Upload, BookTemplate, Send, ArrowRight, Zap, Sparkles,
  ChevronRight, Trophy, Star, Target, BarChart3, Users
} from 'lucide-react'
import { getStats, listDocuments, type Document } from '../api/documents'
import { Badge } from '../components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'
import { Spinner } from '../components/ui/Spinner'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, delta, onClick }: {
  icon: React.ReactNode, label: string, value: number | string,
  color: string, delta?: string, onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderColor: `${color}22` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {delta && (
          <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
            <TrendingUp size={11} /> {delta}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold font-display text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </motion.div>
  )
}

// ─── Getting Started ──────────────────────────────────────────────────────────
interface Step {
  id: string, title: string, description: string,
  icon: React.ReactNode, action: string, actionTo: string,
  done?: boolean, points: number
}

function GettingStarted({ steps, totalDocs }: { steps: Step[], totalDocs: number }) {
  const completed = steps.filter(s => s.done).length
  const pct = Math.round((completed / steps.length) * 100)
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card"
      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)' }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Getting Started</span>
          </div>
          <h2 className="text-xl font-display font-bold text-white">Your signing journey</h2>
          <p className="text-sm text-slate-400 mt-0.5">{completed} of {steps.length} steps complete · {pct}%</p>
        </div>
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle cx="28" cy="28" r="22" fill="none" stroke="url(#grad)" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
              className="transition-all duration-700" />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mb-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
              step.done ? 'opacity-60' : 'cursor-pointer hover:bg-white/5'
            }`}
            onClick={() => !step.done && navigate(step.actionTo)}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
              step.done
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-white/6 text-slate-400'
            }`}>
              {step.done ? <CheckCircle2 size={18} /> : step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${step.done ? 'line-through text-slate-500' : 'text-white'}`}>
                  {step.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                  +{step.points} pts
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
            </div>
            {!step.done && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-brand-400 flex-shrink-0">
                {step.action} <ArrowRight size={12} />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Recent Document Card ─────────────────────────────────────────────────────
function RecentDocCard({ doc }: { doc: Document }) {
  const navigate = useNavigate()
  const status = doc.invite?.status || 'draft'
  const isExpired = doc.invite?.expired

  return (
    <motion.div
      whileHover={{ x: 3 }}
      onClick={() => navigate(`/documents/${doc.id}`)}
      className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <FileText size={18} className="text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{doc.name}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          {formatDistanceToNow(doc.last_updated * 1000, { addSuffix: true })}
          {doc.invite?.participants?.length ? ` · ${doc.invite.participants.length} signer${doc.invite.participants.length > 1 ? 's' : ''}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge status={isExpired ? 'expired' : status} />
        <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </motion.div>
  )
}

// ─── Activity Insight ─────────────────────────────────────────────────────────
function ActivityBar({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-slate-400 w-24 truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <div className="text-xs font-semibold text-white w-6 text-right">{value}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [recentDocs, setRecentDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, docsData] = await Promise.all([
        getStats(),
        listDocuments({ limit: 6, sortby: 'updated', order: 'desc' }),
      ])
      setStats(s)
      setRecentDocs(docsData.document_groups || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const gettingStartedSteps: Step[] = [
    {
      id: 'upload',
      title: 'Upload your first document',
      description: 'Upload a PDF and add signature fields',
      icon: <Upload size={18} />,
      action: 'Upload',
      actionTo: '/send',
      done: (stats?.total || 0) > 0,
      points: 100,
    },
    {
      id: 'send',
      title: 'Send a document for signing',
      description: 'Invite recipients via email with a personalized message',
      icon: <Send size={18} />,
      action: 'Send',
      actionTo: '/send',
      done: (stats?.waitingForOthers || 0) > 0 || (stats?.signed || 0) > 0,
      points: 150,
    },
    {
      id: 'template',
      title: 'Use a template',
      description: 'Speed up your workflow with reusable templates',
      icon: <BookTemplate size={18} />,
      action: 'Browse',
      actionTo: '/templates',
      done: false,
      points: 75,
    },
    {
      id: 'signed',
      title: 'Get a document signed',
      description: 'Celebrate your first completed signature!',
      icon: <Trophy size={18} />,
      action: 'View',
      actionTo: '/documents',
      done: (stats?.signed || 0) > 0,
      points: 200,
    },
  ]

  const maxStat = stats ? Math.max(stats.signed, stats.waitingForOthers, stats.expired, stats.drafts, 1) : 1

  return (
    <div className="p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand-400" />
          <span className="text-sm text-brand-400 font-medium">Good to see you</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white">
          Welcome back, <span className="gradient-text">Asaf</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your documents today.</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard
              icon={<FileText size={20} />}
              label="Total Documents"
              value={stats?.total ?? '—'}
              color="#6366f1"
              onClick={() => navigate('/documents')}
            />
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Completed"
              value={stats?.signed ?? '—'}
              color="#10b981"
              delta={stats?.signed > 0 ? `${stats.signed} signed` : undefined}
              onClick={() => navigate('/documents?filter=signed')}
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Waiting for Others"
              value={stats?.waitingForOthers ?? '—'}
              color="#f59e0b"
              onClick={() => navigate('/documents?filter=pending')}
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Expired"
              value={stats?.expired ?? '—'}
              color="#f43f5e"
              onClick={() => navigate('/documents?filter=expired')}
            />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Getting Started */}
            <div className="xl:col-span-2">
              <GettingStarted steps={gettingStartedSteps} totalDocs={stats?.total || 0} />
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={15} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">Quick Actions</span>
                </div>
                <div className="space-y-2">
                  {[
                    { icon: <Upload size={16} />, label: 'Upload & Send', to: '/send', color: '#6366f1' },
                    { icon: <BookTemplate size={16} />, label: 'Use a Template', to: '/templates', color: '#8b5cf6' },
                    { icon: <FileText size={16} />, label: 'View All Docs', to: '/documents', color: '#06b6d4' },
                  ].map(a => (
                    <motion.button
                      key={a.to}
                      whileHover={{ x: 3 }}
                      onClick={() => navigate(a.to)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-slate-300 hover:text-white transition-all hover:bg-white/5"
                    >
                      <span style={{ color: a.color }}>{a.icon}</span>
                      {a.label}
                      <ChevronRight size={13} className="ml-auto text-slate-600" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Document Health */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={15} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Document Health</span>
                </div>
                <div className="space-y-3">
                  <ActivityBar label="Completed" value={stats?.signed || 0} max={maxStat} color="#10b981" />
                  <ActivityBar label="In Progress" value={stats?.waitingForOthers || 0} max={maxStat} color="#f59e0b" />
                  <ActivityBar label="Drafts" value={stats?.drafts || 0} max={maxStat} color="#6366f1" />
                  <ActivityBar label="Expired" value={stats?.expired || 0} max={maxStat} color="#f43f5e" />
                </div>
              </motion.div>

              {/* Achievements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="card"
                style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(245,158,11,0.04) 100%)', borderColor: 'rgba(251,191,36,0.12)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star size={15} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">Achievements</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { emoji: '🚀', label: 'First Doc', done: (stats?.total || 0) > 0 },
                    { emoji: '✍️', label: 'First Sign', done: (stats?.signed || 0) > 0 },
                    { emoji: '🏆', label: 'Power User', done: (stats?.total || 0) >= 10 },
                  ].map(a => (
                    <div key={a.label}
                      className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                        a.done ? 'opacity-100' : 'opacity-30 grayscale'
                      }`}
                      style={a.done ? { background: 'rgba(251,191,36,0.1)' } : {}}>
                      <span className="text-xl mb-1">{a.emoji}</span>
                      <span className="text-[10px] text-slate-400">{a.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Recent Documents */}
          {recentDocs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-slate-400" />
                  <span className="text-sm font-semibold text-white">Recent Documents</span>
                </div>
                <button
                  onClick={() => navigate('/documents')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {recentDocs.map(doc => (
                  <RecentDocCard key={doc.id} doc={doc} />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

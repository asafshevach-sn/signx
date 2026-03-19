import { CheckCircle2, Clock, AlertCircle, FileText, Eye, XCircle } from 'lucide-react'

type BadgeStatus = 'signed' | 'pending' | 'expired' | 'draft' | 'waiting' | 'created' | 'completed' | 'fulfilled' | string

const config: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
  signed:    { cls: 'badge-signed',  icon: <CheckCircle2 size={11} />, label: 'Signed' },
  completed: { cls: 'badge-signed',  icon: <CheckCircle2 size={11} />, label: 'Completed' },
  fulfilled: { cls: 'badge-signed',  icon: <CheckCircle2 size={11} />, label: 'Signed' },
  pending:   { cls: 'badge-pending', icon: <Clock size={11} />,        label: 'Pending' },
  waiting:   { cls: 'badge-waiting', icon: <Eye size={11} />,          label: 'Waiting' },
  created:   { cls: 'badge-draft',   icon: <FileText size={11} />,     label: 'Created' },
  expired:   { cls: 'badge-expired', icon: <AlertCircle size={11} />,  label: 'Expired' },
  cancelled: { cls: 'badge-expired', icon: <XCircle size={11} />,      label: 'Cancelled' },
  draft:     { cls: 'badge-draft',   icon: <FileText size={11} />,     label: 'Draft' },
}

export function Badge({ status, label }: { status: BadgeStatus; label?: string }) {
  const c = config[status?.toLowerCase()] || config.draft
  return (
    <span className={c.cls}>
      {c.icon}
      {label || c.label}
    </span>
  )
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-emerald-400',
    signed: 'bg-emerald-400',
    fulfilled: 'bg-emerald-400',
    pending: 'bg-amber-400 animate-pulse',
    expired: 'bg-rose-400',
    draft: 'bg-slate-400',
    created: 'bg-slate-400',
    waiting: 'bg-blue-400 animate-pulse',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status?.toLowerCase()] || 'bg-slate-400'}`} />
}

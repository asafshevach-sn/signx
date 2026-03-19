import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, BookTemplate, Send,
  Zap, Settings, ChevronRight, Plus, Sparkles
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',   end: true },
  { to: '/documents', icon: FileText,        label: 'Documents' },
  { to: '/templates', icon: BookTemplate,    label: 'Templates' },
  { to: '/send',      icon: Send,            label: 'Send Document' },
]

export function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside
      className="flex flex-col w-64 h-screen flex-shrink-0 border-r py-6 overflow-y-auto"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-sidebar)' }}
    >
      {/* Logo */}
      <div className="px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={18} className="text-white" />
            <div className="absolute inset-0 rounded-xl opacity-50 blur-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
          </div>
          <div>
            <span className="text-xl font-display font-bold gradient-text">SignX</span>
            <div className="text-[10px] font-medium -mt-0.5" style={{ color: 'var(--text-muted)' }}>Sign Smarter</div>
          </div>
        </motion.div>
      </div>

      {/* Quick action */}
      <div className="px-4 mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/send')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            boxShadow: '0 4px 15px rgba(99,102,241,0.35)'
          }}
        >
          <Plus size={16} />
          New Document
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group'
                )}
                style={isActive ? {
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)'
                } : { color: 'var(--text-secondary)' }}
              >
                <Icon size={18} style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }} />
                {label}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto" style={{ color: 'rgba(129,140,248,0.6)' }} />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* AI Badge */}
      <div className="px-4 mb-4">
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="rounded-xl p-3 cursor-default"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))',
            border: '1px solid rgba(139,92,246,0.2)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-400">AI Assistant</span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Auto-detect fields & summarize documents for signers.
          </p>
        </motion.div>
      </div>

      {/* Settings */}
      <div className="px-3">
        <NavLink to="/settings">
          {({ isActive }) => (
            <motion.div
              whileHover={{ x: 2 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={isActive ? {
                background: 'rgba(99,102,241,0.15)',
                color: '#a5b4fc',
                boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)'
              } : { color: 'var(--text-secondary)' }}
            >
              <Settings size={18} style={{ color: isActive ? '#818cf8' : 'var(--text-muted)' }} />
              Settings
            </motion.div>
          )}
        </NavLink>
      </div>

      {/* User */}
      <div className="px-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-sidebar)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            A
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>Asaf Shevach</div>
            <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>asaf.shevach@airslate.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

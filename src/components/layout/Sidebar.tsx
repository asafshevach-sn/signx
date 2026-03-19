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
    <aside className="flex flex-col w-64 min-h-screen border-r border-white/6 py-6" style={{ background: 'rgba(2,6,23,0.95)' }}>
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
            <div className="text-[10px] text-slate-500 font-medium -mt-0.5">Sign Smarter</div>
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                )}
                style={isActive ? {
                  background: 'rgba(99,102,241,0.15)',
                  color: '#a5b4fc',
                  boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)'
                } : {}}
              >
                <Icon size={18} className={isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {label}
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-brand-400/60" />
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
            <span className="text-xs font-semibold text-violet-300">AI Assistant</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Auto-detect fields & summarize documents for signers.
          </p>
        </motion.div>
      </div>

      {/* Settings */}
      <div className="px-3">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
          <Settings size={18} />
          Settings
        </button>
      </div>

      {/* User */}
      <div className="px-4 mt-4 pt-4 border-t border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            A
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">Asaf Shevach</div>
            <div className="text-[11px] text-slate-500 truncate">asaf.shevach@airslate.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

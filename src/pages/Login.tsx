import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Zap, Sparkles, Shield, FileText, CheckCircle2,
  PenLine, Clock, Users, ArrowRight, Star
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

// ─── Floating activity cards ──────────────────────────────────────────────────
const activities = [
  { icon: <CheckCircle2 size={14} />, color: '#10b981', bg: '#d1fae5', name: 'Sarah K.', action: 'just signed', doc: 'NDA Agreement.pdf', time: '2m ago' },
  { icon: <PenLine size={14} />,      color: '#6366f1', bg: '#e0e7ff', name: 'Michael R.', action: 'sent for signing', doc: 'Service Contract.pdf', time: '5m ago' },
  { icon: <CheckCircle2 size={14} />, color: '#10b981', bg: '#d1fae5', name: 'Emily T.', action: 'completed', doc: 'Offer Letter.pdf', time: '12m ago' },
  { icon: <Clock size={14} />,        color: '#f59e0b', bg: '#fef3c7', name: 'David L.', action: 'awaiting signature', doc: 'Partnership Agreement.pdf', time: '18m ago' },
]

const stats = [
  { value: '98%', label: 'Completion rate', icon: <CheckCircle2 size={16} />, color: '#10b981' },
  { value: '3 min', label: 'Avg. sign time', icon: <Clock size={16} />, color: '#6366f1' },
  { value: '100%', label: 'Legally binding', icon: <Shield size={16} />, color: '#8b5cf6' },
]

export function Login() {
  const { handleCredentialResponse } = useAuth()
  const btnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initGSI = () => {
      if (!(window as any).google || !btnRef.current) return
      ;(window as any).google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        hl: 'en',
      })
      ;(window as any).google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        locale: 'en',
      })
    }

    if ((window as any).google) { initGSI(); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGSI
    document.head.appendChild(script)
  }, [handleCredentialResponse])

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f7ff' }}>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #eef2ff 0%, #f5f3ff 40%, #fdf4ff 100%)',
          borderRight: '1px solid #e0e7ff',
        }}>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(circle, #c7d2fe, transparent 70%)' }} />
          <div className="absolute bottom-[-60px] right-[-60px] w-[350px] h-[350px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #ddd6fe, transparent 70%)' }} />
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#6366f1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-display font-bold" style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>SignX</span>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-indigo-400 -mt-0.5">Sign Smarter</div>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <Sparkles size={12} />
              AI-Powered eSignature Platform
            </div>
            <h1 className="text-4xl font-display font-bold leading-tight mb-4"
              style={{ color: '#1e1b4b' }}>
              The smarter way<br />
              to get documents<br />
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>signed</span>
            </h1>
            <p className="text-base mb-8 leading-relaxed max-w-sm" style={{ color: '#6b7280' }}>
              Upload, prepare, and send documents for signature in minutes.
              AI detects fields, summarizes content, and guides every signer.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex gap-4 mb-8"
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex-1 rounded-2xl p-3.5 text-center"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(99,102,241,0.12)', backdropFilter: 'blur(8px)' }}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-lg font-display font-bold">{s.value}</span>
                </div>
                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Live activity feed */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Activity</span>
            </div>
            <div className="space-y-2">
              {activities.slice(0, 3).map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(99,102,241,0.1)', backdropFilter: 'blur(6px)' }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: a.bg, color: a.color }}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-gray-700">{a.name}</span>
                      <span className="text-gray-400">{a.action}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{a.doc}</div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 flex-shrink-0">{a.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex items-center gap-3 relative">
          <div className="flex -space-x-2">
            {['bg-indigo-400', 'bg-violet-400', 'bg-purple-400', 'bg-pink-400'].map((c, i) => (
              <div key={i} className={`w-7 h-7 rounded-full ${c} ring-2 ring-white flex items-center justify-center text-white text-[10px] font-bold`}>
                {['S','M','E','D'][i]}
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Trusted by thousands of businesses</div>
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">

        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-display font-bold" style={{
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>SignX</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 24 }}
          className="w-full max-w-[380px]"
        >
          {/* Card */}
          <div className="rounded-3xl p-8 relative"
            style={{
              background: '#ffffff',
              border: '1px solid #e0e7ff',
              boxShadow: '0 4px 40px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            }}>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <Zap size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold mb-2" style={{ color: '#1e1b4b' }}>
                Welcome back
              </h1>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                Sign in to access your SignX workspace
              </p>
            </div>

            {/* Google Button */}
            <div className="flex justify-center mb-5">
              <div ref={btnRef} />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: '#f3f4f6' }} />
              <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>or</span>
              <div className="flex-1 h-px" style={{ background: '#f3f4f6' }} />
            </div>

            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { icon: <FileText size={12} />, text: 'Upload PDFs' },
                { icon: <PenLine size={12} />, text: 'Add fields' },
                { icon: <Users size={12} />, text: 'Multiple signers' },
                { icon: <Sparkles size={12} />, text: 'AI-powered' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={{ background: '#f8f7ff', border: '1px solid #ede9fe' }}>
                  <span style={{ color: '#6366f1' }}>{f.icon}</span>
                  <span className="text-xs font-medium" style={{ color: '#4338ca' }}>{f.text}</span>
                </div>
              ))}
            </div>

            {/* CTA hint */}
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(79,70,229,0.3)',
              }}
              onClick={() => btnRef.current?.querySelector('div')?.click()}>
              Get started free
              <ArrowRight size={15} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {[
              { icon: <Shield size={12} />, label: 'Secure & encrypted' },
              { icon: <CheckCircle2 size={12} />, label: 'Legally binding' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#9ca3af' }}>
                <span style={{ color: '#a5b4fc' }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

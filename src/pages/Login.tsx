import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Sparkles, Shield, FileText, CheckCircle2,
  Clock, Users, Eye, EyeOff, Mail, Lock, ArrowRight, Star
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

const valueProps = [
  {
    icon: FileText,
    color: '#6366f1',
    bg: '#eef2ff',
    title: 'Send documents in minutes',
    desc: 'Upload any PDF, add signature fields, and send to multiple recipients instantly.',
  },
  {
    icon: Sparkles,
    color: '#8b5cf6',
    bg: '#f5f3ff',
    title: 'AI that works for you',
    desc: 'Auto-detects signature fields, summarizes documents for signers, and suggests smart email subjects.',
  },
  {
    icon: Users,
    color: '#0ea5e9',
    bg: '#e0f2fe',
    title: 'Flexible signing workflows',
    desc: 'Sequential or parallel signing, custom roles, and real-time tracking for every recipient.',
  },
  {
    icon: Shield,
    color: '#10b981',
    bg: '#d1fae5',
    title: 'Legally binding & secure',
    desc: 'Every signature is timestamped, audit-trailed, and fully compliant with eSignature laws.',
  },
]

const stats = [
  { value: '98%', label: 'Completion rate', color: '#10b981' },
  { value: '3 min', label: 'Avg. sign time', color: '#6366f1' },
  { value: '256-bit', label: 'Encryption', color: '#8b5cf6' },
]

export function Login() {
  const { handleCredentialResponse, signInWithEmail } = useAuth()
  const btnRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await signInWithEmail(email, password, mode === 'register')
      toast.success(mode === 'register' ? 'Account created!' : 'Welcome back!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8f7ff' }}>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #eef2ff 0%, #f5f3ff 45%, #fdf4ff 100%)',
          borderRight: '1px solid #e0e7ff',
        }}>

        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #c7d2fe, transparent 65%)' }} />
          <div className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #ddd6fe, transparent 65%)' }} />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]">
            <defs>
              <pattern id="grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#6366f1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
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

        {/* Hero + value props */}
        <div className="relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
              style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <Sparkles size={12} />
              AI-Powered eSignature Platform
            </div>
            <h1 className="text-4xl font-display font-bold leading-tight mb-4" style={{ color: '#1e1b4b' }}>
              The smarter way<br />to get documents<br />
              <span style={{
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>signed</span>
            </h1>
          </motion.div>

          {/* Value props */}
          <div className="space-y-3 mb-8">
            {valueProps.map((vp, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.09 }}
                className="flex items-start gap-4 rounded-2xl px-4 py-3.5"
                style={{ background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(99,102,241,0.1)', backdropFilter: 'blur(6px)' }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: vp.bg, color: vp.color }}>
                  <vp.icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-0.5" style={{ color: '#1e1b4b' }}>{vp.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#6b7280' }}>{vp.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            {stats.map((s, i) => (
              <div key={i} className="flex-1 rounded-xl px-3 py-2.5 text-center"
                style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <div className="text-base font-display font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
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
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={10} className="fill-amber-400 text-amber-400" />)}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Trusted by thousands of businesses</div>
          </div>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">

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
          <div className="rounded-3xl p-8"
            style={{
              background: '#ffffff',
              border: '1px solid #e0e7ff',
              boxShadow: '0 4px 40px rgba(99,102,241,0.08), 0 1px 3px rgba(0,0,0,0.05)',
            }}>

            {/* Header */}
            <div className="text-center mb-7">
              <div className="w-13 h-13 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', width: 52, height: 52 }}>
                <Zap size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold mb-1.5" style={{ color: '#1e1b4b' }}>
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-sm" style={{ color: '#9ca3af' }}>
                {mode === 'signin' ? 'Sign in to your SignX workspace' : 'Start signing smarter today'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: '#f3f4f6' }}>
              {(['signin', 'register'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={mode === m
                    ? { background: '#fff', color: '#4338ca', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }
                    : { color: '#9ca3af' }
                  }>
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {/* Email/password form */}
            <form onSubmit={handleSubmit} className="space-y-3 mb-4">
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#1e1b4b',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9ca3af' }} />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required minLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#1e1b4b' }}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}>
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign in' : 'Create account'}
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#f3f4f6' }} />
              <span className="text-xs font-medium" style={{ color: '#d1d5db' }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: '#f3f4f6' }} />
            </div>

            {/* Google Button */}
            <div className="flex justify-center">
              <div ref={btnRef} />
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-5 mt-5">
            {[
              { icon: <Shield size={12} />, label: 'Secure & encrypted' },
              { icon: <CheckCircle2 size={12} />, label: 'Legally binding' },
              { icon: <Clock size={12} />, label: 'Sign in minutes' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#9ca3af' }}>
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

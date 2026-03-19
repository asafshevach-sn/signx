import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, Sparkles, Shield, FileText, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

const features = [
  { icon: FileText,     label: 'Upload & send documents for signing' },
  { icon: CheckCircle2, label: 'Track signatures in real-time' },
  { icon: Sparkles,     label: 'AI-powered field detection & summaries' },
  { icon: Shield,       label: 'Secure, compliant document management' },
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
      })
      ;(window as any).google.accounts.id.renderButton(btnRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: 280,
        text: 'signin_with',
        shape: 'rectangular',
      })
    }

    // If GSI script already loaded
    if ((window as any).google) {
      initGSI()
      return
    }

    // Load GSI script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGSI
    document.head.appendChild(script)
  }, [handleCredentialResponse])

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{
          background: 'linear-gradient(160deg, #0a0f23 0%, #1a1040 100%)',
          borderRight: '1px solid var(--border-subtle)'
        }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <span className="text-xl font-display font-bold gradient-text">SignX</span>
            <div className="text-[10px] text-slate-500 font-medium -mt-0.5">Sign Smarter</div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-display font-bold leading-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            The smarter way to<br />
            <span className="gradient-text">get documents signed</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-sm mb-8 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            Upload, send, and track signatures — with AI that helps every step of the way.
          </motion.p>

          <div className="space-y-3">
            {features.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                  <Icon size={14} />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-violet-400" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Powered by SignNow API + Claude AI
          </span>
        </div>
      </div>

      {/* Right panel - sign in */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-display font-bold gradient-text">SignX</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-sm"
        >
          <div className="card p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Shield size={22} className="text-indigo-400" />
            </div>

            <h1 className="text-xl font-display font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
              Welcome to SignX
            </h1>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Sign in with your Google account to continue
            </p>

            {/* Google Sign-In Button */}
            <div className="flex justify-center mb-6">
              <div ref={btnRef} />
            </div>

            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              By signing in, you agree to use this platform responsibly.
              Your Google account info is only stored locally.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

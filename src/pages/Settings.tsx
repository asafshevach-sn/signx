import { motion } from 'framer-motion'
import { Monitor, Moon, Sun, Check, ExternalLink, Key, Info, Globe } from 'lucide-react'
import { useTheme, ThemeMode } from '../contexts/ThemeContext'

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light theme' },
  { value: 'dark',  label: 'Dark',  icon: Moon, description: 'Always use dark theme' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow your device setting' },
]

function SettingSection({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="card mb-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function Settings() {
  const { mode, setMode } = useTheme()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Manage your preferences and configuration</p>

        {/* Appearance */}
        <SettingSection title="Appearance" description="Choose how SignX looks on your device">
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon, description }) => {
              const active = mode === value
              return (
                <motion.button
                  key={value}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMode(value)}
                  className="relative flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-center"
                  style={active ? {
                    background: 'rgba(99,102,241,0.12)',
                    borderColor: 'rgba(99,102,241,0.5)',
                    boxShadow: '0 0 0 2px rgba(99,102,241,0.2)',
                  } : {
                    background: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {active && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <Check size={9} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={active
                      ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8' }
                      : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: active ? '#a5b4fc' : 'var(--text-primary)' }}>
                      {label}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </SettingSection>

        {/* SignNow API Config */}
        <SettingSection
          title="SignNow Integration"
          description="API credentials and embedded features configuration"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Info size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong className="text-indigo-400">API credentials</strong> are configured via environment variables on your server.
                Update <code className="px-1 py-0.5 rounded text-[11px]" style={{ background: 'rgba(0,0,0,0.2)' }}>.env</code> locally
                or the Vercel dashboard in production.
              </div>
            </div>

            {[
              { label: 'Client ID', env: 'SIGNNOW_CLIENT_ID' },
              { label: 'Client Secret', env: 'SIGNNOW_CLIENT_SECRET' },
              { label: 'Username (email)', env: 'SIGNNOW_USERNAME' },
              { label: 'Password', env: 'SIGNNOW_PASSWORD' },
              { label: 'Anthropic API Key', env: 'ANTHROPIC_API_KEY' },
            ].map(({ label, env }) => (
              <div key={env} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</div>
                  <code className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{env}</code>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <Key size={12} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>env var</span>
                </div>
              </div>
            ))}
          </div>
        </SettingSection>

        {/* Embedded Features */}
        <SettingSection
          title="Embedded Features"
          description="Requirements for embedded editor, signing, and sending"
        >
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Globe size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong className="text-amber-400">Allowed Origins required.</strong> For embedded iframes to load, your app's domain must be
                whitelisted in the <strong>SignNow Developer Portal</strong> under your app's Allowed Origins.
                Add both your Vercel domain and <code className="px-1 py-0.5 rounded text-[11px]" style={{ background: 'rgba(0,0,0,0.2)' }}>http://localhost:5173</code> for local dev.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Info size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <strong className="text-emerald-400">Business/Enterprise plan required</strong> for embedded editor and branded signing links.
                Standard API access covers document management and invite sending.
              </div>
            </div>
            <a
              href="https://developer.signnow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors mt-2"
            >
              <ExternalLink size={14} />
              Open SignNow Developer Portal
            </a>
          </div>
        </SettingSection>

        {/* About */}
        <div className="text-center pt-4 pb-8">
          <span className="gradient-text text-sm font-semibold">SignX</span>
          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>v1.0.0 · Powered by SignNow + Claude AI</span>
        </div>
      </motion.div>
    </div>
  )
}

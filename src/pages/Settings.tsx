import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Monitor, Moon, Sun, Check, Palette, Mail, Upload, Save, RefreshCw, Image, AlertCircle } from 'lucide-react'
import { useTheme, ThemeMode } from '../contexts/ThemeContext'
import client from '../api/client'
import { Spinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

// ─── Theme ────────────────────────────────────────────────────────────────────
const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light',  label: 'Light',  icon: Sun,     description: 'Always use light theme' },
  { value: 'dark',   label: 'Dark',   icon: Moon,    description: 'Always use dark theme' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Follow your device setting' },
]

function SettingSection({ title, description, children, icon }: {
  title: string; description?: string; children: React.ReactNode; icon?: React.ReactNode
}) {
  return (
    <div className="card mb-5">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5">
          {icon && <span className="text-brand-400">{icon}</span>}
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        </div>
        {description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Color Picker Field ───────────────────────────────────────────────────────
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm w-40 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0"
          style={{ border: '2px solid var(--border-medium)' }}>
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer border-0 p-0"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
          className="input w-28 text-sm font-mono uppercase"
          placeholder="#000000"
          maxLength={7}
        />
      </div>
    </div>
  )
}

// ─── Brand Section ────────────────────────────────────────────────────────────
interface BrandState {
  orgId: string
  brandId: string
  title: string
  primaryColor: string
  headerBackground: string
  mainBackground: string
  senderEmail: string
  hideSignNowRef: boolean
  logoUrl: string | null
}

const DEFAULT_BRAND: Partial<BrandState> = {
  primaryColor: '#6366f1',
  headerBackground: '#ffffff',
  mainBackground: '#f8fafc',
  senderEmail: '',
  hideSignNowRef: false,
  logoUrl: null,
}

function BrandSection() {
  const [brand, setBrand] = useState<BrandState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noOrg, setNoOrg] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    client.get('/brand')
      .then(({ data }) => {
        if (!data.orgId) { setNoOrg(true); return }
        // Parse colors from existing general resource
        const gen = data.general
        setBrand({
          orgId: data.orgId,
          brandId: data.brandId,
          title: data.title || 'SignX Brand',
          primaryColor: gen?.buttons?.primary?.background || DEFAULT_BRAND.primaryColor!,
          headerBackground: gen?.header?.background || DEFAULT_BRAND.headerBackground!,
          mainBackground: gen?.['main-background'] || DEFAULT_BRAND.mainBackground!,
          senderEmail: data.email?.sender_email || '',
          hideSignNowRef: data.email?.signnow_references === false,
          logoUrl: data.general?.logo?.url || null,
        })
      })
      .catch(e => {
        const msg = e.response?.data?.error || e.message
        if (msg?.includes('organization')) setNoOrg(true)
        else toast.error('Could not load brand settings')
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    if (!brand) return
    setSaving(true)
    try {
      await client.post('/brand', {
        orgId: brand.orgId,
        brandId: brand.brandId,
        primaryColor: brand.primaryColor,
        headerBackground: brand.headerBackground,
        mainBackground: brand.mainBackground,
        senderEmail: brand.senderEmail || undefined,
        hideSignNowRef: brand.hideSignNowRef,
      })
      toast.success('Brand settings saved!')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to save brand settings')
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(file: File) {
    if (!brand) return
    setUploadingLogo(true)
    try {
      const form = new FormData()
      form.append('logo', file)
      form.append('orgId', brand.orgId)
      form.append('brandId', brand.brandId)
      await client.post('/brand/logo', form)
      toast.success('Logo uploaded!')
      setBrand(b => b ? { ...b, logoUrl: URL.createObjectURL(file) } : b)
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Logo upload failed')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6" style={{ color: 'var(--text-muted)' }}>
        <Spinner size={16} /> <span className="text-sm">Loading brand settings...</span>
      </div>
    )
  }

  if (noOrg) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertCircle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium text-amber-400">Organization account required.</span>{' '}
          Branding features require an organization account with admin or moderator access on SignNow.
          Contact your SignNow account manager to enable this.
        </div>
      </div>
    )
  }

  if (!brand) return null

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Logo</div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)' }}>
            {brand.logoUrl
              ? <img src={brand.logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
              : <Image size={20} style={{ color: 'var(--text-muted)' }} />
            }
          </div>
          <div>
            <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {uploadingLogo ? <Spinner size={14} /> : <Upload size={14} />}
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              PNG, JPG or SVG · Recommended 200×60px
            </p>
          </div>
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--border-subtle)' }} />

      {/* Colors */}
      <div>
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Colors</div>
        <div className="space-y-3">
          <ColorField label="Primary color" value={brand.primaryColor}
            onChange={v => setBrand(b => b ? { ...b, primaryColor: v } : b)} />
          <ColorField label="Header background" value={brand.headerBackground}
            onChange={v => setBrand(b => b ? { ...b, headerBackground: v } : b)} />
          <ColorField label="Page background" value={brand.mainBackground}
            onChange={v => setBrand(b => b ? { ...b, mainBackground: v } : b)} />
        </div>
      </div>

      <div className="h-px" style={{ background: 'var(--border-subtle)' }} />

      {/* Email */}
      <div>
        <div className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Email</div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm w-40 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
              Sender email
            </label>
            <input
              type="email"
              className="input text-sm flex-1"
              placeholder="noreply@yourcompany.com"
              value={brand.senderEmail}
              onChange={e => setBrand(b => b ? { ...b, senderEmail: e.target.value } : b)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Hide "Powered by SignNow"
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Remove SignNow branding references from email notifications
              </div>
            </div>
            <button
              onClick={() => setBrand(b => b ? { ...b, hideSignNowRef: !b.hideSignNowRef } : b)}
              className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${
                brand.hideSignNowRef ? 'bg-indigo-500' : ''
              }`}
              style={brand.hideSignNowRef ? {} : { background: 'var(--bg-skeleton-a)' }}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                brand.hideSignNowRef ? 'left-[calc(100%-22px)]' : 'left-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={save}
        disabled={saving}
        className="btn-primary flex items-center gap-2 w-full justify-center py-2.5"
      >
        {saving ? <Spinner size={15} /> : <Save size={15} />}
        {saving ? 'Saving...' : 'Save Brand Settings'}
      </motion.button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function Settings() {
  const { mode, setMode } = useTheme()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Manage your preferences and configuration</p>

        {/* Appearance */}
        <SettingSection title="Appearance" description="Choose how SignX looks on your device" icon={<Monitor size={16} />}>
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
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={active
                      ? { background: 'rgba(99,102,241,0.2)', color: '#818cf8' }
                      : { background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
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

        {/* Brand & Email */}
        <SettingSection
          title="Brand & Email"
          description="Customize how your signing invitations look — applies to all documents sent through this account"
          icon={<Palette size={16} />}
        >
          <BrandSection />
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

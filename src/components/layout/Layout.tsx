import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { useWebhookEvents } from '../../hooks/useWebhookEvents'

function WebhookPoller() {
  const { user } = useAuth()
  useWebhookEvents(user?.sub)
  return null
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--bg-page, linear-gradient(160deg, #020617 0%, #0a0f23 100%))' }}
      >
        {children}
      </motion.main>
      <WebhookPoller />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 6000,
          style: {
            background: 'rgba(15,23,42,0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '14px',
            backdropFilter: 'blur(12px)',
            fontSize: '13px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
        }}
      />
    </div>
  )
}

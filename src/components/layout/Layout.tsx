import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { motion } from 'framer-motion'

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
    </div>
  )
}

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-5 mx-auto">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm max-w-sm mb-6">{description}</p>
      {action}
    </motion.div>
  )
}

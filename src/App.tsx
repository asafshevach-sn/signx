import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { Templates } from './pages/Templates'
import { SendDocument } from './pages/SendDocument'
import { DocumentDetail } from './pages/DocumentDetail'
import { Settings } from './pages/Settings'
import { Reports } from './pages/Reports'
import { Login } from './pages/Login'
import { useAuth } from './contexts/AuthContext'

function ProtectedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/documents"     element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/templates"     element={<Templates />} />
        <Route path="/send"          element={<SendDocument />} />
        <Route path="/reports"       element={<Reports />} />
        <Route path="/settings"      element={<Settings />} />
        <Route path="*"              element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  return user ? <ProtectedApp /> : <Login />
}

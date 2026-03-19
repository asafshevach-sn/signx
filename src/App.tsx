import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Documents } from './pages/Documents'
import { Templates } from './pages/Templates'
import { SendDocument } from './pages/SendDocument'
import { DocumentDetail } from './pages/DocumentDetail'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Dashboard />} />
        <Route path="/documents"     element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetail />} />
        <Route path="/templates"     element={<Templates />} />
        <Route path="/send"          element={<SendDocument />} />
        <Route path="/settings"      element={<Settings />} />
      </Routes>
    </Layout>
  )
}

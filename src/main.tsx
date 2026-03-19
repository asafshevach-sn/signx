import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: 'white' },
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

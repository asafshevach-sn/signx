import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  resolved: 'dark',
  setMode: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('theme') as ThemeMode) || 'dark'
  })

  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolved: 'light' | 'dark' =
    mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', resolved)
    if (resolved === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }, [resolved])

  const setMode = (m: ThemeMode) => {
    localStorage.setItem('theme', m)
    setModeState(m)
  }

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

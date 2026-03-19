import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface GoogleUser {
  name: string
  email: string
  picture: string
  sub: string
}

interface AuthContextValue {
  user: GoogleUser | null
  loading: boolean
  signOut: () => void
  handleCredentialResponse: (response: { credential: string }) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: () => {},
  handleCredentialResponse: () => {},
})

// Decode JWT payload without verification (client-side only)
function parseJwt(token: string): GoogleUser {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  )
  return JSON.parse(json) as GoogleUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('signx_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const handleCredentialResponse = (response: { credential: string }) => {
    const parsed = parseJwt(response.credential)
    setUser(parsed)
    localStorage.setItem('signx_user', JSON.stringify(parsed))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('signx_user')
    // Also revoke Google session
    ;(window as any).google?.accounts?.id?.disableAutoSelect()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, handleCredentialResponse }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

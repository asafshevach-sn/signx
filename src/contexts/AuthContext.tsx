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
  signInWithEmail: (email: string, password: string, isRegister: boolean) => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: () => {},
  handleCredentialResponse: () => {},
  signInWithEmail: async () => {},
})

function parseJwt(token: string): GoogleUser {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64).split('').map(c =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')
  )
  return JSON.parse(json) as GoogleUser
}

// Simple hash for storing password verification (client-side only)
async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0]
  return local.split(/[._-]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
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

  const signInWithEmail = async (email: string, password: string, isRegister: boolean) => {
    const hash = await hashPassword(password)
    const usersKey = 'signx_users'
    const users: Record<string, string> = JSON.parse(localStorage.getItem(usersKey) || '{}')

    if (isRegister) {
      if (users[email]) throw new Error('An account with this email already exists')
      users[email] = hash
      localStorage.setItem(usersKey, JSON.stringify(users))
    } else {
      if (!users[email]) throw new Error('No account found — please create one first')
      if (users[email] !== hash) throw new Error('Incorrect password')
    }

    const profile: GoogleUser = {
      name: nameFromEmail(email),
      email,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFromEmail(email))}&background=6366f1&color=fff`,
      sub: email,
    }
    setUser(profile)
    localStorage.setItem('signx_user', JSON.stringify(profile))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem('signx_user')
    ;(window as any).google?.accounts?.id?.disableAutoSelect()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, handleCredentialResponse, signInWithEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

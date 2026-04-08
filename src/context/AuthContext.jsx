import { createContext, useContext } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Tennis MVP: no auth/Supabase - return stub values
  return (
    <AuthContext.Provider value={{
      user: null,
      profile: null,
      loading: false,
      signOut: async () => {},
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

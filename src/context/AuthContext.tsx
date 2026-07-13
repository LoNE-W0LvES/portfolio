import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const ALLOWED_EMAILS = [
  'nafithelonewolves@gmail.com',
  'nafimnr00@gmail.com',
  'nafimnr05@gmail.com',
]

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isOwner: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isOwner = !!(session?.user?.email && ALLOWED_EMAILS.includes(session.user.email))

  const signIn = async (email: string, password: string): Promise<string | null> => {
    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      return 'Access denied.'
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, loading, isOwner, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { ALLOWED_EMAILS }

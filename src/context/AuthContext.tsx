import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

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
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])

  const fetchAllowed = async () => {
    const { data, error } = await supabase.from('site_user_emails').select('email')
    if (error) return
    setAllowedEmails((data ?? []).map((r: any) => String(r.email).toLowerCase()))
  }

  useEffect(() => {
    // load current session
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await fetchAllowed()
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await fetchAllowed()
      } else {
        setAllowedEmails([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isOwner = !!(session?.user?.email && allowedEmails.includes(session.user.email.toLowerCase()))

  // signIn with password first, then enforce DB allowlist and sign out if not allowed
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const normalized = email.toLowerCase().trim()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: normalized, password })
    if (signInError) return signInError.message

    const { data, error: allowlistError } = await supabase
      .from('site_user_emails')
      .select('email')
      .ilike('email', normalized)
      .limit(1)

    if (allowlistError || !data || data.length === 0) {
      await supabase.auth.signOut()
      return 'Access denied.'
    }

    await fetchAllowed()
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

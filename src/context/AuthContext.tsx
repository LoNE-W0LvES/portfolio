import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isOwner: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [allowedEmails, setAllowedEmails] = useState<string[]>([])
  const [role, setRole] = useState<'admin' | 'user' | null>(null)

  const fetchAllowed = async (currentEmail?: string) => {
    const { data, error } = await supabase.from('site_user_emails').select('email, site_users(role)')
    if (error) return
    setAllowedEmails((data ?? []).map((r: any) => String(r.email).toLowerCase()))
    const current = (data ?? []).find((r: any) => String(r.email).toLowerCase() === currentEmail?.toLowerCase()) as any
    setRole(current?.site_users?.role === 'admin' ? 'admin' : current ? 'user' : null)
  }

  useEffect(() => {
    // load current session
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await fetchAllowed(data.session.user.email)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        await fetchAllowed(session.user.email)
      } else {
        setAllowedEmails([])
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const isOwner = !!(session?.user?.email && allowedEmails.includes(session.user.email.toLowerCase()))
  const isAdmin = isOwner && role === 'admin'

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

    await fetchAllowed(normalized)
    return null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async (): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/edit` },
    })
    return error?.message ?? null
  }

  return (
    <AuthContext.Provider value={{ session, loading, isOwner, isAdmin, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

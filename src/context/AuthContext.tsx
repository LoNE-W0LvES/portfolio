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

  useEffect(() => {
    // load current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // fetch allowed emails from DB
    const fetchAllowed = async () => {
      try {
        const { data, error } = await supabase.from('site_user_emails').select('email')
        if (!error && data) {
          setAllowedEmails(data.map((r: any) => String(r.email).toLowerCase()))
        }
      } catch (e) {
        // ignore — default list will be empty (no owners)
        console.error('Failed to load allowed emails', e)
      }
    }
    fetchAllowed()

    return () => subscription.unsubscribe()
  }, [])

  const isOwner = !!(session?.user?.email && allowedEmails.includes(session.user.email.toLowerCase()))

  // signIn first checks if email exists in site_user_emails, then calls Supabase auth
  const signIn = async (email: string, password: string): Promise<string | null> => {
    const normalized = email.toLowerCase().trim()
    try {
      const { data, error } = await supabase.from('site_user_emails').select('email').ilike('email', normalized)
      if (error) return 'Access check failed.'
      if (!data || data.length === 0) return 'Access denied.'
    } catch (e) {
      return 'Access check failed.'
    }

    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password })
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
